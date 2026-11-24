const DISPLAY_MARKUP = () => Number(process.env.DOMAIN_DISPLAY_MARKUP) || 1.3;
const CHECKOUT_MARKUP = () => Number(process.env.DOMAIN_CHECKOUT_MARKUP) || 0.2;
const CHECKOUT_CAP_NGN = () => Number(process.env.DOMAIN_CHECKOUT_MARKUP_CAP_NGN) || 2000;

let fxCache = { rate: null, fetchedAt: 0 };

export const getUsdToNgn = async () => {
  const override = Number(process.env.DOMAIN_FX_RATE);
  if (Number.isFinite(override) && override > 0) {
    return { rate: override, source: 'configured' };
  }

  if (fxCache.rate && Date.now() - fxCache.fetchedAt < 6 * 60 * 60 * 1000) {
    return { rate: fxCache.rate, source: 'cache' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const body = await response.json();
    const rate = Number(body?.rates?.NGN);
    if (Number.isFinite(rate) && rate > 0) {
      fxCache = { rate, fetchedAt: Date.now() };
      return { rate, source: 'live' };
    }
  } catch {
    // Fall through to the configured safety rate.
  }

  return {
    rate: Number(process.env.DOMAIN_FX_FALLBACK) || 1650,
    source: 'fallback',
  };
};

/**
 * Mirrors the Nile pricing rules: a 30% display multiplier, then a 20% checkout
 * markup capped at ₦2,000. The first year is bundled into Premium, so its
 * payable amount is zero while the retail value is still shown to the merchant.
 */
export const buildQuote = async ({ registrarUSD, included = false }) => {
  const { rate, source } = await getUsdToNgn();
  const displayUSD = Math.round(Number(registrarUSD || 0) * DISPLAY_MARKUP() * 100) / 100;
  const displayNGN = Math.round(displayUSD * rate);
  const markupNGN = Math.min(Math.round(displayNGN * CHECKOUT_MARKUP()), CHECKOUT_CAP_NGN());
  const retailNGN = displayNGN + markupNGN;

  return {
    registrarUSD: Number(registrarUSD || 0),
    priceUSD: displayUSD,
    priceNGN: included ? 0 : retailNGN,
    retailValueNGN: retailNGN,
    markupNGN,
    fxRate: rate,
    fxSource: source,
    included,
  };
};

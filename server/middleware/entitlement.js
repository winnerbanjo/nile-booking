/**
 * Premium entitlement guard.
 *
 * The database is the source of truth: `protect` reloads the user on every
 * request, so a downgrade applies immediately without waiting for JWT expiry.
 */
export const requirePremium = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (user.role !== 'provider') {
    return res.status(403).json({
      message: 'Only merchant accounts can manage a storefront domain.',
      code: 'PROVIDER_REQUIRED',
    });
  }

  const planActive =
    user.plan === 'premium' &&
    user.planStatus === 'active' &&
    (!user.planExpiresAt || new Date(user.planExpiresAt).getTime() > Date.now());

  if (!planActive) {
    return res.status(402).json({
      message: 'Custom domains are included with the Premium plan.',
      code: 'PREMIUM_REQUIRED',
    });
  }

  next();
};

export const isPremiumMerchant = (user) =>
  Boolean(
    user &&
      user.role === 'provider' &&
      user.plan === 'premium' &&
      user.planStatus === 'active' &&
      (!user.planExpiresAt || new Date(user.planExpiresAt).getTime() > Date.now())
  );

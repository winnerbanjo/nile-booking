import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  Globe2,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { domainApi } from '../lib/api';
import type {
  CustomDomainRecord,
  DomainAvailability,
  DomainOverview,
  DomainSuggestion,
} from '../types';

type Tab = 'buy' | 'connect';

interface RegistrantForm {
  firstName: string;
  lastName: string;
  company: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
}

const STATUS_STYLES: Record<string, { label: string; className: string; dot: string }> = {
  ACTIVE: {
    label: 'Live',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  DNS_PENDING: {
    label: 'Connecting',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
  },
  REGISTERED: {
    label: 'Registered',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
    dot: 'bg-sky-500',
  },
  REGISTERING: {
    label: 'Registering',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
    dot: 'bg-sky-500 animate-pulse',
  },
  PENDING_REGISTRATION: {
    label: 'Starting',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
    dot: 'bg-sky-500 animate-pulse',
  },
  PENDING_VERIFICATION: {
    label: 'Verify DNS',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
  },
  CONNECTING: {
    label: 'Connecting',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
    dot: 'bg-sky-500 animate-pulse',
  },
  FAILED: {
    label: 'Needs attention',
    className: 'border-red-200 bg-red-50 text-red-700',
    dot: 'bg-red-500',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'border-zinc-300 bg-zinc-100 text-zinc-600',
    dot: 'bg-zinc-500',
  },
  SUSPENDED: {
    label: 'Suspended',
    className: 'border-red-200 bg-red-50 text-red-700',
    dot: 'bg-red-500',
  },
  REMOVED: {
    label: 'Removed',
    className: 'border-zinc-200 bg-zinc-50 text-zinc-500',
    dot: 'bg-zinc-400',
  },
};

const naira = (value?: number | null) =>
  `₦${Number(value || 0).toLocaleString('en-NG')}`;

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
};

const isExpiringSoon = (value?: string | null) => {
  if (!value) return false;
  const days = (new Date(value).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
  return days > 0 && days <= 45;
};

const buildRegistrant = (user: ReturnType<typeof useAuth>['user']): RegistrantForm => {
  const names = String(user?.name || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: names[0] || '',
    lastName: names.slice(1).join(' ') || '',
    company: user?.businessName || '',
    address: user?.address?.street || '',
    city: user?.address?.city || user?.location || '',
    state: '',
    postalCode: user?.address?.zipCode || '',
    country: 'NG',
    phone: user?.phone || '',
    email: user?.email || '',
  };
};

export const CustomDomains: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<DomainOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('buy');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<DomainSuggestion[]>([]);
  const [searching, setSearching] = useState(false);

  const [domainQuery, setDomainQuery] = useState('');
  const [availability, setAvailability] = useState<DomainAvailability | null>(null);
  const [checking, setChecking] = useState(false);

  const [connectDomain, setConnectDomain] = useState('');
  const [connecting, setConnecting] = useState(false);

  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [registrant, setRegistrant] = useState<RegistrantForm>(() => buildRegistrant(user));
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const renewalChecked = useRef(false);

  const loadOverview = useCallback(async () => {
    try {
      const data = await domainApi.getOverview();
      setOverview(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Could not load your domains.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    setRegistrant(buildRegistrant(user));
  }, [user]);

  // Paystack returns the merchant to this page with ?reference=...
  useEffect(() => {
    if (renewalChecked.current) return;
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');
    if (!reference) return;
    renewalChecked.current = true;

    domainApi
      .verifyRenewal(reference)
      .then((result) => {
        if (result.success) {
          setNotice('Renewal payment received. The registrar is updating your domain.');
          loadOverview();
        } else {
          setError(result.message || 'We could not confirm that renewal payment yet.');
        }
      })
      .catch((err: any) => setError(err?.message || 'We could not confirm that renewal payment.'))
      .finally(() => {
        window.history.replaceState({}, '', window.location.pathname);
      });
  }, [loadOverview]);

  const isPremium = Boolean(overview?.isPremium ?? (user?.plan === 'premium' && user?.planStatus === 'active'));
  const domains = overview?.domains || [];
  const includedDomain = useMemo(
    () => domains.find((domain) => domain.status !== 'FAILED' && domain.status !== 'REMOVED'),
    [domains]
  );
  const pendingConnected = domains.find(
    (domain) => domain.source === 'connected' && domain.status === 'PENDING_VERIFICATION'
  );

  const showNotice = (message: string) => {
    setNotice(message);
    setError(null);
    window.setTimeout(() => setNotice(null), 6000);
  };

  const handleSuggest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!keyword.trim()) return;
    setSearching(true);
    setError(null);
    setSuggestions([]);
    try {
      const response = await domainApi.getSuggestions(keyword.trim());
      setSuggestions(response.suggestions || []);
      if (!response.suggestions?.length) {
        setNotice('No available .store or .shop names for that keyword. Try another keyword or check a full domain.');
      }
    } catch (err: any) {
      setError(err?.message || 'Could not search for domains right now.');
    } finally {
      setSearching(false);
    }
  };

  const handleCheck = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!domainQuery.trim()) return;
    setChecking(true);
    setError(null);
    setAvailability(null);
    try {
      const result = await domainApi.checkAvailability(domainQuery.trim());
      setAvailability(result);
    } catch (err: any) {
      setError(err?.message || 'Could not check that domain right now.');
    } finally {
      setChecking(false);
    }
  };

  const beginClaim = (domain: string) => {
    setSelectedDomain(domain);
    setModalError(null);
    setAcceptedTerms(false);
    setRegistrant(buildRegistrant(user));
  };

  const handleClaim = async () => {
    if (!selectedDomain) return;
    setClaiming(true);
    setModalError(null);
    try {
      const result = await domainApi.claim({
        domain: selectedDomain,
        acceptedTerms,
        registrant,
      });
      setSelectedDomain(null);
      setAvailability(null);
      setSuggestions((current) => current.filter((item) => item.domain !== selectedDomain));
      showNotice(result.message || 'Your domain is registered.');
      await loadOverview();
    } catch (err: any) {
      setModalError(err?.message || 'Domain registration failed.');
    } finally {
      setClaiming(false);
    }
  };

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!connectDomain.trim()) return;
    setConnecting(true);
    setError(null);
    try {
      const result = await domainApi.connect(connectDomain.trim());
      setConnectDomain('');
      showNotice(result.message || 'Add the TXT record, then verify the domain.');
      await loadOverview();
    } catch (err: any) {
      setError(err?.message || 'Could not start connecting that domain.');
    } finally {
      setConnecting(false);
    }
  };

  const runDomainAction = async (
    id: string,
    action: 'verify' | 'refresh' | 'retry' | 'remove'
  ) => {
    if (action === 'remove' && !window.confirm('Disconnect this domain from your storefront? The registration itself will not be deleted.')) {
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      if (action === 'verify') {
        const result = await domainApi.verify(id);
        showNotice(result.message || 'Domain verified.');
      } else if (action === 'refresh') {
        const result = await domainApi.refresh(id);
        showNotice(result.domain.status === 'ACTIVE' ? 'Domain is live.' : 'Status refreshed.');
      } else if (action === 'retry') {
        const result = await domainApi.retry(id);
        showNotice(result.domain.status === 'ACTIVE' ? 'Domain is live.' : 'We retried the setup.');
      } else {
        await domainApi.remove(id);
        showNotice('Domain disconnected.');
      }
      await loadOverview();
    } catch (err: any) {
      setError(err?.message || 'That action could not be completed.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRenew = async (domain: CustomDomainRecord) => {
    setBusyId(domain._id);
    setError(null);
    try {
      const result = await domainApi.renew(domain._id);
      if (result.authorizationUrl) {
        window.location.href = result.authorizationUrl;
        return;
      }
      throw new Error('The payment page could not be opened. Please try again.');
    } catch (err: any) {
      setError(err?.message || 'Could not start the renewal payment.');
      setBusyId(null);
    }
  };

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setError('Copy failed. Select the record and copy it manually.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="space-y-3 border-b border-zinc-200 pb-6">
            <div className="h-3 w-28 rounded bg-zinc-200" />
            <div className="h-8 w-48 rounded bg-zinc-200" />
            <div className="h-4 w-96 max-w-full rounded bg-zinc-200" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <div className="h-56 rounded-lg bg-zinc-200" />
              <div className="h-44 rounded-lg bg-zinc-200" />
            </div>
            <div className="h-64 rounded-lg bg-zinc-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-zinc-200 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
                Storefront settings
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Domains</h1>
                {isPremium && (
                  <span className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                    Premium
                  </span>
                )}
              </div>
              <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-zinc-500">
                Manage the address customers use to reach your storefront. DNS, SSL and hosting are configured for you.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 text-[11px] text-zinc-500 sm:inline-flex">
                <span className={`h-1.5 w-1.5 rounded-full ${domains.some((domain) => domain.active) ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                {domains.some((domain) => domain.active) ? 'Storefront domain live' : 'No live domain'}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={loadOverview}
                className="h-9 rounded-md border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
              </Button>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <main className="min-w-0 space-y-6">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-white px-4 py-3 text-xs text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="flex-1 leading-5">{error}</span>
                <button onClick={() => setError(null)} aria-label="Dismiss error" className="text-red-400 hover:text-red-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {notice && (
              <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-xs text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span className="flex-1 leading-5">{notice}</span>
                <button onClick={() => setNotice(null)} aria-label="Dismiss message" className="text-emerald-500 hover:text-emerald-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {!isPremium && (
              <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                <div className="p-6 sm:p-8">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">Premium feature</p>
                      <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">
                        Custom domains are included with Premium
                      </h2>
                      <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-zinc-500">
                        Register one standard domain with the first year included, or connect a domain you already own. Your storefront stays on HTTPS and the routing is handled for you.
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 grid gap-5 border-t border-zinc-100 pt-5 sm:grid-cols-3">
                    {[
                      ['Included', 'One domain with first-year activation'],
                      ['Ownership', 'The merchant is registrant of record'],
                      ['Renewals', 'Billed to you only when due'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-400">{label}</p>
                        <p className="mt-1.5 text-xs leading-5 text-zinc-700">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-7 flex flex-col gap-3 border-t border-zinc-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <Button asChild className="h-9 rounded-md bg-zinc-900 px-4 text-xs font-medium text-white hover:bg-zinc-800">
                      <Link to="/pricing">
                        View Premium plan <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <p className="text-[11px] text-zinc-500">Already on Premium? Refresh to load your plan status.</p>
                  </div>
                </div>
              </section>
            )}

            {domains.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight text-zinc-900">Domain portfolio</h2>
                    <p className="mt-0.5 text-[11px] text-zinc-500">Registrations and connections on this account.</p>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    {domains.length} {domains.length === 1 ? 'domain' : 'domains'}
                  </span>
                </div>

                {domains.map((domain) => {
                  const status = STATUS_STYLES[domain.status] || STATUS_STYLES.REGISTERED;
                  const expiry = formatDate(domain.registration?.expiryDate);
                  const registeredAt = formatDate(domain.registration?.registeredAt);
                  const records = [
                    ...(domain.verificationRecord ? [domain.verificationRecord] : []),
                    ...(domain.dnsRecords || []),
                  ].filter((record, index, all) =>
                    all.findIndex((item) => item.type === record.type && item.host === record.host && item.value === record.value) === index
                  );
                  const registrar = domain.provider
                    ? `${domain.provider.charAt(0).toUpperCase()}${domain.provider.slice(1)}`
                    : 'Namecheap';

                  return (
                    <article key={domain._id} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50">
                            <Globe2 className="h-4 w-4 text-zinc-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-[13px] font-semibold text-zinc-900">{domain.domain}</h3>
                              <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium ${status.className}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} /> {status.label}
                              </span>
                              {domain.source === 'connected' && (
                                <span className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                                  Connected
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-zinc-500">
                              {domain.active
                                ? 'Live on your storefront'
                                : domain.failureReason
                                  ? 'Setup needs attention'
                                  : 'Setup in progress'}
                              {domain.active && (
                                <>
                                  <span className="mx-1.5 text-zinc-300">·</span>
                                  <a
                                    href={`https://${domain.domain}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 font-medium text-zinc-700 hover:text-zinc-900"
                                  >
                                    Visit site <ExternalLink className="h-3 w-3" />
                                  </a>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {domain.status === 'PENDING_VERIFICATION' && (
                            <Button
                              size="sm"
                              onClick={() => runDomainAction(domain._id, 'verify')}
                              disabled={busyId === domain._id}
                              className="h-8 rounded-md bg-zinc-900 px-3 text-[11px] font-medium text-white hover:bg-zinc-800"
                            >
                              {busyId === domain._id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />}
                              Verify now
                            </Button>
                          )}
                          {['FAILED', 'DNS_PENDING', 'REGISTERED'].includes(domain.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => runDomainAction(domain._id, 'retry')}
                              disabled={busyId === domain._id}
                              className="h-8 rounded-md border-zinc-300 bg-white px-2.5 text-[11px] text-zinc-700"
                            >
                              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${busyId === domain._id ? 'animate-spin' : ''}`} />
                              Retry
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runDomainAction(domain._id, 'refresh')}
                            disabled={busyId === domain._id}
                            className="h-8 rounded-md border-zinc-300 bg-white px-2.5 text-[11px] text-zinc-700"
                          >
                            Check status
                          </Button>
                          {['ACTIVE', 'DNS_PENDING', 'REGISTERED', 'EXPIRED'].includes(domain.status) && domain.source === 'purchased' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRenew(domain)}
                              disabled={busyId === domain._id}
                              className="h-8 rounded-md border-zinc-300 bg-white px-2.5 text-[11px] text-zinc-700"
                            >
                              <CreditCard className="mr-1.5 h-3.5 w-3.5" /> Renew
                            </Button>
                          )}
                          {domain.status !== 'EXPIRED' && domain.status !== 'REMOVED' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => runDomainAction(domain._id, 'remove')}
                              disabled={busyId === domain._id}
                              title="Disconnect domain"
                              aria-label={`Disconnect ${domain.domain}`}
                              className="h-8 rounded-md px-2 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <dl className="grid grid-cols-2 gap-px border-t border-zinc-200 bg-zinc-200 sm:grid-cols-4">
                        {[
                          ['Registrar', registrar],
                          ['Registered', registeredAt || 'Pending'],
                          ['Renews', expiry || 'Not set'],
                          ['Source', domain.source === 'purchased' ? 'Included in Premium' : 'Connected domain'],
                        ].map(([label, value]) => (
                          <div key={label} className="bg-white px-4 py-3">
                            <dt className="text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">{label}</dt>
                            <dd className={`mt-1 truncate text-[11px] font-medium ${label === 'Renews' && isExpiringSoon(domain.registration?.expiryDate) ? 'text-amber-700' : 'text-zinc-700'}`}>
                              {value}
                            </dd>
                          </div>
                        ))}
                      </dl>

                      {domain.failureReason && (
                        <div className="flex items-start gap-2 border-t border-amber-100 bg-amber-50/60 px-5 py-3 text-[11px] leading-5 text-amber-800">
                          <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{domain.failureReason}</span>
                        </div>
                      )}

                      {domain.status !== 'ACTIVE' && records.length > 0 && (
                        <div className="border-t border-zinc-100 bg-zinc-50/60 px-5 py-4">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-700">
                            <Server className="h-3.5 w-3.5 text-zinc-400" /> DNS records to apply
                          </div>
                          <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                            Add these at your registrar. Changes can take a few minutes to propagate.
                          </p>
                          <div className="mt-2.5 divide-y divide-zinc-200 overflow-hidden rounded-md border border-zinc-200 bg-white">
                            {records.map((record, index) => {
                              const key = `${domain._id}-${record.type}-${record.host}-${index}`;
                              return (
                                <div key={key} className="flex items-center gap-2 px-3 py-2">
                                  <span className="w-12 shrink-0 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-center font-mono text-[9px] font-semibold text-zinc-500">
                                    {record.type}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-mono text-[11px] text-zinc-800">{record.host}</p>
                                    <p className="truncate font-mono text-[10px] text-zinc-500">{record.value}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => copy(record.value, key)}
                                    className="shrink-0 rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                                    aria-label={`Copy ${record.type} record`}
                                  >
                                    {copied === key ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {domain.status === 'ACTIVE' && (
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-zinc-100 bg-zinc-50/50 px-5 py-3 text-[10px] text-zinc-500">
                          <span className="inline-flex items-center gap-1.5">
                            <Lock className="h-3 w-3 text-zinc-400" /> HTTPS active
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <ShieldCheck className="h-3 w-3 text-zinc-400" /> Registrant: merchant
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="h-3 w-3 text-zinc-400" /> Renewal billed separately
                          </span>
                        </div>
                      )}
                    </article>
                  );
                })}
              </section>
            )}

            {isPremium && (
              <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                <div className="border-b border-zinc-200 px-5 py-4 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight text-zinc-900">Add a domain</h2>
                      <p className="mt-0.5 text-[11px] leading-5 text-zinc-500">
                        Register the domain included with Premium, or connect one you already own.
                      </p>
                    </div>
                    <div className="inline-flex w-full rounded-md bg-zinc-100 p-0.5 sm:w-auto">
                      {[
                        { id: 'buy' as Tab, label: 'Register new', icon: Search },
                        { id: 'connect' as Tab, label: 'Connect existing', icon: LinkIcon },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setTab(item.id);
                            setError(null);
                          }}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-medium transition-colors sm:flex-none ${
                            tab === item.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                          }`}
                        >
                          <item.icon className="h-3.5 w-3.5" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {tab === 'buy' ? (
                  <div className="space-y-6 p-5 sm:p-6">
                    {includedDomain ? (
                      <div className="flex items-start gap-2.5 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
                        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                        <div>
                          <p className="text-xs font-medium text-zinc-800">Your included domain is already assigned</p>
                          <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                            {includedDomain.domain} is on this Premium account. The plan includes one domain; additional domains are quoted separately.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <h3 className="text-xs font-semibold text-zinc-900">Search for a business name</h3>
                          <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                            We check <span className="font-mono text-zinc-700">.store</span> and <span className="font-mono text-zinc-700">.shop</span> availability. One standard name is included.
                          </p>
                          <form onSubmit={handleSuggest} className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <div className="relative flex-1">
                              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                              <Input
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                placeholder="yourbusiness"
                                className="h-10 rounded-md border-zinc-300 pl-9 text-xs"
                                disabled={searching}
                              />
                            </div>
                            <Button
                              type="submit"
                              disabled={searching || keyword.trim().length < 2}
                              className="h-10 rounded-md bg-zinc-900 px-4 text-xs font-medium text-white hover:bg-zinc-800"
                            >
                              {searching ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Search className="mr-1.5 h-3.5 w-3.5" />}
                              Search
                            </Button>
                          </form>
                        </div>

                        {suggestions.length > 0 && (
                          <div className="divide-y divide-zinc-200 overflow-hidden rounded-md border border-zinc-200">
                            {suggestions.map((suggestion) => (
                              <div key={suggestion.domain} className="flex items-center justify-between gap-4 px-3.5 py-3">
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-medium text-zinc-900">{suggestion.domain}</p>
                                  <p className="mt-0.5 text-[10px] text-zinc-500">
                                    {suggestion.isPremiumDomain ? (
                                      <span className="text-amber-700">Premium-priced · contact support</span>
                                    ) : (
                                      <>Included · retail value {naira(suggestion.retailValueNGN)}/yr</>
                                    )}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => beginClaim(suggestion.domain)}
                                  disabled={suggestion.isPremiumDomain}
                                  className="h-8 shrink-0 rounded-md bg-zinc-900 px-3 text-[11px] font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-500"
                                >
                                  Claim
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="border-t border-zinc-100 pt-5">
                          <h3 className="text-xs font-semibold text-zinc-900">Check a specific domain</h3>
                          <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                            Any extension can be checked. The registrar confirms final availability.
                          </p>
                          <form onSubmit={handleCheck} className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <Input
                              value={domainQuery}
                              onChange={(event) => {
                                setDomainQuery(event.target.value.toLowerCase().replace(/\s/g, ''));
                                setAvailability(null);
                              }}
                              placeholder="yourbusiness.com"
                              className="h-10 flex-1 rounded-md border-zinc-300 text-xs"
                              disabled={checking}
                            />
                            <Button
                              type="submit"
                              variant="outline"
                              disabled={checking || !domainQuery.trim()}
                              className="h-10 rounded-md border-zinc-300 bg-white px-4 text-xs font-medium text-zinc-700"
                            >
                              {checking ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Globe2 className="mr-1.5 h-3.5 w-3.5" />}
                              Check
                            </Button>
                          </form>

                          {availability && (
                            <div className={`mt-3 rounded-md border px-4 py-3 ${availability.available ? 'border-zinc-200 bg-zinc-50' : 'border-red-200 bg-red-50/40'}`}>
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-2">
                                  {availability.available ? (
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                  ) : (
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                  )}
                                  <div>
                                    <p className="text-xs font-medium text-zinc-900">
                                      {availability.domain} is {availability.available ? 'available' : 'not available'}
                                    </p>
                                    <p className="mt-0.5 text-[11px] leading-5 text-zinc-500">
                                      {availability.available
                                        ? availability.isPremiumDomain || availability.quoteRequired
                                          ? 'Premium-priced name. Contact support for a quote.'
                                          : `Included in Premium · retail value ${naira(availability.retailValueNGN)}/yr`
                                        : 'Try another extension or search for a different name.'}
                                    </p>
                                  </div>
                                </div>
                                {availability.available && !availability.quoteRequired && (
                                  <Button
                                    size="sm"
                                    onClick={() => beginClaim(availability.domain)}
                                    className="h-8 shrink-0 rounded-md bg-zinc-900 px-3 text-[11px] font-medium text-white hover:bg-zinc-800"
                                  >
                                    Claim domain
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 p-5 sm:p-6">
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-900">Connect a domain you own</h3>
                      <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                        Keep your registrar and renewals. We verify ownership with a TXT record, then route the domain to your storefront.
                      </p>
                      <form onSubmit={handleConnect} className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <Input
                          value={connectDomain}
                          onChange={(event) => setConnectDomain(event.target.value.toLowerCase().replace(/\s/g, ''))}
                          placeholder="yourbusiness.com"
                          className="h-10 flex-1 rounded-md border-zinc-300 text-xs"
                          disabled={connecting}
                        />
                        <Button
                          type="submit"
                          disabled={connecting || !connectDomain.trim()}
                          className="h-10 rounded-md bg-zinc-900 px-4 text-xs font-medium text-white hover:bg-zinc-800"
                        >
                          {connecting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <LinkIcon className="mr-1.5 h-3.5 w-3.5" />}
                          Connect domain
                        </Button>
                      </form>
                    </div>

                    {pendingConnected?.verificationRecord && (
                      <div className="rounded-md border border-amber-200 bg-amber-50/50 p-4">
                        <div className="flex items-start gap-2.5">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-amber-900">Add this TXT record at your registrar</p>
                            <p className="mt-1 text-[11px] leading-5 text-amber-800">
                              After saving it, click “Verify now” on the domain card. DNS can take a few minutes.
                            </p>
                            <div className="mt-2.5 divide-y divide-zinc-200 overflow-hidden rounded-md border border-zinc-200 bg-white font-mono text-[11px] text-zinc-800">
                              <div className="flex items-center justify-between gap-2 px-3 py-2">
                                <span className="truncate">{pendingConnected.verificationRecord.host}</span>
                                <button
                                  type="button"
                                  onClick={() => copy(pendingConnected.verificationRecord!.host, 'txt-host')}
                                  className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                                  aria-label="Copy TXT host"
                                >
                                  {copied === 'txt-host' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                              <div className="flex items-center justify-between gap-2 px-3 py-2">
                                <span className="truncate">{pendingConnected.verificationRecord.value}</span>
                                <button
                                  type="button"
                                  onClick={() => copy(pendingConnected.verificationRecord!.value, 'txt-value')}
                                  className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                                  aria-label="Copy TXT value"
                                >
                                  {copied === 'txt-value' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => runDomainAction(pendingConnected._id, 'verify')}
                              disabled={busyId === pendingConnected._id}
                              className="mt-3 h-8 rounded-md bg-zinc-900 px-3 text-[11px] font-medium text-white hover:bg-zinc-800"
                            >
                              {busyId === pendingConnected._id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />}
                              Verify now
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4 border-t border-zinc-100 pt-5 sm:grid-cols-3">
                      {[
                        ['1', 'Add TXT record', 'Prove ownership at your registrar.'],
                        ['2', 'Verify', 'We check DNS and attach hosting.'],
                        ['3', 'Go live', 'SSL and routing finish automatically.'],
                      ].map(([step, title, description]) => (
                        <div key={step}>
                          <span className="text-[10px] font-medium text-zinc-400">{step}</span>
                          <p className="mt-1 text-[11px] font-medium text-zinc-800">{title}</p>
                          <p className="mt-0.5 text-[10px] leading-4 text-zinc-500">{description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            <p className="px-1 text-[10px] leading-4 text-zinc-400">
              Domains registered through Nile Booking use the merchant as registrant. The first year of one standard domain is included in Premium; renewals are paid by the merchant. Premium-priced names and additional domains are quoted separately.
            </p>
          </main>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Plan</p>
                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${isPremium ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-zinc-200 bg-zinc-50 text-zinc-600'}`}>
                  {isPremium ? 'Premium' : 'Free'}
                </span>
              </div>
              <div className="space-y-4 p-4">
                <div className="flex items-start gap-2.5">
                  <BadgeCheck className={`mt-0.5 h-4 w-4 shrink-0 ${isPremium ? 'text-emerald-600' : 'text-zinc-300'}`} />
                  <div>
                    <p className="text-xs font-medium text-zinc-900">{isPremium ? 'Domain benefit active' : 'Domain benefit unavailable'}</p>
                    <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                      {isPremium
                        ? 'Your plan includes one standard domain with the first year of activation.'
                        : 'Upgrade to Premium to register an included domain or connect an existing one.'}
                    </p>
                  </div>
                </div>

                {isPremium ? (
                  <dl className="space-y-2 border-t border-zinc-100 pt-3 text-[11px]">
                    {[
                      ['Included domains', String(overview?.limits.includedDomains || 1)],
                      ['Currently active', String(overview?.limits.activeDomains || 0)],
                      ['First-year activation', 'Included'],
                      ['Renewals', 'Merchant-paid'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-3">
                        <dt className="text-zinc-500">{label}</dt>
                        <dd className="font-medium text-zinc-800">{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <Button asChild className="h-8 w-full rounded-md bg-zinc-900 text-[11px] font-medium text-white hover:bg-zinc-800">
                    <Link to="/pricing">Compare plans</Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">What happens next</p>
              <ol className="mt-3 space-y-3">
                {[
                  'Choose an included domain or connect one you own.',
                  'We configure DNS, SSL and storefront routing.',
                  'Your storefront serves from the new address.',
                ].map((item, index) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-[9px] font-medium text-zinc-500">
                      {index + 1}
                    </span>
                    <p className="text-[11px] leading-5 text-zinc-600">{item}</p>
                  </li>
                ))}
              </ol>
            </div>

            <p className="px-1 text-[10px] leading-4 text-zinc-400">
              Need help with DNS or a premium-priced name? Contact support from your dashboard.
            </p>
          </aside>
        </div>
      </div>

      {selectedDomain && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/50 p-4 sm:items-center">
          <div className="my-6 w-full max-w-xl overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-zinc-200 px-5 py-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-400">Domain registration</p>
                <h3 className="mt-1 text-[15px] font-semibold tracking-tight text-zinc-950">{selectedDomain}</h3>
                <p className="mt-0.5 text-[11px] leading-5 text-zinc-500">
                  Included in Premium. No payment today.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !claiming && setSelectedDomain(null)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[68vh] space-y-5 overflow-y-auto px-5 py-5">
              {modalError && (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-700">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {modalError}
                </div>
              )}

              <div>
                <p className="text-[11px] font-medium text-zinc-800">Registrant contact</p>
                <p className="mt-0.5 text-[10px] leading-4 text-zinc-500">Use details exactly as they should appear with the registrar.</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ['firstName', 'First name', 'Adeola'],
                    ['lastName', 'Last name', 'Johnson'],
                    ['company', 'Business name (optional)', 'Glow Studio'],
                    ['email', 'Registrant email', 'you@business.com'],
                  ].map(([key, label, placeholder]) => (
                    <div key={key} className={key === 'company' || key === 'email' ? 'sm:col-span-2' : ''}>
                      <Label className="mb-1 block text-[10px] font-medium text-zinc-500">{label}</Label>
                      <Input
                        value={registrant[key as keyof RegistrantForm]}
                        onChange={(event) => setRegistrant((current) => ({ ...current, [key]: event.target.value }))}
                        placeholder={placeholder}
                        className="h-9 rounded-md border-zinc-300 text-[11px]"
                        disabled={claiming}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-4">
                <p className="text-[11px] font-medium text-zinc-800">Address</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label className="mb-1 block text-[10px] font-medium text-zinc-500">Street address</Label>
                    <Input
                      value={registrant.address}
                      onChange={(event) => setRegistrant((current) => ({ ...current, address: event.target.value }))}
                      placeholder="30 Ikoyi Road"
                      className="h-9 rounded-md border-zinc-300 text-[11px]"
                      disabled={claiming}
                    />
                  </div>
                  {[
                    ['city', 'City', 'Lagos'],
                    ['state', 'State / region', 'Lagos'],
                    ['postalCode', 'Postal code', '100001'],
                    ['country', 'Country code', 'NG'],
                    ['phone', 'Phone (+234.8012345678)', '+234.8012345678'],
                  ].map(([key, label, placeholder]) => (
                    <div key={key} className={key === 'phone' ? 'sm:col-span-2' : ''}>
                      <Label className="mb-1 block text-[10px] font-medium text-zinc-500">{label}</Label>
                      <Input
                        value={registrant[key as keyof RegistrantForm]}
                        onChange={(event) => setRegistrant((current) => ({ ...current, [key]: event.target.value }))}
                        placeholder={placeholder}
                        className="h-9 rounded-md border-zinc-300 text-[11px]"
                        disabled={claiming}
                        maxLength={key === 'country' ? 2 : undefined}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                  disabled={claiming}
                />
                <span className="text-[11px] leading-5 text-zinc-600">
                  I confirm these registrant details are accurate, I am authorised to register this domain, and I accept the domain terms. The first year is included in Premium; renewals are paid by me.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-zinc-200 bg-zinc-50/50 px-5 py-3">
              <Button
                variant="outline"
                onClick={() => setSelectedDomain(null)}
                disabled={claiming}
                className="h-9 rounded-md border-zinc-300 bg-white text-xs text-zinc-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleClaim}
                disabled={claiming || !acceptedTerms}
                className="h-9 rounded-md bg-zinc-900 px-4 text-xs font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-500"
              >
                {claiming ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                {claiming ? 'Registering…' : 'Register domain'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LinkIcon = (props: React.ComponentProps<typeof Globe2>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10 13a5 5 0 0 0 7.07 0l1.42-1.42a5 5 0 0 0-7.07-7.07L10.7 5.23" />
    <path d="M14 11a5 5 0 0 0-7.07 0l-1.42 1.42a5 5 0 0 0 7.07 7.07l1.42-1.42" />
  </svg>
);

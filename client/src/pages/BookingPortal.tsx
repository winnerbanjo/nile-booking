import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { bookingApi } from '../lib/api';
import type { PublicBooking } from '../types';
import { Button } from '../components/ui/button';
import { CheckCircle2, Clock, Copy, Loader2, MapPin, Phone, Upload, XCircle } from 'lucide-react';

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

const money = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency || 'NGN' }).format(amount || 0);
  } catch {
    return `${currency || 'NGN'} ${Number(amount || 0).toLocaleString()}`;
  }
};

const messageFromError = (error: unknown, fallback: string) => {
  const value = error as { status?: number; message?: string };
  if (value?.status === 404) return 'This booking link is invalid or no longer available.';
  return value?.message || fallback;
};

const statusLabel = (booking: PublicBooking) => {
  if (booking.status === 'confirmed') return 'Confirmed';
  if (booking.status === 'completed') return 'Completed';
  if (booking.status === 'cancelled') return 'Cancelled';
  if (booking.status === 'rejected') return 'Payment not accepted';
  if (booking.paymentStatus === 'awaiting_verification') return 'Receipt received - awaiting verification';
  return 'Awaiting payment';
};

export const BookingPortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [uploading, setUploading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!token) return;
    try {
      const response = await bookingApi.getPublicBooking(token);
      setBooking(response.booking);
      setError('');
    } catch (err: unknown) {
      setError(messageFromError(err, 'Could not load this booking.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setNotice('Copy the address from your browser to save this link.');
    }
  };

  const uploadReceipt = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      setNotice('Please choose a JPG, PNG, WebP, or PDF file.');
      return;
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      setNotice('Receipt must be 5 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      setUploading(true);
      setNotice('');
      try {
        await bookingApi.uploadPublicReceipt(token, reader.result as string);
        setNotice('Receipt uploaded. The business will verify it.');
        await load();
      } catch (err: unknown) {
        setNotice(messageFromError(err, 'Receipt upload failed. Please try again.'));
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const cancelBooking = async () => {
    if (!token || !booking?.canCancel) return;
    if (!window.confirm('Cancel this booking and release the time slot?')) return;

    setCancelling(true);
    setNotice('');
    try {
      await bookingApi.cancelPublicBooking(token, 'Cancelled by customer');
      setNotice('Your booking has been cancelled and the time has been released.');
      await load();
    } catch (err: unknown) {
      setNotice(messageFromError(err, 'This booking could not be cancelled.'));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <XCircle className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-4 text-lg font-semibold text-zinc-900">Booking not available</h1>
          <p className="mt-2 text-sm text-zinc-500">{error || 'This booking link is invalid.'}</p>
          <Button asChild className="mt-6 w-full bg-zinc-900 text-white hover:bg-zinc-800">
            <Link to="/">Return home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const awaitingPayment = booking.bankDetails && booking.paymentStatus === 'awaiting_payment';
  const closed = booking.status === 'cancelled' || booking.status === 'rejected';

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{booking.provider.name}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">{booking.service.name}</h1>
              <p className="mt-1 font-mono text-xs text-zinc-500">{booking.reference}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              booking.status === 'confirmed' || booking.status === 'completed'
                ? 'bg-emerald-50 text-emerald-700'
                : closed
                  ? 'bg-red-50 text-red-700'
                  : 'bg-amber-50 text-amber-700'
            }`}>
              {statusLabel(booking)}
            </span>
          </div>

          <div className="mt-5 grid gap-3 border-t border-zinc-100 pt-5 text-sm text-zinc-700 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 text-zinc-400" />
              <div>
                <p className="font-medium text-zinc-900">{booking.dateLabel || new Date(booking.startAt).toLocaleDateString()}</p>
                <p className="text-xs text-zinc-500">{booking.timeLabel || `${booking.timeSlot.startTime}-${booking.timeSlot.endTime}`}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-zinc-400" />
              <div>
                <p className="font-medium text-zinc-900">{booking.timezone}</p>
                <p className="text-xs text-zinc-500">Times shown in the provider's timezone</p>
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Payment</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Total</dt>
              <dd className="font-semibold text-zinc-900">{money(booking.amount.total, booking.amount.currency)}</dd>
            </div>
            {booking.amount.deposit > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Deposit</dt>
                <dd className="text-zinc-700">{money(booking.amount.deposit, booking.amount.currency)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Received</dt>
              <dd className="text-zinc-700">{money(booking.amount.received, booking.amount.currency)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-zinc-100 pt-2">
              <dt className="text-zinc-500">Balance due</dt>
              <dd className="font-semibold text-zinc-900">{money(booking.amount.balanceDue, booking.amount.currency)}</dd>
            </div>
          </dl>

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
            {booking.receipt.uploaded ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Upload className="h-4 w-4 text-zinc-400" />}
            <span>
              {booking.receipt.status === 'verified'
                ? 'Receipt verified'
                : booking.receipt.status === 'awaiting_verification'
                  ? 'Receipt uploaded and awaiting verification'
                  : 'No receipt uploaded yet'}
            </span>
          </div>

          {awaitingPayment && booking.bankDetails && (
            <div className="mt-4 rounded-xl bg-zinc-900 p-4 text-white">
              <p className="text-xs font-medium text-zinc-400">Transfer to the business</p>
              <p className="mt-2 text-sm font-semibold">{booking.bankDetails.bankName || 'Bank transfer'}</p>
              <p className="font-mono text-lg font-bold tracking-wider text-emerald-400">{booking.bankDetails.accountNumber}</p>
              <p className="text-xs text-zinc-300">{booking.bankDetails.accountName}</p>
              <p className="mt-2 text-xs text-zinc-400">
                Transfer {money(booking.amount.dueNow, booking.amount.currency)} and upload the receipt below.
              </p>
            </div>
          )}

          {booking.canUploadReceipt && (
            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={uploadReceipt}
                disabled={uploading}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full bg-zinc-900 text-white hover:bg-zinc-800"
              >
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {booking.receipt.uploaded ? 'Replace receipt' : 'Upload receipt'}
              </Button>
              <p className="mt-2 text-center text-[11px] text-zinc-500">JPG, PNG, WebP, or PDF. Maximum 5 MB.</p>
            </div>
          )}
        </section>

        {notice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>
        )}

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Need help?</h2>
          <p className="mt-1 text-xs text-zinc-500">Contact {booking.provider.name} directly.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {booking.provider.phone && (
              <a
                href={`https://wa.me/${booking.provider.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <Phone className="h-3.5 w-3.5" /> WhatsApp
              </a>
            )}
            {booking.provider.email && (
              <a
                href={`mailto:${booking.provider.email}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                {booking.provider.email}
              </a>
            )}
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <Copy className="h-3.5 w-3.5" /> {copied ? 'Link copied' : 'Copy booking link'}
            </button>
          </div>
        </section>

        {booking.canCancel && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Cancel booking</h2>
            <p className="mt-1 text-xs text-zinc-500">
              This releases your time slot immediately and notifies the business. It cannot be undone.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={cancelBooking}
              disabled={cancelling}
              className="mt-3 w-full border-red-200 text-red-700 hover:bg-red-50"
            >
              {cancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cancel booking
            </Button>
          </section>
        )}

        <p className="text-center text-[11px] text-zinc-400">
          Save this page. The link is private and is the only way to reopen this booking.
        </p>
      </div>
    </div>
  );
};

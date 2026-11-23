import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { paystackService, flutterwaveService, bankService } from '../services/paymentService.js';
import {
  PaymentLifecycleError,
  applyGatewayFailure,
  applyGatewaySuccess,
  verifyBookingPayment,
} from '../services/paymentLifecycleService.js';

const lifecycleError = (res, error) => {
  if (error instanceof PaymentLifecycleError) {
    return res.status(error.statusCode).json({ message: error.message, code: error.code, ...error.details });
  }
  return res.status(500).json({ message: 'Server error', error: error.message });
};

const defaultAdminAmount = async ({ transactionId, bookingId }) => {
  const transaction = transactionId
    ? await Transaction.findById(transactionId).lean()
    : await Transaction.findOne({ booking: bookingId }).sort({ createdAt: 1 }).lean();
  return transaction?.amount;
};

// @desc    Verify payment (Paystack)
// @route   POST /api/payments/paystack/verify
// @access  Public
export const verifyPaystackPayment = async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ message: 'Reference is required' });
    }

    const verification = await paystackService.verifyPayment(reference);

    if (verification.data.status === 'success') {
      const result = await applyGatewaySuccess({
        reference: verification.data.reference || reference,
        gateway: 'paystack',
        amount: verification.data.amount / 100, // Paystack reports kobo
        currency: verification.data.currency,
        metadata: verification.data,
      });

      if (result.mismatch) {
        return res.json({ success: false, message: 'Amount or currency mismatch' });
      }

      return res.json({
        success: true,
        booking: result.booking,
        alreadyProcessed: !!result.alreadyProcessed,
        confirmationEmail: result.email,
        message: result.alreadyProcessed ? 'Payment already verified' : 'Payment verified and booking confirmed',
      });
    }

    await applyGatewayFailure({ reference, reason: 'Paystack verification did not report success' });
    res.json({ success: false, message: 'Payment verification failed' });
  } catch (error) {
    lifecycleError(res, error);
  }
};

// @desc    Paystack webhook
// @route   POST /api/payments/paystack/webhook
// @access  Public
export const paystackWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const isValid = paystackService.verifyWebhook(signature, req.rawBody || req.body);

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const { reference, amount, currency } = event.data;
      await applyGatewaySuccess({
        reference,
        gateway: 'paystack',
        amount: amount / 100,
        currency,
        metadata: event.data,
      });
    }

    // Duplicate successes are idempotent inside applyGatewaySuccess.
    res.json({ received: true });
  } catch (error) {
    lifecycleError(res, error);
  }
};

// @desc    Verify payment (Flutterwave)
// @route   POST /api/payments/flutterwave/verify
// @access  Public
export const verifyFlutterwavePayment = async (req, res) => {
  try {
    const { transaction_id } = req.body;

    if (!transaction_id) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    const verification = await flutterwaveService.verifyPayment(transaction_id);

    if (verification.data.status === 'successful') {
      const result = await applyGatewaySuccess({
        reference: String(transaction_id),
        bookingNumber: verification.data.tx_ref,
        gateway: 'flutterwave',
        amount: verification.data.amount,
        currency: verification.data.currency,
        metadata: verification.data,
      });

      if (result.mismatch) {
        return res.json({ success: false, message: 'Amount or currency mismatch' });
      }

      return res.json({
        success: true,
        booking: result.booking,
        alreadyProcessed: !!result.alreadyProcessed,
        confirmationEmail: result.email,
        message: result.alreadyProcessed ? 'Payment already verified' : 'Payment verified and booking confirmed',
      });
    }

    await applyGatewayFailure({ reference: String(transaction_id), reason: 'Flutterwave verification did not report success' });
    res.json({ success: false, message: 'Payment verification failed' });
  } catch (error) {
    lifecycleError(res, error);
  }
};

// @desc    Flutterwave webhook
// @route   POST /api/payments/flutterwave/webhook
// @access  Public
export const flutterwaveWebhook = async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    const isValid = flutterwaveService.verifyWebhook(signature);

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = req.body;

    if (event.event === 'charge.completed') {
      if (event.data.status === 'successful') {
        await applyGatewaySuccess({
          reference: String(event.data.id),
          bookingNumber: event.data.tx_ref,
          gateway: 'flutterwave',
          amount: event.data.amount,
          currency: event.data.currency,
          metadata: event.data,
        });
      } else {
        await applyGatewayFailure({
          reference: String(event.data.id || event.data.tx_ref),
          reason: `Flutterwave status: ${event.data.status}`,
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    lifecycleError(res, error);
  }
};

// @desc    Get list of banks
// @route   GET /api/payments/banks
// @access  Private
export const getBanks = async (req, res) => {
  try {
    const banks = await bankService.getBanks();
    res.json(banks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch banks', error: error.message });
  }
};

// @desc    Verify bank account
// @route   POST /api/payments/verify-bank
// @access  Private
export const verifyBankAccount = async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.body;
    const userId = req.user?._id;

    if (!accountNumber || !bankCode) {
      return res.status(400).json({ message: 'Account number and bank code are required' });
    }

    // Verify account with Paystack
    const verification = await bankService.verifyBankAccount(accountNumber, bankCode);

    if (verification.status && verification.data) {
      const accountName = verification.data.account_name;

      // Update user's bank account info
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          'bankAccount.accountNumber': accountNumber,
          'bankAccount.accountName': accountName,
          'bankAccount.verified': true,
        });
      }

      // Create Paystack subaccount for automated payouts
      try {
        const user = await User.findById(userId);
        if (user && user.businessName) {
          const subaccount = await bankService.createSubaccount(
            user.businessName,
            bankCode,
            accountNumber,
            accountName
          );

          if (subaccount.status && subaccount.data) {
            await User.findByIdAndUpdate(userId, {
              'bankAccount.subaccountCode': subaccount.data.subaccount_code,
              'bankAccount.bankName': bankCode,
            });
          }
        }
      } catch (subaccountError) {
        console.error('Subaccount creation failed:', subaccountError);
        // Don't fail the request if subaccount creation fails
      }

      return res.json({
        success: true,
        accountName,
        message: 'Bank account verified successfully',
      });
    }

    res.status(400).json({ message: 'Bank account verification failed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get provider transactions
// @route   GET /api/payments/transactions
// @access  Private (Provider)
export const getTransactions = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { provider: req.user._id };
    if (status) query.status = status;

    const limitNum = Number(limit) || 20;
    const pageNum = Number(page) || 1;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('booking')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify manual payment (Bank Transfer)
// @route   PUT /api/payments/transactions/:id/verify
// @access  Private (Provider)
export const verifyManualPayment = async (req, res) => {
  try {
    let amountReceived = req.body?.amountReceived;
    if (req.user.role === 'admin' && amountReceived === undefined) {
      amountReceived = await defaultAdminAmount({ transactionId: req.params.id });
    }

    const result = await verifyBookingPayment({
      transactionId: req.params.id,
      actor: req.user,
      amountReceived,
      overrideReason: req.body?.overrideReason,
      cashAcknowledged: req.body?.cashAcknowledged,
    });

    res.json({
      message: result.alreadyVerified ? 'Payment already verified' : 'Payment verified successfully',
      alreadyVerified: result.alreadyVerified,
      partial: !!result.partial,
      transaction: result.transaction,
      booking: result.booking,
      confirmationEmail: result.email,
    });
  } catch (error) {
    lifecycleError(res, error);
  }
};

// @desc    Verify payment for a booking (provider receipt modal / admin queue)
// @route   PUT /api/payments/bookings/:bookingId/verify
// @access  Private (Provider or Admin)
export const verifyBookingPaymentController = async (req, res) => {
  try {
    let amountReceived = req.body?.amountReceived;
    if (req.user.role === 'admin' && amountReceived === undefined) {
      amountReceived = await defaultAdminAmount({ bookingId: req.params.bookingId });
    }

    const result = await verifyBookingPayment({
      bookingId: req.params.bookingId,
      actor: req.user,
      amountReceived,
      overrideReason: req.body?.overrideReason,
      cashAcknowledged: req.body?.cashAcknowledged,
    });

    res.json({
      message: result.alreadyVerified ? 'Payment already verified' : 'Payment verified successfully',
      alreadyVerified: result.alreadyVerified,
      partial: !!result.partial,
      transaction: result.transaction,
      booking: result.booking,
      confirmationEmail: result.email,
    });
  } catch (error) {
    lifecycleError(res, error);
  }
};

// @desc    Process refund manually
// @route   POST /api/payments/transactions/:id/refund
// @access  Private (Provider)
export const processRefund = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const { amount, reason } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid refund amount is required' });
    }

    const transaction = await Transaction.findOne({ _id: transactionId, provider: req.user._id });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'successful') {
      return res.status(400).json({ message: 'Only successful transactions can be refunded' });
    }

    const currentRefundAmount = transaction.refundAmount || 0;
    const newRefundAmount = currentRefundAmount + Number(amount);

    if (newRefundAmount > transaction.amount) {
      return res.status(400).json({ message: 'Refund amount cannot exceed the original successful payment amount' });
    }

    transaction.refundAmount = newRefundAmount;
    transaction.refundReason = reason || 'Manual refund';
    transaction.refundedBy = req.user._id;
    transaction.refundedAt = new Date();
    
    transaction.refundStatus = newRefundAmount < transaction.amount ? 'refund_pending' : 'refunded';
    await transaction.save();

    res.json({
      message: 'Refund recorded successfully (bookkeeping only — no money was moved)',
      bookkeepingOnly: true,
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

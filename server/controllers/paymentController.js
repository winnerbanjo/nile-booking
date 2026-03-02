import Booking from '../models/Booking.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { paystackService, flutterwaveService, bankService } from '../services/paymentService.js';
import { notifyPaymentConfirmation } from '../services/notificationService.js';

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
      // Find booking by reference (bookingNumber)
      const booking = await Booking.findOne({ bookingNumber: reference })
        .populate('service');

      if (booking) {
        // Update booking status
        booking.status = 'confirmed';
        booking.paymentStatus = booking.paymentType === 'deposit' ? 'partial' : 'paid';
        booking.paymentReference = reference;
        booking.paymentGateway = 'paystack';
        await booking.save();

        // Create transaction record
        await Transaction.create({
          booking: booking._id,
          provider: booking.provider,
          type: booking.paymentType === 'deposit' ? 'deposit' : 'payment',
          amount: verification.data.amount / 100, // Convert from kobo
          currency: 'USD',
          paymentGateway: 'paystack',
          gatewayReference: reference,
          status: 'success',
          metadata: verification.data,
        });

        // Send notifications (WhatsApp + Email to customer and merchant)
        await notifyPaymentConfirmation(booking._id);

        return res.json({
          success: true,
          booking,
          message: 'Payment verified and booking confirmed',
        });
      }
    }

    res.json({ success: false, message: 'Payment verification failed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Paystack webhook
// @route   POST /api/payments/paystack/webhook
// @access  Public
export const paystackWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const isValid = paystackService.verifyWebhook(signature, req.body);

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const { reference, amount, customer } = event.data;

      const booking = await Booking.findOne({ bookingNumber: reference })
        .populate('service');

      if (booking && booking.status === 'pending') {
        booking.status = 'confirmed';
        booking.paymentStatus = booking.paymentType === 'deposit' ? 'partial' : 'paid';
        booking.paymentReference = reference;
        booking.paymentGateway = 'paystack';
        await booking.save();

        await Transaction.create({
          booking: booking._id,
          provider: booking.provider,
          type: booking.paymentType === 'deposit' ? 'deposit' : 'payment',
          amount: amount / 100,
          currency: 'USD',
          paymentGateway: 'paystack',
          gatewayReference: reference,
          status: 'success',
          metadata: event.data,
        });

        await notifyPaymentConfirmation(booking._id);
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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
      const reference = verification.data.tx_ref;
      const booking = await Booking.findOne({ bookingNumber: reference })
        .populate('service');

      if (booking) {
        booking.status = 'confirmed';
        booking.paymentStatus = booking.paymentType === 'deposit' ? 'partial' : 'paid';
        booking.paymentReference = transaction_id;
        booking.paymentGateway = 'flutterwave';
        await booking.save();

        await Transaction.create({
          booking: booking._id,
          provider: booking.provider,
          type: booking.paymentType === 'deposit' ? 'deposit' : 'payment',
          amount: verification.data.amount,
          currency: verification.data.currency || 'USD',
          paymentGateway: 'flutterwave',
          gatewayReference: transaction_id,
          status: 'success',
          metadata: verification.data,
        });

        await notifyPaymentConfirmation(booking._id);

        return res.json({
          success: true,
          booking,
          message: 'Payment verified and booking confirmed',
        });
      }
    }

    res.json({ success: false, message: 'Payment verification failed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Flutterwave webhook
// @route   POST /api/payments/flutterwave/webhook
// @access  Public
export const flutterwaveWebhook = async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    const isValid = flutterwaveService.verifyWebhook(signature, req.body);

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = req.body;

    if (event.event === 'charge.completed' && event.data.status === 'successful') {
      const { tx_ref, id, amount } = event.data;

      const booking = await Booking.findOne({ bookingNumber: tx_ref })
        .populate('service');

      if (booking && booking.status === 'pending') {
        booking.status = 'confirmed';
        booking.paymentStatus = booking.paymentType === 'deposit' ? 'partial' : 'paid';
        booking.paymentReference = id.toString();
        booking.paymentGateway = 'flutterwave';
        await booking.save();

        await Transaction.create({
          booking: booking._id,
          provider: booking.provider,
          type: booking.paymentType === 'deposit' ? 'deposit' : 'payment',
          amount,
          currency: 'USD',
          paymentGateway: 'flutterwave',
          gatewayReference: id.toString(),
          status: 'success',
          metadata: event.data,
        });

        await notifyPaymentConfirmation(booking._id);
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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

import axios from 'axios';
import crypto from 'crypto';

const safeEqual = (left, right) => {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// Gateways are opt-in. Never silently redirect customers to localhost.
const requiredCallback = (name, gateway) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required when ${gateway} payments are enabled.`);
  }
  return value;
};

// Paystack integration
export const paystackService = {
  initializePayment: async (amount, email, reference, metadata = {}, options = {}) => {
    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          amount: amount * 100, // Convert to kobo
          email,
          reference,
          metadata,
          callback_url: options.callbackUrl || requiredCallback('PAYSTACK_CALLBACK_URL', 'Paystack'),
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Paystack error: ${error.response?.data?.message || error.message}`);
    }
  },

  verifyPayment: async (reference) => {
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Paystack verification error: ${error.response?.data?.message || error.message}`);
    }
  },

  verifyWebhook: (signature, body) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret || !signature || body === undefined) return false;
    const raw = Buffer.isBuffer(body)
      ? body
      : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
    const hash = crypto.createHmac('sha512', secret).update(raw).digest('hex');
    return safeEqual(hash, signature);
  },
};

// Flutterwave integration
export const flutterwaveService = {
  initializePayment: async (amount, email, reference, metadata = {}) => {
    try {
      const response = await axios.post(
        'https://api.flutterwave.com/v3/payments',
        {
          tx_ref: reference,
          amount,
          currency: 'USD',
          redirect_url: requiredCallback('FLUTTERWAVE_CALLBACK_URL', 'Flutterwave'),
          payment_options: 'card, banktransfer, ussd',
          customer: {
            email,
            ...metadata.customer,
          },
          meta: metadata,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Flutterwave error: ${error.response?.data?.message || error.message}`);
    }
  },

  verifyPayment: async (transactionId) => {
    try {
      const response = await axios.get(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Flutterwave verification error: ${error.response?.data?.message || error.message}`);
    }
  },

  verifyWebhook: (signature) => {
    const secret = process.env.FLUTTERWAVE_SECRET_HASH;
    return Boolean(secret && signature) && safeEqual(secret, signature);
  },
};

// Bank account verification and subaccount creation
export const bankService = {
  // Verify bank account using Paystack
  verifyBankAccount: async (accountNumber, bankCode) => {
    try {
      const response = await axios.get(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Bank verification error: ${error.response?.data?.message || error.message}`);
    }
  },

  // Get list of banks
  getBanks: async () => {
    try {
      const response = await axios.get('https://api.paystack.co/bank', {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Get banks error: ${error.response?.data?.message || error.message}`);
    }
  },

  // Create Paystack subaccount for split payments
  createSubaccount: async (businessName, settlementBank, accountNumber, accountName, percentageCharge = 10) => {
    try {
      const response = await axios.post(
        'https://api.paystack.co/subaccount',
        {
          business_name: businessName,
          settlement_bank: settlementBank,
          account_number: accountNumber,
          percentage_charge: percentageCharge,
          primary_contact_email: process.env.PAYSTACK_MERCHANT_EMAIL || 'merchant@nile.ng',
          primary_contact_name: accountName,
          primary_contact_phone: process.env.PAYSTACK_MERCHANT_PHONE || '+2348123456789',
          settlement_schedule: 'weekly',
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Subaccount creation error: ${error.response?.data?.message || error.message}`);
    }
  },
};

import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { bookingApi } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Check, ChevronRight, ArrowLeft, CreditCard, Wallet, Clock, Camera, Upload, MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Service } from '../types';

interface CheckoutData {
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  paymentType: 'full' | 'deposit' | 'pay_later' | 'bank_transfer';
  paymentGateway?: 'paystack' | 'flutterwave';
  notes: string;
  receiptImage?: string;
}

const STEPS = ['Details', 'Summary', 'Payment'] as const;

export const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { service, date, timeSlot } = location.state || {};
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTransferSheet, setShowTransferSheet] = useState(false);
  const [showPendingVerification, setShowPendingVerification] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CheckoutData>({
    customer: {
      name: '',
      email: '',
      phone: '',
    },
    paymentType: 'full',
    paymentGateway: 'paystack',
    notes: '',
  });

  if (!service || !date || !timeSlot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Invalid checkout session</p>
            <Button className="w-full mt-4" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof CheckoutData],
          [child]: value,
        },
      });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, receiptImage: reader.result as string });
        setReceiptUploaded(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (currentStep === 0) {
      // Validate customer details
      if (!formData.customer.name || !formData.customer.email || !formData.customer.phone) {
        setError('Please fill in all customer details');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.customer.email)) {
        setError('Please enter a valid email address');
        return;
      }
    }
    setError('');
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (formData.paymentType === 'bank_transfer') {
      if (!receiptUploaded || !formData.receiptImage) {
        setError('Please upload your payment receipt');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const response = await bookingApi.createBooking({
        customer: formData.customer,
        serviceId: (service as Service)._id,
        date,
        timeSlot,
        paymentType: formData.paymentType,
        paymentGateway: formData.paymentGateway,
        notes: formData.notes,
        receiptImage: formData.receiptImage, // Include receipt for bank transfer
      });

      // If bank transfer, show pending verification screen
      if (formData.paymentType === 'bank_transfer') {
        setShowPendingVerification(true);
        setLoading(false);
        return;
      }

      // Redirect to payment if needed
      if (response.paymentData && formData.paymentType !== 'pay_later') {
        if (formData.paymentGateway === 'paystack') {
          window.location.href = response.paymentData.data.authorization_url;
        } else if (formData.paymentGateway === 'flutterwave') {
          window.location.href = response.paymentData.data.link;
        }
      } else {
        // Pay later - show success
        navigate('/checkout/success', { state: { booking: response.booking } });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create booking. Please try again.');
      setLoading(false);
    }
  };

  const calculatePricing = () => {
    const servicePrice = (service as Service).price;
    const depositAmount = formData.paymentType === 'deposit' ? servicePrice * 0.3 : 0;
    const totalAmount = formData.paymentType === 'pay_later' ? 0 : (formData.paymentType === 'deposit' ? depositAmount : servicePrice);
    return { servicePrice, depositAmount, totalAmount };
  };

  const pricing = calculatePricing();

  // Bank Transfer Details
  const bankDetails = {
    bankName: 'Providus Bank',
    accountName: 'Nile Technologies Inc',
    accountNumber: '8123843076',
    amount: pricing.totalAmount || pricing.servicePrice,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F5F5F7] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <React.Fragment key={step}>
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      index <= currentStep
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-400 border-gray-300'
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      index <= currentStep ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="h-5 w-5 text-gray-300 mx-4" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <Card className="bg-white/40 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <CardHeader>
            <CardTitle>{STEPS[currentStep]}</CardTitle>
            <CardDescription>
              {currentStep === 0 && 'Enter your contact information'}
              {currentStep === 1 && 'Review your booking details'}
              {currentStep === 2 && 'Complete your payment'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Step 1: Customer Details */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.customer.name}
                    onChange={(e) => handleInputChange('customer.name', e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.customer.email}
                    onChange={(e) => handleInputChange('customer.email', e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.customer.phone}
                    onChange={(e) => handleInputChange('customer.phone', e.target.value)}
                    placeholder="+1234567890"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Any special requests or notes..."
                  />
                </div>
              </div>
            )}

            {/* Step 2: Summary */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Service</h3>
                  <p className="text-gray-600">{(service as Service).name}</p>
                  <p className="text-sm text-gray-500 mt-1">{(service as Service).description}</p>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Date & Time</h3>
                  <p className="text-gray-600">
                    {new Date(date).toLocaleDateString()} at {timeSlot.startTime} - {timeSlot.endTime}
                  </p>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Customer</h3>
                  <p className="text-gray-600">{formData.customer.name}</p>
                  <p className="text-sm text-gray-500">{formData.customer.email}</p>
                  <p className="text-sm text-gray-500">{formData.customer.phone}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Payment Option</h3>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentType"
                        value="full"
                        checked={formData.paymentType === 'full'}
                        onChange={(e) => handleInputChange('paymentType', e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center">
                          <CreditCard className="h-5 w-5 mr-2 text-gray-600" />
                          <span className="font-medium">Full Payment</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">₦{pricing.servicePrice.toLocaleString()}</p>
                      </div>
                    </label>
                    <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentType"
                        value="deposit"
                        checked={formData.paymentType === 'deposit'}
                        onChange={(e) => handleInputChange('paymentType', e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Wallet className="h-5 w-5 mr-2 text-gray-600" />
                          <span className="font-medium">Deposit (30%)</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">₦{pricing.depositAmount.toLocaleString()} now, rest later</p>
                      </div>
                    </label>
                    <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentType"
                        value="bank_transfer"
                        checked={formData.paymentType === 'bank_transfer'}
                        onChange={(e) => handleInputChange('paymentType', e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Wallet className="h-5 w-5 mr-2 text-gray-600" />
                          <span className="font-medium">Bank Transfer</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Pay via bank transfer | Upload receipt</p>
                      </div>
                    </label>
                    <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentType"
                        value="pay_later"
                        checked={formData.paymentType === 'pay_later'}
                        onChange={(e) => handleInputChange('paymentType', e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 mr-2 text-gray-600" />
                          <span className="font-medium">Pay Later</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Pay at the time of service</p>
                      </div>
                    </label>
                  </div>
                </div>
                {formData.paymentType !== 'pay_later' && formData.paymentType !== 'bank_transfer' && (
                  <div className="space-y-2">
                    <Label htmlFor="gateway">Payment Gateway</Label>
                    <select
                      id="gateway"
                      value={formData.paymentGateway}
                      onChange={(e) => handleInputChange('paymentGateway', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="paystack">Paystack</option>
                      <option value="flutterwave">Flutterwave</option>
                    </select>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold">₦{(pricing.totalAmount || pricing.servicePrice).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 2 && formData.paymentType !== 'bank_transfer' && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <CreditCard className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Redirecting to Payment...</h3>
                  <p className="text-gray-600">
                    You will be redirected to {formData.paymentGateway === 'paystack' ? 'Paystack' : 'Flutterwave'} to complete your payment.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && formData.paymentType === 'bank_transfer' && (
              <div className="space-y-4">
                <div className="p-6 bg-white/50 rounded-xl border border-white/50">
                  <h3 className="text-lg font-semibold mb-4">Bank Transfer Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank Name:</span>
                      <span className="font-semibold">{bankDetails.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Name:</span>
                      <span className="font-semibold">{bankDetails.accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Number:</span>
                      <span className="font-semibold font-mono">{bankDetails.accountNumber}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t">
                      <span className="text-gray-900 font-semibold">Amount:</span>
                      <span className="text-xl font-black">₦{bankDetails.amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setShowTransferSheet(true)}
                  className="w-full bg-[#22c55e] hover:bg-green-600 text-white h-12"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Snap & Upload Receipt
                </Button>
                {receiptUploaded && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">Receipt uploaded successfully</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  if (currentStep > 0) {
                    setCurrentStep(currentStep - 1);
                  } else {
                    navigate(-1);
                  }
                }}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {currentStep === 0 ? 'Back' : 'Previous'}
              </Button>
              <Button onClick={handleNext} disabled={loading}>
                {loading ? 'Processing...' : currentStep === STEPS.length - 1 ? 'Complete Payment' : 'Next'}
                {!loading && currentStep < STEPS.length - 1 && <ChevronRight className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Bottom Sheet for Bank Transfer */}
      <AnimatePresence>
        {showTransferSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTransferSheet(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl rounded-t-3xl border-t border-white/30 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-gray-900">Bank Transfer Details</h3>
                <button onClick={() => setShowTransferSheet(false)}>
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Bank Name</p>
                  <p className="text-lg font-semibold">{bankDetails.bankName}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Account Name</p>
                  <p className="text-lg font-semibold">{bankDetails.accountName}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Account Number</p>
                  <p className="text-lg font-mono text-lg font-semibold">{bankDetails.accountNumber}</p>
                </div>
                <div className="p-4 bg-[#22c55e]/10 rounded-xl border border-[#22c55e]/20">
                  <p className="text-sm text-gray-600 mb-1">Amount to Transfer</p>
                  <p className="text-2xl font-black text-[#22c55e]">₦{bankDetails.amount.toLocaleString()}</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                onClick={handleCameraClick}
                className="w-full bg-[#22c55e] hover:bg-green-600 text-white h-12 mb-3"
              >
                <Camera className="h-5 w-5 mr-2" />
                {receiptUploaded ? 'Change Receipt' : 'Snap & Upload Receipt'}
              </Button>
              {receiptUploaded && (
                <Button
                  onClick={() => {
                    setShowTransferSheet(false);
                    handleSubmit();
                  }}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12"
                >
                  Submit Booking
                </Button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Pending Verification Screen */}
      <AnimatePresence>
        {showPendingVerification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white/95 backdrop-blur-2xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full text-center"
            >
              <div className="mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 mx-auto mb-4 border-4 border-[#22c55e] border-t-transparent rounded-full"
                />
                <h2 className="text-2xl font-black text-gray-900 mb-2">Pending Verification</h2>
                <p className="text-gray-600">
                  Your booking is pending verification. We'll notify you once your payment receipt has been confirmed.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl mb-6">
                <p className="text-sm text-gray-600 mb-2">Need help?</p>
                <a
                  href="https://wa.me/2348123843076"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#22c55e] font-semibold hover:underline"
                >
                  <MessageCircle className="h-5 w-5" />
                  Contact Support on WhatsApp
                </a>
              </div>
              <Button
                onClick={() => navigate('/')}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              >
                Return Home
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

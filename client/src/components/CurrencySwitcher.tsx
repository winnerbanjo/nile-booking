import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type Currency = 'NGN' | 'USD' | 'GBP';

interface CurrencySwitcherProps {
  onCurrencyChange?: (currency: Currency) => void;
}

const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: 'NGN', symbol: '₦', label: 'Nigerian Naira' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
];

const EXCHANGE_RATES: Record<Currency, number> = {
  NGN: 1,
  USD: 1500, // 1 USD = 1,500 NGN
  GBP: 1900, // 1 GBP = 1,900 NGN (approximate)
};

export const CurrencySwitcher: React.FC<CurrencySwitcherProps> = ({ onCurrencyChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('NGN');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCurrencySelect = (currency: Currency) => {
    setSelectedCurrency(currency);
    setIsOpen(false);
    if (onCurrencyChange) {
      onCurrencyChange(currency);
    }
    // Store in localStorage for persistence
    localStorage.setItem('selectedCurrency', currency);
  };

  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency') as Currency;
    if (savedCurrency && CURRENCIES.some(c => c.code === savedCurrency)) {
      setSelectedCurrency(savedCurrency);
    }
  }, []);

  const currentCurrency = CURRENCIES.find(c => c.code === selectedCurrency)!;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/40 backdrop-blur-xl border border-white/40 hover:bg-white/60 transition-all text-sm font-semibold text-gray-900"
        style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
      >
        <Globe className="w-4 h-4" />
        <span>{currentCurrency.symbol}</span>
        <span className="hidden sm:inline">{currentCurrency.code}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 right-0 z-50 bg-white/40 backdrop-blur-xl border border-white/40 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-w-[180px] overflow-hidden"
            >
              {CURRENCIES.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencySelect(currency.code)}
                  className={`w-full px-4 py-3 text-left hover:bg-white/60 transition-colors flex items-center justify-between ${
                    selectedCurrency === currency.code ? 'bg-white/40' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold">{currency.symbol}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                        {currency.code}
                      </span>
                      <span className="text-xs text-gray-500 font-light">{currency.label}</span>
                    </div>
                  </div>
                  {selectedCurrency === currency.code && (
                    <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Currency conversion utility
export const convertCurrency = (amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to NGN first
  const amountInNGN = amount * EXCHANGE_RATES[fromCurrency];
  
  // Convert to target currency
  return amountInNGN / EXCHANGE_RATES[toCurrency];
};

// Format currency display
export const formatCurrency = (amount: number, currency: Currency): string => {
  const currencyInfo = CURRENCIES.find(c => c.code === currency)!;
  const convertedAmount = convertCurrency(amount, 'NGN', currency);
  
  if (currency === 'NGN') {
    return `${currencyInfo.symbol}${convertedAmount.toLocaleString('en-NG')}`;
  }
  
  return `${currencyInfo.symbol}${convertedAmount.toFixed(2)}`;
};

// Get current currency from localStorage
export const getCurrentCurrency = (): Currency => {
  const saved = localStorage.getItem('selectedCurrency') as Currency;
  return saved && CURRENCIES.some(c => c.code === saved) ? saved : 'NGN';
};

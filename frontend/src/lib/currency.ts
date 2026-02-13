import api from './api';

let cachedRates: Record<string, number> | null = null;
let cacheTime = 0;

export const getCurrencySymbol = (currency: string) => {
  const symbols: Record<string, string> = {
    USD: '$',
    COP: 'COP $',
    VES: 'Bs.'
  };
  return symbols[currency] || '$';
};

export const fetchRates = async () => {
  const now = Date.now();
  if (cachedRates && now - cacheTime < 3600000) return cachedRates;

  try {
    const { data } = await api.get('/exchange-rates');
    cachedRates = data.rates;
    cacheTime = now;
    return data.rates;
  } catch {
    return cachedRates || { USD: 1, COP: 4200, VES: 36.5 };
  }
};

export const formatCurrency = (amountUSD: number, currency: string, rate?: number) => {
  const symbol = getCurrencySymbol(currency);
  const converted = currency === 'USD' ? amountUSD : amountUSD * (rate || 1);
  return `${symbol}${converted.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

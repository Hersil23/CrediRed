let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000;

const fetchRates = async () => {
  const now = Date.now();

  if (cachedRates && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();

    if (data.result === 'success') {
      cachedRates = {
        USD: 1,
        COP: data.rates.COP,
        VES: data.rates.VES
      };
      cacheTimestamp = now;
      return cachedRates;
    }

    throw new Error('Error al obtener tasas de cambio');
  } catch {
    if (cachedRates) return cachedRates;
    return { USD: 1, COP: 4200, VES: 36.5 };
  }
};

export const toUSD = async (amount: number, fromCurrency: string) => {
  if (fromCurrency === 'USD') return amount;
  const rates = await fetchRates();
  return amount / rates[fromCurrency];
};

export const fromUSD = async (amountUSD: number, toCurrency: string) => {
  if (toCurrency === 'USD') return amountUSD;
  const rates = await fetchRates();
  return amountUSD * rates[toCurrency];
};

export const getRates = async () => {
  return await fetchRates();
};

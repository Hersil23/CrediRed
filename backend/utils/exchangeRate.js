let cachedRates = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

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
  } catch (error) {
    // Si falla la API y hay cache viejo, usarlo
    if (cachedRates) return cachedRates;

    // Tasas de respaldo
    return { USD: 1, COP: 4200, VES: 36.5 };
  }
};

// Convertir de cualquier moneda a USD
const toUSD = async (amount, fromCurrency) => {
  if (fromCurrency === 'USD') return amount;
  const rates = await fetchRates();
  return amount / rates[fromCurrency];
};

// Convertir de USD a cualquier moneda
const fromUSD = async (amountUSD, toCurrency) => {
  if (toCurrency === 'USD') return amountUSD;
  const rates = await fetchRates();
  return amountUSD * rates[toCurrency];
};

// Obtener todas las tasas
const getRates = async () => {
  return await fetchRates();
};

module.exports = { toUSD, fromUSD, getRates };

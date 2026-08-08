/**
 * Exchange rates.
 *
 * Uses open.er-api.com, which needs no API key and no signup — the old build
 * asked users for an OpenWeatherMap key before Weather would do anything, and
 * this app's promise is that nothing needs configuring.
 *
 * Rates are cached in localStorage with the timestamp they were fetched, so the
 * tool works offline and can honestly tell you how stale the numbers are.
 */

import { readStored, writeStored } from './storage';

const ENDPOINT = 'https://open.er-api.com/v6/latest/USD';
const CACHE_KEY = 'rates:usd';

/** Rates older than this trigger a background refresh; the cache is still used
 *  until the new data lands, so the UI never blocks on the network. */
const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

export interface RateCache {
  /** Rates keyed by ISO code, expressed per 1 USD. */
  rates: Record<string, number>;
  /** When we fetched it (ms epoch). */
  fetchedAt: number;
  /** The provider's own "last updated" string, which is what actually matters
   *  for accuracy — the feed updates once a day. */
  providerUpdated: string | null;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

/** The codes the tool offers, with names/symbols for display. The API returns
 *  more than this; the list is trimmed to currencies people actually convert. */
export const CURRENCIES: readonly Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب' },
  { code: 'OMR', name: 'Omani Rial', symbol: '﷼' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'Rs' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
  { code: 'ARS', name: 'Argentine Peso', symbol: 'AR$' },
  { code: 'CLP', name: 'Chilean Peso', symbol: 'CL$' },
  { code: 'COP', name: 'Colombian Peso', symbol: 'CO$' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U' },
  { code: 'ISK', name: 'Icelandic Króna', symbol: 'kr' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸' },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: "so'm" },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت' },
];

export function getCurrency(code: string): Currency | undefined {
  return CURRENCIES.find((currency) => currency.code === code);
}

function isRateCache(value: unknown): value is RateCache {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<RateCache>;
  return (
    typeof candidate.fetchedAt === 'number' &&
    typeof candidate.rates === 'object' &&
    candidate.rates !== null &&
    typeof candidate.rates.USD === 'number'
  );
}

export function readCachedRates(): RateCache | null {
  const cached = readStored<RateCache | null>(CACHE_KEY, null, (value): value is RateCache | null =>
    value === null ? true : isRateCache(value),
  );
  return cached;
}

export function isStale(cache: RateCache): boolean {
  return Date.now() - cache.fetchedAt > STALE_AFTER_MS;
}

/** Fetch fresh rates and cache them. Throws on network or shape failure so the
 *  caller can decide whether to fall back to cache. */
export async function fetchRates(signal?: AbortSignal): Promise<RateCache> {
  const response = await fetch(ENDPOINT, { signal });
  if (!response.ok) throw new Error(`Rate service returned ${response.status}`);

  const payload: unknown = await response.json();
  if (typeof payload !== 'object' || payload === null) throw new Error('Malformed response');

  const body = payload as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string };
  if (body.result !== 'success' || !body.rates || typeof body.rates.USD !== 'number') {
    throw new Error('Rate service returned unexpected data');
  }

  const cache: RateCache = {
    rates: body.rates,
    fetchedAt: Date.now(),
    providerUpdated: body.time_last_update_utc ?? null,
  };

  writeStored(CACHE_KEY, cache);
  return cache;
}

/**
 * Convert between any two currencies via USD, which is the base the feed
 * publishes. `rates[X]` is how many X one USD buys, so cross rates are
 * `amount / rates[from] * rates[to]`.
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
): number | null {
  const fromRate = rates[from];
  const toRate = rates[to];
  if (typeof fromRate !== 'number' || typeof toRate !== 'number' || fromRate === 0) return null;
  return (amount / fromRate) * toRate;
}

/** Rate for 1 unit of `from` expressed in `to`. */
export function pairRate(from: string, to: string, rates: Record<string, number>): number | null {
  return convertCurrency(1, from, to, rates);
}

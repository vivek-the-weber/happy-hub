export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  currency: {
    code: string;
    locale: string;
  };
}

const countryCurrencyMap: Record<string, { code: string; locale: string }> = {
  'IN': { code: 'INR', locale: 'en-IN' },
  'US': { code: 'USD', locale: 'en-US' },
  'GB': { code: 'GBP', locale: 'en-GB' },
  'EU': { code: 'EUR', locale: 'de-DE' },
  'AE': { code: 'AED', locale: 'ar-AE' },
  'SG': { code: 'SGD', locale: 'en-SG' },
  'AU': { code: 'AUD', locale: 'en-AU' },
  'CA': { code: 'CAD', locale: 'en-CA' },
  'ID': { code: 'IDR', locale: 'id-ID' },
  'MY': { code: 'MYR', locale: 'ms-MY' },
  'PH': { code: 'PHP', locale: 'en-PH' },
  'TH': { code: 'THB', locale: 'th-TH' },
  'JP': { code: 'JPY', locale: 'ja-JP' },
  'KR': { code: 'KRW', locale: 'ko-KR' },
  'CN': { code: 'CNY', locale: 'zh-CN' },
  'BR': { code: 'BRL', locale: 'pt-BR' },
  'MX': { code: 'MXN', locale: 'es-MX' },
  'ZA': { code: 'ZAR', locale: 'en-ZA' },
  'NZ': { code: 'NZD', locale: 'en-NZ' },
  'CH': { code: 'CHF', locale: 'de-CH' },
};

export const SUPPORTED_COUNTRIES: CountryConfig[] = [
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: countryCurrencyMap['IN'] },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: countryCurrencyMap['US'] },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: countryCurrencyMap['GB'] },
  { code: 'EU', name: 'Europe', flag: '🇪🇺', currency: countryCurrencyMap['EU'] },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', currency: countryCurrencyMap['AE'] },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: countryCurrencyMap['SG'] },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: countryCurrencyMap['AU'] },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: countryCurrencyMap['CA'] },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', currency: countryCurrencyMap['ID'] },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', currency: countryCurrencyMap['MY'] },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', currency: countryCurrencyMap['PH'] },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', currency: countryCurrencyMap['TH'] },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: countryCurrencyMap['JP'] },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', currency: countryCurrencyMap['KR'] },
  { code: 'CN', name: 'China', flag: '🇨🇳', currency: countryCurrencyMap['CN'] },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: countryCurrencyMap['BR'] },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: countryCurrencyMap['MX'] },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: countryCurrencyMap['ZA'] },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', currency: countryCurrencyMap['NZ'] },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', currency: countryCurrencyMap['CH'] },
];

export function formatPrice(price: number, countryCode: string = 'IN'): string {
  const config = countryCurrencyMap[countryCode] || countryCurrencyMap['US'];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
  }).format(price);
}

export function getCurrencySymbol(countryCode: string = 'IN'): string {
  const config = countryCurrencyMap[countryCode] || countryCurrencyMap['US'];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
  })
    .formatToParts(0)
    .find(part => part.type === 'currency')?.value || '$';
}

export function getCountryByCode(code: string): CountryConfig | undefined {
  return SUPPORTED_COUNTRIES.find(c => c.code === code);
}

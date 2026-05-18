export type Country = {
  code: string; // ISO-2
  name: string;
  currency: string;
  flag: string; // emoji
  region: "North" | "West" | "East" | "Central" | "Southern";
  papssLive: boolean;
};

export const COUNTRIES: Country[] = [
  { code: "DZ", name: "Algeria", currency: "DZD", flag: "🇩🇿", region: "North", papssLive: false },
  { code: "AO", name: "Angola", currency: "AOA", flag: "🇦🇴", region: "Southern", papssLive: false },
  { code: "BJ", name: "Benin", currency: "XOF", flag: "🇧🇯", region: "West", papssLive: false },
  { code: "BW", name: "Botswana", currency: "BWP", flag: "🇧🇼", region: "Southern", papssLive: false },
  { code: "BF", name: "Burkina Faso", currency: "XOF", flag: "🇧🇫", region: "West", papssLive: false },
  { code: "CM", name: "Cameroon", currency: "XAF", flag: "🇨🇲", region: "Central", papssLive: false },
  { code: "CV", name: "Cape Verde", currency: "CVE", flag: "🇨🇻", region: "West", papssLive: false },
  { code: "CI", name: "Côte d'Ivoire", currency: "XOF", flag: "🇨🇮", region: "West", papssLive: false },
  { code: "DJ", name: "Djibouti", currency: "DJF", flag: "🇩🇯", region: "East", papssLive: true },
  { code: "EG", name: "Egypt", currency: "EGP", flag: "🇪🇬", region: "North", papssLive: false },
  { code: "ET", name: "Ethiopia", currency: "ETB", flag: "🇪🇹", region: "East", papssLive: false },
  { code: "GH", name: "Ghana", currency: "GHS", flag: "🇬🇭", region: "West", papssLive: true },
  { code: "GN", name: "Guinea", currency: "GNF", flag: "🇬🇳", region: "West", papssLive: true },
  { code: "KE", name: "Kenya", currency: "KES", flag: "🇰🇪", region: "East", papssLive: true },
  { code: "LR", name: "Liberia", currency: "LRD", flag: "🇱🇷", region: "West", papssLive: true },
  { code: "MA", name: "Morocco", currency: "MAD", flag: "🇲🇦", region: "North", papssLive: false },
  { code: "MW", name: "Malawi", currency: "MWK", flag: "🇲🇼", region: "Southern", papssLive: false },
  { code: "MU", name: "Mauritius", currency: "MUR", flag: "🇲🇺", region: "East", papssLive: false },
  { code: "NG", name: "Nigeria", currency: "NGN", flag: "🇳🇬", region: "West", papssLive: true },
  { code: "RW", name: "Rwanda", currency: "RWF", flag: "🇷🇼", region: "East", papssLive: true },
  { code: "SN", name: "Senegal", currency: "XOF", flag: "🇸🇳", region: "West", papssLive: false },
  { code: "SL", name: "Sierra Leone", currency: "SLL", flag: "🇸🇱", region: "West", papssLive: true },
  { code: "ZA", name: "South Africa", currency: "ZAR", flag: "🇿🇦", region: "Southern", papssLive: false },
  { code: "TZ", name: "Tanzania", currency: "TZS", flag: "🇹🇿", region: "East", papssLive: false },
  { code: "TN", name: "Tunisia", currency: "TND", flag: "🇹🇳", region: "North", papssLive: false },
  { code: "UG", name: "Uganda", currency: "UGX", flag: "🇺🇬", region: "East", papssLive: false },
  { code: "ZM", name: "Zambia", currency: "ZMW", flag: "🇿🇲", region: "Southern", papssLive: true },
  { code: "ZW", name: "Zimbabwe", currency: "ZWL", flag: "🇿🇼", region: "Southern", papssLive: true }
];

export function getCountry(code: string) {
  return COUNTRIES.find((c) => c.code === code);
}

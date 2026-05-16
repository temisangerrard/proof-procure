export interface Currency {
  code: string;
  name: string;
  symbol: string;
  countries?: string[];
}

export const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$", countries: ["US"] },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    countries: ["DE", "FR", "IT", "ES"],
  },
  { code: "GBP", name: "British Pound", symbol: "£", countries: ["GB"] },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", countries: ["NG"] },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", countries: ["GH"] },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", countries: ["KE"] },
  { code: "ZAR", name: "South African Rand", symbol: "R", countries: ["ZA"] },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", countries: ["AE"] },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", countries: ["SA"] },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", countries: ["CN"] },
  { code: "INR", name: "Indian Rupee", symbol: "₹", countries: ["IN"] },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨", countries: ["PK"] },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", countries: ["BD"] },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", countries: ["VN"] },
  { code: "THB", name: "Thai Baht", symbol: "฿", countries: ["TH"] },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", countries: ["ID"] },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", countries: ["MY"] },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", countries: ["TR"] },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", countries: ["EG"] },
  { code: "MAD", name: "Moroccan Dirham", symbol: "د.م.", countries: ["MA"] },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br", countries: ["ET"] },
  {
    code: "XOF",
    name: "West African CFA Franc",
    symbol: "CFA",
    countries: ["SN", "CI", "BJ"],
  },
  {
    code: "XAF",
    name: "Central African CFA Franc",
    symbol: "FCFA",
    countries: ["CM", "TD"],
  },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", countries: ["CA"] },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", countries: ["AU"] },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", countries: ["JP"] },
  { code: "KRW", name: "South Korean Won", symbol: "₩", countries: ["KR"] },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", countries: ["BR"] },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$", countries: ["MX"] },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", countries: ["SG"] },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", countries: ["HK"] },
];

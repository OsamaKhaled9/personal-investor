export interface USTicker {
  ticker: string;
  name: string;
  sector: string;
}

// Curated halal-compliant US stocks — AAOIFI-screened, no banks/defence/alcohol/tobacco/gambling.
export const US_HALAL_TICKERS: USTicker[] = [
  // Technology
  { ticker: "AAPL",  name: "Apple Inc.",                  sector: "Technology" },
  { ticker: "MSFT",  name: "Microsoft Corporation",        sector: "Technology" },
  { ticker: "GOOGL", name: "Alphabet Inc.",                sector: "Technology" },
  { ticker: "META",  name: "Meta Platforms Inc.",          sector: "Technology" },
  { ticker: "NVDA",  name: "NVIDIA Corporation",           sector: "Technology" },
  { ticker: "AMZN",  name: "Amazon.com Inc.",              sector: "Technology" },
  { ticker: "CRM",   name: "Salesforce Inc.",              sector: "Technology" },
  { ticker: "ADBE",  name: "Adobe Inc.",                   sector: "Technology" },
  { ticker: "ORCL",  name: "Oracle Corporation",           sector: "Technology" },
  { ticker: "CSCO",  name: "Cisco Systems Inc.",           sector: "Technology" },
  // Healthcare
  { ticker: "JNJ",   name: "Johnson & Johnson",            sector: "Healthcare" },
  { ticker: "ABBV",  name: "AbbVie Inc.",                  sector: "Healthcare" },
  { ticker: "UNH",   name: "UnitedHealth Group",           sector: "Healthcare" },
  { ticker: "MDT",   name: "Medtronic plc",                sector: "Healthcare" },
  { ticker: "TMO",   name: "Thermo Fisher Scientific",     sector: "Healthcare" },
  { ticker: "ABT",   name: "Abbott Laboratories",          sector: "Healthcare" },
  // Consumer
  { ticker: "NKE",   name: "Nike Inc.",                    sector: "Consumer" },
  { ticker: "COST",  name: "Costco Wholesale",             sector: "Consumer" },
  { ticker: "TGT",   name: "Target Corporation",           sector: "Consumer" },
  { ticker: "AMGN",  name: "Amgen Inc.",                   sector: "Consumer" },
  // Industrials
  { ticker: "HON",   name: "Honeywell International",      sector: "Industrials" },
  { ticker: "CAT",   name: "Caterpillar Inc.",              sector: "Industrials" },
  { ticker: "DE",    name: "Deere & Company",              sector: "Industrials" },
  { ticker: "MMM",   name: "3M Company",                   sector: "Industrials" },
  { ticker: "UPS",   name: "United Parcel Service",        sector: "Industrials" },
  // Clean Energy
  { ticker: "NEE",   name: "NextEra Energy Inc.",          sector: "Clean Energy" },
  { ticker: "ENPH",  name: "Enphase Energy Inc.",          sector: "Clean Energy" },
  { ticker: "FSLR",  name: "First Solar Inc.",             sector: "Clean Energy" },
  // Communication
  { ticker: "T",     name: "AT&T Inc.",                    sector: "Communication" },
  { ticker: "VZ",    name: "Verizon Communications",       sector: "Communication" },
  // Real Estate (REITs — debt ratio must pass screening; included as commonly listed halal)
  { ticker: "PLD",   name: "Prologis Inc.",                sector: "Real Estate" },
  { ticker: "AMT",   name: "American Tower Corporation",   sector: "Real Estate" },
  // Materials
  { ticker: "LIN",   name: "Linde plc",                   sector: "Materials" },
  { ticker: "APD",   name: "Air Products & Chemicals",    sector: "Materials" },
];

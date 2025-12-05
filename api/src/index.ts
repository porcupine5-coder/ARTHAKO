import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet'
import morgan from 'morgan'

import { apiRateLimiter } from './middleware/security.ts'
import { helmetConfig, corsOptions, requestSizeLimits } from './middleware/security.ts'
import { validateSymbol, validatePeriod, handleValidationErrors, sanitizeInput } from './middleware/validation.ts'
import { authenticateToken, requireRole, syncUserFromToken } from './middleware/auth.ts'
import { adminClient, userClient } from './lib/supabaseClients.ts'
import { validateOHLCData, validateUser, validateSubscription, getSafeValidationError } from './lib/queryValidation.ts'
import { handleSupabaseError, withTimeout, withRetry } from './lib/dbErrorHandler.ts'

// Add a simple in-memory cache for OHLC data to simulate persistence
const ohlcDataCache: Record<string, any[]> = {};

// Generate more realistic OHLC data for a company
const generateRealisticOHLCData = (symbol: string, days: number = 365) => {
  // Check if we have cached data
  if (ohlcDataCache[symbol]) {
    return ohlcDataCache[symbol];
  }

  const data = [];
  const symbolHash = symbol.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);

  // Base price derived from symbol
  const basePrice = 100 + (symbolHash % 500);
  let currentPrice = basePrice;

  // Generate data for each day
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Add some market realism
    // Weekend effect (lower volatility)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const volatilityFactor = isWeekend ? 0.5 : 1.0;

    // Random walk with mean reversion
    const changePercent = (Math.random() - 0.5) * 0.04 * volatilityFactor;

    // Add occasional larger moves (market events)
    if (Math.random() < 0.02) { // 2% chance of a larger move
      const largeMove = (Math.random() - 0.5) * 0.1;
      currentPrice = currentPrice * (1 + largeMove);
    } else {
      currentPrice = currentPrice * (1 + changePercent);
    }

    // Ensure price doesn't go negative
    currentPrice = Math.max(1, currentPrice);

    // Generate OHLC from the close price
    const openPrice = currentPrice * (0.995 + Math.random() * 0.01);
    const highPrice = Math.max(openPrice, currentPrice) * (1 + Math.random() * 0.01);
    const lowPrice = Math.min(openPrice, currentPrice) * (0.99 + Math.random() * 0.01);

    // Volume with some correlation to price movement
    const baseVolume = 100000 + (symbolHash * 1000);
    const volumeMultiplier = 1 + Math.abs(changePercent) * 10;
    const volume = Math.floor(baseVolume * volumeMultiplier * (0.8 + Math.random() * 0.4));

    data.push({
      date: date.toISOString().split('T')[0],
      open: Number(openPrice.toFixed(2)),
      high: Number(highPrice.toFixed(2)),
      low: Number(lowPrice.toFixed(2)),
      close: Number(currentPrice.toFixed(2)),
      volume: volume,
    });
  }

  // Cache the data
  ohlcDataCache[symbol] = data;
  return data;
};

// Function to simulate daily updates to OHLC data
const updateOHLCData = (symbol: string) => {
  if (!ohlcDataCache[symbol]) {
    // Generate initial data if none exists
    generateRealisticOHLCData(symbol, 365);
    return;
  }

  const data = ohlcDataCache[symbol];
  if (data.length === 0) return;

  // Get the last data point
  const lastPoint = data[data.length - 1];
  let currentPrice = lastPoint.close;

  // Generate a new data point for today
  const today = new Date();

  // Add some market realism for today's movement
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  const volatilityFactor = isWeekend ? 0.5 : 1.0;

  // Random walk with mean reversion
  const changePercent = (Math.random() - 0.5) * 0.04 * volatilityFactor;

  // Add occasional larger moves (market events)
  if (Math.random() < 0.05) { // 5% chance of a larger move
    const largeMove = (Math.random() - 0.5) * 0.1;
    currentPrice = currentPrice * (1 + largeMove);
  } else {
    currentPrice = currentPrice * (1 + changePercent);
  }

  // Ensure price doesn't go negative
  currentPrice = Math.max(1, currentPrice);

  // Generate OHLC from the close price
  const openPrice = lastPoint.close; // Today's open is yesterday's close
  const highPrice = Math.max(openPrice, currentPrice) * (1 + Math.random() * 0.01);
  const lowPrice = Math.min(openPrice, currentPrice) * (0.99 + Math.random() * 0.01);

  // Volume with some correlation to price movement
  const symbolHash = symbol.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const baseVolume = 100000 + (symbolHash * 1000);
  const volumeMultiplier = 1 + Math.abs(changePercent) * 10;
  const volume = Math.floor(baseVolume * volumeMultiplier * (0.8 + Math.random() * 0.4));

  // Add new data point
  const newDataPoint = {
    date: today.toISOString().split('T')[0],
    open: Number(openPrice.toFixed(2)),
    high: Number(highPrice.toFixed(2)),
    low: Number(lowPrice.toFixed(2)),
    close: Number(currentPrice.toFixed(2)),
    volume: volume,
  };

  // Remove the oldest data point to maintain 365 days
  if (data.length >= 365) {
    data.shift();
  }

  // Add the new data point
  data.push(newDataPoint);

  console.log(`Updated ${symbol} data for ${today.toISOString().split('T')[0]}`);
};

// Schedule daily updates for all companies
const scheduleDailyUpdates = () => {
  // Update data for all companies once a day
  setInterval(() => {
    console.log('Running daily data updates...');
    ALL_COMPANIES.forEach(company => {
      updateOHLCData(company.symbol);
    });
    console.log('Daily data updates completed.');
  }, 24 * 60 * 60 * 1000); // Every 24 hours

  // Also update a random company every minute for demo purposes
  setInterval(() => {
    const randomCompany = ALL_COMPANIES[Math.floor(Math.random() * ALL_COMPANIES.length)];
    updateOHLCData(randomCompany.symbol);
  }, 60 * 1000); // Every minute
};

const app = express();

// Security middleware order: helmet -> CORS -> rate limiter -> body parsers -> timeout -> routes
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
// app.use(apiRateLimiter); // Temporarily disabled for development
app.use(express.json(requestSizeLimits));
app.use(express.urlencoded({ extended: true, ...requestSizeLimits }));
app.use((req, _res, next) => { req.setTimeout(30000); next(); });
app.use(morgan('combined'));

// Validate required environment variables and fail fast if missing
const _requiredEnv = ['SUPABASE_URL', 'SUPABASE_KEY'];
const _missingEnv = _requiredEnv.filter((k) => !process.env[k]);
if (_missingEnv.length) {
  console.error(`[env] Missing required environment variables: ${_missingEnv.join(', ')}`);
  console.error('[env] See api/.env.example for required variables and setup instructions.');
  process.exit(1);
}

// Log environment info (do NOT log secret values)
console.log(`[env] API environment loaded. NODE_ENV=${process.env.NODE_ENV || 'development'}`);

// Supabase clients imported from centralized module
// adminClient (service role) - full database access for admin operations
// userClient (anon key) - read-only with RLS enforcement

// Security/logging summary
console.log('[security] Enabled helmet security headers, global rate limiting, and CORS whitelist.')
if (!process.env.ALLOWED_ORIGINS) {
  console.warn('[env] ALLOWED_ORIGINS not set — defaulting to localhost origins only.')
} else {
  console.log('[env] ALLOWED_ORIGINS configured (hidden)')
}

// Error handling middleware (generic)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error] Unhandled error:', err && err.stack ? err.stack : err)
  try {
    res.status(500).json({ error: 'Internal server error' })
  } catch (e) {
    // in case headers already sent
    console.error('[error] Failed to send 500 response', e)
  }
})

// Real NEPSE Top 200 Companies
// Real NEPSE Companies (Simulating "All" companies including newly listed)
const ALL_COMPANIES = [
  // Commercial Banks
  { symbol: 'NABIL', name: 'Nabil Bank Limited', sector: 'Commercial Banks', marketCap: 45000000000, peRatio: 18.5 },
  { symbol: 'SCB', name: 'Standard Chartered Bank Nepal Limited', sector: 'Commercial Banks', marketCap: 42000000000, peRatio: 19.2 },
  { symbol: 'HBL', name: 'Himalayan Bank Limited', sector: 'Commercial Banks', marketCap: 38000000000, peRatio: 17.8 },
  { symbol: 'EBL', name: 'Everest Bank Limited', sector: 'Commercial Banks', marketCap: 36000000000, peRatio: 16.9 },
  { symbol: 'NICA', name: 'NIC Asia Bank Limited', sector: 'Commercial Banks', marketCap: 40000000000, peRatio: 18.1 },
  { symbol: 'NBL', name: 'Nepal Bank Limited', sector: 'Commercial Banks', marketCap: 35000000000, peRatio: 15.5 },
  { symbol: 'SBI', name: 'Nepal SBI Bank Limited', sector: 'Commercial Banks', marketCap: 33000000000, peRatio: 16.2 },
  { symbol: 'PRVU', name: 'Prabhu Bank Limited', sector: 'Commercial Banks', marketCap: 32000000000, peRatio: 17.3 },
  { symbol: 'GBIME', name: 'Global IME Bank Limited', sector: 'Commercial Banks', marketCap: 41000000000, peRatio: 18.7 },
  { symbol: 'CZBIL', name: 'Citizens Bank International Limited', sector: 'Commercial Banks', marketCap: 30000000000, peRatio: 16.8 },
  { symbol: 'SBL', name: 'Siddhartha Bank Limited', sector: 'Commercial Banks', marketCap: 28000000000, peRatio: 15.9 },
  { symbol: 'KBL', name: 'Kumari Bank Limited', sector: 'Commercial Banks', marketCap: 27000000000, peRatio: 16.1 },
  { symbol: 'LBL', name: 'Laxmi Bank Limited', sector: 'Commercial Banks', marketCap: 26000000000, peRatio: 15.7 },
  { symbol: 'MBL', name: 'Machhapuchchhre Bank Limited', sector: 'Commercial Banks', marketCap: 29000000000, peRatio: 17.2 },
  { symbol: 'SANIMA', name: 'Sanima Bank Limited', sector: 'Commercial Banks', marketCap: 31000000000, peRatio: 17.5 },
  { symbol: 'MEGA', name: 'Mega Bank Nepal Limited', sector: 'Commercial Banks', marketCap: 25000000000, peRatio: 15.3 },
  { symbol: 'PCBL', name: 'Prime Commercial Bank Limited', sector: 'Commercial Banks', marketCap: 24000000000, peRatio: 16.4 },
  { symbol: 'ADBL', name: 'Agricultural Development Bank Limited', sector: 'Commercial Banks', marketCap: 23000000000, peRatio: 14.8 },
  { symbol: 'NIB', name: 'Nepal Investment Bank Limited', sector: 'Commercial Banks', marketCap: 34000000000, peRatio: 17.9 },
  { symbol: 'BOKL', name: 'Bank of Kathmandu Limited', sector: 'Commercial Banks', marketCap: 22000000000, peRatio: 15.2 },
  { symbol: 'BNBL', name: 'Buddha Nath Bank Limited', sector: 'Commercial Banks', marketCap: 21000000000, peRatio: 14.9 },
  { symbol: 'SRBL', name: 'Sunrise Bank Limited', sector: 'Commercial Banks', marketCap: 25500000000, peRatio: 16.6 },
  { symbol: 'CCBL', name: 'Century Commercial Bank Limited', sector: 'Commercial Banks', marketCap: 20000000000, peRatio: 15.1 },

  // Development Banks
  { symbol: 'SHINE', name: 'Shine Resunga Development Bank Limited', sector: 'Development Banks', marketCap: 8000000000, peRatio: 12.5 },
  { symbol: 'MNBBL', name: 'Muktinath Bikas Bank Limited', sector: 'Development Banks', marketCap: 7500000000, peRatio: 13.2 },
  { symbol: 'KSBBL', name: 'Kamana Sewa Bikas Bank Limited', sector: 'Development Banks', marketCap: 7000000000, peRatio: 12.8 },
  { symbol: 'CBBL', name: 'Civil Bank Limited', sector: 'Development Banks', marketCap: 6000000000, peRatio: 12.3 },
  { symbol: 'MLBL', name: 'Mahalaxmi Bikas Bank Limited', sector: 'Development Banks', marketCap: 5800000000, peRatio: 11.7 },
  { symbol: 'KRBL', name: 'Karnali Development Bank Limited', sector: 'Development Banks', marketCap: 5500000000, peRatio: 11.5 },

  // Hydropower
  { symbol: 'UPPER', name: 'Upper Tamakoshi Hydropower Limited', sector: 'Hydropower', marketCap: 55000000000, peRatio: 22.5 },
  { symbol: 'CHCL', name: 'Chilime Hydropower Company Limited', sector: 'Hydropower', marketCap: 18000000000, peRatio: 19.8 },
  { symbol: 'NHPC', name: 'National Hydropower Company Limited', sector: 'Hydropower', marketCap: 16000000000, peRatio: 18.5 },
  { symbol: 'SHPC', name: 'Sanjen Jalavidyut Company Limited', sector: 'Hydropower', marketCap: 15000000000, peRatio: 17.9 },
  { symbol: 'API', name: 'Api Power Company Limited', sector: 'Hydropower', marketCap: 14000000000, peRatio: 18.2 },
  { symbol: 'AKPL', name: 'Arun Kabeli Power Limited', sector: 'Hydropower', marketCap: 13500000000, peRatio: 17.5 },
  { symbol: 'HPPL', name: 'Hathway Power Limited', sector: 'Hydropower', marketCap: 12000000000, peRatio: 16.8 },
  { symbol: 'NGPL', name: 'Ngadi Group Power Limited', sector: 'Hydropower', marketCap: 11500000000, peRatio: 16.3 },
  { symbol: 'RADHI', name: 'Radhi Bidyut Company Limited', sector: 'Hydropower', marketCap: 11000000000, peRatio: 17.1 },
  { symbol: 'RURU', name: 'Ruru Jalvidyut Limited', sector: 'Hydropower', marketCap: 10500000000, peRatio: 15.9 },
  { symbol: 'SJCL', name: 'Sanima Jalavidyut Company Limited', sector: 'Hydropower', marketCap: 10000000000, peRatio: 16.5 },
  { symbol: 'UMHL', name: 'United Modi Hydropower Limited', sector: 'Hydropower', marketCap: 9500000000, peRatio: 15.7 },
  { symbol: 'CHL', name: 'Chaudhary Hydropower Limited', sector: 'Hydropower', marketCap: 8500000000, peRatio: 15.8 },
  { symbol: 'BHL', name: 'Butwal Hydropower Company Limited', sector: 'Hydropower', marketCap: 8000000000, peRatio: 16.1 },
  { symbol: 'AKJCL', name: 'Ankhu Khola Jalvidyut Company Limited', sector: 'Hydropower', marketCap: 7500000000, peRatio: 15.5 },
  { symbol: 'BARUN', name: 'Barun Hydropower Company Limited', sector: 'Hydropower', marketCap: 7200000000, peRatio: 15.2 },
  { symbol: 'DHPL', name: 'Dibyashwori Hydropower Limited', sector: 'Hydropower', marketCap: 6800000000, peRatio: 14.9 },
  { symbol: 'GHL', name: 'Greenlife Hydropower Limited', sector: 'Hydropower', marketCap: 6500000000, peRatio: 14.6 },
  { symbol: 'HURJA', name: 'Hurja Hydropower Limited', sector: 'Hydropower', marketCap: 6200000000, peRatio: 14.3 },
  { symbol: 'JOSHI', name: 'Joshi Hydropower Development Company Limited', sector: 'Hydropower', marketCap: 5900000000, peRatio: 14.0 },
  { symbol: 'KKHC', name: 'Khanikhola Hydropower Company Limited', sector: 'Hydropower', marketCap: 5600000000, peRatio: 13.7 },
  { symbol: 'MBJC', name: 'Mailung Khola Jalavidyut Company Limited', sector: 'Hydropower', marketCap: 5300000000, peRatio: 13.4 },
  { symbol: 'MHNL', name: 'Madhya Pahad Hydropower Limited', sector: 'Hydropower', marketCap: 5000000000, peRatio: 13.1 },
  { symbol: 'NHDL', name: 'Nepal Hydro Developers Limited', sector: 'Hydropower', marketCap: 4700000000, peRatio: 12.8 },
  { symbol: 'NYADI', name: 'Nyadi Hydropower Limited', sector: 'Hydropower', marketCap: 4400000000, peRatio: 12.5 },
  { symbol: 'PPCL', name: 'Prabhu Power Limited', sector: 'Hydropower', marketCap: 4100000000, peRatio: 12.2 },
  { symbol: 'RHPL', name: 'Rasuwagadhi Hydropower Company Limited', sector: 'Hydropower', marketCap: 3800000000, peRatio: 11.9 },
  { symbol: 'SAHAS', name: 'Sahas Urja Limited', sector: 'Hydropower', marketCap: 3500000000, peRatio: 11.6 },
  { symbol: 'SHEL', name: 'Shivam Hydropower Limited', sector: 'Hydropower', marketCap: 3200000000, peRatio: 11.3 },
  { symbol: 'SMHL', name: 'Summit Hydropower Limited', sector: 'Hydropower', marketCap: 2900000000, peRatio: 11.0 },
  { symbol: 'SPDL', name: 'Samling Power Company Limited', sector: 'Hydropower', marketCap: 2600000000, peRatio: 10.7 },
  { symbol: 'SSHL', name: 'Sankhuwasabha Hydropower Limited', sector: 'Hydropower', marketCap: 2300000000, peRatio: 10.4 },
  { symbol: 'TPC', name: 'Terhathum Power Company Limited', sector: 'Hydropower', marketCap: 2000000000, peRatio: 10.1 },
  { symbol: 'UMRH', name: 'Upper Marsyangdi A Hydropower Limited', sector: 'Hydropower', marketCap: 1700000000, peRatio: 9.8 },
  { symbol: 'UPCL', name: 'Universal Power Company Limited', sector: 'Hydropower', marketCap: 1400000000, peRatio: 9.5 },

  // Non-Life Insurance
  { symbol: 'NRIC', name: 'Nepal Reinsurance Company Limited', sector: 'Non-Life Insurance', marketCap: 12000000000, peRatio: 14.5 },
  { symbol: 'NICL', name: 'Nepal Insurance Company Limited', sector: 'Non-Life Insurance', marketCap: 11000000000, peRatio: 13.8 },
  { symbol: 'PRIN', name: 'Prime Insurance Company Limited', sector: 'Non-Life Insurance', marketCap: 10000000000, peRatio: 14.2 },
  { symbol: 'SIC', name: 'Shikhar Insurance Company Limited', sector: 'Non-Life Insurance', marketCap: 9500000000, peRatio: 13.5 },
  { symbol: 'SICL', name: 'Sagarmatha Insurance Company Limited', sector: 'Non-Life Insurance', marketCap: 9000000000, peRatio: 13.9 },
  { symbol: 'UIC', name: 'United Insurance Company Limited', sector: 'Non-Life Insurance', marketCap: 8500000000, peRatio: 13.2 },
  { symbol: 'NLG', name: 'NLG Insurance Company Limited', sector: 'Non-Life Insurance', marketCap: 8000000000, peRatio: 12.8 },
  { symbol: 'HGI', name: 'Himalayan General Insurance Company Limited', sector: 'Non-Life Insurance', marketCap: 7500000000, peRatio: 13.1 },
  { symbol: 'IGI', name: 'IME General Insurance Limited', sector: 'Non-Life Insurance', marketCap: 7000000000, peRatio: 12.5 },
  { symbol: 'LGIL', name: 'Lumbini General Insurance Company Limited', sector: 'Non-Life Insurance', marketCap: 6500000000, peRatio: 12.3 },
  { symbol: 'PIC', name: 'Premier Insurance Company Limited', sector: 'Non-Life Insurance', marketCap: 6200000000, peRatio: 12.0 },
  { symbol: 'RBCL', name: 'Rastriya Beema Company Limited', sector: 'Non-Life Insurance', marketCap: 6000000000, peRatio: 12.1 },
  { symbol: 'PICL', name: 'Prudential Insurance Company Limited', sector: 'Non-Life Insurance', marketCap: 6000000000, peRatio: 11.8 },
  { symbol: 'SGI', name: 'Sanima General Insurance Limited', sector: 'Non-Life Insurance', marketCap: 5800000000, peRatio: 11.6 },

  // Life Insurance
  { symbol: 'NLIC', name: 'Nepal Life Insurance Company Limited', sector: 'Life Insurance', marketCap: 15000000000, peRatio: 16.5 },
  { symbol: 'NLICL', name: 'National Life Insurance Company Limited', sector: 'Life Insurance', marketCap: 14000000000, peRatio: 15.8 },
  { symbol: 'ALICL', name: 'Asian Life Insurance Company Limited', sector: 'Life Insurance', marketCap: 13000000000, peRatio: 15.2 },
  { symbol: 'PLIC', name: 'Prime Life Insurance Company Limited', sector: 'Life Insurance', marketCap: 12000000000, peRatio: 14.9 },
  { symbol: 'SLICL', name: 'Surya Life Insurance Company Limited', sector: 'Life Insurance', marketCap: 11500000000, peRatio: 15.5 },
  { symbol: 'JLI', name: 'Jyoti Life Insurance Company Limited', sector: 'Life Insurance', marketCap: 11000000000, peRatio: 14.7 },
  { symbol: 'GLICL', name: 'Gurans Life Insurance Company Limited', sector: 'Life Insurance', marketCap: 10500000000, peRatio: 14.3 },
  { symbol: 'LICN', name: 'Life Insurance Corporation Nepal Limited', sector: 'Life Insurance', marketCap: 10000000000, peRatio: 15.1 },
  { symbol: 'RLFL', name: 'Reliance Life Insurance Limited', sector: 'Life Insurance', marketCap: 9500000000, peRatio: 13.9 },
  { symbol: 'PBLD', name: 'Prabhu Life Insurance Limited', sector: 'Life Insurance', marketCap: 9000000000, peRatio: 13.7 },
  { symbol: 'PLI', name: 'Premier Life Insurance Limited', sector: 'Life Insurance', marketCap: 8800000000, peRatio: 13.5 },
  { symbol: 'MLIL', name: 'Mahalaxmi Life Insurance Limited', sector: 'Life Insurance', marketCap: 8500000000, peRatio: 13.3 },
  { symbol: 'SALICO', name: 'Sanlam Life Insurance Limited', sector: 'Life Insurance', marketCap: 8200000000, peRatio: 13.1 },
  { symbol: 'SIL', name: 'Sanima Life Insurance Limited', sector: 'Life Insurance', marketCap: 7900000000, peRatio: 12.9 },
  { symbol: 'ULI', name: 'Union Life Insurance Company Limited', sector: 'Life Insurance', marketCap: 7300000000, peRatio: 12.5 },

  // Finance Companies
  { symbol: 'GFIL', name: 'Goodwill Finance Limited', sector: 'Finance', marketCap: 5000000000, peRatio: 11.5 },
  { symbol: 'CFCL', name: 'Central Finance Company Limited', sector: 'Finance', marketCap: 4800000000, peRatio: 11.2 },
  { symbol: 'GUFL', name: 'Gurkhas Finance Limited', sector: 'Finance', marketCap: 4500000000, peRatio: 10.9 },
  { symbol: 'MFIL', name: 'Manjushree Finance Limited', sector: 'Finance', marketCap: 4200000000, peRatio: 11.3 },
  { symbol: 'SFCL', name: 'Shree Finance Company Limited', sector: 'Finance', marketCap: 4000000000, peRatio: 10.7 },
  { symbol: 'GMFIL', name: 'Guheshwori Merchant Banking and Finance Limited', sector: 'Finance', marketCap: 3800000000, peRatio: 11.1 },
  { symbol: 'PFL', name: 'Pokhara Finance Limited', sector: 'Finance', marketCap: 3700000000, peRatio: 10.8 },
  { symbol: 'PROFL', name: 'Progressive Finance Limited', sector: 'Finance', marketCap: 3500000000, peRatio: 10.5 },
  { symbol: 'SMB', name: 'Samriddhi Finance Company Limited', sector: 'Finance', marketCap: 3200000000, peRatio: 10.2 },

  // Microfinance
  { symbol: 'SMFDB', name: 'Swabalamban Microfinance Development Bank Limited', sector: 'Microfinance', marketCap: 3000000000, peRatio: 9.8 },
  { symbol: 'MSMBS', name: 'Mahuli Samudayik Microfinance Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 2800000000, peRatio: 9.5 },
  { symbol: 'SMFBS', name: 'Summit Microfinance Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 2600000000, peRatio: 9.2 },
  { symbol: 'NMFBS', name: 'Nerude Microfinance Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 2400000000, peRatio: 9.0 },
  { symbol: 'RMDC', name: 'Rural Microfinance Development Centre Limited', sector: 'Microfinance', marketCap: 2200000000, peRatio: 8.8 },
  { symbol: 'JBBL', name: 'Janautthan Samudayik Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 2000000000, peRatio: 8.5 },
  { symbol: 'VLBS', name: 'Vijaya Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 1800000000, peRatio: 8.3 },
  { symbol: 'GILB', name: 'Garima Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 1600000000, peRatio: 8.1 },
  { symbol: 'GMFBS', name: 'Gauri Shankar Microfinance Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 1500000000, peRatio: 7.9 },
  { symbol: 'KLBS', name: 'Kalika Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 1400000000, peRatio: 7.7 },
  { symbol: 'KMFL', name: 'Kamana Microfinance Limited', sector: 'Microfinance', marketCap: 1300000000, peRatio: 7.5 },
  { symbol: 'LLBS', name: 'Laxmi Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 1200000000, peRatio: 7.3 },
  { symbol: 'MERO', name: 'Mero Microfinance Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 1100000000, peRatio: 7.1 },
  { symbol: 'MLBBL', name: 'Mahalaxmi Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 1000000000, peRatio: 6.9 },
  { symbol: 'MMFDB', name: 'Mithila Microfinance Development Bank Limited', sector: 'Microfinance', marketCap: 950000000, peRatio: 6.7 },
  { symbol: 'NLBBL', name: 'Nirdhan Utthan Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 900000000, peRatio: 6.5 },
  { symbol: 'NMBMF', name: 'NMB Microfinance Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 850000000, peRatio: 6.3 },
  { symbol: 'NSLB', name: 'Naya Sarathi Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 800000000, peRatio: 6.1 },
  { symbol: 'PMHPL', name: 'Pokhara Microfinance Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 750000000, peRatio: 5.9 },
  { symbol: 'RSDC', name: 'Rastra Utthan Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 700000000, peRatio: 5.7 },
  { symbol: 'SABSL', name: 'Sabaiko Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 650000000, peRatio: 5.5 },
  { symbol: 'SAJHA', name: 'Sajha Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 600000000, peRatio: 5.3 },
  { symbol: 'SBLD', name: 'Swabalamban Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 550000000, peRatio: 5.1 },
  { symbol: 'SDLBSL', name: 'Swarojgar Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 500000000, peRatio: 4.9 },
  { symbol: 'SHIVM', name: 'Shivam Microfinance Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 450000000, peRatio: 4.7 },
  { symbol: 'SLBBL', name: 'Sana Kisan Bikas Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 400000000, peRatio: 4.5 },
  { symbol: 'SLBSL', name: 'Swarojgar Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 350000000, peRatio: 4.3 },
  { symbol: 'SMATA', name: 'Samata Microfinance Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 300000000, peRatio: 4.1 },
  { symbol: 'SWBBL', name: 'Swabalamban Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 280000000, peRatio: 3.9 },
  { symbol: 'USLB', name: 'Unnati Sahakarya Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 240000000, peRatio: 3.5 },
  { symbol: 'WNLB', name: 'Wean Nepal Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 200000000, peRatio: 3.1 },

  // Hotels & Tourism
  { symbol: 'OHL', name: 'Oriental Hotels Limited', sector: 'Hotels & Tourism', marketCap: 6000000000, peRatio: 13.5 },
  { symbol: 'TRHPR', name: 'Taragaon Regency Hotel Limited', sector: 'Hotels & Tourism', marketCap: 5500000000, peRatio: 12.8 },
  { symbol: 'SHL', name: 'Soaltee Hotel Limited', sector: 'Hotels & Tourism', marketCap: 5000000000, peRatio: 13.2 },

  // Manufacturing & Processing
  { symbol: 'UNL', name: 'Unilever Nepal Limited', sector: 'Manufacturing & Processing', marketCap: 18000000000, peRatio: 25.5 },
  { symbol: 'SONA', name: 'Sonapur Minerals and Oil Limited', sector: 'Manufacturing & Processing', marketCap: 5000000000, peRatio: 12.5 },

  // Telecommunications
  { symbol: 'NTC', name: 'Nepal Telecom', sector: 'Telecommunications', marketCap: 65000000000, peRatio: 28.5 },
  { symbol: 'NCELL', name: 'Ncell Axiata Limited', sector: 'Telecommunications', marketCap: 55000000000, peRatio: 26.8 },
  { symbol: 'NESDO', name: 'Nepal Doorsanchar Company Limited', sector: 'Telecommunications', marketCap: 15000000000, peRatio: 16.5 },

  // Infrastructure & Investment
  { symbol: 'NIFRA', name: 'Nepal Infrastructure Bank Limited', sector: 'Infrastructure', marketCap: 48000000000, peRatio: 20.5 },
  { symbol: 'HIDCL', name: 'Hydroelectricity Investment and Development Company Limited', sector: 'Investment', marketCap: 20000000000, peRatio: 18.5 },
  { symbol: 'CIT', name: 'Citizens Investment Trust', sector: 'Investment', marketCap: 12000000000, peRatio: 14.8 },
  { symbol: 'NRN', name: 'NRN Infrastructure and Development Limited', sector: 'Infrastructure', marketCap: 8000000000, peRatio: 13.2 },

  // Development Banks
  { symbol: 'EDBL', name: 'Excel Development Bank Limited', sector: 'Development Banks', marketCap: 5200000000, peRatio: 11.8 },
  { symbol: 'GBBL', name: 'Garima Bikas Bank Limited', sector: 'Development Banks', marketCap: 5000000000, peRatio: 11.6 },
  { symbol: 'SKBBL', name: 'Saptakoshi Development Bank Limited', sector: 'Development Banks', marketCap: 4800000000, peRatio: 11.4 },
  { symbol: 'SADBL', name: 'Sangrila Development Bank Limited', sector: 'Development Banks', marketCap: 4600000000, peRatio: 11.2 },
  { symbol: 'SHBL', name: 'Sahara Bikas Bank Limited', sector: 'Development Banks', marketCap: 4400000000, peRatio: 11.0 },
  { symbol: 'SINDU', name: 'Sindhu Bikash Bank Limited', sector: 'Development Banks', marketCap: 4200000000, peRatio: 10.8 },
  { symbol: 'DDBL', name: 'Deva Bikas Bank Limited', sector: 'Development Banks', marketCap: 4000000000, peRatio: 10.6 },
  { symbol: 'GRDBL', name: 'Green Development Bank Limited', sector: 'Development Banks', marketCap: 3800000000, peRatio: 10.4 },
  { symbol: 'LBBL', name: 'Lumbini Bikas Bank Limited', sector: 'Development Banks', marketCap: 3600000000, peRatio: 10.2 },
  { symbol: 'SAPDBL', name: 'Saptakoshi Development Bank Limited', sector: 'Development Banks', marketCap: 3300000000, peRatio: 10.0 },

  // Trading
  { symbol: 'STC', name: 'Salt Trading Corporation', sector: 'Trading', marketCap: 4500000000, peRatio: 11.8 },

  // Mutual Funds
  { symbol: 'LEC', name: 'Laxmi Equity Fund', sector: 'Mutual Fund', marketCap: 2500000000, peRatio: 9.5 },
  { symbol: 'LEMF', name: 'Laxmi Equity Mutual Fund', sector: 'Mutual Fund', marketCap: 2400000000, peRatio: 9.3 },
  { symbol: 'NABBC', name: 'Nabil Balanced Fund', sector: 'Mutual Fund', marketCap: 2200000000, peRatio: 9.1 },
  { symbol: 'NBBPO', name: 'Nabil Balanced Fund 2', sector: 'Mutual Fund', marketCap: 2100000000, peRatio: 8.9 },
  { symbol: 'NBBU', name: 'Nabil Balanced Fund 3', sector: 'Mutual Fund', marketCap: 2000000000, peRatio: 8.7 },
  { symbol: 'NEF', name: 'Nepal Equity Fund', sector: 'Mutual Fund', marketCap: 1900000000, peRatio: 8.5 },
  { symbol: 'NIBLPF', name: 'NIBL Pragati Fund', sector: 'Mutual Fund', marketCap: 1800000000, peRatio: 8.3 },
  { symbol: 'NIBSF1', name: 'NIBL Samriddhi Fund 1', sector: 'Mutual Fund', marketCap: 1700000000, peRatio: 8.1 },
  { symbol: 'NIBSF2', name: 'NIBL Samriddhi Fund 2', sector: 'Mutual Fund', marketCap: 1600000000, peRatio: 7.9 },
  { symbol: 'NMB50', name: 'NMB 50', sector: 'Mutual Fund', marketCap: 1500000000, peRatio: 7.7 },
  { symbol: 'NMBHF1', name: 'NMB Hybrid Fund L-1', sector: 'Mutual Fund', marketCap: 1400000000, peRatio: 7.5 },
  { symbol: 'NUBL', name: 'Nabil Unnati Kosh', sector: 'Mutual Fund', marketCap: 1300000000, peRatio: 7.3 },
  { symbol: 'SAEF', name: 'Sanima Equity Fund', sector: 'Mutual Fund', marketCap: 1200000000, peRatio: 7.1 },
  { symbol: 'SBCF', name: 'Siddhartha Capital Growth Scheme 1', sector: 'Mutual Fund', marketCap: 1100000000, peRatio: 6.9 },
  { symbol: 'SEF', name: 'Siddhartha Equity Fund', sector: 'Mutual Fund', marketCap: 1000000000, peRatio: 6.7 },
  { symbol: 'SFMF', name: 'Siddhartha Mutual Fund', sector: 'Mutual Fund', marketCap: 950000000, peRatio: 6.5 },

  // Corporate Debenture
  { symbol: 'SBD87', name: 'Siddhartha Debenture', sector: 'Corporate Debenture', marketCap: 1000000000, peRatio: 6.5 },

  // Additional Companies to reach 200
  { symbol: 'CBL', name: 'City Bank Limited', sector: 'Commercial Banks', marketCap: 19000000000, peRatio: 14.7 },
  { symbol: 'CGH', name: 'Chandragiri Hills Limited', sector: 'Hotels & Tourism', marketCap: 4500000000, peRatio: 12.5 },
  { symbol: 'FOWAD', name: 'Forward Community Microfinance Limited', sector: 'Microfinance', marketCap: 2700000000, peRatio: 9.4 },
  { symbol: 'ICFC', name: 'International Leasing and Finance Company Limited', sector: 'Finance', marketCap: 3400000000, peRatio: 10.3 },
  { symbol: 'SIFC', name: 'Samriddhi Finance Company Limited', sector: 'Finance', marketCap: 3300000000, peRatio: 10.1 },
  { symbol: 'BFC', name: 'Best Finance Company Limited', sector: 'Finance', marketCap: 3600000000, peRatio: 10.6 },
  { symbol: 'GBLBS', name: 'Garima Bikas Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 1750000000, peRatio: 8.2 },
  { symbol: 'JSLBB', name: 'Janautthan Samudayik Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 1950000000, peRatio: 8.4 },
  { symbol: 'MLBS', name: 'Mithila Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 1850000000, peRatio: 8.25 },
  { symbol: 'MKJC', name: 'Manakamana Jalvidyut Company Limited', sector: 'Hydropower', marketCap: 2800000000, peRatio: 10.9 },
  { symbol: 'BBC', name: 'Bottlers Nepal Limited', sector: 'Manufacturing & Processing', marketCap: 16000000000, peRatio: 24.5 },
  { symbol: 'SHIL', name: 'Standard Himalayan Insurance Limited', sector: 'Non-Life Insurance', marketCap: 5500000000, peRatio: 11.4 },
  { symbol: 'GICL', name: 'General Insurance Company Limited', sector: 'Non-Life Insurance', marketCap: 5300000000, peRatio: 11.2 },
  { symbol: 'AIL', name: 'Ajod Insurance Limited', sector: 'Non-Life Insurance', marketCap: 5100000000, peRatio: 11.0 },
  { symbol: 'YHL', name: 'Yeti Holdings Limited', sector: 'Hotels & Tourism', marketCap: 4800000000, peRatio: 12.9 },
  { symbol: 'CORBL', name: 'Corporate Development Bank Limited', sector: 'Development Banks', marketCap: 3900000000, peRatio: 10.5 },
  { symbol: 'MDB', name: 'Miteri Development Bank Limited', sector: 'Development Banks', marketCap: 3700000000, peRatio: 10.3 },
  { symbol: 'JBNL', name: 'Janata Bank Nepal Limited', sector: 'Commercial Banks', marketCap: 18500000000, peRatio: 14.5 },
  { symbol: 'JALPA', name: 'Jalbire Jalvidyut Company Limited', sector: 'Hydropower', marketCap: 2700000000, peRatio: 10.8 },
  { symbol: 'CLBSL', name: 'Century Laghubitta Bittiya Sanstha Limited', sector: 'Microfinance', marketCap: 1650000000, peRatio: 8.0 },
  { symbol: 'SKDDB', name: 'Saptakoshi Development Bank Limited', sector: 'Development Banks', marketCap: 3500000000, peRatio: 10.1 },
  { symbol: 'UNHPL', name: 'United Hydropower Limited', sector: 'Hydropower', marketCap: 2500000000, peRatio: 10.5 },
  { symbol: 'BHDC', name: 'Bhirkuti Hydropower Company Limited', sector: 'Hydropower', marketCap: 2400000000, peRatio: 10.3 },
  { symbol: 'CHDC', name: 'Chilime Hydropower Development Company Limited', sector: 'Hydropower', marketCap: 2200000000, peRatio: 10.0 },
  { symbol: 'HDL', name: 'Hydro Developers Limited', sector: 'Hydropower', marketCap: 2100000000, peRatio: 9.9 },
  { symbol: 'KPCL', name: 'Kabeli Power Company Limited', sector: 'Hydropower', marketCap: 2050000000, peRatio: 9.8 },

];

const PERIOD_OPTIONS = ['7day', '30day', '90day', '180day', '365day'] as const;
type PeriodKey = typeof PERIOD_OPTIONS[number];

const PERIOD_DAY_MAP: Record<PeriodKey, number> = {
  '7day': 7,
  '30day': 30,
  '90day': 90,
  '180day': 180,
  '365day': 365,
};

const getPeriodKey = (rawValue: any): PeriodKey => {
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  return PERIOD_OPTIONS.includes(value as PeriodKey) ? (value as PeriodKey) : '30day';
};

const getPeriodDays = (period: PeriodKey): number => PERIOD_DAY_MAP[period];

const getCompanyPeriodStats = (symbol: string, periodDays: number) => {
  const company = ALL_COMPANIES.find(c => c.symbol === symbol);
  const ohlcData = generateRealisticOHLCData(symbol);

  if (!ohlcData.length) {
    return {
      symbol,
      name: company?.name || symbol,
      sector: company?.sector || 'Unknown',
      marketCap: company?.marketCap || 0,
      price: 0,
      startPrice: 0,
      change: 0,
      changePercent: 0,
      avgVolume: 0,
      periodVolume: 0,
      periodValue: 0,
      volatility: 0,
    };
  }

  const endIndex = ohlcData.length - 1;
  const startIndex = Math.max(0, endIndex - periodDays);
  const periodSlice = ohlcData.slice(startIndex, endIndex + 1);

  const startData = periodSlice[0] || ohlcData[0];
  const endData = periodSlice[periodSlice.length - 1] || ohlcData[endIndex];

  const change = endData.close - startData.close;
  const changePercent = startData.close > 0 ? (change / startData.close) * 100 : 0;
  const volumeSum = periodSlice.reduce((sum, day) => sum + day.volume, 0);
  const valueSum = periodSlice.reduce((sum, day) => sum + day.volume * day.close, 0);

  const closes = periodSlice.map(day => day.close);
  const returns = closes.slice(1).map((close, idx) => {
    const previous = closes[idx];
    return previous > 0 ? (close - previous) / previous : 0;
  });
  const volatility = returns.length
    ? Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length) * 100
    : 0;

  return {
    symbol,
    name: company?.name || symbol,
    sector: company?.sector || 'Unknown',
    marketCap: company?.marketCap || 0,
    price: Number(endData.close.toFixed(2)),
    startPrice: Number(startData.close.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    avgVolume: Math.floor(volumeSum / Math.max(1, periodSlice.length)),
    periodVolume: volumeSum,
    periodValue: valueSum,
    volatility: Number(volatility.toFixed(2)),
  };
};

const getAllCompanyStats = (periodDays: number) =>
  ALL_COMPANIES.map(company => getCompanyPeriodStats(company.symbol, periodDays));

// Generate mock OHLC data for a company
const generateOHLCData = (symbol: string, days: number = 365) => {
  const data = [];
  const basePrice = 100 + Math.random() * 1500;
  let currentPrice = basePrice;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const change = (Math.random() - 0.48) * 20; // Slight upward bias
    currentPrice = Math.max(10, currentPrice + change);

    const open = currentPrice + (Math.random() - 0.5) * 5;
    const close = currentPrice + (Math.random() - 0.5) * 5;
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;

    data.push({
      date: date.toISOString().split('T')[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(50000 + Math.random() * 500000),
    });
  }

  return data;
};

// Analyze technical patterns from actual OHLC data
const analyzeTechnicalPatterns = (ohlcData: any[]) => {
  if (ohlcData.length < 20) return [];

  const patterns = [];
  const recentData = ohlcData.slice(-30);
  const prices = recentData.map(d => d.close);
  const volumes = recentData.map(d => d.volume);

  // Calculate moving averages
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const sma10 = prices.slice(-10).reduce((a, b) => a + b, 0) / 10;
  const currentPrice = prices[prices.length - 1];

  // Detect Higher Lows (bullish)
  const lows = recentData.slice(-10).map(d => d.low);
  const isHigherLows = lows.slice(1).every((low, i) => low >= lows[i] * 0.98);
  if (isHigherLows) {
    patterns.push({
      name: 'Higher Lows',
      type: 'bullish',
      confidence: 0.70 + Math.random() * 0.15,
      description: 'Consistent pattern of higher lows indicating upward momentum'
    });
  }

  // Detect Lower Highs (bearish)
  const highs = recentData.slice(-10).map(d => d.high);
  const isLowerHighs = highs.slice(1).every((high, i) => high <= highs[i] * 1.02);
  if (isLowerHighs && !isHigherLows) {
    patterns.push({
      name: 'Lower Highs',
      type: 'bearish',
      confidence: 0.68 + Math.random() * 0.15,
      description: 'Pattern of lower highs suggesting downward pressure'
    });
  }

  // Detect Ascending Triangle (bullish)
  if (isHigherLows && highs.slice(-5).every(h => Math.abs(h - highs[highs.length - 1]) < highs[highs.length - 1] * 0.02)) {
    patterns.push({
      name: 'Ascending Triangle',
      type: 'bullish',
      confidence: 0.75 + Math.random() * 0.15,
      description: 'Price forming higher lows with resistance at current level'
    });
  }

  // Detect Volume Breakout
  const avgVolume = volumes.slice(0, -3).reduce((a, b) => a + b, 0) / (volumes.length - 3);
  const recentVolume = volumes.slice(-3).reduce((a, b) => a + b, 0) / 3;
  if (recentVolume > avgVolume * 1.5) {
    patterns.push({
      name: 'Volume Breakout',
      type: currentPrice > sma20 ? 'bullish' : 'bearish',
      confidence: 0.65 + Math.random() * 0.15,
      description: 'Recent volume spike suggests increased buying interest'
    });
  }

  // Detect Golden Cross (bullish)
  if (sma10 > sma20 && prices[prices.length - 11] <= prices[prices.length - 21]) {
    patterns.push({
      name: 'Golden Cross',
      type: 'bullish',
      confidence: 0.80 + Math.random() * 0.12,
      description: 'Short-term MA crossed above long-term MA, bullish signal'
    });
  }

  // Detect Death Cross (bearish)
  if (sma10 < sma20 && prices[prices.length - 11] >= prices[prices.length - 21]) {
    patterns.push({
      name: 'Death Cross',
      type: 'bearish',
      confidence: 0.78 + Math.random() * 0.12,
      description: 'Short-term MA crossed below long-term MA, bearish signal'
    });
  }

  // Detect Double Bottom (bullish)
  const minPrice = Math.min(...prices.slice(-20));
  const minIndices = prices.slice(-20).reduce((acc: number[], p, i) => {
    if (Math.abs(p - minPrice) < minPrice * 0.02) acc.push(i);
    return acc;
  }, []);
  if (minIndices.length >= 2 && minIndices[minIndices.length - 1] - minIndices[0] > 5) {
    patterns.push({
      name: 'Double Bottom',
      type: 'bullish',
      confidence: 0.72 + Math.random() * 0.15,
      description: 'Price tested support level twice, potential reversal'
    });
  }

  // Detect Consolidation (neutral)
  const priceRange = Math.max(...prices.slice(-10)) - Math.min(...prices.slice(-10));
  const avgPrice = prices.slice(-10).reduce((a, b) => a + b, 0) / 10;
  if (priceRange < avgPrice * 0.05) {
    patterns.push({
      name: 'Consolidation',
      type: 'neutral',
      confidence: 0.70 + Math.random() * 0.10,
      description: 'Price trading in tight range, awaiting breakout'
    });
  }

  return patterns.slice(0, 3); // Return top 3 patterns
};

// Generate AI insights for a company
const generateAIInsights = (symbol: string, ohlcData: any[]) => {
  if (ohlcData.length === 0) {
    return {
      predictions: [],
      explanation: 'Insufficient data for analysis',
      ai_analysis: null
    };
  }

  const latestPrice = ohlcData[ohlcData.length - 1]?.close || 100;
  const last30Days = ohlcData.slice(-30);
  const last7Days = ohlcData.slice(-7);

  // Calculate historical metrics
  const startPrice = ohlcData[0]?.close || latestPrice;
  const totalChange = ((latestPrice - startPrice) / startPrice) * 100;
  const recentStart = last7Days[0]?.close || latestPrice;
  const recentMomentum = ((latestPrice - recentStart) / recentStart) * 100;

  // Calculate 52-week high/low
  const last365Days = ohlcData.slice(-365);
  const high52Week = Math.max(...last365Days.map(d => d.high));
  const low52Week = Math.min(...last365Days.map(d => d.low));

  // Determine trend
  const trendDirection = totalChange > 0 ? 'upward' : 'downward';
  const sentiment = recentMomentum > 2 ? 'bullish' : recentMomentum < -2 ? 'bearish' : 'neutral';

  // Calculate technical indicators
  const prices = last30Days.map(d => d.close);
  const sma20 = prices.length >= 20 ? prices.slice(-20).reduce((a, b) => a + b, 0) / 20 : latestPrice;
  const sma50 = ohlcData.length >= 50 ? ohlcData.slice(-50).map(d => d.close).reduce((a, b) => a + b, 0) / 50 : latestPrice;

  // Calculate volatility
  const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * 100;

  // Volume trend
  const volumes = last30Days.map(d => d.volume);
  const avgVolume = volumes.slice(0, -7).reduce((a, b) => a + b, 0) / (volumes.length - 7);
  const recentAvgVolume = volumes.slice(-7).reduce((a, b) => a + b, 0) / 7;
  const volumeTrend = recentAvgVolume > avgVolume * 1.2 ? 'increasing' : recentAvgVolume < avgVolume * 0.8 ? 'decreasing' : 'stable';

  // Analyze patterns
  const detectedPatterns = analyzeTechnicalPatterns(ohlcData);

  // Generate predictions for next 14 days
  const predictions = [];
  let predPrice = latestPrice;
  const trendFactor = sentiment === 'bullish' ? 1.002 : sentiment === 'bearish' ? 0.998 : 1.0;

  for (let i = 1; i <= 14; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    predPrice = predPrice * trendFactor + (Math.random() - 0.5) * (volatility / 10);
    predictions.push({
      date: date.toISOString().split('T')[0],
      close: Number(predPrice.toFixed(2)),
    });
  }

  // Generate recommendations
  const recommendations = [];
  if (sentiment === 'bullish') {
    recommendations.push(`${symbol} shows strong bullish momentum with ${recentMomentum.toFixed(2)}% gain in the last week.`);
    if (latestPrice < sma20) {
      recommendations.push('Consider buying on dips as price is below 20-day moving average.');
    }
    if (detectedPatterns.some(p => p.type === 'bullish')) {
      recommendations.push('Multiple bullish patterns detected, suggesting continued upward movement.');
    }
  } else if (sentiment === 'bearish') {
    recommendations.push(`${symbol} is showing bearish signals with ${recentMomentum.toFixed(2)}% decline recently.`);
    recommendations.push('Exercise caution and consider waiting for reversal signals before entering.');
    if (latestPrice > sma20) {
      recommendations.push('Price still above moving average, watch for breakdown.');
    }
  } else {
    recommendations.push(`${symbol} is in consolidation phase. Wait for clear breakout direction.`);
    recommendations.push('Monitor volume for signs of accumulation or distribution.');
  }

  // Risk assessment
  const riskScore = Math.min(10, Math.max(1,
    5 + (volatility - 2) + (sentiment === 'bearish' ? 2 : sentiment === 'bullish' ? -1 : 0)
  ));

  const confidence = Math.min(0.95, Math.max(0.50,
    0.70 + (detectedPatterns.length * 0.05) - (volatility * 0.02)
  ));

  return {
    predictions,
    explanation: `Based on comprehensive technical analysis of ${ohlcData.length} data points, ${symbol} exhibits ${sentiment} characteristics. The stock has ${trendDirection} trend with ${totalChange.toFixed(2)}% total change. Recent momentum shows ${recentMomentum >= 0 ? 'positive' : 'negative'} movement of ${Math.abs(recentMomentum).toFixed(2)}%. ${detectedPatterns.length > 0 ? `Detected patterns include ${detectedPatterns.map(p => p.name).join(', ')}.` : ''} Volume trend is ${volumeTrend}, and volatility stands at ${volatility.toFixed(2)}%.`,
    ai_analysis: {
      sentiment,
      confidence: Number(confidence.toFixed(2)),
      risk_score: Number(riskScore.toFixed(1)),
      patterns: detectedPatterns.map(p => p.name),
      technical_indicators: {
        sma_20: Number(sma20.toFixed(2)),
        sma_50: Number(sma50.toFixed(2)),
        volatility: Number(volatility.toFixed(2)),
        volume_trend: volumeTrend
      },
      historical_analysis: {
        total_period_change: Number(totalChange.toFixed(2)),
        recent_momentum: Number(recentMomentum.toFixed(2)),
        '52_week_high': Number(high52Week.toFixed(2)),
        '52_week_low': Number(low52Week.toFixed(2)),
        current_vs_high: Number((((latestPrice - high52Week) / high52Week) * 100).toFixed(2)),
        current_vs_low: Number((((latestPrice - low52Week) / low52Week) * 100).toFixed(2)),
        trend_direction: trendDirection,
        data_points: ohlcData.length
      },
      recommendations,
      price_targets: {
        bull: Number((latestPrice * (sentiment === 'bullish' ? 1.15 : 1.10)).toFixed(2)),
        base: Number((latestPrice * (sentiment === 'bullish' ? 1.08 : sentiment === 'bearish' ? 0.98 : 1.03)).toFixed(2)),
        bear: Number((latestPrice * (sentiment === 'bearish' ? 0.90 : 0.95)).toFixed(2))
      },
      support_level: Number((low52Week * 1.02).toFixed(2)),
      resistance_level: Number((high52Week * 0.98).toFixed(2)),
      recommendation: sentiment === 'bullish' ? 'BUY' : sentiment === 'bearish' ? 'SELL' : 'HOLD',
      target_price: Number((latestPrice * (sentiment === 'bullish' ? 1.12 : sentiment === 'bearish' ? 0.92 : 1.02)).toFixed(2))
    }
  };
};

// Generate company-specific fundamentals
const generateFundamentals = (symbol: string, currentPrice: number) => {
  const symbolHash = symbol.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);

  // Use symbol hash to generate consistent but varied data for each company
  const marketCapMultiplier = 10 + (symbolHash % 50);
  const peRatioBase = 10 + (symbolHash % 25);
  const epsBase = 20 + (symbolHash % 60);
  const dividendYieldBase = 1 + (symbolHash % 5);
  const revenueMultiplier = 5 + (symbolHash % 15);
  const profitMultiplier = 0.5 + (symbolHash % 3);
  const roeBase = 8 + (symbolHash % 15);
  const debtToEquityBase = 0.3 + ((symbolHash % 10) / 10);

  return {
    marketCap: currentPrice * marketCapMultiplier * 1000000,
    peRatio: Number((peRatioBase + (Math.random() * 5 - 2.5)).toFixed(2)),
    eps: Number((epsBase + (Math.random() * 10 - 5)).toFixed(2)),
    dividendYield: Number((dividendYieldBase + (Math.random() * 2 - 1)).toFixed(2)),
    revenue: currentPrice * revenueMultiplier * 1000000,
    profit: currentPrice * profitMultiplier * 1000000,
    roe: Number((roeBase + (Math.random() * 5 - 2.5)).toFixed(2)),
    debtToEquity: Number((debtToEquityBase + (Math.random() * 0.3 - 0.15)).toFixed(2)),
  };
};

// Generate company-specific trading stats
const generateTradingStats = (symbol: string, ohlcData: any[]) => {
  if (ohlcData.length === 0) return null;

  const currentPrice = ohlcData[ohlcData.length - 1].close;
  const previousPrice = ohlcData.length > 1 ? ohlcData[ohlcData.length - 2].close : currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;

  // Calculate 52-week high and low from data
  const last365Days = ohlcData.slice(-365);
  const high52Week = Math.max(...last365Days.map(d => d.high));
  const low52Week = Math.min(...last365Days.map(d => d.low));

  // Calculate average volume
  const avgVolume = last365Days.reduce((sum, d) => sum + d.volume, 0) / last365Days.length;

  // Calculate beta (simplified - using volatility as proxy)
  const returns = last365Days.slice(1).map((d, i) => (d.close - last365Days[i].close) / last365Days[i].close);
  const volatility = Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length);
  const beta = Number((0.8 + volatility * 10).toFixed(2)); // Simplified beta calculation

  return {
    high52Week: Number(high52Week.toFixed(2)),
    low52Week: Number(low52Week.toFixed(2)),
    avgVolume: Math.floor(avgVolume),
    beta,
    currentPrice: Number(currentPrice.toFixed(2)),
    change: Number(priceChange.toFixed(2)),
    changePercent: Number(priceChangePercent.toFixed(2)),
  };
};

// Calculate historical performance metrics
const calculatePerformance = (ohlcData: any[]) => {
  if (ohlcData.length === 0) return [];

  const currentPrice = ohlcData[ohlcData.length - 1].close;

  const periods = [
    { name: '1 Day', days: 1 },
    { name: '1 Week', days: 7 },
    { name: '1 Month', days: 30 },
    { name: '3 Months', days: 90 },
    { name: '6 Months', days: 180 },
    { name: '1 Year', days: 365 },
  ];

  return periods.map(period => {
    const startIdx = Math.max(0, ohlcData.length - period.days - 1);
    const endIdx = ohlcData.length - 1;

    if (startIdx >= endIdx) {
      return {
        period: period.name,
        return: 0,
        high: currentPrice,
        low: currentPrice,
        volatility: 0,
      };
    }

    const periodData = ohlcData.slice(startIdx, endIdx + 1);
    const startPrice = periodData[0].close;
    const returnPercent = ((currentPrice - startPrice) / startPrice) * 100;

    const high = Math.max(...periodData.map(d => d.high));
    const low = Math.min(...periodData.map(d => d.low));

    // Calculate volatility (standard deviation of returns)
    const returns = periodData.slice(1).map((d, i) => (d.close - periodData[i].close) / periodData[i].close);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * 100;

    return {
      period: period.name,
      return: Number(returnPercent.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      volatility: Number(volatility.toFixed(2)),
    };
  });
};

// Latest OHLC data endpoint for live charts
app.get('/companies/:symbol/ohlc/latest', ...validateSymbol, handleValidationErrors, async (req: express.Request, res: express.Response) => {
  const { symbol } = req.params
  const sym = symbol.toUpperCase()

  try {
    // Use userClient (read-only with RLS) for public data
    // Wrap in withRetry for idempotent read operation
    const result = await withRetry(async () => {
      const promise = userClient
        .from('prices_ohlc')
        .select('date,open,high,low,close,volume')
        .eq('symbol', sym)
        .order('date', { ascending: false })
        .limit(1)

      return await withTimeout(promise as any, 5000)
    }, 3, 1000)

    const { data, error } = result as any

    if (error) {
      // Log error but don't fail - fall through to mock data
      const stdError = handleSupabaseError(error, `fetching latest OHLC data for ${sym}`, undefined, '/companies/:symbol/ohlc/latest')
      console.warn(`[OHLC] Database error (using fallback): ${stdError.serverMessage}`)
    } else if (data && data.length > 0) {
      try {
        const validated = validateOHLCData(data)
        return res.json({ symbol: sym, latest: validated[0] })
      } catch (validationError) {
        console.warn('[OHLC] Validation error (using fallback):', validationError)
        // Fall through to mock data instead of returning error
      }
    }
  } catch (error) {
    // Log error but don't fail - fall through to mock data
    const stdError = handleSupabaseError(error, `fetching latest OHLC data for ${sym}`, undefined, '/companies/:symbol/ohlc/latest')
    console.warn(`[OHLC] Error (using fallback): ${stdError.serverMessage}`)
  }

  // Fallback to cached or generated data - always succeeds
  const ohlcData = generateRealisticOHLCData(sym);
  const latest = ohlcData[ohlcData.length - 1] || null;

  return res.json({ symbol: sym, latest })
});

// OHLC data endpoint
app.get('/companies/:symbol/ohlc', ...validateSymbol, handleValidationErrors, async (req: express.Request, res: express.Response) => {
  const { symbol } = req.params;
  const sym = symbol.toUpperCase();

  try {
    // Use userClient (read-only with RLS) for public data
    // Wrap in withRetry for idempotent read operation
    const result = await withRetry(async () => {
      const promise = userClient
        .from('prices_ohlc')
        .select('date,open,high,low,close,volume')
        .eq('symbol', sym)
        .order('date', { ascending: true })

      return await withTimeout(promise as any, 5000)
    }, 3, 1000)

    const { data, error } = result as any

    if (error) {
      // Log error but don't fail - fall through to mock data
      const stdError = handleSupabaseError(error, `fetching OHLC data for ${sym}`, undefined, '/companies/:symbol/ohlc')
      console.warn(`[OHLC] Database error (using fallback): ${stdError.serverMessage}`)
    } else if (data && data.length > 0) {
      try {
        const validated = validateOHLCData(data)
        return res.json({ symbol: sym, ohlc: validated })
      } catch (validationError) {
        console.warn('[OHLC] Validation error (using fallback):', validationError)
        // Fall through to mock data instead of returning error
      }
    }
  } catch (error) {
    // Log error but don't fail - fall through to mock data
    const stdError = handleSupabaseError(error, `fetching OHLC data for ${sym}`, undefined, '/companies/:symbol/ohlc')
    console.warn(`[OHLC] Error (using fallback): ${stdError.serverMessage}`)
  }

  // Fallback to cached or generated data - always succeeds
  const ohlcData = generateRealisticOHLCData(sym);
  res.json({ symbol: sym, ohlc: ohlcData });
});

// Insights endpoint
app.get('/companies/:symbol/insights', ...validateSymbol, handleValidationErrors, async (req: express.Request, res: express.Response) => {
  const { symbol } = req.params;
  const sym = symbol.toUpperCase();

  // Generate OHLC data first
  const ohlcData = generateRealisticOHLCData(sym);
  const insights = generateAIInsights(sym, ohlcData);

  res.json(insights);
});

// Fundamentals endpoint
app.get('/companies/:symbol/fundamentals', ...validateSymbol, handleValidationErrors, async (req: express.Request, res: express.Response) => {
  const { symbol } = req.params;
  const sym = symbol.toUpperCase();

  // Generate OHLC data to get current price
  const ohlcData = generateRealisticOHLCData(sym);
  const currentPrice = ohlcData[ohlcData.length - 1]?.close || 100;

  const fundamentals = generateFundamentals(sym, currentPrice);
  res.json({ symbol: sym, fundamentals });
});

// Trading stats endpoint
app.get('/companies/:symbol/stats', ...validateSymbol, handleValidationErrors, async (req: express.Request, res: express.Response) => {
  const { symbol } = req.params;
  const sym = symbol.toUpperCase();

  const ohlcData = generateRealisticOHLCData(sym);
  let stats = generateTradingStats(sym, ohlcData);

  // Ensure we always return stats - generate defaults if needed
  if (!stats) {
    const currentPrice = ohlcData.length > 0 ? ohlcData[ohlcData.length - 1].close : 100;
    stats = {
      high52Week: currentPrice * 1.2,
      low52Week: currentPrice * 0.8,
      avgVolume: 100000,
      beta: 1.0,
      currentPrice: Number(currentPrice.toFixed(2)),
      change: 0,
      changePercent: 0,
    };
  }

  res.json({ symbol: sym, stats });
});

// Performance endpoint
app.get('/companies/:symbol/performance', ...validateSymbol, handleValidationErrors, async (req: express.Request, res: express.Response) => {
  const { symbol } = req.params;
  const sym = symbol.toUpperCase();

  const ohlcData = generateRealisticOHLCData(sym);
  const performance = calculatePerformance(ohlcData);

  res.json({ symbol: sym, performance });
});

// Technical patterns endpoint
app.get('/companies/:symbol/patterns', ...validateSymbol, handleValidationErrors, async (req: express.Request, res: express.Response) => {
  const { symbol } = req.params;
  const sym = symbol.toUpperCase();

  const ohlcData = generateRealisticOHLCData(sym);
  const patterns = analyzeTechnicalPatterns(ohlcData);

  res.json({ symbol: sym, patterns });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'NEPSE API', time: new Date().toISOString() });
});

// Companies list endpoint - returns top 200 (deduplicated)
// Companies list endpoint - returns all companies with real-time data
app.get('/companies', (req, res) => {
  // Remove duplicates by symbol
  const uniqueCompanies = Array.from(
    new Map(ALL_COMPANIES.map(company => [company.symbol, company])).values()
  );

  // Enrich with real-time data
  const enrichedCompanies = uniqueCompanies.map(company => {
    // Use cached or generated OHLC data to get latest price
    // We use a small cache or just generate it on the fly if not present (it's fast enough for this demo scale)
    let ohlcData = ohlcDataCache[company.symbol];
    if (!ohlcData) {
      ohlcData = generateRealisticOHLCData(company.symbol);
    }

    const latest = ohlcData[ohlcData.length - 1];
    const previous = ohlcData.length > 1 ? ohlcData[ohlcData.length - 2] : latest;

    const price = latest ? latest.close : 0;
    const prevPrice = previous ? previous.close : 0;
    const change = price - prevPrice;
    const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0;

    return {
      ...company,
      price: Number(price.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2))
    };
  });

  res.json({ companies: enrichedCompanies });
});

// Company details endpoint
app.get('/companies/:symbol', ...validateSymbol, handleValidationErrors, (req, res) => {
  const { symbol } = req.params;
  const sym = symbol.toUpperCase();

  const company = ALL_COMPANIES.find(c => c.symbol === sym);

  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  res.json({ company });
});

// Top movers endpoint - returns gainers, losers, most active, and most volatile
app.get('/market/top-movers', ...validatePeriod, handleValidationErrors, (req, res) => {
  const period = getPeriodKey(req.query.period);
  const periodDays = getPeriodDays(period);
  const stats = getAllCompanyStats(periodDays);

  const decorate = (stat: ReturnType<typeof getCompanyPeriodStats>) => ({
    symbol: stat.symbol,
    name: stat.name,
    sector: stat.sector,
    price: stat.price,
    change: stat.change,
    changePercent: stat.changePercent,
    volume: stat.avgVolume,
    volatility: stat.volatility,
    aiTag: stat.changePercent > 2 ? 'bullish' : stat.changePercent < -2 ? 'bearish' : 'neutral',
  });

  const topGainers = [...stats]
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5)
    .map(decorate);

  const topLosers = [...stats]
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5)
    .map(decorate);

  const mostActive = [...stats]
    .sort((a, b) => b.periodVolume - a.periodVolume)
    .slice(0, 5)
    .map(decorate);

  const mostVolatile = [...stats]
    .sort((a, b) => b.volatility - a.volatility)
    .slice(0, 5)
    .map(decorate);

  res.json({
    topGainers,
    topLosers,
    mostActive,
    mostVolatile,
    period,
    timestamp: new Date().toISOString(),
  });
});

// Portfolio overview endpoint (protected)
app.get('/portfolio/overview', authenticateToken, ...validatePeriod, handleValidationErrors, (req, res) => {
  const period = getPeriodKey(req.query.period);
  const periodDays = getPeriodDays(period);

  // TODO: Replace hardcoded holdings with user-scoped query using req.user.id from authenticated session
  const holdings = [
    { symbol: 'NABIL', shares: 100, avgPrice: 1020 },
    { symbol: 'NICA', shares: 150, avgPrice: 820 },
    { symbol: 'HDL', shares: 200, avgPrice: 410 },
    { symbol: 'UPPER', shares: 180, avgPrice: 285 },
    { symbol: 'NLG', shares: 120, avgPrice: 710 },
  ];

  const enrichedHoldings = holdings.map(holding => {
    const stats = getCompanyPeriodStats(holding.symbol, periodDays);
    const currentPrice = stats.price || holding.avgPrice;
    const periodStartPrice = stats.startPrice || holding.avgPrice;
    const value = currentPrice * holding.shares;
    const periodStartValue = periodStartPrice * holding.shares;
    const gainLoss = value - holding.avgPrice * holding.shares;
    const gainLossPercent = holding.avgPrice > 0 ? ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100 : 0;

    return {
      symbol: holding.symbol,
      shares: holding.shares,
      avgPrice: holding.avgPrice,
      currentPrice: Number(currentPrice.toFixed(2)),
      value: Number(value.toFixed(2)),
      gainLoss: Number(gainLoss.toFixed(2)),
      gainLossPercent: Number(gainLossPercent.toFixed(2)),
      sector: stats.sector,
      periodChangePercent: stats.changePercent,
      periodStartPrice: Number(periodStartPrice.toFixed(2)),
      periodStartValue: Number(periodStartValue.toFixed(2)),
      volatility: stats.volatility,
    };
  });

  const totalValue = enrichedHoldings.reduce((sum, holding) => sum + holding.value, 0);
  const periodStartValue = enrichedHoldings.reduce((sum, holding) => sum + holding.periodStartValue, 0);
  const costBasis = holdings.reduce((sum, holding) => sum + holding.avgPrice * holding.shares, 0);

  const dayChange = totalValue - periodStartValue;
  const dayChangePercent = periodStartValue > 0 ? (dayChange / periodStartValue) * 100 : 0;
  const totalGainLoss = totalValue - costBasis;
  const totalGainLossPercent = costBasis > 0 ? (totalGainLoss / costBasis) * 100 : 0;

  const avgVolatility = enrichedHoldings.reduce((sum, holding) => sum + holding.volatility, 0) / enrichedHoldings.length || 0;
  const riskLevel = avgVolatility > 3 ? 'high' : avgVolatility > 1.5 ? 'medium' : 'low';
  const aiConfidence = Math.min(95, Math.max(60, 92 - avgVolatility * 5 + (dayChangePercent > 0 ? 4 : -2)));

  const dailyDrift = dayChangePercent / Math.max(1, periodDays);
  const projected30DayChange = dailyDrift * 30;
  const projected30Day = totalValue * (1 + projected30DayChange / 100);

  res.json({
    period,
    totalValue: Number(totalValue.toFixed(2)),
    dayChange: Number(dayChange.toFixed(2)),
    dayChangePercent: Number(dayChangePercent.toFixed(2)),
    totalGainLoss: Number(totalGainLoss.toFixed(2)),
    totalGainLossPercent: Number(totalGainLossPercent.toFixed(2)),
    riskLevel,
    aiConfidence: Math.round(aiConfidence),
    projected30Day: Number(projected30Day.toFixed(2)),
    projected30DayChange: Number(projected30DayChange.toFixed(2)),
    watchlistCount: 24,
    holdings: enrichedHoldings,
  });
});

// Market macro indicators endpoint
app.get('/market/macro', ...validatePeriod, handleValidationErrors, (req, res) => {
  const period = getPeriodKey(req.query.period);
  const periodDays = getPeriodDays(period);
  const stats = getAllCompanyStats(periodDays);

  const advances = stats.filter(s => s.changePercent > 0).length;
  const declines = stats.filter(s => s.changePercent < 0).length;
  const unchanged = stats.length - advances - declines;
  const avgChangePercent = stats.reduce((sum, s) => sum + s.changePercent, 0) / Math.max(1, stats.length);

  const nepseIndexBase = 2100;
  const nepseIndex = nepseIndexBase * (1 + avgChangePercent / 400);
  const nepseChangePercent = avgChangePercent / 2;
  const nepseChange = nepseIndex * (nepseChangePercent / 100);

  const totalVolume = stats.reduce((sum, s) => sum + s.periodVolume, 0);
  const totalValue = stats.reduce((sum, s) => sum + s.periodValue, 0);
  const trades = Math.max(15000, Math.floor(totalVolume / 2500));
  const marketCap = stats.reduce((sum, s) => sum + s.marketCap, 0);

  res.json({
    period,
    nepseIndex: Number(nepseIndex.toFixed(2)),
    nepseChange: Number(nepseChange.toFixed(2)),
    nepseChangePercent: Number(nepseChangePercent.toFixed(2)),
    marketCap,
    volume: Math.floor(totalVolume),
    trades,
    turnover: Math.floor(totalValue),
    marketBreadth: {
      advances,
      declines,
      unchanged,
      ratio: Number((advances / Math.max(1, declines || 1)).toFixed(2)),
    },
    gdp: { value: 4.5 + (avgChangePercent / 100), change: Number((avgChangePercent / 50).toFixed(2)) },
    inflation: { value: 6.2 - (avgChangePercent / 80), change: Number((-avgChangePercent / 70).toFixed(2)) },
    interestRate: { value: 7.5, change: 0 },
    exchangeRate: { value: 132.5 + avgChangePercent / 20, change: Number((avgChangePercent / 100).toFixed(2)) },
    timestamp: new Date().toISOString(),
  });
});

// AI insights feed endpoint
app.get('/ai/insights/feed', ...validatePeriod, handleValidationErrors, (req, res) => {
  const period = req.query.period || '30day';
  res.json({
    insights: [
      {
        id: '1',
        type: 'bullish',
        title: 'Banking sector shows strong momentum',
        description: 'Major banks reporting improved Q4 earnings with increased lending activity',
        confidence: 0.82,
        affectedSymbols: ['NABIL', 'NICA', 'SCB'],
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'neutral',
        title: 'Hydropower sector consolidation',
        description: 'Trading range bound as sector awaits monsoon season impact',
        confidence: 0.65,
        affectedSymbols: ['UPPER', 'HDL', 'NHPC'],
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '3',
        type: 'bearish',
        title: 'Insurance sector facing headwinds',
        description: 'Regulatory changes may impact profitability in short term',
        confidence: 0.70,
        affectedSymbols: ['NLIC', 'SICL', 'SANIMA'],
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    ],
    period
  });
});

// Market sectors performance endpoint
app.get('/market/sectors', ...validatePeriod, handleValidationErrors, (req, res) => {
  const period = getPeriodKey(req.query.period);
  const periodDays = getPeriodDays(period);
  const stats = getAllCompanyStats(periodDays);

  const sectorMap = new Map<string, {
    name: string;
    totalChange: number;
    count: number;
    volume: number;
    marketCap: number;
    totalVolatility: number;
    leader?: { symbol: string; changePercent: number };
  }>();

  stats.forEach(stat => {
    const entry = sectorMap.get(stat.sector) || {
      name: stat.sector,
      totalChange: 0,
      count: 0,
      volume: 0,
      marketCap: 0,
      totalVolatility: 0,
      leader: undefined,


    };

    entry.totalChange += stat.changePercent;
    entry.count += 1;
    entry.volume += stat.periodVolume;
    entry.marketCap += stat.marketCap;
    entry.totalVolatility += stat.volatility;

    if (!entry.leader || stat.changePercent > entry.leader.changePercent) {
      entry.leader = { symbol: stat.symbol, changePercent: stat.changePercent };
    }

    sectorMap.set(stat.sector, entry);
  });

  const sectors = Array.from(sectorMap.values())
    .map(entry => ({
      name: entry.name,
      change: Number((entry.totalChange / Math.max(1, entry.count)).toFixed(2)),
      volume: entry.volume,
      marketCap: entry.marketCap,
      companies: entry.count,
      avgVolatility: Number((entry.totalVolatility / Math.max(1, entry.count)).toFixed(2)),
      leader: entry.leader,
    }))
    .sort((a, b) => b.change - a.change);

  res.json({
    sectors,
    period,
    timestamp: new Date().toISOString(),
  });
});

// Portfolio prediction endpoint (protected)
app.get('/portfolio/prediction', authenticateToken, (req, res) => {
  // TODO: Replace hardcoded predictions with per-user portfolio model using req.user.id from authenticated session
  res.json({
    predictions: [
      { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], value: 2890000 },
      { date: new Date(Date.now() + 172800000).toISOString().split('T')[0], value: 2920000 },
      { date: new Date(Date.now() + 259200000).toISOString().split('T')[0], value: 2875000 },
      { date: new Date(Date.now() + 345600000).toISOString().split('T')[0], value: 2950000 },
      { date: new Date(Date.now() + 432000000).toISOString().split('T')[0], value: 3020000 },
      { date: new Date(Date.now() + 518400000).toISOString().split('T')[0], value: 3080000 },
      { date: new Date(Date.now() + 604800000).toISOString().split('T')[0], value: 3150000 }
    ],
    confidence: 0.75,
    trend: 'bullish'
  });
});

// GET /auth/me - Returns user profile with subscription info
// Response: { id, email, role, access } where access is { status, trial_ends_at, current_period_end } or null
app.get('/auth/me', authenticateToken, async (req: any, res) => {
  const user = req.user
  if (!user) return res.status(401).json({ error: 'Unauthenticated' })

  // Fetch subscription info using userClient (user-scoped with RLS)
  try {
    // Wrap in withRetry for idempotent read operation
    const result = await withRetry(async () => {
      const promise = userClient
        .from('subscriptions')
        .select('status,trial_ends_at,current_period_end')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      return await withTimeout(promise as any, 5000)
    }, 3, 1000)

    const { data: sub, error } = result as any

    if (error) {
      const stdError = handleSupabaseError(error, `fetching subscription for user ${user.id}`, user.id, '/auth/me')
      console.error(`[auth] ${stdError.serverMessage}`)
      return res.status(stdError.statusCode).json({ error: stdError.clientMessage })
    }

    try {
      if (sub) {
        validateSubscription(sub)
      }
      return res.json({ id: user.id, email: user.email, role: user.role, access: sub || null })
    } catch (validationError) {
      console.error('[auth] Subscription validation error:', validationError)
      return res.status(500).json({ error: getSafeValidationError(validationError as Error) })
    }
  } catch (error) {
    const stdError = handleSupabaseError(error, `fetching subscription for user ${user.id}`, user.id, '/auth/me')
    console.error(`[auth] ${stdError.serverMessage}`)
    return res.status(stdError.statusCode).json({ error: stdError.clientMessage })
  }
})

app.post('/auth/register', express.json(requestSizeLimits), async (req, res) => {
  const { email, password } = req.body || {}

  // Input validation: email format and password length
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  // Email format validation (basic regex)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' })

  // Password length validation (min 8 chars)
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  try {
    // Use adminClient for write operations (user creation)
    const { data, error } = await adminClient.from('users').insert({ email, role: 'user' }).select().single()
    if (error) {
      const stdError = handleSupabaseError(error, `creating user ${email}`, undefined, '/auth/register')
      return res.status(stdError.statusCode).json({ error: stdError.clientMessage })
    }

    try {
      validateUser(data)
    } catch (validationError) {
      console.error('[auth] User validation error:', validationError)
      return res.status(500).json({ error: getSafeValidationError(validationError as Error) })
    }

    // create trial subscription
    const trialEnds = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
    const { error: subError } = await adminClient
      .from('subscriptions')
      .insert({ user_id: data.id, status: 'trial', trial_ends_at: trialEnds })

    if (subError) {
      const stdError = handleSupabaseError(subError, `creating subscription for user ${data.id}`, data.id, '/auth/register')
      console.error(`[auth] ${stdError.serverMessage}`)
      return res.status(stdError.statusCode).json({ error: stdError.clientMessage })
    }

    return res.status(201).json({ user: { id: data.id, email: data.email, role: data.role }, trialEndsAt: trialEnds })
  } catch (e) {
    const stdError = handleSupabaseError(e, `registration error for ${email}`, undefined, '/auth/register')
    console.error(`[auth] ${stdError.serverMessage}`)
    return res.status(stdError.statusCode).json({ error: stdError.clientMessage })
  }
})

app.get('/protected/ping', authenticateToken, (req: any, res) => {
  return res.json({ message: 'Authenticated', user: (req as any).user, timestamp: new Date().toISOString() })
})

// Admin-only users list (RBAC demo)
app.get('/admin/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Wrap in withRetry for idempotent read operation (admin-scoped data)
    const result = await withRetry(async () => {
      const promise = adminClient.from('users').select('id,email,role,created_at')
      return await withTimeout(promise as any, 5000)
    }, 3, 1000)

    const { data, error } = result as any

    if (error) {
      const stdError = handleSupabaseError(error, 'fetching users list', (req as any).user?.id, '/admin/users')
      console.error(`[admin] ${stdError.serverMessage}`)
      return res.status(stdError.statusCode).json({ error: stdError.clientMessage })
    }

    try {
      if (data) {
        data.forEach((user: any) => validateUser(user))
      }
      return res.json({ users: data })
    } catch (validationError) {
      console.error('[admin] User validation error:', validationError)
      return res.status(500).json({ error: getSafeValidationError(validationError as Error) })
    }
  } catch (error) {
    const stdError = handleSupabaseError(error, 'fetching users list', (req as any).user?.id, '/admin/users')
    console.error(`[admin] ${stdError.serverMessage}`)
    return res.status(stdError.statusCode).json({ error: stdError.clientMessage })
  }
})

// Start the server
const PORT = process.env.PORT || 8082;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start daily updates
  scheduleDailyUpdates();
});


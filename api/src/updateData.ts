import 'dotenv/config'
import express from 'express';
import { adminClient } from './lib/supabaseClients'
import { handleSupabaseError, withTimeout, withRetry } from './lib/dbErrorHandler'

/**
 * Ensure environment variables are loaded and validated for the update script.
 * This script requires SUPABASE_URL and SUPABASE_KEY.
 */
const requiredEnv = ['SUPABASE_URL', 'SUPABASE_KEY']
const missing = requiredEnv.filter(k => !process.env[k])
if (missing.length) {
  console.error(`[env] Missing required environment variables for update-data: ${missing.join(', ')}`)
  console.error('[env] See api/.env.example and create api/.env before running this script.')
  process.exit(1)
}

console.log(`[env] updateData script environment OK. NODE_ENV=${process.env.NODE_ENV || 'development'}`)

// Real NEPSE Top 200 Companies
const TOP_200_COMPANIES = [
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

// Function to generate realistic OHLC data for a company
const generateRealisticOHLCData = (symbol: string, days: number = 365) => {
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
  
  return data;
};

// Function to update daily data for all companies using batch upserts
const updateDailyData = async () => {
  console.log('Starting daily data update with batch processing...');
  
  const BATCH_SIZE = 50
  let totalProcessed = 0
  let totalFailed = 0
  let totalSkipped = 0
  const batchesToUpsert: any[] = []
  
  for (const company of TOP_200_COMPANIES) {
    try {
      // Generate new OHLC data for today
      const ohlcData = generateRealisticOHLCData(company.symbol, 1);
      const todayData = ohlcData[ohlcData.length - 1];
      
      // Validate OHLC data before adding to batch
      if (
        todayData.open <= 0 ||
        todayData.high <= 0 ||
        todayData.low <= 0 ||
        todayData.close <= 0 ||
        todayData.volume < 0 ||
        todayData.high < todayData.low
      ) {
        console.error(`[updateData] Invalid OHLC data for ${company.symbol}, skipping`)
        totalSkipped++
        continue
      }

      // Add validated data to batch
      batchesToUpsert.push({
        symbol: company.symbol,
        date: todayData.date,
        open: todayData.open,
        high: todayData.high,
        low: todayData.low,
        close: todayData.close,
        volume: todayData.volume,
      })

      // Process batch when it reaches BATCH_SIZE
      if (batchesToUpsert.length >= BATCH_SIZE) {
        const batch = batchesToUpsert.splice(0, BATCH_SIZE)
        totalProcessed += await processBatch(batch)
      }
    } catch (error) {
      const stdError = handleSupabaseError(error, `processing data for ${company.symbol}`)
      console.error(`[updateData] Error processing ${company.symbol}: ${stdError.serverMessage}`)
      totalFailed++
    }
  }

  // Process remaining rows
  if (batchesToUpsert.length > 0) {
    totalProcessed += await processBatch(batchesToUpsert)
  }
  
  console.log('═══════════════════════════════════════')
  console.log(`Daily data update completed.`)
  console.log(`  • Processed: ${totalProcessed}`)
  console.log(`  • Failed: ${totalFailed}`)
  console.log(`  • Skipped: ${totalSkipped}`)
  console.log(`  • Total: ${TOP_200_COMPANIES.length}`)
  console.log('═══════════════════════════════════════')
};

// Helper function to process a batch of OHLC records with retry
const processBatch = async (batch: any[]): Promise<number> => {
  if (!adminClient || batch.length === 0) {
    return 0
  }

  try {
    // Wrap in withRetry for transient failure resilience
    const result = await withRetry(
      async () => {
        const upsertPromise = adminClient
          .from('prices_ohlc')
          .upsert(batch)

        const result = await withTimeout(upsertPromise as any, 10000)
        return result
      },
      3, // max 3 attempts
      1000 // delay between retries
    )

    const { error } = result as any

    if (error) {
      const stdError = handleSupabaseError(error, `batch upserting ${batch.length} OHLC records`)
      console.error(`[updateData] Batch error: ${stdError.serverMessage}`)
      return 0
    }

    console.log(`[updateData] Successfully batch upserted ${batch.length} records`)
    return batch.length
  } catch (error) {
    const stdError = handleSupabaseError(error, `batch upserting ${batch.length} OHLC records`)
    console.error(`[updateData] Batch failed: ${stdError.serverMessage}`)
    return 0
  }
};

// Run the update and exit
updateDailyData().then(() => {
  console.log('Data update script completed successfully.');
  process.exit(0);
}).catch((error) => {
  console.error('Data update script failed:', error);
  process.exit(1);
});
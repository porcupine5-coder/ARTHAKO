# NEPSE Real-Time Data Implementation

This document describes the implementation of real-time or near real-time company data updates for the NEPSE application.

## Overview

The system has been enhanced to provide daily data updates that reflect actual market performance, replacing the previous static/mock data approach. The implementation includes:

1. **Realistic Data Generation**: More realistic OHLC (Open, High, Low, Close) data generation that simulates actual market movements
2. **Daily Data Updates**: Automated daily updates to company data to reflect market changes
3. **AI-Powered Predictions**: Enhanced AI predictions based on updated data
4. **Data Persistence**: In-memory caching for demonstration purposes (can be extended to database storage)

## Key Components

### 1. API Service Enhancements

The API service (`api/src/index.ts`) now includes:

- **Realistic OHLC Data Generation**: The `generateRealisticOHLCData` function creates more realistic price movements with:
  - Market realism (weekend effects, lower volatility)
  - Random walk with mean reversion
  - Occasional larger moves to simulate market events
  - Volume correlation with price movements

- **Daily Update Scheduler**: The `scheduleDailyUpdates` function runs automatically when the server starts and:
  - Updates data for all companies once per day
  - Updates a random company every minute for demonstration purposes

- **Data Caching**: An in-memory cache (`ohlcDataCache`) stores generated data to improve performance

### 2. AI Service Enhancements

The AI service (`ai/app/main.py`) now includes:

- **Real-Time OHLC Generation**: The `generate_real_time_ohlc` function creates realistic price data for AI analysis
- **Enhanced Predictions**: The `predict_company` endpoint now generates predictions based on recent data trends and volatility
- **Improved Forecasting**: Statistical forecasting methods that work with updated data

### 3. Data Update Scripts

Additional scripts have been added for manual data updates:

- **updateData.ts**: A script that can be run manually to update company data
- **scheduler.ts**: A scheduler that can run updates at regular intervals

## How It Works

### Daily Data Updates

1. When the API server starts, it automatically schedules daily updates
2. Every 24 hours, the system updates OHLC data for all 200+ companies
3. For demonstration purposes, a random company is updated every minute
4. Each update adds a new data point for the current day and removes the oldest data point to maintain a 365-day history

### Realistic Data Generation

The system generates realistic market data by:

1. Using a symbol-based seed for consistent but varied data per company
2. Implementing market realism with weekend effects and lower volatility on weekends
3. Using random walk with mean reversion for price movements
4. Adding occasional larger moves to simulate market events
5. Ensuring prices don't go negative
6. Generating OHLC data from close prices
7. Calculating volumes with correlation to price movements

### AI Predictions

The AI service now provides more accurate predictions by:

1. Analyzing recent data trends (last 30 days)
2. Calculating volatility based on historical returns
3. Generating forecasts that consider trend strength and volatility
4. Including metadata about recent trends and volatility in predictions

## Running the System

### Starting Services

1. Start the API service: `cd api && npm run dev`
2. Start the AI service: `cd ai && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001`
3. Start the frontend: `cd frontend && npm run dev`

### Manual Data Updates

To manually update data:
```bash
cd api
npm run update-data
```

### Running the Scheduler

To run the scheduler:
```bash
cd api
npm run scheduler
```

## Future Enhancements

This implementation provides a foundation for real-time data that can be extended with:

1. **Database Integration**: Store data in a proper database instead of in-memory cache
2. **External Data Sources**: Integrate with real market data APIs
3. **Advanced AI Models**: Implement more sophisticated machine learning models
4. **Real-Time Updates**: WebSocket-based real-time data streaming
5. **Historical Data Import**: Import historical market data for backtesting

## API Endpoints

The enhanced system maintains all existing API endpoints while providing more realistic data:

- `/companies` - List all companies
- `/companies/{symbol}` - Get company details
- `/companies/{symbol}/ohlc` - Get OHLC data
- `/companies/{symbol}/ohlc/latest` - Get latest OHLC data point
- `/companies/{symbol}/insights` - Get AI insights
- `/companies/{symbol}/fundamentals` - Get company fundamentals
- `/companies/{symbol}/stats` - Get trading statistics
- `/companies/{symbol}/performance` - Get performance metrics
- `/companies/{symbol}/patterns` - Get technical patterns
- `/market/top-movers` - Get top market movers
- `/market/sectors` - Get sector performance
- `/portfolio/overview` - Get portfolio overview
- `/portfolio/prediction` - Get portfolio predictions
- `/ai/insights/feed` - Get AI insights feed

AI Service Endpoints:
- `/predict/company` - Get company predictions based on recent data
- `/forecast/simple` - Get simple statistical forecasts
- `/forecast/ml` - Get ML-based forecasts
- `/analyze/company` - Get detailed company analysis
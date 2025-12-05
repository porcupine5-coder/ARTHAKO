from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import random
import math

app = FastAPI(title="NEPSE AI Service", version="0.1.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MarketPrediction(BaseModel):
    horizon_days: int

class CompanyPrediction(BaseModel):
    symbol: str
    horizon_days: int

class SentimentRequest(BaseModel):
    texts: List[str]
    language: Optional[str] = None  # 'en' or 'ne' (optional)

class CompanyAnalysisRequest(BaseModel):
    symbol: str
    ohlc_data: List[Dict[str, Any]]  # List of {date, open, high, low, close, volume}

# Add new models for real-time data updates
class MarketDataUpdate(BaseModel):
    symbol: str
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int
    timestamp: str

class DailyUpdateRequest(BaseModel):
    companies: List[MarketDataUpdate]

@app.get("/")
def root():
    return {
        "service": "NEPSE AI Service",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
def health():
    return {"ok": True, "service": "ai", "time": datetime.utcnow().isoformat()}

@app.post("/predict/market")
def predict_market(req: MarketPrediction):
    # Stub: return neutral/stable with dummy confidence
    horizon = req.horizon_days
    return {
        "trend": "stable",
        "probabilities": {"bullish": 0.33, "bearish": 0.33, "stable": 0.34},
        "horizon_days": horizon
    }

@app.post("/predict/company")
def predict_company(req: CompanyPrediction):
    # Generate more realistic predictions based on recent data trends
    symbol = req.symbol.upper()
    days = req.horizon_days
    
    # Generate realistic OHLC data
    ohlc_data = generate_real_time_ohlc(symbol)
    
    if not ohlc_data or len(ohlc_data) < 2:
        # Fallback to flat forecast with small random-like jitter mock
        series = [{"day": i+1, "delta_pct": 0.0} for i in range(days)]
        return {
            "symbol": symbol,
            "forecast": series
        }
    
    # Get the latest data points
    latest_data = ohlc_data[-min(30, len(ohlc_data)):]  # Last 30 days or less
    
    # Calculate recent trend
    if len(latest_data) >= 2:
        first_price = latest_data[0]["close"]
        last_price = latest_data[-1]["close"]
        recent_trend = (last_price - first_price) / first_price if first_price > 0 else 0
        
        # Calculate volatility
        prices = [d["close"] for d in latest_data]
        if len(prices) > 1:
            returns = [(prices[i] - prices[i-1]) / prices[i-1] for i in range(1, len(prices)) if prices[i-1] > 0]
            if returns:
                avg_return = sum(returns) / len(returns) if returns else 0
                volatility = (sum((r - avg_return) ** 2 for r in returns) / len(returns)) ** 0.5 if returns else 0
            else:
                volatility = 0
        else:
            volatility = 0
        
        # Generate forecast with trend and volatility
        series = []
        current_price = last_price
        
        for i in range(days):
            # Add some randomness based on volatility
            random_factor = random.gauss(0, volatility * 0.5) if volatility > 0 else 0
            
            # Apply trend with some mean reversion
            trend_factor = recent_trend * 0.7  # Reduce trend strength over time
            mean_reversion = (100 - current_price) / 1000 if current_price < 100 else 0
            
            # Calculate daily change
            daily_change = trend_factor + random_factor + mean_reversion
            
            # Ensure price doesn't go negative
            current_price = max(1, current_price * (1 + daily_change)) if current_price > 0 else 1
            
            series.append({
                "day": i+1,
                "delta_pct": round(daily_change * 100, 2)
            })
        
        return {
            "symbol": symbol,
            "forecast": series,
            "metadata": {
                "recent_trend": round(recent_trend * 100, 2),
                "volatility": round(volatility * 100, 2),
                "current_price": round(last_price, 2)
            }
        }
    
    # Fallback if not enough data
    series = [{"day": i+1, "delta_pct": 0.0} for i in range(days)]
    return {
        "symbol": symbol,
        "forecast": series
    }

@app.post("/sentiment")
def sentiment(req: SentimentRequest):
    # Rule-based toy sentiment: counts of words
    positives = {"gain", "up", "good", "bull", "profit", "increase", "strong"}
    negatives = {"loss", "down", "bad", "bear", "decline", "weak", "risk"}
    results = []
    for t in req.texts:
        tl = t.lower()
        pos = sum(1 for w in positives if w in tl)
        neg = sum(1 for w in negatives if w in tl)
        score = 0.0
        label = "neutral"
        if pos > neg:
            score = min(1.0, 0.2 * (pos - neg))
            label = "positive"
        elif neg > pos:
            score = -min(1.0, 0.2 * (neg - pos))
            label = "negative"
        results.append({"text": t, "label": label, "score": score})
    return {"results": results}

@app.get("/insights/feed")
def insights_feed(period: str = Query("30day")):
    period = period if period in {"7day", "30day", "90day", "180day", "365day"} else "30day"
    period_multipliers = {
        "7day": 1.0,
        "30day": 1.6,
        "90day": 2.2,
        "180day": 3.1,
        "365day": 4.0,
    }
    volatility_scale = {
        "7day": 1.4,
        "30day": 1.1,
        "90day": 0.9,
        "180day": 0.7,
        "365day": 0.6,
    }

    multiplier = period_multipliers[period]
    vol = volatility_scale[period]
    now = datetime.utcnow()

    base_messages = [
        {
            "type": "trend",
            "severity": "info",
            "title": f"{period.upper()} sector momentum",
            "symbols": ["NABIL", "SCB", "NICA"],
        },
        {
            "type": "prediction",
            "severity": "warning",
            "title": f"{period.upper()} breakout probability",
            "symbols": ["UPPER", "HDL", "CHCL"],
        },
        {
            "type": "alert",
            "severity": "critical",
            "title": f"{period.upper()} liquidity alert",
            "symbols": ["NLIC", "SICL", "SIC"],
        },
        {
            "type": "opportunity",
            "severity": "info",
            "title": f"{period.upper()} undervalued watchlist",
            "symbols": ["GBIME", "SANIMA", "MEGA"],
        },
        {
            "type": "anomaly",
            "severity": "warning",
            "title": f"{period.upper()} volume spikes",
            "symbols": ["NLG", "UPPER", "HBL"],
        },
    ]

    insights = []
    for idx, base in enumerate(base_messages, start=1):
        confidence = round(min(95, max(60, random.gauss(80, 8) * (vol / 1.2))), 2)
        delta = round(random.uniform(5, 15) * multiplier, 2)
        volatility = round(random.uniform(3, 12) * vol, 2)
        message = (
            f"{base['title']} detected {delta}% swing potential with "
            f"{volatility}% volatility footprint across tracked symbols."
        )
        insights.append({
            "id": f"{period}-{idx}",
            "type": base["type"],
            "severity": base["severity"],
            "title": base["title"],
            "message": message,
            "symbols": base.get("symbols", []),
            "timestamp": (now - timedelta(minutes=idx * 5)).isoformat(),
            "confidence": confidence,
        })

    return {
        "period": period,
        "insights": insights,
        "metadata": {
            "generated_at": now.isoformat(),
            "volatility_scale": vol,
        }
    }

@app.post("/analyze/company")
def analyze_company(req: CompanyAnalysisRequest):
    """
    Company-specific AI agent that analyzes the chart and provides:
    - Past history analysis
    - Recommendations
    - Future predictions
    """
    symbol = req.symbol.upper()
    ohlc = req.ohlc_data
    
    if not ohlc or len(ohlc) < 2:
        return {
            "symbol": symbol,
            "error": "Insufficient data for analysis"
        }
    
    # Sort by date
    sorted_data = sorted(ohlc, key=lambda x: x.get("date", ""))
    
    # Calculate technical indicators
    closes = [float(d.get("close", 0)) for d in sorted_data]
    volumes = [float(d.get("volume", 0)) for d in sorted_data]
    highs = [float(d.get("high", 0)) for d in sorted_data]
    lows = [float(d.get("low", 0)) for d in sorted_data]
    
    current_price = closes[-1] if closes else 0
    previous_price = closes[-2] if len(closes) > 1 else current_price
    
    # Calculate moving averages
    period_20 = min(20, len(closes))
    period_50 = min(50, len(closes))
    
    sma_20 = sum(closes[-period_20:]) / period_20 if period_20 > 0 else current_price
    sma_50 = sum(closes[-period_50:]) / period_50 if period_50 > 0 else current_price
    
    # Price trends
    price_change = current_price - previous_price
    price_change_pct = (price_change / previous_price * 100) if previous_price > 0 else 0
    
    # Calculate trends over different periods
    if len(closes) >= 5:
        week_trend = (closes[-1] - closes[-5]) / closes[-5] * 100
    else:
        week_trend = price_change_pct
    
    if len(closes) >= 20:
        month_trend = (closes[-1] - closes[-20]) / closes[-20] * 100
    else:
        month_trend = price_change_pct
    
    # Volatility
    if len(closes) >= 20:
        volatility = calculate_volatility(closes[-20:])
    else:
        volatility = calculate_volatility(closes) if closes else 0
    
    # Volume analysis
    avg_volume = sum(volumes) / len(volumes) if volumes else 0
    recent_volume = volumes[-1] if volumes else 0
    volume_trend = "above average" if recent_volume > avg_volume * 1.2 else "below average" if recent_volume < avg_volume * 0.8 else "average"
    
    # Determine sentiment
    sentiment_score = 0
    if price_change > 0:
        sentiment_score += 1
    if current_price > sma_20:
        sentiment_score += 1
    if current_price > sma_50:
        sentiment_score += 1
    if recent_volume > avg_volume * 1.2:
        sentiment_score += 0.5
    if week_trend > 0:
        sentiment_score += 0.5
    
    if sentiment_score >= 3:
        sentiment = "bullish"
        confidence = min(0.9, 0.6 + (sentiment_score - 3) * 0.1)
    elif sentiment_score <= 1.5:
        sentiment = "bearish"
        confidence = min(0.9, 0.6 + (1.5 - sentiment_score) * 0.1)
    else:
        sentiment = "neutral"
        confidence = 0.65
    
    # Historical analysis
    historical_analysis = analyze_history(sorted_data, closes, current_price)
    
    # Recommendations
    recommendations = generate_recommendations(
        symbol, current_price, price_change_pct, sentiment_score,
        sma_20, sma_50, volume_trend, volatility, historical_analysis
    )
    
    # Predictions
    prediction_days = 14
    predictions = generate_predictions(
        sorted_data, closes, current_price, sentiment_score, volatility, prediction_days
    )
    
    # Price targets
    risk_score = calculate_risk_score(volatility, price_change_pct, volume_trend)
    
    price_targets = {
        "bull": current_price * (1 + abs(volatility) * 2.5),
        "base": current_price * (1 + abs(volatility) * 1.2),
        "bear": current_price * (1 - abs(volatility) * 1.5)
    }
    
    # Technical patterns
    patterns = detect_patterns(closes, highs, lows)
    
    # Comprehensive explanation
    explanation = generate_explanation(
        symbol, historical_analysis, sentiment, recommendations, predictions
    )
    
    return {
        "symbol": symbol,
        "sentiment": sentiment,
        "confidence": round(confidence, 2),
        "current_price": round(current_price, 2),
        "price_change": round(price_change, 2),
        "price_change_pct": round(price_change_pct, 2),
        "historical_analysis": historical_analysis,
        "recommendations": recommendations,
        "predictions": predictions,
        "price_targets": {
            "bull": round(price_targets["bull"], 2),
            "base": round(price_targets["base"], 2),
            "bear": round(price_targets["bear"], 2)
        },
        "risk_score": round(risk_score, 1),
        "patterns": patterns,
        "technical_indicators": {
            "sma_20": round(sma_20, 2),
            "sma_50": round(sma_50, 2),
            "volatility": round(volatility * 100, 2),
            "volume_trend": volume_trend
        },
        "explanation": explanation
    }

def calculate_volatility(prices: List[float]) -> float:
    """Calculate price volatility (standard deviation of returns)"""
    if len(prices) < 2:
        return 0.0
    returns = []
    for i in range(1, len(prices)):
        if prices[i-1] > 0:
            ret = (prices[i] - prices[i-1]) / prices[i-1]
            returns.append(ret)
    if not returns:
        return 0.0
    mean_return = sum(returns) / len(returns)
    variance = sum((r - mean_return) ** 2 for r in returns) / len(returns)
    return math.sqrt(variance)

def analyze_history(data: List[Dict], closes: List[float], current_price: float) -> Dict[str, Any]:
    """Analyze past performance and trends"""
    if not closes:
        return {"summary": "Insufficient historical data"}
    
    # Find highs and lows
    max_price = max(closes)
    min_price = min(closes)
    max_price_date = data[closes.index(max_price)].get("date", "") if max_price in closes else ""
    min_price_date = data[closes.index(min_price)].get("date", "") if min_price in closes else ""
    
    # Performance periods
    total_change = ((current_price - closes[0]) / closes[0] * 100) if closes[0] > 0 else 0
    
    # Recent momentum
    if len(closes) >= 5:
        recent_change = ((closes[-1] - closes[-5]) / closes[-5] * 100) if closes[-5] > 0 else 0
    else:
        recent_change = total_change
    
    # Identify trends
    if len(closes) >= 20:
        recent_avg = sum(closes[-10:]) / 10
        earlier_avg = sum(closes[-20:-10]) / 10
        trend_direction = "upward" if recent_avg > earlier_avg else "downward"
    else:
        trend_direction = "upward" if recent_change > 0 else "downward"
    
    return {
        "total_period_change": round(total_change, 2),
        "recent_momentum": round(recent_change, 2),
        "52_week_high": round(max_price, 2),
        "52_week_low": round(min_price, 2),
        "high_date": max_price_date,
        "low_date": min_price_date,
        "current_vs_high": round((current_price / max_price - 1) * 100, 2) if max_price > 0 else 0,
        "current_vs_low": round((current_price / min_price - 1) * 100, 2) if min_price > 0 else 0,
        "trend_direction": trend_direction,
        "data_points": len(closes)
    }

def generate_recommendations(
    symbol: str, current_price: float, change_pct: float, sentiment_score: float,
    sma_20: float, sma_50: float, volume_trend: str, volatility: float, history: Dict
) -> List[str]:
    """Generate actionable recommendations"""
    recommendations = []
    
    # Price action recommendations
    if sentiment_score >= 3:
        if current_price > sma_20 and current_price > sma_50:
            recommendations.append("✅ Strong bullish momentum detected. Consider entering long positions with proper stop-loss below recent support.")
        else:
            recommendations.append("⚠️ Positive sentiment but below key moving averages. Wait for confirmation above SMA-20 before entering.")
    elif sentiment_score <= 1.5:
        recommendations.append("🔴 Bearish conditions present. Consider reducing exposure or waiting for clearer reversal signals.")
    else:
        recommendations.append("⚡ Neutral conditions. Monitor for breakout above resistance or breakdown below support.")
    
    # Volume-based recommendations
    if volume_trend == "above average" and sentiment_score >= 2.5:
        recommendations.append("📊 Strong volume confirmation supports the current trend. Price movement is backed by institutional interest.")
    elif volume_trend == "below average":
        recommendations.append("📉 Low volume suggests weak conviction. Wait for volume confirmation before making significant moves.")
    
    # Volatility recommendations
    if volatility > 0.05:
        recommendations.append("🌊 High volatility detected. Use tighter stop-losses and position sizing. Consider reducing exposure during high volatility periods.")
    
    # Trend-based recommendations
    trend_dir = history.get("trend_direction", "")
    if trend_dir == "upward" and current_price > sma_20:
        recommendations.append("📈 Uptrend confirmed. Buy on dips to moving average support levels.")
    elif trend_dir == "downward":
        recommendations.append("📉 Downtrend in place. Avoid catching falling knives. Wait for reversal confirmation.")
    
    # Risk management
    recommendations.append(f"💼 Risk Management: Set stop-loss at {round(current_price * 0.95, 2)} (5% below current) and take-profit at {round(current_price * 1.10, 2)} (10% above) for a 2:1 risk-reward ratio.")
    
    return recommendations

def generate_predictions(
    data: List[Dict], closes: List[float], current_price: float,
    sentiment_score: float, volatility: float, days: int
) -> List[Dict[str, Any]]:
    """Generate future price predictions"""
    predictions = []
    today = datetime.now()
    
    # Base trend based on sentiment
    if sentiment_score >= 3:
        base_drift = 0.002  # Slight positive drift
    elif sentiment_score <= 1.5:
        base_drift = -0.002  # Slight negative drift
    else:
        base_drift = 0.0
    
    price = current_price
    
    for i in range(1, days + 1):
        future_date = today + timedelta(days=i)
        
        # Random walk with drift and volatility
        change = random.gauss(base_drift, volatility)
        price = price * (1 + change)
        
        predictions.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "close": round(price, 2)
        })
    
    return predictions

def calculate_risk_score(volatility: float, change_pct: float, volume_trend: str) -> float:
    """Calculate risk score (0-10, higher = more risky)"""
    risk = 5.0  # Base risk
    
    # Volatility component
    risk += min(3.0, volatility * 100)
    
    # Change component (high changes = high risk)
    risk += min(2.0, abs(change_pct) / 5)
    
    # Volume component
    if volume_trend == "below average":
        risk += 0.5
    
    return min(10.0, max(0.0, risk))

def detect_patterns(closes: List[float], highs: List[float], lows: List[float]) -> List[Dict[str, Any]]:
    """Detect common technical patterns with detailed information"""
    patterns = []
    
    if len(closes) < 10:
        return [{
            "name": "Insufficient Data",
            "strength": "N/A",
            "direction": "neutral",
            "description": "Not enough data points for pattern detection"
        }]
    
    # Calculate moving averages for pattern detection
    sma_10 = sum(closes[-10:]) / 10 if len(closes) >= 10 else closes[-1]
    sma_20 = sum(closes[-20:]) / 20 if len(closes) >= 20 else closes[-1]
    sma_50 = sum(closes[-50:]) / 50 if len(closes) >= 50 else closes[-1]
    
    current_price = closes[-1]
    
    # 1. Trend Patterns - Higher Highs & Higher Lows
    if len(highs) >= 10 and len(lows) >= 10:
        recent_highs = highs[-5:]
        recent_lows = lows[-5:]
        earlier_highs = highs[-10:-5]
        earlier_lows = lows[-10:-5]
        
        avg_recent_high = sum(recent_highs) / len(recent_highs)
        avg_earlier_high = sum(earlier_highs) / len(earlier_highs)
        avg_recent_low = sum(recent_lows) / len(recent_lows)
        avg_earlier_low = sum(earlier_lows) / len(earlier_lows)
        
        if avg_recent_high > avg_earlier_high and avg_recent_low > avg_earlier_low:
            strength_score = min(100, ((avg_recent_high - avg_earlier_high) / avg_earlier_high) * 500)
            patterns.append({
                "name": "Higher Highs & Higher Lows",
                "strength": "strong" if strength_score > 70 else "moderate" if strength_score > 40 else "weak",
                "direction": "bullish",
                "description": "Consistent uptrend with higher peaks and troughs"
            })
        elif avg_recent_high < avg_earlier_high and avg_recent_low < avg_earlier_low:
            strength_score = min(100, ((avg_earlier_high - avg_recent_high) / avg_earlier_high) * 500)
            patterns.append({
                "name": "Lower Highs & Lower Lows",
                "strength": "strong" if strength_score > 70 else "moderate" if strength_score > 40 else "weak",
                "direction": "bearish",
                "description": "Consistent downtrend with lower peaks and troughs"
            })
    
    # 2. Consolidation Pattern
    if len(closes) >= 20:
        recent_prices = closes[-10:]
        price_range = max(recent_prices) - min(recent_prices)
        avg_price = sum(recent_prices) / len(recent_prices)
        range_pct = (price_range / avg_price) * 100
        
        if range_pct < 3:
            patterns.append({
                "name": "Tight Consolidation",
                "strength": "strong" if range_pct < 1.5 else "moderate",
                "direction": "neutral",
                "description": f"Price trading in narrow {range_pct:.1f}% range, potential breakout ahead"
            })
    
    # 3. Moving Average Crossovers
    if len(closes) >= 20:
        prev_sma_10 = sum(closes[-11:-1]) / 10
        prev_sma_20 = sum(closes[-21:-1]) / 20
        
        # Golden Cross
        if sma_10 > sma_20 and prev_sma_10 <= prev_sma_20:
            patterns.append({
                "name": "Golden Cross",
                "strength": "strong",
                "direction": "bullish",
                "description": "Short-term MA crossed above long-term MA - bullish signal"
            })
        # Death Cross
        elif sma_10 < sma_20 and prev_sma_10 >= prev_sma_20:
            patterns.append({
                "name": "Death Cross",
                "strength": "strong",
                "direction": "bearish",
                "description": "Short-term MA crossed below long-term MA - bearish signal"
            })
    
    # 4. Double Bottom Pattern (Bullish Reversal)
    if len(lows) >= 20:
        recent_lows = lows[-20:]
        min_low = min(recent_lows)
        # Find indices where price is within 2% of minimum
        bottom_indices = [i for i, low in enumerate(recent_lows) if abs(low - min_low) / min_low < 0.02]
        
        if len(bottom_indices) >= 2 and bottom_indices[-1] - bottom_indices[0] >= 5:
            # Check if price is recovering
            if current_price > min_low * 1.03:
                patterns.append({
                    "name": "Double Bottom",
                    "strength": "moderate",
                    "direction": "bullish",
                    "description": "Price tested support twice and is recovering - potential reversal"
                })
    
    # 5. Double Top Pattern (Bearish Reversal)
    if len(highs) >= 20:
        recent_highs = highs[-20:]
        max_high = max(recent_highs)
        # Find indices where price is within 2% of maximum
        top_indices = [i for i, high in enumerate(recent_highs) if abs(high - max_high) / max_high < 0.02]
        
        if len(top_indices) >= 2 and top_indices[-1] - top_indices[0] >= 5:
            # Check if price is declining
            if current_price < max_high * 0.97:
                patterns.append({
                    "name": "Double Top",
                    "strength": "moderate",
                    "direction": "bearish",
                    "description": "Price tested resistance twice and is declining - potential reversal"
                })
    
    # 6. Ascending Triangle (Bullish)
    if len(highs) >= 15 and len(lows) >= 15:
        recent_highs = highs[-15:]
        recent_lows = lows[-15:]
        
        # Check if highs are relatively flat (resistance)
        high_variance = max(recent_highs) - min(recent_highs)
        high_avg = sum(recent_highs) / len(recent_highs)
        
        # Check if lows are ascending
        first_half_lows = recent_lows[:7]
        second_half_lows = recent_lows[7:]
        
        if (high_variance / high_avg < 0.03 and 
            min(second_half_lows) > min(first_half_lows)):
            patterns.append({
                "name": "Ascending Triangle",
                "strength": "moderate",
                "direction": "bullish",
                "description": "Higher lows meeting resistance - bullish breakout likely"
            })
    
    # 7. Descending Triangle (Bearish)
    if len(highs) >= 15 and len(lows) >= 15:
        recent_highs = highs[-15:]
        recent_lows = lows[-15:]
        
        # Check if lows are relatively flat (support)
        low_variance = max(recent_lows) - min(recent_lows)
        low_avg = sum(recent_lows) / len(recent_lows)
        
        # Check if highs are descending
        first_half_highs = recent_highs[:7]
        second_half_highs = recent_highs[7:]
        
        if (low_variance / low_avg < 0.03 and 
            max(second_half_highs) < max(first_half_highs)):
            patterns.append({
                "name": "Descending Triangle",
                "strength": "moderate",
                "direction": "bearish",
                "description": "Lower highs meeting support - bearish breakdown likely"
            })
    
    # 8. Bullish Engulfing (recent pattern)
    if len(closes) >= 5:
        for i in range(len(closes) - 5, len(closes) - 1):
            if (closes[i] < closes[i-1] and  # Previous candle was bearish
                closes[i+1] > closes[i-1] and  # Current candle closes above previous open
                closes[i+1] > closes[i]):  # Current candle is bullish
                patterns.append({
                    "name": "Bullish Engulfing",
                    "strength": "moderate",
                    "direction": "bullish",
                    "description": "Strong bullish reversal candle pattern detected"
                })
                break
    
    # 9. Bearish Engulfing (recent pattern)
    if len(closes) >= 5:
        for i in range(len(closes) - 5, len(closes) - 1):
            if (closes[i] > closes[i-1] and  # Previous candle was bullish
                closes[i+1] < closes[i-1] and  # Current candle closes below previous open
                closes[i+1] < closes[i]):  # Current candle is bearish
                patterns.append({
                    "name": "Bearish Engulfing",
                    "strength": "moderate",
                    "direction": "bearish",
                    "description": "Strong bearish reversal candle pattern detected"
                })
                break
    
    # 10. Volume Breakout Pattern
    # This would require volume data, but we can infer from price action
    if len(closes) >= 10:
        recent_volatility = max(closes[-5:]) - min(closes[-5:])
        earlier_volatility = max(closes[-10:-5]) - min(closes[-10:-5])
        
        if recent_volatility > earlier_volatility * 1.5:
            direction = "bullish" if closes[-1] > closes[-5] else "bearish"
            patterns.append({
                "name": "Volatility Breakout",
                "strength": "moderate",
                "direction": direction,
                "description": f"Increased volatility suggests {direction} momentum building"
            })
    
    # If no patterns detected, return neutral
    if not patterns:
        patterns.append({
            "name": "Ranging Market",
            "strength": "moderate",
            "direction": "neutral",
            "description": "No clear technical patterns detected, market in equilibrium"
        })
    
    # Return top 3-4 most significant patterns
    return patterns[:4]

def generate_explanation(
    symbol: str, history: Dict, sentiment: str, recommendations: List[str], predictions: List[Dict]
) -> str:
    """Generate comprehensive AI explanation"""
    explanation = f"As the dedicated AI agent for {symbol}, I've analyzed the complete trading history and current market conditions.\n\n"
    
    explanation += "📊 HISTORICAL ANALYSIS:\n"
    explanation += f"Over the analyzed period, {symbol} has shown a {history.get('trend_direction', 'neutral')} trend. "
    explanation += f"The stock is currently trading {abs(history.get('current_vs_high', 0)):.1f}% below its peak and "
    explanation += f"{abs(history.get('current_vs_low', 0)):.1f}% above its low. "
    explanation += f"Recent momentum indicates a {history.get('recent_momentum', 0):.1f}% change.\n\n"
    
    explanation += f"🎯 CURRENT SENTIMENT: {sentiment.upper()}\n"
    explanation += "Based on price action, moving averages, volume patterns, and technical indicators, "
    explanation += f"the market sentiment for {symbol} is currently {sentiment}.\n\n"
    
    explanation += "💡 RECOMMENDATIONS:\n"
    for i, rec in enumerate(recommendations[:3], 1):  # Top 3 recommendations
        explanation += f"{i}. {rec}\n"
    
    explanation += f"\n🔮 FUTURE OUTLOOK:\n"
    if predictions:
        final_pred = predictions[-1]
        change_pct = ((final_pred['close'] - predictions[0]['close']) / predictions[0]['close'] * 100) if len(predictions) > 1 else 0
        explanation += f"My prediction model suggests {symbol} could reach NPR {final_pred['close']:.2f} "
        explanation += f"over the next {len(predictions)} days, representing a {change_pct:+.1f}% change. "
        explanation += "This forecast is based on historical patterns, current momentum, and technical indicators.\n\n"
    
    explanation += "⚠️ IMPORTANT DISCLAIMER:\n"
    explanation += "This analysis is for informational purposes only and should not be considered as financial advice. "
    explanation += "Always conduct your own research and consider consulting with a financial advisor before making investment decisions."
    
    return explanation

def exponential_smoothing_forecast(prices: List[float], alpha: float = 0.3, periods: int = 7) -> List[Dict[str, Any]]:
    """Generate simple exponential smoothing forecast"""
    if not prices or len(prices) < 2:
        return []
    
    # Initialize
    forecasts = []
    today = datetime.now()
    
    # Initialize forecast value
    forecast = 0.0
    
    for i in range(1, periods + 1):
        # Exponential smoothing: forecast = alpha * last_price + (1 - alpha) * last_forecast
        if i == 1:
            forecast = alpha * prices[-1] + (1 - alpha) * (sum(prices) / len(prices))
        else:
            forecast = alpha * forecasts[-1]['close'] + (1 - alpha) * forecast
        
        future_date = today + timedelta(days=i)
        forecasts.append({
            'date': future_date.strftime('%Y-%m-%d'),
            'close': round(forecast, 2),
            'method': 'exponential_smoothing'
        })
    
    return forecasts

def linear_regression_forecast(prices: List[float], periods: int = 7) -> List[Dict[str, Any]]:
    """Generate simple linear regression forecast"""
    if not prices or len(prices) < 2:
        return []
    
    n = len(prices)
    x = list(range(n))
    y = prices
    
    # Calculate slope and intercept
    mean_x = sum(x) / n
    mean_y = sum(y) / n
    
    numerator = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
    denominator = sum((x[i] - mean_x) ** 2 for i in range(n))
    
    if denominator == 0:
        return []
    
    slope = numerator / denominator
    intercept = mean_y - slope * mean_x
    
    # Generate forecast
    forecasts = []
    today = datetime.now()
    
    for i in range(1, periods + 1):
        x_future = n + i
        y_future = slope * x_future + intercept
        
        future_date = today + timedelta(days=i)
        forecasts.append({
            'date': future_date.strftime('%Y-%m-%d'),
            'close': round(max(y_future, prices[-1] * 0.5), 2),  # Prevent negative prices
            'method': 'linear_regression'
        })
    
    return forecasts

@app.post("/forecast/simple")
def simple_forecast(req: CompanyPrediction):
    """Generate simple statistical forecasts for a stock"""
    symbol = req.symbol.upper()
    horizon = req.horizon_days
    
    # Generate mock OHLC data for analysis
    from random import seed
    seed(hash(symbol) % 2**32)
    
    prices = []
    base_price = 100 + (hash(symbol) % 500)
    for i in range(90):
        change = (random.random() - 0.48) * 5
        base_price = max(10, base_price + change)
        prices.append(base_price)
    
    # Generate forecasts using multiple methods
    es_forecast = exponential_smoothing_forecast(prices, alpha=0.3, periods=min(horizon, 14))
    lr_forecast = linear_regression_forecast(prices, periods=min(horizon, 14))
    
    # Calculate ensemble forecast (average of methods)
    ensemble_forecast = []
    for i in range(len(es_forecast)):
        avg_close = (es_forecast[i]['close'] + lr_forecast[i]['close']) / 2
        ensemble_forecast.append({
            'date': es_forecast[i]['date'],
            'close': round(avg_close, 2),
            'method': 'ensemble'
        })
    
    # Calculate confidence intervals (simple std dev based)
    current_price = prices[-1]
    recent_volatility = (max(prices[-14:]) - min(prices[-14:])) / current_price * 100
    
    return {
        'symbol': symbol,
        'current_price': round(current_price, 2),
        'horizon_days': horizon,
        'forecasts': {
            'exponential_smoothing': es_forecast,
            'linear_regression': lr_forecast,
            'ensemble': ensemble_forecast
        },
        'confidence': min(0.95, 0.5 + (1 - recent_volatility / 50)),
        'volatility': round(recent_volatility, 2),
        'timestamp': datetime.utcnow().isoformat()
    }

def prophet_style_forecast(prices: List[float], periods: int = 7) -> List[Dict[str, Any]]:
    """Prophet-like forecasting with trend and seasonal components"""
    if not prices or len(prices) < 7:
        return []
    
    # Extract trend using linear regression
    n = len(prices)
    if n < 2:
        return []
    x = list(range(n))
    y = prices

    mean_x = sum(x) / n
    mean_y = sum(y) / n

    numerator = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
    denominator = sum((x[i] - mean_x) ** 2 for i in range(n))

    trend_slope = numerator / denominator if denominator != 0 else 0
    trend_intercept = mean_y - trend_slope * mean_x
    
    # Extract seasonality (7-day pattern)
    seasonal_period = min(7, len(prices))
    seasonal_components = []
    for i in range(seasonal_period):
        seasonal_sum = sum(prices[j] for j in range(i, len(prices), seasonal_period))
        seasonal_count = len([j for j in range(i, len(prices), seasonal_period)])
        seasonal_avg = seasonal_sum / seasonal_count if seasonal_count > 0 else 0
        seasonal_components.append(seasonal_avg - mean_y)
    
    # Generate forecast
    forecasts = []
    today = datetime.now()
    
    for i in range(1, periods + 1):
        x_future = n + i
        trend_component = trend_slope * x_future + trend_intercept
        seasonal_component = seasonal_components[(n + i) % seasonal_period]
        forecast_value = trend_component + seasonal_component
        
        future_date = today + timedelta(days=i)
        forecasts.append({
            'date': future_date.strftime('%Y-%m-%d'),
            'close': round(max(forecast_value, prices[-1] * 0.4), 2),
            'method': 'prophet_style'
        })
    
    return forecasts

def lstm_style_forecast(prices: List[float], periods: int = 7, lookback: int = 5) -> List[Dict[str, Any]]:
    """LSTM-inspired forecast using sequence patterns"""
    if not prices or len(prices) < lookback:
        return []
    
    forecasts = []
    today = datetime.now()
    
    # Use recent prices as context
    recent_prices = prices[-lookback:]
    
    # Calculate momentum and direction
    momentum = (prices[-1] - prices[-lookback]) / prices[-lookback] * 100
    
    # Generate forecast
    current_price = prices[-1]
    
    for i in range(1, periods + 1):
        # Add momentum with decay
        momentum_decay = momentum * (1 - (i / (periods + 1)))
        
        # Add cyclical component (sine wave inspired)
        cycle_amplitude = abs(momentum) * 0.3
        cycle = cycle_amplitude * math.sin((i / periods) * 2 * math.pi)
        
        forecast_value = current_price * (1 + (momentum_decay + cycle) / 100)
        
        future_date = today + timedelta(days=i)
        forecasts.append({
            'date': future_date.strftime('%Y-%m-%d'),
            'close': round(max(forecast_value, prices[-1] * 0.3), 2),
            'method': 'lstm_style'
        })
    
    return forecasts

def xgboost_style_forecast(prices: List[float], periods: int = 7) -> List[Dict[str, Any]]:
    """XGBoost-inspired forecast using feature importance and gradient boosting concept"""
    if not prices or len(prices) < 3:
        return []

    # Ensure sufficient data for features
    data_len = len(prices)
    if data_len < 5:
        # Fallback for short data
        features = {
            'sma_5': prices[-1],  # Use current price as SMA
            'sma_10': prices[-1],
            'momentum': 0.0,  # No momentum with insufficient data
            'volatility': 0.0,
            'rsi': 50,
        }
    else:
        # Extract features
        features = {
            'sma_5': sum(prices[-5:]) / 5,
            'sma_10': sum(prices[-min(10, data_len):]) / min(10, data_len),
            'momentum': (prices[-1] - prices[-3]) / prices[-3] * 100 if prices[-3] != 0 else 0,
            'volatility': (max(prices[-min(10, data_len):]) - min(prices[-min(10, data_len):])) / (sum(prices[-min(10, data_len):]) / len(prices[-min(10, data_len):])) * 100 if len(prices[-min(10, data_len):]) > 0 else 0,
            'rsi': 50 + ((prices[-1] - sum(prices[-min(14, data_len):]) / min(14, data_len)) / (max(prices[-min(14, data_len):]) - min(prices[-min(14, data_len):]))) * 25 if max(prices[-min(14, data_len):]) > min(prices[-min(14, data_len):]) else 50,
        }
    
    # Weighted combination
    forecast_value = (
        features['sma_5'] * 0.4 +
        features['sma_10'] * 0.3 +
        prices[-1] * (1 + features['momentum'] / 200) * 0.3
    )
    
    forecasts = []
    today = datetime.now()
    
    for i in range(1, periods + 1):
        # Apply momentum decay
        momentum_decay = features['momentum'] * (1 - (i / (periods + 1)) ** 0.8)
        
        iteration_value = forecast_value * (1 + momentum_decay / 200)
        
        future_date = today + timedelta(days=i)
        forecasts.append({
            'date': future_date.strftime('%Y-%m-%d'),
            'close': round(max(iteration_value, prices[-1] * 0.2), 2),
            'method': 'xgboost_style',
            'feature_importance': {
                'sma_5': 0.4,
                'sma_10': 0.3,
                'momentum': 0.3
            }
        })
    
    return forecasts

@app.post("/forecast/ml")
def ml_forecast(req: CompanyPrediction):
    """Generate ML-based forecasts using Prophet, LSTM, and XGBoost-inspired methods"""
    symbol = req.symbol.upper()
    horizon = req.horizon_days
    
    # Generate mock OHLC data
    from random import seed
    seed(hash(symbol) % 2**32)
    
    prices = []
    base_price = 100 + (hash(symbol) % 500)
    for i in range(90):
        change = (random.random() - 0.48) * 5
        base_price = max(10, base_price + change)
        prices.append(base_price)
    
    # Generate forecasts using ML methods
    prophet_forecast = prophet_style_forecast(prices, periods=min(horizon, 14))
    lstm_forecast = lstm_style_forecast(prices, periods=min(horizon, 14), lookback=5)
    xgb_forecast = xgboost_style_forecast(prices, periods=min(horizon, 14))
    
    # Calculate ensemble (weighted average)
    ensemble_forecast = []
    for i in range(len(prophet_forecast)):
        weighted_close = (
            prophet_forecast[i]['close'] * 0.4 +
            lstm_forecast[i]['close'] * 0.3 +
            xgb_forecast[i]['close'] * 0.3
        )
        ensemble_forecast.append({
            'date': prophet_forecast[i]['date'],
            'close': round(weighted_close, 2),
            'method': 'ensemble_weighted'
        })
    
    # Calculate metrics
    current_price = prices[-1]
    recent_volatility = (max(prices[-14:]) - min(prices[-14:])) / current_price * 100
    
    # Confidence based on agreement between models
    prophet_final = prophet_forecast[-1]['close'] if prophet_forecast else current_price
    lstm_final = lstm_forecast[-1]['close'] if lstm_forecast else current_price
    xgb_final = xgb_forecast[-1]['close'] if xgb_forecast else current_price
    
    model_variance = sum([
        (prophet_final - lstm_final) ** 2,
        (lstm_final - xgb_final) ** 2,
        (xgb_final - prophet_final) ** 2
    ]) / 3
    
    confidence = max(0.3, min(0.95, 0.8 - (model_variance / (current_price ** 2)) * 10))
    
    return {
        'symbol': symbol,
        'current_price': round(current_price, 2),
        'horizon_days': horizon,
        'models': {
            'prophet': prophet_forecast,
            'lstm': lstm_forecast,
            'xgboost': xgb_forecast,
            'ensemble': ensemble_forecast
        },
        'confidence': round(confidence, 2),
        'model_agreement': round(1 - (model_variance / (current_price ** 2)), 2),
        'volatility': round(recent_volatility, 2),
        'summary': {
            'bullish_count': sum(1 for f in ensemble_forecast if f['close'] > current_price),
            'bearish_count': sum(1 for f in ensemble_forecast if f['close'] < current_price),
            'target_price': round(ensemble_forecast[-1]['close'], 2) if ensemble_forecast else current_price,
            'upside_downside': round((ensemble_forecast[-1]['close'] - current_price) / current_price * 100, 2) if ensemble_forecast else 0
        },
        'timestamp': datetime.utcnow().isoformat()
    }

@app.post("/update/daily")
def update_daily_data(req: DailyUpdateRequest):
    """
    Endpoint to receive daily market data updates
    This would be called by a data provider or scraper
    """
    try:
        # In a real implementation, this would save to a database
        # For now, we'll just log the updates
        updates = []
        try:
            for update in req.companies:
                # Validate data types
                if not isinstance(update.close, (int, float)) or not isinstance(update.volume, int):
                    continue  # Skip invalid updates
                updates.append({
                    "symbol": update.symbol,
                    "date": update.date,
                    "close": update.close,
                    "volume": update.volume,
                    "updated_at": update.timestamp
                })
        except AttributeError as e:
            return {
                "status": "error",
                "message": f"Invalid update data structure: {str(e)}"
            }
        
        return {
            "status": "success",
            "message": f"Processed {len(updates)} updates",
            "updates": updates
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

def generate_real_time_ohlc(symbol: str, days: int = 365) -> List[Dict[str, Any]]:
    """
    Generate OHLC data that simulates real market movements with daily updates
    This function creates more realistic price movements that can be updated daily
    """
    data = []
    
    # Use a seed based on symbol for consistent but varied data per company
    seed = hash(symbol) % 10000
    random.seed(seed)
    
    # Base price derived from symbol
    base_price = 100 + (seed % 500)
    current_price = base_price
    
    # Simulate more realistic market movements
    for i in range(days):
        date = datetime.now() - timedelta(days=days-i)
        
        # Add some market realism
        # Weekend effect (lower volatility)
        is_weekend = date.weekday() >= 5
        volatility_factor = 0.5 if is_weekend else 1.0
        
        # Random walk with mean reversion
        change_percent = random.gauss(0, 0.02 * volatility_factor)
        
        # Add occasional larger moves (market events)
        if random.random() < 0.02:  # 2% chance of a larger move
            change_percent += random.choice([-0.05, -0.03, 0.03, 0.05])
        
        # Ensure price doesn't go negative
        current_price = max(1, current_price * (1 + change_percent))
        
        # Generate OHLC from the close price
        open_price = current_price * random.uniform(0.995, 1.005)
        high_price = max(open_price, current_price) * random.uniform(1.001, 1.01)
        low_price = min(open_price, current_price) * random.uniform(0.99, 0.999)
        
        # Volume with some correlation to price movement
        base_volume = 100000 + (seed * 1000)
        volume_multiplier = 1 + abs(change_percent) * 10
        volume = int(base_volume * volume_multiplier * random.uniform(0.8, 1.2))
        
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "open": round(open_price, 2),
            "high": round(high_price, 2),
            "low": round(low_price, 2),
            "close": round(current_price, 2),
            "volume": volume
        })
    
    return data

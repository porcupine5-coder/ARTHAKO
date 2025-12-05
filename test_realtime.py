import requests
import json

# Test the API endpoints
def test_endpoints():
    print("Testing NEPSE Real-Time Data Implementation")
    print("=" * 50)
    
    # Test API health
    try:
        response = requests.get("http://localhost:8082/health")
        print(f"API Health: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"API Health Error: {e}")
    
    # Test AI health
    try:
        response = requests.get("http://localhost:8001/health")
        print(f"AI Health: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"AI Health Error: {e}")
    
    # Test company data
    try:
        response = requests.get("http://localhost:8082/companies/NABIL/ohlc")
        data = response.json()
        print(f"Company OHLC Data: {response.status_code} - {len(data.get('ohlc', []))} data points")
        if data.get('ohlc'):
            latest = data['ohlc'][-1]
            print(f"  Latest: {latest['date']} - Close: {latest['close']}")
    except Exception as e:
        print(f"Company Data Error: {e}")
    
    # Test company prediction
    try:
        payload = {
            "symbol": "NABIL",
            "horizon_days": 7
        }
        response = requests.post("http://localhost:8001/predict/company", json=payload)
        data = response.json()
        print(f"Company Prediction: {response.status_code}")
        if 'forecast' in data:
            print(f"  Forecast points: {len(data['forecast'])}")
            if data['forecast']:
                print(f"  First day prediction: {data['forecast'][0]['delta_pct']}%")
        if 'metadata' in data:
            print(f"  Current price: {data['metadata']['current_price']}")
            print(f"  Recent trend: {data['metadata']['recent_trend']}%")
            print(f"  Volatility: {data['metadata']['volatility']}%")
    except Exception as e:
        print(f"Company Prediction Error: {e}")

if __name__ == "__main__":
    test_endpoints()
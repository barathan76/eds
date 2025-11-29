import requests
import json

url = "http://127.0.0.1:8000/register"
payload = {
    "full_name": "Debug User",
    "email": "debug@example.com",
    "password": "password123",
    "is_company": False
}

try:
    print(f"Sending request to {url} with payload: {payload}")
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")

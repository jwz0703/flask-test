import os


# 讀取環境變數來確認
api_key = os.getenv("GEMINI_API_KEY")
print(f"目前的 API Key 是: {api_key}")
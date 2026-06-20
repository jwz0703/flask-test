# To run this code you need to install the following dependencies:
# pip install google-genai
from google import genai
from google.genai import types
import os

MODEL_PRICING = {
    "gemini-3-flash-preview": [0.5, 3.0, 3.0],
    "gemini-3.1-pro-preview" : [2, 12, 12],
    "gemini-3.5-flash": [1.5, 1.5, 9]
}
DEFAULT_PRICE = [0.5, 3.0, 3.0]

def format_history(json_history):
    formatted = []
    for item in json_history:
        formatted.append(types.Content(
                role=item['role'],
                parts=[
                    types.Part.from_text(text=item['content']),
                ],
            ))
    return formatted
def generate_stream_with_parts(user_input: list,history, model_name="gemini-3-flash-preview"):
    price_list = MODEL_PRICING.get(model_name,DEFAULT_PRICE)
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    final_usage = {
        "input": 0,
        "thoughts": 0,
        "candidates": 0
    }
    messages = list(history) if history else []
    messages.append(types.Content(
            role="user",
            parts=user_input,
        ))
    contents = messages
    tools = []
    generate_content_config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_level="HIGH",
            include_thoughts=True
        ),
        system_instruction=[
            types.Part.from_text(text="""你是一位台灣高中老師，你的主要任務為:
- 如果照片裡有可以解的問題，請解答他
- 如果用戶詢問相關知識，請你在一開始詳細說明用戶提及的觀念
- 題目有可能是多選題，請考慮清楚，如果今天選項有五個，通常是多選題
"""),
        ],
        tools=tools,)
    for chunk in client.models.generate_content_stream(
        model=model_name,
        contents=contents,
        config=generate_content_config,
    ):
        if chunk.usage_metadata:
            final_usage['input'] = chunk.usage_metadata.prompt_token_count 
            final_usage['thoughts'] = chunk.usage_metadata.thoughts_token_count
            final_usage['candidates'] = chunk.usage_metadata.candidates_token_count
            final_usage['US_dollar'] = count_money(final_usage['input'],final_usage['thoughts'],final_usage['candidates'],price_list)
            final_usage['Model_Name'] = model_name
            final_usage['Price_list'] = "\n".join(map(str, price_list))

        for part in chunk.candidates[0].content.parts:
            if part.text is None:
                continue
            if part.thought:
                yield {"status":"thinking","content":part.text}
            else:
                yield {"status":"response","content":part.text}

    yield {"status":"usage","content":final_usage}


def count_money(input_token,thought_token,candidate,price_list:list):
    input_token = input_token or 0
    thought_token = thought_token or 0
    candidate = candidate or 0
    return (input_token * price_list[0] + thought_token * price_list[1] + candidate * price_list[2]) / 1000000

if __name__ == "__main__":
    uri = "https://isiscpdjyhukkydkafmv.supabase.co/storage/v1/object/public/images/original/36849e15-869a-4092-b94d-a26af4fd3147/1775669064_big.jpg"
    data = [{'role': 'user', 'content': '請解釋什麼是向量資料庫？'}, {'role': 'model', 'content': '向量資料庫專門存儲與檢索高維向量，常用於 AI 語義搜尋與推薦系統。'}, {'role': 'user', 'content': '如何優化 API 的回應速度？'}, {'role': 'model', 'content': '可以透過建立索引、實作快取機制、減少不必要的資料庫查詢以及使用非同步處理來提升效能。'}, {'role': 'user', 'content': '什麼是資料庫的 ACID 特性？'}, {'role': 'model', 'content': 'ACID 代表原子性、一致性、隔離性與持續性，是確保資料庫事務可靠的四個基本要素。'}]
    part = []
    history = []
    part.extend([
                types.Part.from_text(text="早安你好"),
            ])
    for message in generate_stream_with_parts(user_input=part,history=history):
        print(message['content'])



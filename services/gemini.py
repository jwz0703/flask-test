# To run this code you need to install the following dependencies:
# pip install google-genai
from google import genai
from google.genai import types
import os

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
def generate_stream_with_parts(user_input: list,history):
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    model = "gemini-3-flash-preview"
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
    tools = [types.Tool(googleSearch=types.GoogleSearch()),]
    generate_content_config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_level="HIGH",
            include_thoughts=True
        ),tools=tools,)
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        if chunk.usage_metadata:
            final_usage['input'] = chunk.usage_metadata.prompt_token_count
            final_usage['thoughts'] = chunk.usage_metadata.thoughts_token_count
            final_usage['candidates'] = chunk.usage_metadata.candidates_token_count
        
        for part in chunk.candidates[0].content.parts:
            if part.text is None:
                continue
            if part.thought:
                yield {"status":"thinking","content":part.text}
            else:
                yield {"status":"response","content":part.text}

    yield {"status":"usage","content":final_usage}

def generate_stream(user_input="你好",history:list = None):

    client = genai.Client()
    model = "gemini-3-flash-preview"
    final_usage = {
        "input": 0,
        "thoughts": 0,
        "candidates": 0
    }
    messages = list(history) if history else []
    messages.append(types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=user_input),
            ],
        ))

    contents = messages
    tools = [types.Tool(googleSearch=types.GoogleSearch()),]
    generate_content_config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_level="HIGH",
            include_thoughts=True
        ),tools=tools,)

    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        if chunk.usage_metadata:
            final_usage['input'] = chunk.usage_metadata.prompt_token_count
            final_usage['thoughts'] = chunk.usage_metadata.thoughts_token_count
            final_usage['candidates'] = chunk.usage_metadata.candidates_token_count
        
        for part in chunk.candidates[0].content.parts:
            if part.thought:
                yield {"status":"thinking","content":part.text}
            else:
                yield {"status":"response","content":part.text}

    yield {"status":"usage","content":final_usage}

if __name__ == "__main__":
    uri = "https://isiscpdjyhukkydkafmv.supabase.co/storage/v1/object/public/images/original/36849e15-869a-4092-b94d-a26af4fd3147/1775669064_big.jpg"
    data = [{'role': 'user', 'content': '請解釋什麼是向量資料庫？'}, {'role': 'model', 'content': '向量資料庫專門存儲與檢索高維向量，常用於 AI 語義搜尋與推薦系統。'}, {'role': 'user', 'content': '如何優化 API 的回應速度？'}, {'role': 'model', 'content': '可以透過建立索引、實作快取機制、減少不必要的資料庫查詢以及使用非同步處理來提升效能。'}, {'role': 'user', 'content': '什麼是資料庫的 ACID 特性？'}, {'role': 'model', 'content': 'ACID 代表原子性、一致性、隔離性與持續性，是確保資料庫事務可靠的四個基本要素。'}]
    part = []
    history = []
    part.extend([
                types.Part.from_text(text="這圖在講啥"),
                types.Part.from_uri(
                    file_uri=uri
                ),
            ])
    for message in generate_stream_with_parts(user_input=part,history=history):
        print(message['content'])

        
    """for message in generate_stream(user_input="我們剛剛說甚麼", history=format_history(data)):
        if message['status'] == "usage":
            # Gemini 3 Flash Preview: Input price $0.50, Output price(including thinking tokens) $3.00 (per 1M tokens in USD)
            usage = message['content']
            money = ( 0.5 * usage['input'] + 3 * usage['thoughts'] + 3 * usage['candidates'] ) / 1000000
            print(f"錢錢(美金) {money}")
        else:
            print(message['content'])
    """



# To run this code you need to install the following dependencies:
# pip install google-genai
from google import genai
from google.genai import types
import json
def generate_stream(user_input="你好"):
    with open("images.jpg","rb") as f:
        image_bytes = f.read()
    client = genai.Client()
    model = "gemini-3-flash-preview"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=user_input),
                types.Part.from_bytes(  
                    data=image_bytes,
                    mime_type="image/jpeg",
                ),
                
            ],
        ),
    ]
    tools = [
        types.Tool(googleSearch=types.GoogleSearch(
        )),
    ]
    generate_content_config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_level="LOW",
            include_thoughts=True
        ),
        tools=tools,
    )

    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        for part in chunk.candidates[0].content.parts:
            if part.thought:
                yield {"status":"thinking","content":part.text}
            else:
                yield {"status":"response","content":part.text}
        


data = [{'id': '502754e7-bc8f-4fc6-95eb-44c8867dccf2', 'title': '新對話'}, {'id': '8c0e2545-7812-40a6-acda-f66f6b130aba', 'title': '我操你媽'}, {'id': '36849e15-869a-4092-b94d-a26af4fd3147', 'title': '新對話'}, {'id': '5c43b13a-a5e1-49dc-9e0c-1277933f65fa', 'title': '新對話'}]


content = types.Content(
            role="user",
            parts=[
                types.Part.from_text(text="hello"),   
            ],
        ),


data.append(content)



if __name__ == "__main__":




    """print("starting...gemini 3.1 pro")
    for text in generate_stream("這圖在說甚麼"):
        print(json.dumps(text, ensure_ascii=False))"""
    



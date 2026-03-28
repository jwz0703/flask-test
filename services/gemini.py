# To run this code you need to install the following dependencies:
# pip install google-genai
from google import genai
from google.genai import types
import json
def generate_stream(user_input="你好"):
    client = genai.Client()
    model = "gemini-3-flash-preview"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=user_input),
            ],
        ),
    ]
    tools = [
        types.Tool(googleSearch=types.GoogleSearch(
        )),
    ]
    generate_content_config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_level="HIGH",
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
        

if __name__ == "__main__":
    print("starting...gemini 3.1 pro")
    for text in generate_stream("x|x|+3x+4=0有幾個實根"):
        print(json.dumps(text, ensure_ascii=False))
    



# To run this code you need to install the following dependencies:
# pip install google-genai
from google import genai
from google.genai import types


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
        ),
        tools=tools,
    )

    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        
        yield chunk.text
        

if __name__ == "__main__":
    for text in generate_stream("如何證明e^i pi=-1"):
        print(text)
    



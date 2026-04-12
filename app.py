from flask import Flask, request, jsonify, render_template, Response, stream_with_context
from services.sb import (
    insert_conversation,
    upload_file
)
from google import genai
from google.genai import types
from services.gemini import format_history, generate_stream, generate_stream_with_parts
import json
import time
import mimetypes
app = Flask(__name__)



@app.route("/")
def index():
    return render_template("test.html")
@app.route("/test")
def test():
    return render_template("test.html")

@app.route("/api/start-chat", methods =['POST'])
def chat():
    id = insert_conversation('新對話')
    files = request.files.getlist('images')
    files_data = []
    for file in request.files.getlist('images'):
        files_data.append({
            'filename': file.filename,
            'mimetype': file.mimetype,
            'bytes': file.read()  
        })
    parts = []
    history = []
    parts.append(types.Part.from_text(text="你是一位高中老師，請幫同學解題，題目在圖片裡面，請好好思考"))
    def generate():
        yield f"{id}\n"
        for data in files_data:
            
            url = upload_file(id, data['bytes'], data['mimetype'])
            parts.append(types.Part.from_uri(file_uri=url))
             
            yield f"{data['filename']} {data['mimetype']} {url}\n"
        try:
            for message in generate_stream_with_parts(user_input=parts,history=history):
                yield str(message['content'])
        except Exception as e:
            print(f"api error{e}")
            yield "無法生成"
        yield "完成\n"
    return Response(stream_with_context(generate()),mimetype='text/plain')

@app.route('/health')
def health():
    return render_template('health.html')

if __name__ == "__main__":
    app.run(host='0.0.0.0',debug=True)
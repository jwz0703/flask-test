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
import os
app = Flask(__name__)


@app.route("/debug-env")
def debug():
    key = os.environ.get("GEMINI_API_KEY")
    if key:
        return jsonify({"status":"found","perfix":key[:4]})
    else:
        return jsonify({"status":"not-found"})
@app.route("/")
def index():
    return render_template("test.html")
@app.route("/test")
def test():
    return render_template("test.html")

@app.route("/api/start-chat", methods =['POST'])
def chat():
    id = insert_conversation('新對話')
    extra_message = request.form.get('extraMessage','')
    print(extra_message)
    files_data = []
    for file in request.files.getlist('images'):
        files_data.append({
            'filename': file.filename,
            'mimetype': file.mimetype,
            'bytes': file.read()  
        })
    parts = []
    history = []
    parts.append(types.Part.from_text(text=extra_message))
    def generate():
        yield json.dumps({"id":"status","content":id},ensure_ascii=False)  + "\n"

        for data in files_data:
            
            url = upload_file(id, data['bytes'], data['mimetype'])
            parts.append(types.Part.from_uri(file_uri=url))
             
            yield json.dumps({"status":"file","content":url},ensure_ascii=False)  + "\n"
        try:
            for message in generate_stream_with_parts(user_input=parts,history=history):
                yield json.dumps(message,ensure_ascii=False) + "\n"
        except Exception as e:
            print(f"api error{e}",ensure_ascii=False)
            yield json.dumps({"status":"error","content":str(e)},ensure_ascii=False) + "\n"
        yield json.dumps({"status":"done","content":""},ensure_ascii=False) + "\n"
    return Response(stream_with_context(generate()),mimetype='application/x-ndjson')


if __name__ == "__main__":
    app.run(host='0.0.0.0',debug=True)
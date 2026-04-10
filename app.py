from flask import Flask, request, jsonify, render_template, Response, stream_with_context
from services.sb import (
    load_conversation_by_id,
    add_content_by_id,
    insert_conversation,
    get_conversations_content,
)
from services.gemini import format_history, generate_stream
import json

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")
@app.route("/test")
def test():
    return render_template("test.html")

@app.route("/api/conversations", methods=["GET"])
def get_conversations():
    data = get_conversations_content()
    return jsonify(data)


@app.route("/api/conversations", methods=["POST"])
def new_conversation():
    body = request.get_json()
    title = body.get("title", "新對話")
    cid = insert_conversation(title)
    return jsonify({"id": cid, "title": title})


@app.route("/api/conversations/<cid>/messages", methods=["GET"])
def get_messages(cid):
    count = int(request.args.get("count", 30))
    data = load_conversation_by_id(cid, count)
    return jsonify(data)


@app.route("/api/conversations/<cid>/chat", methods=["POST"])
def chat(cid):
    body = request.get_json()
    user_input = body.get("message", "")
    count = int(body.get("history_count", 10))

    history = load_conversation_by_id(cid, count)

    def event_stream():
        response_text = ""
        try:
            for chunk in generate_stream(user_input, format_history(history)):
                if chunk["status"] == "usage":
                    usage = chunk["content"]
                    money = (
                        0.5 * usage["input"]
                        + 3 * usage["thoughts"]
                        + 3 * usage["candidates"]
                    ) / 1_000_000
                    # Save to DB
                    add_content_by_id(cid, "user", user_input)
                    add_content_by_id(cid, "model", response_text)
                    yield f"data: {json.dumps({'status': 'usage', 'cost': money})}\n\n"
                elif chunk["status"] == "response":
                    response_text += chunk["content"]
                    yield f"data: {json.dumps({'status': 'response', 'content': chunk['content']})}\n\n"
                # skip thinking chunks to frontend (optional: forward them too)
        except Exception as e:
            err = str(e)
            if "503" in err:
                yield f"data: {json.dumps({'status': 'error', 'content': '系統過載，請稍後再試'})}\n\n"
            else:
                yield f"data: {json.dumps({'status': 'error', 'content': f'錯誤：{err}'})}\n\n"

    return Response(
        stream_with_context(event_stream()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


if __name__ == "__main__":
    app.run(host='0.0.0.0',debug=True)
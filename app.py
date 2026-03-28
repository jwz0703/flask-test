from werkzeug.security import generate_password_hash,check_password_hash
from flask import Flask,render_template,redirect,request,jsonify,Response,stream_with_context
import sqlite3
import json
from services.gemini import generate_stream
app = Flask(__name__)
def get_db():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn
@app.route('/')
def home():
    return render_template('home.html')
@app.route('/generate')
def generate():
    return render_template('generate.html')
@app.route('/register',methods = ['GET','POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        hashed = generate_password_hash(password)
        db = get_db()
        try:
            db.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', (username, hashed))
            db.commit()
            return redirect('/login')
        except sqlite3.IntegrityError:
            return "使用者已存在"
        finally:
            db.close()
    return render_template('register.html')

@app.route('/login',methods = ['GET','POST'])
def login():
    error_msg = None
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        db = get_db()
        user = db.execute("SELECT * from users WHERE username = ?",(username,)).fetchone()
        db.close()
        
        if user and check_password_hash(user['password_hash'], password):
            return f"早安 {user[1]}"
        return "帳號密碼錯誤"
    return render_template('login.html',error = error_msg)

@app.route('/success')
def success():
    return "Success"

@app.route('/api/chat',methods=['GET'])
def generate_chat():


    data = request.args.get('q',"你好")
    print(f"收到訊息,{data}")
    def sse_stream():
        try:
            for chunk in generate_stream(data):
                yield f"data: {json.dumps(chunk,ensure_ascii=False)}\n\n"
        except Exception as e:
            error_msg = {"error": str(e)}
            yield f"data: {json.dumps(error_msg, ensure_ascii=False)}\n\n"
            print(f"串流中斷或出錯: {e}")
        finally:
            yield "data: [DONE]\n\n"
    return Response(stream_with_context(sse_stream()),mimetype='text/event-stream')


@app.route('/md')
def md():
    return render_template('mdlatex.html')
if __name__ == '__main__':
    app.run(debug=True)
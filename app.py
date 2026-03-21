from werkzeug.security import generate_password_hash,check_password_hash
from flask import Flask,render_template,redirect,request
import sqlite3
app = Flask(__name__)
def get_db():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn

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

if __name__ == '__main__':
    app.run(debug=True)
import sqlite3
conn = sqlite3.connect('users.db')
curser = conn.cursor()
with open('schema.sql') as f:
    curser.executescript(f.read())
conn.commit()
conn.close()
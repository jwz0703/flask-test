CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);
INSERT INTO users (username, password_hash) VALUES 
('user_01', 'ef92b778bafe4215d6'),
('user_02', '7110eda4d09e062aa5'),
('user_03', '827ccb0eea8a706c4c'),
('user_04', 'eb5740b0806161476b'),
('user_05', '972132759e693144a1'),
('user_06', 'ae2b1fca515949e5d5'),
('user_07', '098f6bcd4621d373ca'),
('user_08', '5f4dcc3b5aa765d61d'),
('user_09', '202cb962ac59075b96'),
('user_10', '1a1dc91c907325c692');
from services.sb import load_conversation_by_id, add_content_by_id, insert_conversation,get_conversations_content
from services.gemini import format_history, generate_stream

selection = int(input("1.新對話\n2.選擇對話\n >>"))
if selection == 1:
    current_id = insert_conversation("新對話")
else:
    conversations = get_conversations_content()
    for i, c in enumerate(conversations):
        print(f"[{i+1}] {c['id']}: {c['title']}")
    a = int(input(">"))
    current_id = conversations[a-1]['id']

history = load_conversation_by_id(current_id)
# display history
for message in history:
    print(f"{message['role']}: {message['content']}")
try:
    response = ""
    input_message = input("輸入內容:")

    for message in generate_stream(input_message, format_history(history)):
        if message['status'] == "usage":
            usage = message['content']
            money = ( 0.5 * usage['input'] + 3 * usage['thoughts'] + 3 * usage['candidates'] ) / 1000000
            print(f"錢錢(美金) {money}")
        elif message['status'] == "response":
            response += message['content']
            print(message['content'])
        else:
            print()
    print("正在上傳...")

    add_content_by_id(current_id,"user",input_message)
    add_content_by_id(current_id,"model",response)
except Exception as e:
    if "503" in str(e):
        print("系統過載")
    else:
        print(f"未預期錯誤{e}")




from supabase import Client, create_client
import os
from dotenv import load_dotenv
from services.generate_text import generate
from typing import Literal
import time
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

#添加對話名稱 
def insert_conversation(title):
    conversation_id = supabase.from_('conversations').insert([{'title':title}]).execute()
    return conversation_id.data[0]['id']

# 添加對話內容 role: user || model
# conversation_id references conversations(id)
def add_content_by_id(id: str, role: Literal["model","user"], content: str):
    response = supabase.from_('messages').insert([{'conversation_id':id,'role':role,'content':content}]).execute()
    return response.data

def insert_content_with_images(id,role,content,image_paths):
    urls =  []
    for path in image_paths:
        clean_path = path.lstrip("/")
        final_url = supabase.storage.from_("images").get_public_url(clean_path)
        urls.append(final_url)

    response = supabase.from_('messages').insert([{'conversation_id':id,'role':role,'content':content,'image_url':urls}]).execute()
    return response.data



def get_conversations_content():
    response = (
        supabase.table("conversations")
        .select("id,title")
        .order("updated_at",desc=True)
        .execute()
    )
    return response.data

def load_conversation_by_id(conversation_id, count = 5):
    response = (
        supabase.table("messages")
        .select("role,content")
        .eq("conversation_id",conversation_id)
        .order("created_at", desc=True)
        .limit(count*2)
        .execute()
    )
    return response.data[::-1]

def upload_file(conversation_id, file_bytes, mimetype):
    filename = f"{conversation_id}/{int(time.time())}_big.jpg"
    
    response = (supabase.storage.from_("images").upload(
        path=f"original/{filename}",
        file=file_bytes,
        file_options={"cache-control": "3600", "upsert": "true","content-type":mimetype}
    ))

    path_without_bucket = response.full_path.removeprefix("images/")
    public_url = supabase.storage.from_("images").get_public_url(path_without_bucket)
    return public_url

if __name__ == "__main__":
    #print(insert_content_with_images("8c0e2545-7812-40a6-acda-f66f6b130aba","user","hhihihihi",["/original/5c43b13a-a5e1-49dc-9e0c-1277933f65fa/1775669609_big.jpg"]))
    data = load_conversation_by_id("8c0e2545-7812-40a6-acda-f66f6b130aba")
    print(data)

    
    """target_id = "8c0e2545-7812-40a6-acda-f66f6b130aba"
    add_content_by_id(target_id, "user", "請解釋什麼是向量資料庫？")
    add_content_by_id(target_id, "model", "向量資料庫專門存儲與檢索高維向量，常用於 AI 語義搜尋與推薦系統。")

    add_content_by_id(target_id, "user", "如何優化 API 的回應速度？")
    add_content_by_id(target_id, "model", "可以透過建立索引、實作快取機制、減少不必要的資料庫查詢以及使用非同步處理來提升效能。")

    add_content_by_id(target_id, "user", "什麼是資料庫的 ACID 特性？")
    add_content_by_id(target_id, "model", "ACID 代表原子性、一致性、隔離性與持續性，是確保資料庫事務可靠的四個基本要素。")"""
    



   
    


    
    
    

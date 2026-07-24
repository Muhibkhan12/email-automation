from fastapi import APIRouter
import requests


router = APIRouter()

@router.get("/get_all")
def get_all_data():
    response = requests.get("https://jsonplaceholder.typicode.com/posts/")
    return response.json()


@router.get("/{post_id}")
def get_by_id(post_id : int):
    response = requests.get(f"https://jsonplaceholder.typicode.com/posts/{post_id}")
    return response.headers
from fastapi import APIRouter, HTTPException, status
import requests
from pydantic import BaseModel




router = APIRouter()


class AddSchema(BaseModel):
    title : str
    body : str
    userId : int


# @router.get("/get_all")
# def get_all_data():
#     response = requests.get("https://jsonplaceholder.typicode.com/posts/")
#     return response.json()


@router.get("/{post_id}")
def get_by_id(post_id : int):
    response = requests.get(f"https://jsonplaceholder.typicode.com/posts/{post_id}")
    return response.headers

@router.post("/")
def create_post(post: AddSchema):
    response = requests.post("https://jsonplaceholder.typicode.com/posts", json=post.model_dump(),)

    if response.status_codes != 201:
        raise HTTPException(
            status_code = response.status_code,
            detail="Failed to create post"
        )
    return response.json()

@router.delete("/{post_id}")
def deleting_post(post_id : int):
    url = f"https://jsonplaceholder.typicode.com/posts/{post_id}"
    response = requests.delete(url)

    if response.status_code != 201:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Can't delete the post"
        )
    return {
        "message" : "Post deleted Successfully"
    }

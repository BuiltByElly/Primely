from pydantic import BaseModel


class LoginSchema(BaseModel):
    username: str
    password: str
    email: str


class UserResponse(BaseModel):
    public_id: str
    username: str
    email: str

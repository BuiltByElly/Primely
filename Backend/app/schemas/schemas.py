from pydantic import BaseModel


class LoginSchema(BaseModel):
    password: str
    email: str
    remember_me: bool = False


class RegisterSchema(BaseModel):
    username: str
    password: str
    email: str
    remember_me: bool = False


class UserResponse(BaseModel):
    public_id: str
    username: str
    email: str

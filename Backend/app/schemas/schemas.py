from pydantic import BaseModel


class LoginSchema(BaseModel):
    username: str
    password: str


class DefaultResponse(BaseModel):
    status: int
    message: str

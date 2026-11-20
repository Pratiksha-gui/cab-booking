
from jose import jwt

from app.core.token import create_access_token
from app.core.config import SECRET_KEY, ALGORITHM

data = {"sub": "1", "role": "rider"}

token = create_access_token(data)

print("Generated JWT:")
print(token)

decoded_token = jwt.decode(
    token,
    SECRET_KEY,
    algorithms=[ALGORITHM]
)

print("Decoded token:")
print(decoded_token)

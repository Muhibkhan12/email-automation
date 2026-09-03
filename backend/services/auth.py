from jose import jwt, JWTError
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta, timezone
from config import settings

oauth2_scheme = OAuth2PasswordBearer(
     tokenUrl= "/auth/login"
)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_TOKEN_EXPIRY)
    to_encode.update({"exp": expire, "type": "access"})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm= settings.ALGORITHM,
    )

    return encoded_jwt

def create_refresh_token(data : dict):
      to_encode = data.copy()

      expire = datetime.now(timezone.utc) + timedelta(days=7)

      to_encode.update({"exp":expire, "type":"refresh"})

      encoded_jwt = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
      )

      return encoded_jwt

def verify_access_token(token : str):
        try:
            payload = jwt.decode(
                  token,
                  settings.SECRET_KEY,
                  algorithms=[settings.ALGORITHM]
            )

            if payload.get("type") != "access":
                  raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid access token",
                  )
            
            return payload  
        
        except JWTError:
              
              raise HTTPException(
                    status_code = status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired access token",
              )

def verify_refresh_token(token : str):
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
            )
            if payload.get("type") != "refresh":
                raise HTTPException(
                        status_code= status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid Refresh Token",
                )
            return payload
        
        except JWTError:

            raise HTTPException(
                  status_code=status.HTTP_401_UNAUTHORIZED,
                  detail="Invalid Refresh Token or Expired"
            )

def refresh_access_token(refresh_token: str) -> str:
    payload = verify_refresh_token(refresh_token)

    # strip reserved claims so we don't leak old exp/type into the new token
    data = {k: v for k, v in payload.items() if k not in ("exp", "type")}

    return create_access_token(data)
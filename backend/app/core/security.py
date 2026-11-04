"""
GuruCortex Security & Access Control Module
Provides JWT/Bearer token issuance, RBAC enforcement, session validation,
and rate limiting for local-first and production environments.
"""
import time
import secrets
from enum import Enum
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from collections import defaultdict

import jwt
from fastapi import Request, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from app.config import settings

# Security Configuration
SECRET_KEY = getattr(settings, "SECRET_KEY", "gurucortex-production-secure-default-key-2026")
ALGORITHM = "HS256"
DEFAULT_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security_scheme = HTTPBearer(auto_error=False)


class Role(str, Enum):
    STUDENT = "student"
    PARENT = "parent"
    TEACHER = "teacher"
    ADMIN = "admin"


class UserPayload(BaseModel):
    user_id: str
    email: str = "student@gurucortex.edu"
    role: str = Role.STUDENT.value


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=DEFAULT_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Verify and decode a signed JWT access token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None


async def get_current_user(
    request: Request,
    auth: Optional[HTTPAuthorizationCredentials] = Security(security_scheme)
) -> UserPayload:
    """
    Extract and validate current authenticated user.
    Supports JWT Bearer token, explicit simulation headers (X-Guru-User-Id / X-Guru-Role),
    and local-first developer fallback.
    """
    # 1. Bearer Token Verification
    if auth and auth.credentials:
        payload = decode_access_token(auth.credentials)
        if payload and "sub" in payload:
            return UserPayload(
                user_id=payload["sub"],
                email=payload.get("email", "user@gurucortex.edu"),
                role=payload.get("role", Role.STUDENT.value)
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Explicit Security Headers (For API testing / inter-service communication)
    header_user_id = request.headers.get("X-Guru-User-Id")
    header_role = request.headers.get("X-Guru-Role")
    if header_user_id or header_role:
        return UserPayload(
            user_id=header_user_id or "default_student",
            email=request.headers.get("X-Guru-Email", "user@gurucortex.edu"),
            role=header_role or Role.STUDENT.value
        )

    # 3. Local-First Developer Default Fallback
    return UserPayload(
        user_id="default_student",
        email="student@gurucortex.edu",
        role=Role.STUDENT.value
    )


def require_roles(allowed_roles: List[str]):
    """FastAPI Dependency for Role-Based Access Control (RBAC)"""
    async def role_checker(user: UserPayload = Security(get_current_user)):
        if user.role not in allowed_roles and user.role != Role.ADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Role '{user.role}' is not authorized. Required: {allowed_roles}"
            )
        return user
    return role_checker


class RateLimiter:
    """In-memory sliding-window rate limiter for sensitive endpoints"""
    def __init__(self, requests_per_minute: int = 60):
        self.rpm = requests_per_minute
        self.history: Dict[str, List[float]] = defaultdict(list)

    def check(self, key: str):
        now = time.time()
        window_start = now - 60.0
        # Clean older records
        self.history[key] = [t for t in self.history[key] if t > window_start]
        if len(self.history[key]) >= self.rpm:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: Maximum {self.rpm} requests per minute."
            )
        self.history[key].append(now)


# Global instances for critical routes
link_rate_limiter = RateLimiter(requests_per_minute=20)
stream_rate_limiter = RateLimiter(requests_per_minute=30)


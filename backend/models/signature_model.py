from pydantic import BaseModel
from datetime import datetime

class SignatureCreate(BaseModel):
    doc_hash: str
    signer_email: str
    summary: str | None = None

class SignatureResponse(BaseModel):
    sig_id: str
    timestamp: datetime
    signature: str
    summary: str | None = None

class VerificationResponse(BaseModel):
    valid: bool
    signer_email: str | None = None
    timestamp: datetime | None = None
    doc_hash: str | None = None
    summary: str | None = None

class SuggestedPlace(BaseModel):
    page: int
    x: float
    y: float
    label: str

class DocumentHashResponse(BaseModel):
    doc_hash: str
    summary: str | None = None
    is_signed: bool = False
    suggested_places: list[SuggestedPlace] = []
    legal_analysis: dict | None = None

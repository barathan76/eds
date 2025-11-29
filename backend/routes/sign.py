from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from services.db_service import get_db
from agents.signature_agent import signature_agent
from agents.audit_agent import audit_agent
from models.signature_model import SignatureCreate, SignatureResponse

router = APIRouter()

@router.post("/sign", response_model=SignatureResponse)
def sign_document(request: SignatureCreate, db: Session = Depends(get_db)):
    try:
        print(f"Received sign request for {request.signer_email} with summary: {request.summary}")
        response = signature_agent.process(db, request.doc_hash, request.signer_email, request.summary, save=False)
        audit_agent.log_action("SIGN", f"Signed hash {request.doc_hash} for {request.signer_email}")
        return response
    except Exception as e:
        audit_agent.log_action("SIGN_ERROR", str(e))
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from services.db_service import get_db
from agents.verification_agent import verification_agent
from agents.ingestion_agent import ingestion_agent
from agents.audit_agent import audit_agent
from models.signature_model import VerificationResponse

router = APIRouter()

@router.get("/verify/{sig_id}", response_model=VerificationResponse)
def verify_signature(sig_id: str, db: Session = Depends(get_db)):
    try:
        response = verification_agent.verify_by_id(db, sig_id)
        audit_agent.log_action("VERIFY_ID", f"Verified ID {sig_id}, Valid: {response.valid}")
        return response
    except Exception as e:
        audit_agent.log_action("VERIFY_ID_ERROR", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-upload")
async def verify_upload(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        content = await file.read()
        # Unpack the tuple (hash, summary, detected_sig_id, suggested_places, legal_analysis)
        doc_hash, _, _, _, _ = ingestion_agent.process(content)
        
        result = verification_agent.verify_by_upload(db, doc_hash)
        audit_agent.log_action("VERIFY_UPLOAD", f"Verified upload, Result: {result}")
        return {"status": result}
    except Exception as e:
        audit_agent.log_action("VERIFY_UPLOAD_ERROR", str(e))
        raise HTTPException(status_code=500, detail=str(e))

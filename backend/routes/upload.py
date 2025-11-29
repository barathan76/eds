from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from services.db_service import get_db, Signature
from agents.ingestion_agent import ingestion_agent
from agents.audit_agent import audit_agent
from models.signature_model import DocumentHashResponse

router = APIRouter()

@router.post("/upload-document", response_model=DocumentHashResponse)
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        content = await file.read()
        doc_hash, summary, detected_sig_id, suggested_places, legal_analysis = ingestion_agent.process(content)
        
        is_signed = False
        
        # 1. Check exact hash match (original file re-upload)
        existing_sig_by_hash = db.query(Signature).filter(Signature.doc_hash == doc_hash).first()
        
        if existing_sig_by_hash:
            is_signed = True
            
        # 2. Check detected signature ID (signed file upload)
        if not is_signed and detected_sig_id:
            existing_sig_by_id = db.query(Signature).filter(Signature.sig_id == detected_sig_id).first()
            if existing_sig_by_id:
                is_signed = True
        
        audit_agent.log_action("UPLOAD", f"Processed file {file.filename}, hash: {doc_hash}, signed: {is_signed}")
        return DocumentHashResponse(
            doc_hash=doc_hash, 
            summary=summary, 
            is_signed=is_signed,
            suggested_places=suggested_places,
            legal_analysis=legal_analysis
        )
    except Exception as e:
        audit_agent.log_action("UPLOAD_ERROR", str(e))
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from services.pdf_service import pdf_service
from services.db_service import get_db, Signature
from agents.audit_agent import audit_agent
import json
from datetime import datetime

router = APIRouter()

@router.post("/stamp")
async def stamp_document(
    file: UploadFile = File(...),
    sig_id: str = Form(...),
    stamps: str = Form(...), # JSON string
    signature_data: str = Form(...), # JSON string
    db: Session = Depends(get_db)
):
    try:
        stamps_list = json.loads(stamps)
        sig_data_dict = json.loads(signature_data)
        
        # Save Signature to DB
        # Check if already exists (idempotency)
        existing_sig = db.query(Signature).filter(Signature.sig_id == sig_id).first()
        if not existing_sig:
            new_sig = Signature(
                sig_id=sig_data_dict['sig_id'],
                doc_hash=sig_data_dict.get('doc_hash'), # Might be missing if not passed, but frontend should pass it
                signer_email=sig_data_dict.get('signer_email'), # Need to ensure frontend passes this
                signature=sig_data_dict['signature'],
                timestamp=datetime.fromisoformat(sig_data_dict['timestamp']),
                summary=sig_data_dict.get('summary')
            )
            db.add(new_sig)
            db.commit()
            audit_agent.log_action("SAVE_SIG", f"Saved signature {sig_id} to DB")

        content = await file.read()
        user_image = sig_data_dict.get('user_image')
        stamped_pdf = pdf_service.stamp_pdf(content, sig_id, stamps_list, user_image)
        
        audit_agent.log_action("STAMP", f"Stamped PDF with {sig_id} on {len(stamps_list)} locations")
        
        return Response(
            content=stamped_pdf,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=signed_{file.filename}"}
        )
    except Exception as e:
        audit_agent.log_action("STAMP_ERROR", str(e))
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

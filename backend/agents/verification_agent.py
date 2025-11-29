from sqlalchemy.orm import Session
from services.crypto_service import crypto_service
from services.db_service import Signature
from models.signature_model import VerificationResponse

class VerificationAgent:
    def verify_by_id(self, db: Session, sig_id: str) -> VerificationResponse:
        """
        Verifies a signature by its ID.
        """
        record = db.query(Signature).filter(Signature.sig_id == sig_id).first()
        if not record:
            return VerificationResponse(valid=False)
            
        payload = f"{record.doc_hash}|{record.signer_email}|{record.timestamp.isoformat()}"
        
        is_valid = crypto_service.verify_signature(payload, record.signature)
        
        if is_valid:
            return VerificationResponse(
                valid=True,
                signer_email=record.signer_email,
                timestamp=record.timestamp,
                doc_hash=record.doc_hash,
                summary=record.summary
            )
        else:
            return VerificationResponse(valid=False)

    def verify_by_upload(self, db: Session, file_hash: str) -> str:
        """
        Checks if a file hash exists in the DB.
        """
        record = db.query(Signature).filter(Signature.doc_hash == file_hash).first()
        if record:
            return "VALID"
        else:
            return "TAMPERED"

verification_agent = VerificationAgent()

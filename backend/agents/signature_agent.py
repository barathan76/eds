from datetime import datetime
from sqlalchemy.orm import Session
from services.crypto_service import crypto_service
from services.db_service import Signature
from models.signature_model import SignatureResponse

class SignatureAgent:
    def process(self, db: Session, doc_hash: str, signer_email: str, summary: str | None = None, save: bool = True) -> SignatureResponse:
        """
        Signs the document hash. If save is True, saves metadata to DB.
        """
        timestamp = datetime.utcnow()
        # Payload format: doc_hash|signer_email|timestamp_iso
        payload = f"{doc_hash}|{signer_email}|{timestamp.isoformat()}"
        
        signature_b64 = crypto_service.sign_payload(payload)
        sig_id = crypto_service.generate_sig_id(signature_b64)
        
        if save:
            db_signature = Signature(
                sig_id=sig_id,
                doc_hash=doc_hash,
                signer_email=signer_email,
                signature=signature_b64,
                timestamp=timestamp,
                summary=summary
            )
            
            db.add(db_signature)
            db.commit()
            db.refresh(db_signature)
        
        return SignatureResponse(
            sig_id=sig_id,
            timestamp=timestamp,
            signature=signature_b64,
            summary=summary
        )

signature_agent = SignatureAgent()

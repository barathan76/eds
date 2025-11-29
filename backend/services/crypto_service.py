import os
import base64
import hashlib
import base58
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend

class CryptoService:
    def __init__(self):
        self.private_key = None
        self.public_key = None
        self.load_keys()

    def load_keys(self):
        # Try loading from env var first, then file
        private_key_pem = os.getenv("PRIVATE_KEY")
        if not private_key_pem:
            try:
                with open("private.pem", "rb") as f:
                    private_key_pem = f.read()
            except FileNotFoundError:
                print("Warning: private.pem not found and PRIVATE_KEY env var not set.")
                return

        if isinstance(private_key_pem, str):
            private_key_pem = private_key_pem.encode()

        self.private_key = serialization.load_pem_private_key(
            private_key_pem,
            password=None,
            backend=default_backend()
        )
        self.public_key = self.private_key.public_key()

    def sign_payload(self, payload: str) -> str:
        if not self.private_key:
            raise Exception("Private key not loaded")
        
        signature = self.private_key.sign(
            payload.encode(),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH,
            ),
            hashes.SHA256()
        )
        return base64.b64encode(signature).decode()

    def verify_signature(self, payload: str, signature_b64: str) -> bool:
        if not self.public_key:
            raise Exception("Public key not loaded")
            
        try:
            signature = base64.b64decode(signature_b64)
            self.public_key.verify(
                signature,
                payload.encode(),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH,
                ),
                hashes.SHA256()
            )
            return True
        except Exception as e:
            print(f"Verification failed: {e}")
            return False

    def generate_sig_id(self, signature_b64: str) -> str:
        signature = base64.b64decode(signature_b64)
        return base58.b58encode(hashlib.sha256(signature).digest()).decode()[:12]

crypto_service = CryptoService()

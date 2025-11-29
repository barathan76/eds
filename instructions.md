1. Project Overview

This MVP provides the essential features of a secure document signing system:

Upload a PDF document

Compute document hash (SHA-256)

Generate a digital signature using a server-held private RSA key

Create a short signature identifier (sig_id) for public lookup

Store signature metadata in a free PostgreSQL database

Verify document authenticity using sig_id or by uploading a PDF

Detect document tampering

All components should run on free-tier services:

Backend → Render.com Free Tier

Frontend → Vercel Free Tier

Database → Neon.tech PostgreSQL Free Tier

Optional Storage → Supabase Free Storage (if needed)

Agents run locally inside backend using Python

2. Technology Stack
Backend

Python FastAPI

Crypto library: cryptography

PostgreSQL (Neon)

Local RSA private key for demo signing

Agents implemented as Python modules

Frontend

Next.js or React + Vite

Simple UI for:

Upload & sign

Verify by sig_id

Verify by uploading PDF

Deployment

Backend: Render (free)

Frontend: Vercel (free)

Database: Neon (free)

3. Folder Structure

Antigravity should generate this:

/project-root
  /backend
    Dockerfile
    requirements.txt
    main.py
    /agents
      ingestion_agent.py
      signature_agent.py
      verification_agent.py
      audit_agent.py
    /services
      crypto_service.py
      db_service.py
      storage_service.py
    /models
      signature_model.py
    /routes
      upload.py
      sign.py
      verify.py
    /tests
  /frontend
    /app
      page.tsx
      upload-sign/page.tsx
      verify/page.tsx
      verify-upload/page.tsx
    package.json
    next.config.js
  INSTRUCTIONS.md
  README.md

4. Functional Requirements
4.1 Upload Document

Endpoint: POST /upload-document

Accepts a PDF file

Computes SHA-256 hash

Returns:

{
  "doc_hash": "<sha256>"
}

4.2 Sign Document

Endpoint: POST /sign
Body:

{
  "doc_hash": "...",
  "signer_email": "user@example.com"
}


Actions:

Build payload: doc_hash|signer_email|timestamp

Sign using RSA private key

Generate sig_id = first 12 chars of base58(sha256(signature))

Save metadata in database

Response:

{
  "sig_id": "...",
  "timestamp": "...",
  "signature": "<base64>"
}

4.3 Verify by Signature ID

Endpoint: GET /verify/{sig_id}
Returns:

{
  "valid": true/false,
  "signer_email": "...",
  "timestamp": "...",
  "doc_hash": "..."
}

4.4 Verify by Upload

Endpoint: POST /verify-upload

Recomputes hash

Matches with DB

Returns VALID → if matches

Returns TAMPERED → if mismatch

5. Cryptography Requirements
RSA Keypair

Generate locally:

openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem


Backend must load private key at startup from environment variable or file.

Signing Function

Use Python cryptography:

signature = private_key.sign(
    payload.encode(),
    padding.PSS(
        mgf=padding.MGF1(hashes.SHA256()),
        salt_length=padding.PSS.MAX_LENGTH,
    ),
    hashes.SHA256()
)

Signature ID
sig_id = base58.b58encode(hashlib.sha256(signature).digest()).decode()[:12]

6. Database Schema (Neon)
CREATE TABLE signatures (
  sig_id VARCHAR PRIMARY KEY,
  doc_hash VARCHAR NOT NULL,
  signer_email VARCHAR NOT NULL,
  signature TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

7. Agents Specification
IngestionAgent

Accept PDF → return SHA-256 hash

Optional metadata extraction

SignatureAgent

Build payload

Sign payload

Generate sig_id

Save to DB

VerificationAgent

Recompute hash (if file uploaded)

Validate signature

Respond VALID or TAMPERED

AuditAgent

Write logs to DB or console

Simple implementation for MVP

8. Backend Tasks for Antigravity

Create FastAPI app with:

/upload-document

/sign

/verify/{sig_id}

/verify-upload

Implement crypto service:

Load RSA private key

Functions:

sign_payload(payload)

verify_signature(payload, signature)

Implement DB service:

Connect using DATABASE_URL from Neon

Insert and query signature records

Integrate the four agents

Write minimal tests for hashing, signing, verifying

9. Frontend Tasks for Antigravity
Pages:

/upload-sign

/verify

/verify-upload

Features:
Upload & Sign

Upload PDF → call /upload-document

Show doc_hash

Click Sign → call /sign

Show sig_id

Verify

Input a sig_id → call /verify/{sig_id}

Verify by Upload

Upload PDF → backend checks hash → show result

Use fetch:
fetch(`${process.env.NEXT_PUBLIC_API}/upload-document`, {...})

10. Deployment Instructions
Backend → Render

Connect GitHub

Add environment vars:

DATABASE_URL=<neon_url>
PRIVATE_KEY=<full RSA private key>


Deploy

Frontend → Vercel

Add env var:

NEXT_PUBLIC_API=<render_backend_url>

Database → Neon

Create project

Run schema

Add connection string to backend

11. Testing Checklist

Upload PDF → correct hash

Sign document → returns valid sig_id

Verify sig_id → correct metadata

Upload same PDF → VALID

Upload tampered PDF → TAMPERED

End-to-end flow works after deployment

12. Project Completion Criteria

End-to-end signing and verification works

Deployments on free platforms

Basic agents implemented

README and architecture clear

Hackathon demo ready
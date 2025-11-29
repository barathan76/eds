import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
import base64

load_dotenv()

class GeminiAgent:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.available = False
        if self.api_key and self.api_key != "YOUR_API_KEY_HERE":
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-2.5-flash')
                self.available = True
            except Exception as e:
                print(f"Gemini Init Error: {e}")

    def analyze(self, text: str) -> dict:
        """Text-only analysis (legacy/fast)"""
        if not self.available:
            return None

        prompt = """
        You are a Legal Expert AI. Analyze the following contract text.
        
        Output a JSON object with this structure:
        {
            "summary_points": ["List of 3-5 key terms like duration, payment, jurisdiction"],
            "red_flags": ["List of potential risks like indefinite liability, non-compete, arbitration"],
            "risk_score": 0 (Integer 0-100, where 100 is high risk)
        }
        
        Do not use markdown formatting like ```json. Just return the raw JSON string.
        
        Contract Text:
        """ + text[:10000]

        try:
            response = self.model.generate_content(prompt)
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_text)
        except Exception as e:
            print(f"Gemini Analysis Error: {e}")
            return None

    def analyze_document(self, file_content: bytes, mime_type: str = "application/pdf") -> dict:
        """
        Analyzes a document (PDF/Image) for both Legal Risks AND Signature Locations.
        Returns a dict with 'legal_analysis' and 'suggested_places'.
        """
        if not self.available:
            return None

        prompt = """
        You are a Smart Document Intelligence Agent. Analyze this document in detail.

        1. **Classification**: Identify the document type (e.g., NDA, Employment Contract, Invoice, Lease, Unknown).
        2. **Executive Summary**: A concise paragraph explaining WHO is involved, WHAT the document is about, and its PURPOSE.
        3. **Entity Extraction**: Extract key metadata:
           - "parties": List of names/companies involved.
           - "effective_date": Start date (if found).
           - "monetary_value": Total value or payment terms (if found).
           - "jurisdiction": Governing law location.
        4. **Validity Check**: Does the document appear complete? Is it a draft? (Simple boolean/string assessment).
        5. **Legal Risks**: Identify red flags and risk score (0-100).
        6. **Signature Locations**: Find visual locations where a signature is EXPLICITLY required.
           Look for labels like "Sign Here", "Signature", "By:", "Authorized Signatory".
           Do NOT include general text containing "sign" (e.g., "design", "assignment") or just "Date" unless it is a field.
           Return bounding boxes in normalized coordinates (0-1000) for the signature line/box.
           Format: [ymin, xmin, ymax, xmax]

        Output a JSON object with this EXACT structure:
        {
            "document_type": "String",
            "executive_summary": "String",
            "entities": {
                "parties": ["Name 1", "Name 2"],
                "effective_date": "String or null",
                "monetary_value": "String or null",
                "jurisdiction": "String or null"
            },
            "validity_check": {
                "is_valid_format": true/false,
                "status": "Draft/Final/Signed/Unknown",
                "notes": "Brief comment"
            },
            "legal_analysis": {
                "summary_points": ["List of key terms"],
                "red_flags": ["List of risks"],
                "risk_score": 0
            },
            "suggested_places": [
                {
                    "page": 1,
                    "box_2d": [ymin, xmin, ymax, xmax],
                    "label": "Sign Here"
                }
            ]
        }

        Do not use markdown. Return raw JSON.
        """

        try:
            # Pass data inline (Gemini 1.5 supports this for reasonable sizes)
            response = self.model.generate_content([
                {'mime_type': mime_type, 'data': file_content},
                prompt
            ])
            
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_text)
        except Exception as e:
            print(f"Gemini Document Analysis Error: {e}")
            return None

gemini_agent = GeminiAgent()

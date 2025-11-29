import hashlib
import io
import re
from pypdf import PdfReader
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words
import nltk
from agents.legal_agent import legal_agent
from agents.gemini_agent import gemini_agent

# Removed Tesseract/Poppler dependencies as requested

# Download NLTK data (run once)
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
    nltk.download('punkt_tab')

class IngestionAgent:
    def process(self, file_content: bytes) -> tuple[str, str, str | None, list[dict], dict]:
        """
        Computes SHA-256 hash, generates summary, detects existing signature ID,
        finds suggested signature locations, and performs legal risk analysis.
        Returns (hash, summary, detected_sig_id, suggested_places, legal_analysis)
        """
        # Compute Hash
        doc_hash = hashlib.sha256(file_content).hexdigest()
        detected_sig_id = None
        suggested_places = []
        legal_analysis = {
            "summary_points": [],
            "red_flags": [],
            "risk_score": 0,
            "document_type": "Unknown",
            "executive_summary": "Analysis not available."
        }
        
        try:
            reader = PdfReader(io.BytesIO(file_content))
            text = ""
            
            # 1. Try Standard Text Extraction (Fast, Local)
            for i, page in enumerate(reader.pages):
                page_num = i + 1
                page_text = page.extract_text()
                text += page_text + "\n"
                
                # Visitor to find coordinates (Text based)
                def visitor_body(text, cm, tm, fontDict, fontSize):
                    if text and text.strip():
                        lower_text = text.lower()
                        # Strict keywords for signature fields
                        is_signature_field = (
                            "sign here" in lower_text or 
                            "signature" in lower_text or 
                            "by:" in lower_text or
                            "authorized signatory" in lower_text
                        )
                        
                        # Exclude common false positives
                        if is_signature_field:
                            if "design" in lower_text or "assignment" in lower_text or "significant" in lower_text:
                                is_signature_field = False

                        if is_signature_field:
                            if len(text) < 50: 
                                x = tm[4]
                                y = tm[5]
                                label = text.strip()
                                suggested_places.append({
                                    "page": page_num,
                                    "x": float(x),
                                    "y": float(y),
                                    "label": label
                                })

                page.extract_text(visitor_text=visitor_body)
            
            # 2. Detect Signature ID
            match = re.search(r"Signed:\s*([a-zA-Z0-9]+)", text)
            if match:
                detected_sig_id = match.group(1)

            # 3. Generate Summary
            if text.strip():
                parser = PlaintextParser.from_string(text, Tokenizer("english"))
                stemmer = Stemmer("english")
                summarizer = LsaSummarizer(stemmer)
                summarizer.stop_words = get_stop_words("english")
                
                summary_sentences = summarizer(parser.document, 3)
                summary = " ".join([str(s) for s in summary_sentences])
            else:
                summary = "No text extracted (Scanned Document)."

            # 4. Advanced Analysis (Gemini)
            # Use Gemini if available. It handles both text analysis AND visual detection (for scanned docs)
            if gemini_agent.available:
                print("Using Gemini for Advanced Analysis...")
                gemini_result = gemini_agent.analyze_document(file_content)
                
                if gemini_result:
                    # Flatten the result for easier frontend consumption
                    # gemini_result has keys: document_type, executive_summary, entities, validity_check, legal_analysis, suggested_places
                    
                    # 1. Extract core analysis
                    legal_analysis = {
                        "document_type": gemini_result.get("document_type", "Unknown"),
                        "executive_summary": gemini_result.get("executive_summary", "No summary provided."),
                        "entities": gemini_result.get("entities", {}),
                        "validity_check": gemini_result.get("validity_check", {}),
                        # Merge nested legal_analysis (risk score, red flags)
                        **gemini_result.get("legal_analysis", {})
                    }
                    
                    # 2. Update Suggested Places (if local failed or for better accuracy)
                    if "suggested_places" in gemini_result and (len(suggested_places) == 0 or len(text.strip()) < 100):
                        print("Using Gemini Visual Coordinates...")
                        for place in gemini_result["suggested_places"]:
                            p_num = place.get("page", 1)
                            box = place.get("box_2d", [0, 0, 0, 0]) # ymin, xmin, ymax, xmax (0-1000)
                            label = place.get("label", "Sign Here")
                            
                            # Convert 0-1000 to PDF Point coordinates
                            if p_num <= len(reader.pages):
                                page = reader.pages[p_num - 1]
                                pdf_w = float(page.mediabox.width)
                                pdf_h = float(page.mediabox.height)
                                
                                ymin, xmin, ymax, xmax = box
                                
                                # x = xmin * width / 1000
                                x_pdf = (xmin / 1000.0) * pdf_w
                                
                                # y = (1000 - ymax) * height / 1000  (Flip Y axis)
                                y_pdf = (1.0 - (ymax / 1000.0)) * pdf_h
                                
                                suggested_places.append({
                                    "page": p_num,
                                    "x": float(x_pdf),
                                    "y": float(y_pdf),
                                    "label": label
                                })

            elif text.strip():
                # Fallback to local heuristic if Gemini not available
                print("Gemini not available, using LegalAgent")
                legal_analysis = legal_agent.analyze(text)
                # Add default fields for intelligence
                legal_analysis["document_type"] = "Unknown (Local Analysis)"
                legal_analysis["executive_summary"] = summary
            else:
                legal_analysis["summary_points"].append("Could not analyze (Scanned doc & No Gemini Key).")

        except Exception as e:
            print(f"Ingestion Error: {e}")
            import traceback
            traceback.print_exc()
            summary = f"Error: {str(e)}"

        return doc_hash, summary, detected_sig_id, suggested_places, legal_analysis

ingestion_agent = IngestionAgent()

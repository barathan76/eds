import re

class LegalAgent:
    def analyze(self, text: str) -> dict:
        """
        Analyzes the contract text for key terms and red flags.
        """
        analysis = {
            "summary_points": [],
            "red_flags": [],
            "risk_score": 0 # 0-100
        }
        
        lower_text = text.lower()
        
        # 1. Term / Duration
        term_match = re.search(r"(term|duration) of this agreement shall be for a period of\s*(\d+\s*\w+)", lower_text)
        if term_match:
            analysis["summary_points"].append(f"Contract Duration: {term_match.group(2)}")
        
        # 2. Termination
        if "termination for convenience" in lower_text:
            analysis["summary_points"].append("Includes 'Termination for Convenience' clause (can be cancelled anytime).")
        elif "termination" in lower_text:
             analysis["summary_points"].append("Contains standard termination clauses.")

        # 3. Red Flags & Risks
        
        # Indefinite / Perpetual
        if "indefinite" in lower_text or "perpetual" in lower_text:
            if "license" not in lower_text: # Perpetual license is often okay, perpetual NDA is not
                analysis["red_flags"].append("Contains 'Indefinite' or 'Perpetual' obligations.")
                analysis["risk_score"] += 20
        
        # Non-Compete
        if "non-compete" in lower_text or "non compete" in lower_text:
            analysis["red_flags"].append("Contains a Non-Compete clause. Verify the duration and scope.")
            analysis["risk_score"] += 30
            
        # Jurisdiction
        if "jurisdiction" in lower_text:
            # Simple check for common remote jurisdictions (example)
            if "delaware" not in lower_text and "california" not in lower_text and "new york" not in lower_text:
                 analysis["summary_points"].append("Check Jurisdiction clause (might be a specific foreign state).")

        # Penalty / Liquidated Damages
        if "liquidated damages" in lower_text or "penalty" in lower_text:
            analysis["red_flags"].append("Contains 'Liquidated Damages' or 'Penalty' clauses.")
            analysis["risk_score"] += 15
            
        # Arbitration
        if "arbitration" in lower_text:
            analysis["summary_points"].append("Requires Arbitration (waives right to court trial).")
            
        # Indemnification
        if "indemnify" in lower_text or "hold harmless" in lower_text:
             analysis["summary_points"].append("Contains Indemnification obligations (you pay for their losses).")
             analysis["risk_score"] += 10

        # Cap Risk Score
        analysis["risk_score"] = min(analysis["risk_score"], 100)
        
        if not analysis["summary_points"] and not analysis["red_flags"]:
            analysis["summary_points"].append("No specific key terms detected. Standard review recommended.")

        return analysis

legal_agent = LegalAgent()

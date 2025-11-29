import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AuditAgent")

class AuditAgent:
    def log_action(self, action: str, details: str):
        """
        Logs an action to the console.
        """
        logger.info(f"ACTION: {action} | DETAILS: {details}")

audit_agent = AuditAgent()

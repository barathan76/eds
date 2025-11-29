# 🖋️ EDS - Intelligent Document Signing Platform

**EDS (Electronic Document Signing)** is a next-generation document signing platform powered by AI. It goes beyond simple e-signatures by providing deep document intelligence, legal risk analysis, and smart signature placement.

## 🚀 Key Features

### 🧠 Smart Document Intelligence (Powered by Gemini)
*   **Auto-Classification**: Automatically identifies document types (NDA, Invoice, Contract, etc.).
*   **Executive Summary**: Generates a concise summary of the document's purpose and parties involved.
*   **Entity Extraction**: Extracts key metadata like Effective Date, Monetary Value, and Jurisdiction.
*   **Validity Check**: Detects if the document is a draft or incomplete.

### ⚖️ Legal Eagle Risk Analysis
*   **Risk Scoring**: Assigns a risk score (0-100) to every document.
*   **Red Flag Detection**: Highlights potential risks like indefinite liability, non-compete clauses, or missing terms.
*   **Key Terms**: Summarizes critical legal terms for quick review.

### 🕵️ Smart Scout (Auto-Place)
*   **Visual Field Detection**: Uses AI to visually scan the document for "Sign Here", "Signature", or "By:" fields.
*   **Strict Filtering**: intelligently ignores false positives (like "design" or "assignment") to ensure accurate placement.
*   **One-Click Placement**: Automatically places your signature on all detected fields with a single click.

### ✍️ Signing Experience
*   **Digital ID**: Generate a unique digital signature ID.
*   **Custom Signatures**: Upload or draw your personal signature.
*   **Drag & Drop**: Manually place signatures anywhere on the document.
*   **Deferred Stamping**: Signatures are applied securely to the PDF upon download.

---

## 🛠️ Tech Stack

*   **Frontend**: Next.js 14 (React), Tailwind CSS, Lucide Icons, React-PDF.
*   **Backend**: FastAPI (Python), PyPDF, Sumy (NLP).
*   **AI Engine**: Google Gemini 1.5 Flash (via `google-generativeai`).
*   **Storage**: Local filesystem (Privacy focused).

---

## 📦 Installation & Setup

### Prerequisites
*   **Node.js** (v18+)
*   **Python** (v3.10+)
*   **Google Gemini API Key** (Get one [here](https://aistudio.google.com/app/apikey))

### 1. Clone the Repository
```bash
git clone <repository-url>
cd EDS
```

### 2. Backend Setup
Navigate to the backend folder and set up the Python environment.

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Configure API Key:**
1.  Open the `.env` file in the `backend` folder.
2.  Add your Gemini API Key:
    ```env
    GEMINI_API_KEY=your_actual_api_key_here
    ```

### 3. Frontend Setup
Navigate to the frontend folder and install Node dependencies.

```bash
cd ../frontend
npm install
```

---

## 🏃‍♂️ Running the Application

You need to run both the backend and frontend servers.

### Terminal 1: Backend
```bash
cd backend
.\venv\Scripts\activate
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

Open your browser and navigate to **http://localhost:3000**.

---

## 📖 Usage Guide

1.  **Upload**: Drag & drop a PDF document.
2.  **Analyze**: Wait a moment for the **Document Intelligence** card to appear. Review the summary, risks, and extracted entities.
3.  **Sign**:
    *   Enter your email.
    *   Click **Generate Signature**.
4.  **Place**:
    *   If signature fields are detected, click **Auto-Place** to fill them instantly.
    *   Or, click **Add My Signature** / **Add Digital ID** and drag them to the desired spot.
5.  **Download**: Click **Finish & Download** to get your signed PDF.

---

## 🔒 Privacy Note
This application processes documents locally or sends them securely to the Gemini API for analysis (if configured). No documents are permanently stored on external servers by default.

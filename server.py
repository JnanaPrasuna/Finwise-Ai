import os
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
import requests

try:
    import anthropic
except ImportError:
    anthropic = None

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
except ImportError:
    service_account = None
    build = None

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="FinWise AI Backend Platform")

# CORS middleware configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "sheets_db.json"
SETTINGS_FILE = "settings.json"

# Models
class SettingsSchema(BaseModel):
    anthropic_api_key: str
    spreadsheet_id: str
    google_credentials_json: str

class ApplicationRequest(BaseModel):
    name: str
    salary: float
    credit_score: int
    existing_emi: float
    loan_amount: float
    tenure: int # in months

class AdviceRequest(BaseModel):
    query: str
    credit_score: Optional[int] = None
    salary: Optional[float] = None
    existing_emi: Optional[float] = None

# Helper to read/write settings
def load_settings():
    default_settings = {
        "anthropic_api_key": os.environ.get("ANTHROPIC_API_KEY", ""),
        "spreadsheet_id": os.environ.get("SPREADSHEET_ID", ""),
        "google_credentials_json": os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
    }
    if not os.path.exists(SETTINGS_FILE):
        return default_settings
    try:
        with open(SETTINGS_FILE, "r") as f:
            data = json.load(f)
            # Merge with defaults or env if not set
            for k in default_settings:
                if not data.get(k):
                    data[k] = default_settings[k]
            return data
    except Exception:
        return default_settings

def save_settings(data):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(data, f, indent=4)

# Helper to read/write JSON applications
def load_applications():
    if not os.path.exists(DB_FILE):
        return []
    try:
        with open(DB_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_applications(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)

# Seed initial mock data if empty
DEFAULT_APPLICATIONS = [
    {
        "timestamp": "2026-07-06 10:15:30",
        "name": "Prasanna Kumar",
        "salary": 45000.0,
        "credit_score": 730,
        "existing_emi": 0.0,
        "loan_amount": 900000.0,
        "status": "Approved",
        "risk": "Low",
        "reasoning": [
            "Application approved based on stable Debt-to-Income (DTI) ratio of 37.6%.",
            "Your credit score of 730 qualifies you for a competitive interest rate of 10.5%."
        ],
        "synced": False
    },
    {
        "timestamp": "2026-07-06 11:22:45",
        "name": "High Risk Applicant",
        "salary": 22000.0,
        "credit_score": 620,
        "existing_emi": 18000.0,
        "loan_amount": 500000.0,
        "status": "Rejected",
        "risk": "High",
        "reasoning": [
            "High Debt-to-Income (DTI) ratio of 132.4%. Existing EMIs consume too much of your income.",
            "Credit score (620) is below our standard threshold of 650, indicating high repayment risk.",
            "Explore our Credit Score Analyzer or AI Financial Tips sections for improvement advice."
        ],
        "synced": False
    },
    {
        "timestamp": "2026-07-06 12:05:12",
        "name": "Amit Sharma",
        "salary": 65000.0,
        "credit_score": 580,
        "existing_emi": 5000.0,
        "loan_amount": 300000.0,
        "status": "Rejected",
        "risk": "High",
        "reasoning": [
            "Credit score (580) is below our standard threshold of 650, indicating high repayment risk.",
            "Please explore the Credit Score Analyzer for actionable guidance on rebuilding your score."
        ],
        "synced": False
    }
]

def init_db():
    if not os.path.exists(DB_FILE) or os.path.getsize(DB_FILE) == 0:
        save_applications(DEFAULT_APPLICATIONS)

init_db()

# Rules-Engine Calculator
def calculate_eligibility(req: ApplicationRequest, settings: dict) -> dict:
    salary = req.salary
    credit_score = req.credit_score
    existing_emi = req.existing_emi
    loan_amount = req.loan_amount
    tenure = req.tenure

    # 1. Determine interest rate based on credit score
    if credit_score >= 750:
        rate = 9.5
    elif credit_score >= 700:
        rate = 10.5
    elif credit_score >= 650:
        rate = 12.0
    elif credit_score >= 600:
        rate = 14.5
    else:
        rate = 18.0

    # 2. Calculate Proposed EMI
    r = (rate / 100.0) / 12.0
    n = tenure
    if r > 0:
        proposed_emi = loan_amount * r * ((1 + r) ** n) / (((1 + r) ** n) - 1)
    else:
        proposed_emi = loan_amount / tenure
    
    proposed_emi = round(proposed_emi, 2)

    # 3. Calculate DTI (Debt-To-Income)
    dti_pct = ((existing_emi + proposed_emi) / salary) * 100.0
    dti_pct = round(dti_pct, 2)

    # Max allowed DTI is 50%
    max_dti = 50.0

    # 4. Eligibility Decision
    status = "Approved"
    reasons = []

    # Rejection triggers
    if credit_score < 630:
        status = "Rejected"
        reasons.append(f"Credit score ({credit_score}) is below our standard threshold of 630, indicating high default risk.")
    
    if dti_pct > max_dti:
        status = "Rejected"
        reasons.append(f"High Debt-to-Income (DTI) ratio of {dti_pct}%. Existing and proposed EMIs consume too much of your monthly income.")

    # 5. Risk classification
    if status == "Rejected":
        risk = "High"
    else:
        if credit_score >= 720 and dti_pct <= 45.0:
            risk = "Low"
        elif credit_score >= 680 and dti_pct <= 50.0:
            risk = "Medium"
        else:
            risk = "High"

    # 6. Max Eligible Loan computation
    # Cap max EMI limit at 50% of income minus existing EMIs
    max_allowed_emi = max(0.0, (salary * 0.5) - existing_emi)
    if max_allowed_emi <= 0 or credit_score < 630:
        max_loan = 0.0
    else:
        if r > 0:
            max_loan = max_allowed_emi * (((1 + r) ** n) - 1) / (r * ((1 + r) ** n))
        else:
            max_loan = max_allowed_emi * n
        # Cap max loan at 20 times the monthly salary
        max_loan = min(max_loan, salary * 20.0)
        max_loan = round(max_loan, 0)
    
    # Generate reasoning (via Claude or Local System)
    anthropic_key = settings.get("anthropic_api_key")
    if anthropic_key and anthropic and len(anthropic_key.strip()) > 10:
        try:
            client = anthropic.Anthropic(api_key=anthropic_key)
            prompt = f"""
            You are a financial advisor at FinWise AI. Evaluate a loan application with the following details:
            - Applicant Name: {req.name}
            - Monthly Income: ₹{salary:,.2f}
            - Credit Score: {credit_score}
            - Existing Monthly EMIs: ₹{existing_emi:,.2f}
            - Requested Loan Amount: ₹{loan_amount:,.2f}
            - Loan Tenure: {tenure} months

            Calculated Metrics:
            - Applicable Interest Rate: {rate}%
            - Proposed Monthly EMI: ₹{proposed_emi:,.2f}
            - Proposed Debt-to-Income (DTI) Ratio: {dti_pct:.1f}%
            - Calculated Application Status: {status}
            - Risk Classification: {risk}
            - Calculated Maximum Eligible Loan Amount: ₹{max_loan:,.2f}

            Provide 2 to 3 concise, highly professional financial evaluation sentences (without asterisks, list bullets, or prefix markers; just return the plain sentences separated by newlines) explaining this decision. Mention the key metrics in your explanation to build user trust.
            """
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=250,
                temperature=0.2,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            text_lines = response.content[0].text.strip().split("\n")
            reasons_ai = [l.strip().lstrip("-*• ").strip() for l in text_lines if len(l.strip()) > 5]
            if reasons_ai:
                reasons = reasons_ai
        except Exception as e:
            # Fallback to local on error
            pass

    # Local fallback reasoning if Claude is not configured or failed
    if not reasons:
        if status == "Approved":
            reasons.append(f"Application approved based on stable Debt-to-Income (DTI) ratio of {dti_pct:.1f}%.")
            if credit_score >= 750:
                reasons.append(f"Your excellent credit score of {credit_score} qualifies you for our best interest rate of {rate:.1f}%.")
            else:
                reasons.append(f"Your credit score of {credit_score} qualifies you for a competitive rate of {rate:.1f}%.")
            
            buffer = salary - (existing_emi + proposed_emi)
            if buffer > 0:
                reasons.append(f"After meeting all EMIs, you retain a monthly cash reserve of ₹{buffer:,.0f}.")
        else:
            if not any("Credit score" in r for r in reasons):
                if credit_score < 630:
                    reasons.append(f"Credit score ({credit_score}) is below our standard threshold of 630, indicating high repayment risk.")
            if not any("DTI" in r for r in reasons):
                if dti_pct > max_dti:
                    reasons.append(f"High Debt-to-Income (DTI) ratio of {dti_pct:.1f}%. Existing EMIs consume too much of your income.")
            reasons.append("Explore our Credit Score Analyzer or AI Financial Tips sections for structured improvement advice.")

    return {
        "status": status,
        "risk": risk,
        "dti": dti_pct,
        "interest_rate": rate,
        "proposed_emi": proposed_emi,
        "eligible_loan": max_loan,
        "reasoning": reasons
    }

# API Endpoints
@app.get("/api/settings")
def get_settings():
    settings = load_settings()
    # Mask API key for client UI
    masked = settings.copy()
    key = masked.get("anthropic_api_key", "")
    if len(key) > 8:
        masked["anthropic_api_key"] = f"{key[:4]}...{key[-4:]}"
    else:
        masked["anthropic_api_key"] = ""
    
    creds = masked.get("google_credentials_json", "")
    if len(creds) > 10:
        masked["google_credentials_json"] = "Service Account Credentials Configured"
    else:
        masked["google_credentials_json"] = "Not Configured"
    return masked

@app.post("/api/settings")
def post_settings(req: SettingsSchema):
    current = load_settings()
    
    # Only update if the user pasted a new key (not the masked placeholder or visual configuration indicator)
    new_key = req.anthropic_api_key.strip()
    if new_key and not new_key.startswith("..."):
        current["anthropic_api_key"] = new_key
    
    new_sheet = req.spreadsheet_id.strip()
    current["spreadsheet_id"] = new_sheet

    new_creds = req.google_credentials_json.strip()
    if new_creds and new_creds != "Service Account Credentials Configured" and new_creds != "Not Configured":
        current["google_credentials_json"] = new_creds

    save_settings(current)
    return {"status": "success", "message": "Settings updated successfully."}

@app.get("/api/applications")
def get_applications():
    return load_applications()

@app.post("/api/check-eligibility")
def check_eligibility(req: ApplicationRequest):
    settings = load_settings()
    result = calculate_eligibility(req, settings)
    
    # Store locally
    apps = load_applications()
    record = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "name": req.name,
        "salary": req.salary,
        "credit_score": req.credit_score,
        "existing_emi": req.existing_emi,
        "loan_amount": req.loan_amount,
        "status": result["status"],
        "risk": result["risk"],
        "reasoning": result["reasoning"],
        "synced": False
    }
    apps.insert(0, record) # Add to top
    save_applications(apps)
    
    return result

@app.post("/api/sync")
def sync_database():
    settings = load_settings()
    spreadsheet_id = settings.get("spreadsheet_id", "").strip()
    creds_json = settings.get("google_credentials_json", "").strip()
    
    apps = load_applications()
    unsynced = [a for a in apps if not a.get("synced", False)]
    
    if not unsynced:
        return {"status": "info", "message": "No new applications to synchronize."}
        
    # Attempt real Google Sheets sync
    if spreadsheet_id and creds_json and service_account and build:
        try:
            creds_dict = json.loads(creds_json)
            creds = service_account.Credentials.from_service_account_info(
                creds_dict, scopes=['https://www.googleapis.com/auth/spreadsheets']
            )
            service = build('sheets', 'v4', credentials=creds)
            sheet = service.spreadsheets()
            
            # Prepare rows
            values = []
            for app_rec in unsynced:
                values.append([
                    app_rec["timestamp"],
                    app_rec["name"],
                    app_rec["salary"],
                    app_rec["credit_score"],
                    app_rec["existing_emi"],
                    app_rec["loan_amount"],
                    app_rec["status"],
                    app_rec["risk"],
                    "; ".join(app_rec["reasoning"])
                ])
            
            body = {'values': values}
            # Append rows below header
            sheet.values().append(
                spreadsheetId=spreadsheet_id,
                range="Sheet1!A2",
                valueInputOption="USER_ENTERED",
                body=body
            ).execute()
            
            # Mark synced
            for app_rec in apps:
                app_rec["synced"] = True
            save_applications(apps)
            
            return {"status": "success", "message": f"Successfully synchronized {len(unsynced)} records to Google Sheets."}
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Google Sheets Sync failed: {str(e)}")
    else:
        # Mock Sync Fallback
        for app_rec in apps:
            app_rec["synced"] = True
        save_applications(apps)
        return {
            "status": "success", 
            "message": f"Mock Synchronization complete. {len(unsynced)} records marked as synced locally. (Setup Google Credentials in settings for real integration)"
        }

@app.post("/api/ai-tips")
def get_ai_tips(req: AdviceRequest):
    settings = load_settings()
    anthropic_key = settings.get("anthropic_api_key", "").strip()
    
    # 1. Real Claude Response if key is set
    if anthropic_key and anthropic and len(anthropic_key) > 10:
        try:
            client = anthropic.Anthropic(api_key=anthropic_key)
            
            financial_context = ""
            if req.credit_score:
                financial_context += f"Applicant credit score: {req.credit_score}. "
            if req.salary:
                financial_context += f"Monthly Salary: ₹{req.salary:,.0f}. "
            if req.existing_emi:
                financial_context += f"Existing EMI: ₹{req.existing_emi:,.0f}. "
                
            prompt = f"""
            You are FinWise AI, an expert, friendly financial advisor. A user asks the following:
            "{req.query}"
            
            User Context: {financial_context}
            
            Provide structured, actionable financial advisory tips. Focus on specific steps (e.g. debt reduction, utilization ratio, emergency funds). Keep the tone encouraging, objective, and expert. Avoid generic disclaimers where possible and keep the length under 250 words. Format with clear subheadings or lists.
            """
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=400,
                temperature=0.3,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return {"advice": response.content[0].text.strip()}
        except Exception as e:
            # Fallback to local on error
            pass

    # 2. Local rule-based advisory response fallback
    query_lower = req.query.lower()
    score = req.credit_score or 650
    salary = req.salary or 30000
    emi = req.existing_emi or 0
    
    if "credit" in query_lower or "score" in query_lower or "improve" in query_lower:
        advice = f"""### AI Credit Score Rebuilding Roadmap
Your current score is **{score}** (classified as **{"Poor" if score < 630 else "Fair" if score < 700 else "Good" if score < 750 else "Excellent"}**). Here are structured steps to improve it:

1. **Lower Credit Utilization**: Keep your credit card balances below **30%** of your total limit. Paying balances off twice a month helps report lower utilization.
2. **Automate Payments**: Payment history accounts for **35%** of your credit score. Set up autopay for all credit card bills and utilities to prevent single late payment listings.
3. **Audit Credit Reports**: Check for errors (e.g. incorrect balances, closed accounts showing active) and file disputes if any discrepancy is found.
4. **Avoid Credit Spree**: Refrain from applying for multiple new credit cards or loans within a short span, as this triggers "hard inquiries" which lower your score.
5. **Keep Old Cards Open**: The length of your credit history counts for **15%**. Retain old cards with zero balance to maintain a high average credit age."""
    elif "debt" in query_lower or "emi" in query_lower or "consolidate" in query_lower:
        dti = (emi / salary) * 100 if salary > 0 else 0
        advice = f"""### AI Debt Optimization & EMI Advisory
With a current EMI of **₹{emi:,.0f}** and income of **₹{salary:,.0f}** (DTI ratio: **{dti:.1f}%**), here is your structured debt management strategy:

1. **The Snowball Method**: List all debt from smallest to largest. Pay the minimums on all and put any extra cash toward clearing the smallest balance first. This builds psychological momentum.
2. **The Avalanche Method**: Pay off high-interest debts first (e.g., credit card debt at 24%+ or personal loans at 18%). This mathematically saves the most interest money.
3. **EMI Consolidation**: Look into a debt consolidation personal loan at a lower interest rate (typically 10.5%-12.0%) to pay off multiple high-interest cards, leaving you with a single, lower monthly EMI.
4. **DTI Goal**: Aim to reduce your fixed EMI obligations below **35%** of your monthly income before applying for major credit lines."""
    elif "budget" in query_lower or "save" in query_lower or "invest" in query_lower:
        savings_target = salary * 0.2
        advice = f"""### Smart Wealth & Budgeting Blueprint
For a monthly salary of **₹{salary:,.0f}**, we recommend adopting the **50/30/20 Budgeting Rule**:

1. **50% Needs (₹{salary*0.5:,.0f})**: Allocate for rent, utilities, food, groceries, and existing mandatory EMIs.
2. **30% Wants (₹{salary*0.3:,.0f})**: Spend on leisure, dining out, and hobbies.
3. **20% Savings & Investing (₹{savings_target:,.0f})**: Direct this portion to:
   - **Emergency Fund**: Secure 3 to 6 months of living expenses in a high-yield liquid account.
   - **High-Yield Instruments**: Once the emergency fund is ready, allocate toward Mutual Funds, Index Funds, or PPF to build long-term inflation-beating wealth."""
    else:
        advice = f"""### FinWise AI General Financial Advisory
Based on your parameters (Salary: ₹{salary:,.0f}, Credit Score: {score}, EMI: ₹{emi:,.0f}), here is your high-level advisory:

1. **Financial Health Ratio**: Your Debt-to-Income (DTI) ratio is **{((emi/salary)*100.0) if salary > 0 else 0:.1f}%**. Keeping this below **40%** is essential for maintaining liquidity.
2. **Emergency Preparedness**: Aim to accumulate at least ₹{(salary * 3):,.0f} as liquid emergency cash.
3. **Intelligent Credit Access**: Always check eligibility prior to formal applications to avoid negative credit impacts from rejections."""
        
    return {"advice": advice}

@app.post("/api/reset")
def reset_database():
    save_applications(DEFAULT_APPLICATIONS)
    return DEFAULT_APPLICATIONS

# Mount static files
app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)

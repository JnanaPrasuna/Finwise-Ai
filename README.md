# 💰 FinWise AI – Intelligent Loan Eligibility & Financial Advisory Platform

FinWise AI is an AI-powered financial assistant that helps users evaluate loan eligibility, analyze credit scores, calculate EMI, and receive personalized financial guidance. The platform combines an interactive frontend with a FastAPI backend and AI-powered recommendations to create a modern digital banking experience.

---

## 🚀 Features

- ✅ Loan Eligibility Checker
- 📊 Credit Score Analyzer
- 💳 EMI Calculator with Repayment Schedule
- 🤖 AI Financial Advisor
- 📈 Interactive Financial Dashboard
- 🎨 Modern Responsive UI
- 🔊 Audio Feedback for User Actions
- ☁️ Google Sheets Integration
- 🔐 FastAPI Backend with REST APIs

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)

### Backend
- Python
- FastAPI
- Uvicorn

### AI & APIs
- Anthropic Claude API
- Google Sheets API

---

## 📁 Project Structure

```
FinWise-Ai/
│
├── index.html              # Main frontend
├── style.css               # Styling
├── app.js                  # Frontend logic
├── server.py               # FastAPI backend
├── requirements.txt        # Python dependencies
├── demo_guide.md           # Demo recording guide
├── dist/                   # Production build
└── README.md
```

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/FinWise-AI.git
cd FinWise-AI
```

### 2. Create a Virtual Environment

Windows

```bash
python -m venv venv
venv\Scripts\activate
```

Linux/Mac

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## ▶️ Running the Project

Start the backend server:

```bash
uvicorn server:app --reload
```

The backend will run at:

```
http://127.0.0.1:8000
```

Open `index.html` in your browser or serve it using any local web server.

---

## 🔑 Environment Configuration

The application supports the following configuration values:

- `ANTHROPIC_API_KEY`
- `SPREADSHEET_ID`
- `GOOGLE_APPLICATION_CREDENTIALS`

These can be supplied through environment variables or application settings.

---

## 📌 Main Modules

### 1. Loan Eligibility Checker

Evaluates a user's loan eligibility using:

- Monthly Salary
- Credit Score
- Existing EMI
- Loan Amount
- Loan Tenure

Returns:

- Approval Status
- Risk Level
- Maximum Eligible Loan Amount

---

### 2. Credit Score Analyzer

Provides:

- Credit Rating
- Score Visualization
- Score Impact Factors
- Personalized Suggestions

---

### 3. EMI Calculator

Calculates:

- Monthly EMI
- Total Interest
- Total Payment
- Complete Repayment Schedule

---

### 4. AI Financial Advisor

Uses Anthropic Claude API to answer financial questions and provide personalized financial advice based on user inputs.

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Home |
| POST | `/settings` | Save application settings |
| POST | `/loan` | Loan eligibility prediction |
| POST | `/advice` | AI financial advice |

---

## 📷 Screenshots

You can add screenshots here.

```
screenshots/
    home.png
    loan-checker.png
    credit-analyzer.png
    emi-calculator.png
```

---

## 📦 Dependencies

- FastAPI
- Uvicorn
- Requests
- Anthropic SDK
- Google API Python Client
- Google Authentication Libraries

Install them using:

```bash
pip install -r requirements.txt
```

---

## 🎯 Future Improvements

- User Authentication
- Loan Comparison
- Multiple Bank Integration
- PDF Report Generation
- Financial Goal Tracking
- Investment Recommendations
- Dashboard Analytics
- Cloud Deployment

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push the branch.
5. Open a Pull Request.

---

## 📄 License

This project is intended for educational and demonstration purposes.

---

## 👨‍💻 Authors

Developed as an AI-powered financial advisory platform using FastAPI, JavaScript, and modern web technologies.

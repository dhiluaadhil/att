# Employee Daily Pay Automation

Automates daily employee pay calculation (Work Hours × ₹250), PDF receipt generation, Meta WhatsApp dispatch to management, and dashboard visualization.

---

## Workspace Structure

```
project/
├── backend/                         # FastAPI Backend
│   ├── main.py                      # FastAPI App Entrypoint
│   ├── config.py                    # Environment settings loader
│   ├── models.py                    # SQLAlchemy database models
│   ├── database.py                  # Database connection, migrations & admin seeder
│   ├── auth.py                      # Hashing & JWT functions
│   ├── services/
│   │   ├── parser.py                # Parse and validate form inputs
│   │   ├── calculator.py            # Pay calculator (hours * rate)
│   │   ├── pdf_generator.py         # ReportLab PDF receipt generator
│   │   └── whatsapp_client.py       # WhatsApp Cloud API client
│   └── routers/
│       ├── submit.py                # POST /api/submit-daily
│       ├── dashboard.py             # GET submissions, calculations, summaries
│       └── auth.py                  # POST /api/auth/login
│
├── frontend/                        # React + Vite Dashboard
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx           # Sticky Top Navigation Bar
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx        # Premium Login Page
│   │   │   ├── DashboardHome.jsx    # Stats Overview & Feed
│   │   │   ├── SubmissionsTable.jsx # Filterable Raw Logs Table
│   │   │   ├── CalculationsTable.jsx# Mapped Pay Audit Table
│   │   │   ├── ReportsPage.jsx      # PDF Logs & Resend Utility
│   │   │   └── FlowTimeline.jsx     # Visual Vertical Pipeline Timeline
│   │   ├── api.js                   # Axios HTTP client with JWT interceptors
│   │   ├── App.jsx                  # React router mapping
│   │   └── index.css                # Base stylesheet importing Tailwind CSS
│   ├── vite.config.js               # Proxy setup to port 8000
│   └── package.json                 # Dependency tree
│
├── google_apps_script.js            # Apps Script for Google Forms
└── README.md                        # Documentation
```

---

## Getting Started

### 1. Database & Backend Configuration

A SQLite fallback is automatically active for local development. If PostgreSQL is not running or the URL is incorrect, it creates a local SQLite file (`backend/automation_db.db`) transparently so the server runs without errors.

To configure PostgreSQL or customize credentials, check the `backend/.env` file:
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/automation_db

# WhatsApp Cloud API (Meta Sandbox)
WHATSAPP_ACCESS_TOKEN=EAATCkXyp...
WHATSAPP_PHONE_NUMBER_ID=1139995969204170
BOSS_WHATSAPP_NUMBER=+918925245191
```

### 2. Start the Backend

1. Navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
3. Access the interactive API Swagger UI at:
   [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Start the Frontend

1. Navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Start the Vite React development server:
   ```bash
   npm run dev
   ```
3. Access the dashboard in your browser:
   [http://localhost:5173](http://localhost:5173)

---

## Administrative Login Credentials

The database is seeded automatically with a default admin user on startup:
* **Username**: `admin`
* **Password**: `adminpassword123`

*(Note: JWT credentials expire after 24 hours. If logged out, simply sign in again.)*

---

## Local Verification / Mock Submit

To verify the calculator, database logging, PDF receipt generation, and WhatsApp dispatch, you can trigger a mock post using the Swagger interface, or submit a local curl command:
```bash
curl -X POST http://localhost:8000/api/submit-daily \
  -H "Content-Type: application/json" \
  -d '{"name": "Raj Kumar", "work_hours": 8, "expenditure": 500, "invoice_total": 25000}'
```

The system will:
1. Parse the employee input.
2. Log the raw submission in the database.
3. Compute payment: `8 hours * 250 = ₹2,000`.
4. Generate a styled PDF receipt in `backend/reports/`.
5. Dispatch the SMS message and PDF document to the WhatsApp target.
6. Return a success JSON message containing the database calculation ID.

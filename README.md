# PSFGS - Public Sector Financial Governance Suite
## Amathole District Municipality

A purpose-built web application for managing governance matters at Amathole District Municipality, addressing persistent AGSA audit findings and improving financial controls.

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Backend API | Python FastAPI |
| Database | MySQL 8.x |
| Authentication | OAuth 2.0 / JWT with bcrypt |
| AI Engine | Anthropic Claude API (integration-ready) |

## Application Modules (16 Applications)

### Domain A - Audit Readiness
- **AFT** - Audit Findings Tracker: Track, assign, and remediate AGSA findings
- **AVS** - Asset Verification System: GRAP-17 compliant FAR with mobile verification
- **PYT** - Prior Year Closure Tracker: Ensure prior-year findings are closed
- **ARR** - AG Response Manager: Manage AG management letter responses

### Domain B - Financial Control
- **BVM** - Budget vs Actual Monitor: Real-time budget utilisation tracking
- **IFW** - IFWE Register: Statutory register for irregular, fruitless & wasteful expenditure
- **CFF** - Cash Flow Forecasting: Liquidity management and projections
- **PSA** - Procurement Spend Analytics: Spend pattern analysis and anomaly detection

### Domain C - Reporting & BI
- **S71** - Section 71 Auto-Generator: Automated monthly budget reports
- **ARD** - Annual Report Auto-Drafter: Section 121 compliant annual reports
- **PKD** - Performance KPI Dashboard: SMART target tracking with traffic lights
- **ERP** - Executive Reporting Portal: Consolidated governance dashboard

### Domain D - Compliance & Risk
- **SCC** - SCM Compliance Checker: Pre-transaction compliance verification
- **CMT** - Consequence Management Tracker: Financial misconduct case management
- **DAR** - Delegation of Authority Register: Track delegated powers and limits
- **PCR** - Policy Compliance Manager: Policy lifecycle management

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL 8.0+

### 1. Database Setup

```bash
# Connect to MySQL and run the init script
mysql -u root -p"mysql#1" < database/init.sql
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
# Start the API server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Default Login Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@amathole.gov.za | Admin@2026! | System Admin |
| cfo@amathole.gov.za | Admin@2026! | CFO |
| mm@amathole.gov.za | Admin@2026! | Accounting Officer |
| scm@amathole.gov.za | Admin@2026! | Manager (SCM) |
| audit@amathole.gov.za | Admin@2026! | Auditor |

## Docker Deployment

```bash
docker-compose up -d
```

This starts MySQL, the FastAPI backend, and the React frontend. The database is automatically initialised with the schema and seed data.

## Project Structure

```
psfgs-app/
├── database/
│   └── init.sql              # MySQL schema + seed data (all 16 modules)
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application entry point
│   │   ├── config.py         # Settings (DB, JWT, etc.)
│   │   ├── database.py       # SQLAlchemy engine and session
│   │   ├── models/           # SQLAlchemy ORM models (all 16 modules)
│   │   ├── routers/          # API route handlers
│   │   │   ├── auth.py       # Login, JWT, password management
│   │   │   ├── dashboard.py  # Executive dashboard summary
│   │   │   ├── aft.py        # Audit Findings Tracker
│   │   │   ├── ifw.py        # IFWE Register
│   │   │   ├── bvm.py        # Budget vs Actual Monitor
│   │   │   ├── scc.py        # SCM Compliance Checker
│   │   │   └── modules.py    # AVS, CMT, DAR, PCR, S71, PKD, ERP
│   │   └── utils/
│   │       └── auth.py       # JWT + bcrypt utilities
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main app with routing
│   │   ├── components/
│   │   │   └── Sidebar.tsx   # Navigation sidebar (4 domains)
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx          # Executive dashboard
│   │   │   ├── AuditFindings.tsx      # AFT module
│   │   │   ├── IFWERegister.tsx       # IFW module
│   │   │   ├── BudgetMonitor.tsx      # BVM module
│   │   │   ├── SCMCompliance.tsx      # SCC module
│   │   │   ├── AssetVerification.tsx  # AVS module
│   │   │   ├── ConsequenceManagement.tsx  # CMT module
│   │   │   ├── DelegationAuthority.tsx    # DAR module
│   │   │   ├── PolicyCompliance.tsx       # PCR module
│   │   │   ├── Section71.tsx              # S71 module
│   │   │   ├── PerformanceKPI.tsx         # PKD module
│   │   │   └── ExecutivePortal.tsx        # ERP module
│   │   ├── services/
│   │   │   └── api.ts        # Axios API client (all endpoints)
│   │   └── index.css         # Global styles
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Authenticate user |
| GET | /api/auth/me | Get current user |
| GET | /api/dashboard/summary | Executive dashboard data |
| GET | /api/aft/findings | List audit findings |
| POST | /api/aft/findings | Create new finding |
| PUT | /api/aft/findings/{id} | Update finding status |
| GET | /api/ifw/items | List IFWE items |
| POST | /api/ifw/items | Register IFWE item |
| GET | /api/bvm/budgets | List budgets with expenditure |
| GET | /api/scc/requisitions | List procurement requisitions |
| POST | /api/scc/requisitions/{id}/check | Run compliance check |
| GET | /api/avs/assets | List fixed assets |
| GET | /api/cmt/cases | List misconduct cases |
| GET | /api/dar/delegations | List delegations |
| GET | /api/pcr/policies | List policies |
| GET | /api/s71/reports | List Section 71 reports |
| GET | /api/pkd/kpis | List performance KPIs |
| GET | /api/erp/metrics | Executive metrics |

## Seed Data (Amathole DM)

The database is pre-loaded with realistic data based on ADM's actual audit history:
- 6 financial years of audit data (2018/19 - 2023/24) - all Qualified
- 12 sample audit findings for 2023/24 (including 9 repeat findings)
- 8 IFWE items totalling R1.05 billion
- 8 budget votes for FY 2024/25 (R949M total)
- 5 SCM requisitions with compliance check results
- 3 consequence management cases
- 3 delegations of authority
- 6 municipal policies
- 9 SCM compliance rules
- 7 sample users across 8 directorates

## Security Features

- JWT-based authentication with configurable expiry
- bcrypt password hashing
- Role-based access control (8 roles)
- CORS protection
- Immutable audit trail for all data changes
- Multi-tenant architecture (entity_id partitioning)

---

Developed by **Glance Management Technologies (Pty) Ltd**
Eastern Cape, South Africa | www.glancemanagementtechnologies.co.za

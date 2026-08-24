# FixoBoard - Manufacturing Management System (MMS)

<div align="center">

![FixoBoard Banner](https://img.shields.io/badge/FixoBoard-Manufacturing%20Execution%20System-blue?style=for-the-badge&logo=react)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0+-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

**Enterprise-grade, domain-driven manufacturing execution, AI telemetry, and commercial operating system designed specifically for Lead-Free PVC/WPC Foam Boards, Solid WPC Doors, and Architectural Extrusions.**

[Live Architecture](#-system-architecture) • [Features](#-core-features--capabilities) • [Quickstart](#-local-development-quickstart) • [Docker Deployment](#-full-docker-deployment) • [API & Credentials](#-default-seeded-credentials)

</div>

---

## 📖 Overview

**FixoBoard MMS** is a mission-critical factory operations cockpit that bridges commercial sales booking with shop-floor extrusion execution, quality tracking, packaging, and logistics. 

It replaces fragmented paper chits and spreadsheets with an integrated platform featuring **real-time machine telemetry**, **AI-assisted document digitization (OCR)**, and an **Enterprise AI Plant Advisor** capable of querying live operational database records in natural language.

---

## 🏗️ System Architecture

```
                                  +---------------------------------------+
                                  |     Modern React 19 + Vite SPA        |
                                  |     - Tailwind CSS + Lucide Icons     |
                                  |     - TanStack Query v5 + Context     |
                                  +-------------------+-------------------+
                                                      │
                                           HTTP / REST (JSON + JWT)
                                                      │
                                  +-------------------▼-------------------+
                                  |    FastAPI Asynchronous Backend       |
                                  |    - Domain State Machines (AuditLog) |
                                  |    - Strict Role-Based Access (RBAC)  |
                                  |    - AI Plant Advisor & Gemini Vision |
                                  |    - ReportLab PDF Gate Pass Engine   |
                                  +-------------------+-------------------+
                                                      │
                                        SQLAlchemy 2.0 (Async Engine)
                                                      │
                         +----------------------------+----------------------------+
                         │                                                         │
          +--------------▼---------------+                          +--------------▼---------------+
          |  PostgreSQL 16 (Production)  |                          |  SQLite + aiosqlite (Local)  |
          |  24 Relational Core Entities |                          |  Zero-dependency Dev Mode    |
          +------------------------------+                          +------------------------------+
```

---

## ✨ Core Features & Capabilities

### 1. 🤖 Enterprise Natural Language AI Plant Advisor
- **Live Database Telemetry**: Directly queries real-time SQL records across commercial orders, machine line status, output scrap, dispatches, and customer ledgers.
- **Role-Gated Security**: Strictly restricted to **Administrator** and **Plant Manager** roles in both UI and API authorization.
- **Dual Execution Engine**: Powered by Google Gemini AI with a high-precision local SQL/NLP intelligence fallback engine.
- **Technical Specification Advice**: Recommends certified thicknesses (5mm–30mm), solid core door densities (0.45–0.60 g/cm³), SGS Lead-Free compliance, and comparative analysis against traditional plywood.

### 2. 📷 AI Document OCR & Order Digitization
- Instant OCR extraction of physical purchase orders, handwritten chits, and digital PDF invoices.
- Automated mapping to customer master profiles, item thicknesses, and order quantities.
- Human-in-the-loop review workflow before converting scans into formal commercial sales orders.

### 3. 📋 Commercial Sales Order Pipeline
- Complete order lifecycle management: `DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `APPROVED` $\rightarrow$ `IN_PRODUCTION` $\rightarrow$ `PARTIALLY_DISPATCHED` $\rightarrow$ `COMPLETED`.
- Multi-source booking: CAT orders, Manual booking, EDI, and email.
- Real-time customer credit limit checking and outstanding balance validation.

### 4. 🏭 Production Planning & Floor Execution Terminal
- **Decoupled Production Memos**: Work orders generated per sales order line item with machine line assignment (Extrusion Lines 1 to 4).
- **Touch-Optimized Operator Terminal**: Start, pause, resume, and log shifts directly on the plant floor.
- **Yield & Waste Telemetry**: Logs good prime sheets, defect rejections, and purge scrap in kg (100% recyclable into core extrusion layers).

### 5. 📦 Packaging & Bundling Queue
- Packaging formats: **Standard Strapping**, **Raffia Fabric Wrapping**, and **Cardboard Box Packaging**.
- Automatic bundle piece calculation and printable package tags.

### 6. 🚚 Logistics, Gate Clearance & PDF Generation
- Vehicle number, transporter details, driver phone, and E-Way bill recording.
- Instant 1-click **PDF Dispatch Sheet & Gate Pass** generation using ReportLab.

### 7. 📊 Demand Intelligence & Analytics
- Multi-dimensional analytics: Party-wise volume, Thickness breakdown (mm), and Density distribution (g/cm³).
- 1-click CSV and report data exports.

### 8. 🔐 Immutable Audit Trail
- Automated JSON delta snapshots capturing every state transition, user ID, timestamp, and field modification.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 5, Tailwind CSS, TanStack React Query v5, Lucide Icons |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, Pydantic Settings, SQLAlchemy 2.0 (Async) |
| **Database** | PostgreSQL 16 (Production) / SQLite with aiosqlite (Development) |
| **AI / Vision** | Google Gemini 1.5 Flash, Custom Industrial NLP Entity Parser |
| **PDF & Documents** | ReportLab Enterprise PDF Engine |
| **DevOps & Containers** | Docker, Docker Compose, Nginx Alpine, Multi-stage builds |

---

## 🚀 Local Development Quickstart

### Prerequisites
- **Python 3.11+**
- **Node.js 20+** & npm

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/fixoboard-mms.git
cd fixoboard-mms
```

### 2. Configure Environment
```bash
# Copy example environment file
cp .env.example .env
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv

# Activate Virtual Environment:
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI backend with auto-reload (Port 8000)
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite development server (Port 3000)
npm run dev
```
- Open Web Application: [http://localhost:3000](http://localhost:3000)

---

## 🐳 Full Docker Deployment

The entire system (PostgreSQL 16, FastAPI Backend, and Nginx React Frontend) can be launched with a single Docker Compose command:

```bash
# 1. Build and start all containers in background
docker compose up --build -d

# 2. Check service health status
docker compose ps

# 3. Stream real-time container logs
docker compose logs -f
```

### Container Endpoints:
- **Frontend Web Application**: [http://localhost:3000](http://localhost:3000)
- **Backend REST API**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL Database**: `localhost:5432`

### Stopping the Stack:
```bash
# Stop containers (preserves database volume)
docker compose down

# Stop and wipe database volume (clean reset)
docker compose down -v
```

---

## 🔑 Default Seeded Credentials

The database is pre-seeded with role-based demo accounts for all factory departments:

| Role | Username | Password | Access Scope & Capabilities |
|---|---|---|---|
| **Administrator** | `admin` | `Fixo@12345` | Full System Access, AI Advisor, User Management, Audit Logs |
| **Plant Manager** | `plant_manager` | `Fixo@12345` | Factory Floor Cockpit, AI Advisor, Line Allocation, Machines |
| **Management** | `management` | `Fixo@12345` | Executive Dashboards, Financial Analytics, Commercial Overview |
| **Sales Executive** | `sales` | `Fixo@12345` | Sales Order Booking, AI OCR Scanner, Customer Ledger |
| **Production Head** | `production` | `Fixo@12345` | Production Planning Board, Memo Release, Shift Scheduling |
| **Machine Operator** | `operator1` | `Fixo@12345` | Floor Execution Terminal, Output Logging, Scrap Waste Recording |
| **Packaging Staff** | `packing` | `Fixo@12345` | Bundling Queue, Wrapping Verification, Packing Slip Print |
| **Dispatch Manager** | `dispatch` | `Fixo@12345` | Vehicle Loading, Gate Clearance, PDF Gate Pass Generation |

---

## ⚙️ Environment Configuration (`.env`)

| Variable | Default Value | Description |
|---|---|---|
| `ENVIRONMENT` | `development` | Runtime environment (`development` / `production`) |
| `DATABASE_URL` | `sqlite+aiosqlite:///./fixoboard.db` | Async database connection string |
| `JWT_SECRET` | *(Random 32+ char key)* | Secret key for signing authentication tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Token expiration period (24 hours) |
| `LOCAL_UPLOAD_DIR` | `uploads` | Directory for order attachments and scanned PDFs |
| `GEMINI_API_KEY` | `""` | Google Gemini API key for OCR & AI Advisor |
| `GEMINI_MODEL` | `gemini-1.5-flash` | Gemini model version for vision and intelligence |

---

## 🧪 Testing Suite

Run the automated backend test suite:

```bash
# Run pytest across all test modules
pytest tests/ -v

# Run specific domain test module
pytest tests/test_ai_scanned_orders.py -v
pytest tests/test_extrusion_execution.py -v
```

---

## 🔒 Security Best Practices

- **Never Commit Secrets**: Ensure `.env` and `*.db` files are kept in `.gitignore`. Use `.env.example` as a public template.
- **Strict Role Authorization**: Sensitive management actions and AI endpoints require explicit role checks on both frontend and backend.
- **Sanitized Exception Handling**: In production mode, backend errors return structured error codes without leaking internal stack traces.

---

## 📄 License

This project is proprietary and confidential. Designed for **FixoBoard Manufacturing Operations**.

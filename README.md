# HospitalManagementSystem - Multi-Tenant SaaS

Production-oriented, multi-tenant clinic appointment scheduling and real-time queue management SaaS platform built with Next.js (App Router), Express.js, PostgreSQL (Prisma ORM), Redis, and Socket.IO.

---

## 1. System Architecture

```
CAQMS02/
├── backend/            # Complete Express.js REST API, Socket.IO, Prisma ORM, & scheduling engine
│   ├── prisma/
│   │   ├── schema.prisma # Complete 27-model multi-tenant schema
│   │   └── seed.ts       # Multi-clinic seed data (Clinics A & B, all 5 roles)
│   ├── src/
│   │   ├── config/       # Environment & Prisma client singleton
│   │   ├── middleware/   # Tenant resolution (x-clinic-id) & RBAC authorization
│   │   ├── services/     # Scheduling engine, atomic queue counters, auth & reports
│   │   ├── routes/       # REST API endpoints under /api/v1
│   │   ├── events/       # Socket.IO authenticated rooms
│   │   ├── types/        # TypeScript DTOs, Zod validation schemas, & roles
│   │   ├── app.ts        # Express application configuration
│   │   └── server.ts     # HTTP + WebSocket server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env              # Backend environment variables
│
├── frontend/           # Complete Next.js 14 App Router application
│   ├── app/
│   │   ├── page.tsx      # Landing page with 1-click quick logins for all 5 roles
│   │   ├── layout.tsx    # Root layout with TanStack Query & AuthProvider
│   │   ├── admin/        # Clinic Owner/Admin Console (settings, staff, branches)
│   │   ├── manager/      # Operations Manager Console (daily flow, calendar, queue)
│   │   ├── doctor/       # Doctor Consultation Console (assigned queue, patient caller)
│   │   ├── receptionist/ # Front Desk Console (search, check-in, walk-in tokens)
│   │   ├── patient/      # Patient Portal (slot booking, live queue token tracker)
│   │   ├── display/[slug]# Public Privacy-Compliant Waiting Room TV Display
│   │   ├── onboarding/   # Multi-tenant Clinic Registration
│   │   └── login/        # Standard User Login
│   ├── components/       # UI Components (Navbar, clinic switcher, role pills)
│   ├── lib/              # API fetcher, AuthContext, & Socket.IO client
│   ├── types/            # Frontend TypeScript definitions
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── docker-compose.yml  # Multi-container production stack (PostgreSQL, Redis, Backend, Frontend)
├── .env                # Root environment variables
├── .env.example
├── start-dev.bat       # 1-Click Windows development launcher
└── README.md
```

---

## 2. Multi-Tenant Architecture & Roles

Every clinic record is isolated by the mandatory tenant identifier `clinic_id`.

### Five Application Roles:
1. **ADMIN**: Full clinic administration, branches, staff invitations, services, settings, and reports.
2. **MANAGER**: Daily operational dashboard, appointment calendar, patient flow, and queue monitoring.
3. **DOCTOR**: Assigned schedule, assigned appointments, queue caller, consultation lifecycle (start, complete, skip), and restricted notes.
4. **RECEPTIONIST**: Patient search with live duplicate detection, walk-in token generation, front-desk check-in, and token printing.
5. **PATIENT**: Self-service booking with slot selector, live queue token tracker with position ahead and wait estimate, reschedule, and cancellation.

### Public TV Waiting Room Board:
- `/display/metro-health`: Real-time queue board with "Now Serving", "Just Called", and "Next in Line" without exposing sensitive patient health details.

---

## 3. Quick Start

### Option A: 1-Click Launch (Windows)
Double-click **`start-dev.bat`** in the project folder.

### Option B: Terminal Command
From the project root:
```powershell
npm run dev
```

---

## 4. Application URLs

| Service | URL |
| :--- | :--- |
| **Frontend Web App** | [http://localhost:3000](http://localhost:3000) |
| **Backend API** | [http://localhost:4000/api/v1](http://localhost:4000/api/v1) |
| **API Health Check** | [http://localhost:4000/health](http://localhost:4000/health) |
| **Public TV Waiting Display** | [http://localhost:3000/display/metro-health](http://localhost:3000/display/metro-health) |
| **Clinic Registration** | [http://localhost:3000/onboarding](http://localhost:3000/onboarding) |

---

## 5. Demo Credentials (Seed Accounts)

Password for all roles: **`Password123!`**

- **ADMIN**: `admin@metrohealth.com` → [Admin Dashboard](http://localhost:3000/admin)
- **MANAGER**: `manager@metrohealth.com` → [Manager Dashboard](http://localhost:3000/manager)
- **DOCTOR**: `doctor@metrohealth.com` → [Doctor Console](http://localhost:3000/doctor)
- **RECEPTIONIST**: `receptionist@metrohealth.com` → [Front-Desk Console](http://localhost:3000/receptionist)
- **PATIENT**: `patient@example.com` → [Patient Portal](http://localhost:3000/patient)

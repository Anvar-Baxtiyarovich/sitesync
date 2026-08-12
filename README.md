# SiteSync (ObyektSinxron) - B2B Micro-SaaS for Industrial Construction Sites

SiteSync bridges language barriers and reporting friction on international industrial construction projects (e.g., wind farms, solar plants, factory installations). Local site managers enter daily metrics in Uzbek or Russian, which are automatically translated by AI into structured English and Chinese executive dashboards for foreign investors and project partners.

---

## 🚀 Key Features

1. **Role-Based Access Control (RBAC)**:
   - `LOCAL_MANAGER`: Mobile-optimized, touch-friendly daily report submission interface with large touch targets.
   - `FOREIGN_PARTNER`: Desktop-optimized executive dashboard with real-time translation and equipment tracking.
2. **Automated Hybrid AI Translation Pipeline**:
   - Multi-stage engine: Self-hosted NLLB-600M -> OpenAI / Hugging Face -> 100% Free Google Translate Web Engine (Zero-Cost Vercel deployment).
   - Asynchronous processing via Redis & BullMQ.
   - Tailored for industrial/civil engineering vocabulary across 4 languages (UZ, RU, EN, ZH).
3. **Multi-lingual Executive Dashboard & Real-Time Chat**:
   - 4-Way auto-translation in group and 1-on-1 direct chats.
   - Real-time polling (3s - 5s) for instant message delivery without page reloads.
   - One-click language toggle between Chinese (中文) and English (EN).
   - Real-time WeChat text summary generator.
4. **Export & Sharing Capabilities**:
   - Instant PDF generation and WeChat summary clipboard export.

---

## 🛠 Project Tech Stack

- **Framework**: Next.js 14+ (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS (Unified Dark Theme & Glassmorphism)
- **Database**: PostgreSQL & Prisma ORM
- **Queue/Worker**: Redis & BullMQ
- **Translation Engine**: Self-Hosted NLLB-600M FastAPI / Free Engine ($0/mo on Vercel)

---

## 💻 Quick Start & Running Locally

### 1. Prerequisites
- Node.js >= 18.x
- Docker & Docker Compose

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Spin up PostgreSQL, Redis & NLLB Translation Server
```bash
docker-compose up -d
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Setup Database Schema
```bash
npx prisma db push
```

### 6. Run Next.js Web App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Local Manager Input View**: [http://localhost:3000/uz/field](http://localhost:3000/uz/field)
- **Foreign Partner Dashboard View**: [http://localhost:3000/zh/dashboard](http://localhost:3000/zh/dashboard)

### 7. Run Translation Queue Worker (Optional)
```bash
npm run worker
```

---

## 📁 Repository Structure

```
sitesync/
├── app/
│   ├── [lang]/
│   │   ├── dashboard/page.tsx    # Foreign Partner Executive Dashboard (ZH/EN)
│   │   ├── field/page.tsx        # Local Manager Input Form (UZ/RU)
│   │   ├── groups/page.tsx       # Group Chat List & Creation
│   │   ├── groups/[id]/page.tsx  # 4-Way Multilingual Live Group Chat
│   │   └── contacts/page.tsx     # 1-on-1 Multilingual Direct Chat
│   ├── api/v1/                   # REST API Endpoints
│   ├── layout.tsx
│   └── page.tsx                  # Portal Landing Page
├── components/                    # UI Components (Navbar, etc.)
├── lib/
│   ├── db.ts                     # Prisma Database Client
│   ├── queue.ts                  # BullMQ Producer Setup
│   └── translation.ts            # Hybrid Industrial Translation Engine
├── nllb_server/                  # FastAPI NLLB-600M Translation Engine
│   ├── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── prisma/
│   └── schema.prisma             # PostgreSQL Database Schema
├── worker/
│   └── translationWorker.ts      # BullMQ Async Translation Worker
├── docker-compose.yml            # Local Postgres, Redis & NLLB Services
├── package.json
└── README.md
```

Designed and built for SiteSync (ObyektSinxron) MVP.

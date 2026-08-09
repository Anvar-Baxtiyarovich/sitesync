# SiteSync (ObyektSinxron) - B2B Micro-SaaS for Industrial Construction Sites

SiteSync bridges language barriers and reporting friction on international industrial construction projects (e.g., wind farms, solar plants, factory installations). Local site managers enter daily metrics in Uzbek or Russian, which are automatically translated by AI into structured English and Chinese executive dashboards for foreign investors and project partners.

---

## 🚀 Key Features

1. **Role-Based Access Control (RBAC)**:
   - `LOCAL_MANAGER`: Mobile-optimized, touch-friendly daily report submission interface.
   - `FOREIGN_PARTNER`: Desktop-optimized executive dashboard with real-time translation and equipment tracking.
2. **Automated AI Translation Pipeline**:
   - Asynchronous processing via Redis & BullMQ.
   - Dual-engine fallback (DeepL & OpenAI GPT-4o-mini) tailored for industrial/civil engineering vocabulary.
3. **Multi-lingual Executive Dashboard**:
   - One-click language toggle between Chinese (中文) and English (EN).
   - Real-time WeChat text summary generator optimized for messaging limits.
4. **Export & Sharing Capabilities**:
   - Instant PDF generation and WeChat summary clipboard export.

---

## 🛠 Project Tech Stack

- **Framework**: Next.js 14+ (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL & Prisma ORM
- **Queue/Worker**: Redis & BullMQ
- **Translation API**: OpenAI GPT-4o-mini / DeepL API

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

### 3. Spin up PostgreSQL & Redis
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
│   │   └── field/page.tsx        # Local Manager Input Form (UZ/RU)
│   ├── api/v1/reports/route.ts  # Daily Report Submission API
│   ├── layout.tsx
│   └── page.tsx                  # Portal Landing Page
├── components/                    # UI Components
├── lib/
│   ├── db.ts                     # Prisma Database Client
│   ├── queue.ts                  # BullMQ Producer Setup
│   └── translation.ts            # Industrial Translation Engine
├── prisma/
│   └── schema.prisma             # PostgreSQL Database Schema
├── worker/
│   └── translationWorker.ts      # BullMQ Async Translation Worker
├── docker-compose.yml            # Local Postgres & Redis Services
├── package.json
└── README.md
```

Designed and built for SiteSync (ObyektSinxron) MVP.

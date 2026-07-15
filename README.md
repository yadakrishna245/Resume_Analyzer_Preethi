<div align="center">

# 🧠 NexuCV — AI Resume Intelligence Platform

### *Your resume, analyzed by AI. Scored by algorithms. Never uploaded to any server.*

[![React 18](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![AWS SAM](https://img.shields.io/badge/AWS_SAM-Serverless-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/sam/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

<br/>

**NexuCV** is a privacy-first, AI-powered resume analysis platform that scores your resume against ATS systems, provides deep AI-driven feedback using 6 different AI providers with intelligent fallback, and matches your resume against job descriptions — all while keeping your resume data **entirely in your browser**.

<br/>

[✨ Features](#-features) • [🏗️ Architecture](#️-architecture) • [🚀 Quick Start](#-one-click-deployment) • [🔒 Security](#-security-measures) • [📡 API](#-api-endpoints)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📊 **100-Point ATS Scoring Engine** | Comprehensive local scoring with weighted categories — no API calls needed |
| 🤖 **AI Deep Analysis** | 6-provider intelligent fallback chain for reliable AI feedback |
| 🎯 **JD Keyword Matching** | Compare your resume keywords against any job description |
| 📄 **Multi-Format Parsing** | PDF, DOCX, and TXT support via client-side `pdfjs-dist` & `mammoth` |
| 🔐 **Privacy-First** | Resume is parsed in browser — **never uploaded** to any server |
| 🛡️ **Secure Auth** | AWS Cognito with email/password + optional TOTP MFA |
| 📜 **Analysis History** | Save & review past analyses with 90-day auto-cleanup (DynamoDB TTL) |
| ⚡ **Rate Limiting** | 3 AI requests/user/day to prevent abuse (configurable) |

### 📊 ATS Scoring Breakdown (100 Points)

```
┌─────────────────────────────────────────────────────────────────┐
│  CATEGORY          │  POINTS  │  WHAT'S CHECKED                 │
├─────────────────────────────────────────────────────────────────┤
│  📧 Contact Info   │  15 pts  │  Email, phone, LinkedIn, GitHub │
│  📑 Sections       │  20 pts  │  Experience, education, skills  │
│  🔑 Keywords       │  25 pts  │  Industry terms, action verbs   │
│  📝 Content        │  20 pts  │  Bullet points, quantification  │
│  📐 Format         │  20 pts  │  Length, consistency, structure  │
└─────────────────────────────────────────────────────────────────┘
                         Total: 100 points
```

### 🤖 AI Provider Fallback Chain

```
Priority 1: Groq (Llama 3.3 70B Versatile) — Fastest inference
    ↓ (on failure)
Priority 2: Google Gemini 2.0 Flash — High quality, generous free tier
    ↓ (on failure)
Priority 3: OpenRouter (Free Models) — Community models, zero cost
    ↓ (on failure)
Priority 4: Anthropic Claude — Premium analysis quality
    ↓ (on failure)
Priority 5: OpenAI GPT-4o — Industry standard
    ↓ (on failure)
Priority 6: NVIDIA — Enterprise-grade inference
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              NexuCV Architecture                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐      ┌──────────────────┐      ┌─────────────────────────┐   │
│  │              │      │                  │      │                         │   │
│  │  React SPA   │─────▶│   CloudFront     │─────▶│   S3 Bucket (Static)    │   │
│  │  (Vite 5)    │      │   HTTP/2 + 3     │      │   OAC Protected         │   │
│  │              │      │   HTTPS Only     │      │   AES-256 Encrypted     │   │
│  └──────┬───────┘      └──────────────────┘      └─────────────────────────┘   │
│         │                                                                        │
│         │  JWT Token (id_token)                                                  │
│         │                                                                        │
│  ┌──────▼───────────────────────────────────────────────────────────────────┐   │
│  │                         AWS API Gateway (REST)                            │   │
│  │                    Cognito Authorizer + Throttling                        │   │
│  │                      (5 req/s, burst 10)                                 │   │
│  └──────┬────────────────────────────────┬──────────────────────────────────┘   │
│         │                                │                                       │
│         ▼                                ▼                                       │
│  ┌──────────────────────┐     ┌──────────────────────────────────────────┐      │
│  │  Lambda: AI Proxy    │     │  Lambda: User History (CRUD)             │      │
│  │  ─────────────────── │     │  ────────────────────────────            │      │
│  │  • Rate limit check  │     │  • GET    /history                       │      │
│  │  • Fallback chain:   │     │  • POST   /history                       │      │
│  │    Groq → Gemini →   │     │  • DELETE /history/{id}                  │      │
│  │    OpenRouter → ...  │     │                                          │      │
│  │  • 60s timeout       │     └───────────────┬──────────────────────────┘      │
│  └──────────┬───────────┘                     │                                  │
│             │                                 │                                  │
│             ▼                                 ▼                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         DynamoDB Tables                                  │    │
│  │  ┌─────────────────────────┐    ┌──────────────────────────────────┐   │    │
│  │  │  RateLimitTable          │    │  HistoryTable                     │   │    │
│  │  │  • userId + date (PK)   │    │  • userId (PK) + id (SK)         │   │    │
│  │  │  • requestCount         │    │  • analysis data                  │   │    │
│  │  │  • TTL: 48 hours        │    │  • TTL: 90 days                  │   │    │
│  │  └─────────────────────────┘    └──────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    Cognito User Pool                                      │    │
│  │                    • Email/Password (SRP)                                │    │
│  │                    • Optional TOTP MFA                                   │    │
│  │                    • 1hr Token Expiry                                    │    │
│  │                    • Deletion Protection ON                              │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ How It Works

### Step 1: Upload & Parse (Client-Side)
```
📄 User selects resume (PDF/DOCX/TXT)
   ↓
🔄 File parsed entirely in browser
   • PDF → pdfjs-dist extracts text
   • DOCX → mammoth.js converts to text
   • TXT → read directly
   ↓
📋 Extracted text ready for analysis
```

### Step 2: ATS Scoring (No API Needed)
```
📋 Extracted resume text
   ↓
📊 Local scoring engine evaluates:
   • Contact info completeness (15 pts)
   • Required sections present (20 pts)
   • Keyword density & action verbs (25 pts)
   • Content quality & metrics (20 pts)
   • Format & structure (20 pts)
   ↓
✅ Score out of 100 displayed instantly
```

### Step 3: AI Deep Analysis (Authenticated)
```
👤 User signs in (Cognito)
   ↓
🔑 JWT id_token obtained
   ↓
📡 POST /analyze → API Gateway
   ↓
🛡️ Cognito Authorizer validates token
   ↓
⚡ Lambda AI Proxy:
   ├─ Check rate limit (3/day per user)
   ├─ Call AI provider (with fallback chain)
   ├─ Groq → Gemini → OpenRouter → Claude → GPT-4o → NVIDIA
   └─ Return structured analysis
   ↓
💾 Analysis saved to history (DynamoDB)
   ↓
📊 Rich feedback displayed to user
```

### Step 4: JD Keyword Matching
```
📄 Resume keywords extracted
   +
📋 Job description pasted by user
   ↓
🔍 Keyword comparison engine:
   • Finds matching keywords ✅
   • Identifies missing keywords ❌
   • Calculates match percentage
   ↓
🎯 Match score + recommendations
```


---

## 🔒 Security Measures

> NexuCV follows **defense-in-depth** principles. Every layer is hardened independently.

### 🪣 S3 (Static Hosting)

| Control | Configuration |
|---------|--------------|
| Public Access | **All blocked** (`BlockPublicAcls`, `BlockPublicPolicy`, `IgnorePublicAcls`, `RestrictPublicBuckets`) |
| Access Method | CloudFront OAC (Origin Access Control) only |
| Encryption | AES-256 server-side encryption (SSE-S3) |
| Versioning | Enabled (rollback capability) |
| Bucket Policy | Deny all except CloudFront OAC principal |

### 🌐 CloudFront (CDN)

| Control | Configuration |
|---------|--------------|
| Protocol | HTTPS only (HTTP → HTTPS redirect) |
| HTTP Version | HTTP/2 and HTTP/3 (QUIC) enabled |
| TLS | TLSv1.2 minimum |
| Origin Access | OAC (not legacy OAI) |
| Caching | Optimized for SPA (index.html no-cache, assets immutable) |

### 🔐 Cognito (Authentication)

| Control | Configuration |
|---------|--------------|
| Auth Flow | SRP (Secure Remote Password) — **no passwords transmitted over wire** |
| MFA | Optional TOTP (Time-based One-Time Password) |
| User Enumeration | `PreventUserExistenceErrors: ENABLED` |
| Token Expiry | ID/Access tokens: **1 hour** |
| Password Policy | Min 8 chars, uppercase, lowercase, numbers, symbols |
| Deletion Protection | **Active** on User Pool |
| Email Verification | Required before account activation |

### 🚪 API Gateway

| Control | Configuration |
|---------|--------------|
| Authorization | Cognito JWT Authorizer (id_token validation) |
| Throttling | 5 requests/second steady, burst 10 |
| Access Logging | CloudWatch Logs enabled |
| CORS | Configured with specific allowed origins |
| Stage | Production with throttling limits |

### 🗄️ DynamoDB

| Control | Configuration |
|---------|--------------|
| Encryption | Server-Side Encryption with AWS KMS |
| Recovery | Point-in-Time Recovery (PITR) enabled |
| TTL | Auto-cleanup: Rate limits (48hrs), History (90 days) |
| Billing | PAY_PER_REQUEST (no over-provisioning) |
| Access | Lambda IAM roles only (least privilege) |

### ⚡ Lambda Functions

| Control | Configuration |
|---------|--------------|
| Architecture | ARM64 (Graviton2 — cost efficient) |
| IAM | Least-privilege policies (only specific DynamoDB actions on specific tables) |
| Timeout | 60 seconds maximum |
| Memory | 256 MB (optimized for workload) |
| Secrets | Environment variables with `NoEcho` in SAM template |
| Runtime | Node.js 20.x (LTS, actively patched) |

### 🖥️ Frontend Security

| Control | Configuration |
|---------|--------------|
| Secrets | **Zero secrets in code** — only public Cognito UserPool ID & Client ID |
| Resume Data | **Never transmitted** to any server (parsed & scored locally) |
| Dependencies | Pinned versions, regular audit |
| Build | Production build with minification & tree-shaking |

### 🚦 Rate Limiting

| Control | Configuration |
|---------|--------------|
| Mechanism | DynamoDB-backed per-user daily counter |
| Limit | 3 AI requests per user per day (configurable via env var) |
| Key | `userId + YYYY-MM-DD` composite key |
| TTL | 48-hour auto-expiry on counter records |
| Response | HTTP 429 with clear error message when exceeded |

---


## 📁 Project Structure

```
Resume Analyzer/
├── 📄 README.md                    # This file
├── 📄 deploy.ps1                   # One-click deployment script (PowerShell)
├── 📄 .gitignore                   # Git ignore rules
│
├── 📂 frontend/                    # React SPA (Vite + Tailwind)
│   ├── 📄 package.json             # Dependencies & scripts
│   ├── 📄 vite.config.js           # Vite configuration
│   ├── 📄 tailwind.config.js       # Tailwind CSS configuration
│   ├── 📄 postcss.config.js        # PostCSS plugins
│   ├── 📄 index.html               # HTML entry point
│   ├── 📄 .env.example             # Environment variable template
│   ├── 📂 public/                  # Static assets
│   └── 📂 src/
│       ├── 📄 main.jsx             # App entry point
│       ├── 📄 App.jsx              # Root component & routing
│       ├── 📂 components/          # React components
│       │   ├── 📄 ResumeUpload.jsx # File upload & parsing
│       │   ├── 📄 ATSScorer.jsx    # 100-point scoring engine
│       │   ├── 📄 AIAnalysis.jsx   # AI deep analysis UI
│       │   ├── 📄 JDMatcher.jsx    # Job description matching
│       │   ├── 📄 History.jsx      # Past analyses viewer
│       │   ├── 📄 Auth.jsx         # Login/Register/MFA
│       │   └── 📄 Navbar.jsx       # Navigation bar
│       ├── 📂 services/            # API & auth services
│       │   ├── 📄 api.js           # API Gateway client
│       │   ├── 📄 auth.js          # Cognito auth flows
│       │   └── 📄 aiProviders.js   # AI provider configuration
│       ├── 📂 utils/               # Utility functions
│       │   ├── 📄 resumeParser.js  # PDF/DOCX/TXT parsing
│       │   ├── 📄 atsScoring.js    # ATS scoring algorithm
│       │   └── 📄 keywords.js     # Keyword extraction
│       └── 📂 styles/              # CSS/Tailwind styles
│           └── 📄 index.css        # Global styles & Tailwind directives
│
├── 📂 backend/                     # AWS SAM application
│   ├── 📄 template.yaml           # SAM/CloudFormation template
│   ├── 📄 samconfig.toml          # SAM deployment configuration
│   ├── 📂 functions/
│   │   ├── 📂 ai-proxy/           # AI Analysis Lambda
│   │   │   ├── 📄 index.mjs       # Handler: rate limit + AI fallback
│   │   │   └── 📄 package.json    # Lambda dependencies
│   │   └── 📂 user-history/       # History CRUD Lambda
│   │       ├── 📄 index.mjs       # Handler: GET/POST/DELETE history
│   │       └── 📄 package.json    # Lambda dependencies
│   └── 📂 layers/                  # Shared Lambda layers (optional)
│
└── 📂 docs/                        # Additional documentation
    ├── 📄 SECURITY.md              # Security details
    └── 📄 ARCHITECTURE.md          # Architecture deep dive
```

---


## 📋 Prerequisites

Before deploying NexuCV, ensure you have the following installed:

| Tool | Version | Purpose | Install |
|------|---------|---------|---------|
| **Node.js** | 20+ | Runtime for Lambda & frontend build | [nodejs.org](https://nodejs.org) |
| **npm** | 10+ | Package management | Comes with Node.js |
| **AWS CLI** | v2 | AWS resource management | [AWS CLI Install](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
| **AWS SAM CLI** | 1.100+ | Serverless deployment | [SAM CLI Install](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) |
| **Git** | 2.40+ | Version control | [git-scm.com](https://git-scm.com) |
| **AWS Account** | — | Cloud infrastructure | [aws.amazon.com](https://aws.amazon.com) |

### AWS CLI Configuration
```bash
aws configure
# AWS Access Key ID: [your-key]
# AWS Secret Access Key: [your-secret]
# Default region: us-east-1  (recommended for CloudFront)
# Default output format: json
```

---

## 🚀 One-Click Deployment

The `deploy.ps1` PowerShell script automates the entire deployment process.

### Usage

```powershell
# Clone the repository
git clone https://github.com/yadakrishna245/Resume_Analyzer_Preethi.git
cd Resume_Analyzer_Preethi

# Run the deployment script
.\deploy.ps1
```

### What the Script Does:

1. ✅ Validates all prerequisites (AWS CLI, SAM CLI, Node.js)
2. 📦 Installs Lambda dependencies (`cd backend/functions/*/  && npm install`)
3. 🏗️ Builds the SAM application (`sam build`)
4. 🚀 Deploys the backend stack (`sam deploy --guided` on first run)
5. 📋 Extracts stack outputs (API URL, Cognito Pool ID, Client ID, CloudFront URL)
6. 📝 Creates the frontend `.env` file with stack outputs
7. 📦 Installs frontend dependencies (`cd frontend && npm install`)
8. 🔨 Builds the frontend (`npm run build`)
9. ☁️ Syncs build to S3 (`aws s3 sync dist/ s3://bucket-name`)
10. 🔄 Invalidates CloudFront cache
11. 🎉 Prints the live URL

### Script Flags

```powershell
.\deploy.ps1                  # Full deployment (backend + frontend)
.\deploy.ps1 -BackendOnly    # Deploy only SAM backend
.\deploy.ps1 -FrontendOnly   # Build & deploy only frontend
.\deploy.ps1 -Destroy        # Tear down all resources
```

---

## 🔧 Manual Deployment Steps

For those who want to understand each step:

### 1. Deploy Backend (SAM)

```bash
# Navigate to backend
cd backend

# Install Lambda dependencies
cd functions/ai-proxy && npm install && cd ../..
cd functions/user-history && npm install && cd ../..

# Build SAM application
sam build

# Deploy (first time — guided)
sam deploy --guided
# Stack Name: nexucv-backend
# Region: us-east-1
# Confirm changes: Y
# Allow SAM CLI IAM role creation: Y
# Save arguments to config: Y
```

### 2. Note Stack Outputs

After deployment, SAM prints outputs:

```
Key                 Value
─────────────────── ──────────────────────────────────────
ApiEndpoint         https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
UserPoolId          us-east-1_XXXXXXXXX
UserPoolClientId    xxxxxxxxxxxxxxxxxxxxxxxxxx
WebBucketName       nexucv-frontend-bucket-xxxxx
CloudFrontUrl       https://dxxxxxxxxxx.cloudfront.net
CloudFrontDistId    EXXXXXXXXXXXXX
```

### 3. Configure Frontend

```bash
cd frontend

# Create .env file
cp .env.example .env
```

Edit `.env` with the stack outputs:

```env
VITE_API_ENDPOINT=https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
VITE_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_REGION=us-east-1
```

### 4. Build & Deploy Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Upload to S3
aws s3 sync dist/ s3://nexucv-frontend-bucket-xxxxx --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id EXXXXXXXXXXXXX \
  --paths "/*"
```

### 5. Add AI Provider Keys

In the AWS Lambda console or via SAM template environment variables, set your AI API keys:

```bash
# Update Lambda environment variables
aws lambda update-function-configuration \
  --function-name nexucv-ai-proxy \
  --environment "Variables={
    GROQ_API_KEY=gsk_xxxxx,
    GEMINI_API_KEY=AIzaxxxxx,
    OPENROUTER_API_KEY=sk-or-xxxxx,
    ANTHROPIC_API_KEY=sk-ant-xxxxx,
    OPENAI_API_KEY=sk-xxxxx,
    NVIDIA_API_KEY=nvapi-xxxxx,
    DAILY_RATE_LIMIT=3
  }"
```

---


## 🌍 Environment Variables

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_ENDPOINT` | API Gateway base URL | `https://xxx.execute-api.us-east-1.amazonaws.com/prod` |
| `VITE_USER_POOL_ID` | Cognito User Pool ID | `us-east-1_AbCdEfGhI` |
| `VITE_USER_POOL_CLIENT_ID` | Cognito App Client ID | `1a2b3c4d5e6f7g8h9i0j` |
| `VITE_REGION` | AWS Region | `us-east-1` |

### Backend (Lambda Environment Variables)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `GROQ_API_KEY` | Groq API key (Priority 1) | ✅ | `gsk_xxxxxxxxxxxx` |
| `GEMINI_API_KEY` | Google Gemini API key (Priority 2) | ✅ | `AIzaSyxxxxxxxxxx` |
| `OPENROUTER_API_KEY` | OpenRouter API key (Priority 3) | ⬜ | `sk-or-v1-xxxxxxxx` |
| `ANTHROPIC_API_KEY` | Anthropic Claude key (Priority 4) | ⬜ | `sk-ant-api03-xxxxx` |
| `OPENAI_API_KEY` | OpenAI API key (Priority 5) | ⬜ | `sk-proj-xxxxxxxxx` |
| `NVIDIA_API_KEY` | NVIDIA NIM API key (Priority 6) | ⬜ | `nvapi-xxxxxxxxxx` |
| `DAILY_RATE_LIMIT` | Max AI requests per user per day | ⬜ | `3` (default) |
| `HISTORY_TABLE_NAME` | DynamoDB history table name | Auto | Set by SAM |
| `RATE_LIMIT_TABLE_NAME` | DynamoDB rate limit table name | Auto | Set by SAM |

> **Note:** At minimum, configure **Groq** and **Gemini** keys for a reliable fallback experience. Both offer generous free tiers.

---

## 📡 API Endpoints

Base URL: `https://{api-id}.execute-api.{region}.amazonaws.com/prod`

| Method | Endpoint | Auth | Rate Limited | Description |
|--------|----------|------|:------------:|-------------|
| `POST` | `/analyze` | ✅ Cognito JWT | ✅ 3/day | Submit resume text for AI analysis |
| `GET` | `/history` | ✅ Cognito JWT | ❌ | Retrieve user's past analyses |
| `POST` | `/history` | ✅ Cognito JWT | ❌ | Save an analysis to history |
| `DELETE` | `/history/{id}` | ✅ Cognito JWT | ❌ | Delete a specific analysis |

### Request Examples

#### POST /analyze
```json
{
  "resumeText": "John Doe\nSoftware Engineer\n5 years experience...",
  "analysisType": "deep_analysis"
}
```

**Response (200):**
```json
{
  "success": true,
  "provider": "groq",
  "analysis": {
    "overallScore": 78,
    "strengths": ["Strong technical skills", "Quantified achievements"],
    "improvements": ["Add more keywords", "Include certifications section"],
    "rewrittenSummary": "Results-driven Software Engineer with 5+ years..."
  },
  "remainingRequests": 2
}
```

**Response (429 — Rate Limited):**
```json
{
  "success": false,
  "error": "Daily AI analysis limit reached (3/3). Resets at midnight UTC.",
  "remainingRequests": 0
}
```

#### GET /history
```json
{
  "success": true,
  "analyses": [
    {
      "id": "uuid-xxxx-xxxx",
      "timestamp": "2025-01-15T10:30:00Z",
      "provider": "groq",
      "score": 78,
      "resumeSnippet": "John Doe - Software Engineer...",
      "ttl": 1713456000
    }
  ]
}
```

---


## 🤖 AI Provider Configuration

### Getting Free API Keys

| Provider | Free Tier | Model Used | Get Key |
|----------|-----------|------------|---------|
| **Groq** | 30 req/min, 14,400/day | Llama 3.3 70B Versatile | [console.groq.com](https://console.groq.com/keys) |
| **Google Gemini** | 15 req/min, 1,500/day | Gemini 2.0 Flash | [aistudio.google.com](https://aistudio.google.com/apikey) |
| **OpenRouter** | Free models available | Various (community) | [openrouter.ai/keys](https://openrouter.ai/keys) |
| **Anthropic** | $5 free credit (new accounts) | Claude 3.5 Sonnet | [console.anthropic.com](https://console.anthropic.com) |
| **OpenAI** | $5 free credit (new accounts) | GPT-4o | [platform.openai.com](https://platform.openai.com/api-keys) |
| **NVIDIA** | 1,000 free credits | Various | [build.nvidia.com](https://build.nvidia.com) |

### Setup Steps

#### 1. Groq (Recommended — Fastest)
```
1. Visit https://console.groq.com
2. Sign up with Google/GitHub
3. Go to API Keys → Create New Key
4. Copy key (starts with gsk_)
```

#### 2. Google Gemini (Recommended — Most Reliable)
```
1. Visit https://aistudio.google.com
2. Sign in with Google account
3. Click "Get API Key" → "Create API Key"
4. Copy key (starts with AIza)
```

#### 3. OpenRouter (Free Tier)
```
1. Visit https://openrouter.ai
2. Sign up → Dashboard → API Keys
3. Create key (starts with sk-or-)
4. Note: Free models have variable availability
```

#### 4. Anthropic Claude (Premium)
```
1. Visit https://console.anthropic.com
2. Sign up → API Keys → Create Key
3. Copy key (starts with sk-ant-)
4. Add billing for continued use beyond free credits
```

#### 5. OpenAI (Premium)
```
1. Visit https://platform.openai.com
2. Sign up → API Keys → Create New Secret Key
3. Copy key (starts with sk-)
4. Add billing for continued use beyond free credits
```

#### 6. NVIDIA (Enterprise)
```
1. Visit https://build.nvidia.com
2. Sign up for developer account
3. Navigate to NIM API section → Generate Key
4. Copy key (starts with nvapi-)
```

---


## 💰 Cost Estimation

NexuCV is designed to run within or near the **AWS Free Tier** for personal/portfolio use.

### Monthly Cost Breakdown

| Service | Free Tier | Low Traffic (100 users/mo) | Medium Traffic (1,000 users/mo) |
|---------|-----------|---------------------------|--------------------------------|
| **Lambda** | 1M requests free | $0.00 | $0.00 |
| **API Gateway** | 1M requests free | $0.00 | $0.01 |
| **DynamoDB** | 25 GB + 25 WCU/RCU | $0.00 | $0.00 |
| **S3** | 5 GB + 20K GETs | $0.00 | $0.01 |
| **CloudFront** | 1 TB transfer/mo | $0.00 | $0.00 |
| **Cognito** | 50,000 MAU free | $0.00 | $0.00 |
| **CloudWatch** | 5 GB logs free | $0.00 | $0.00 |
| | | | |
| **Total AWS** | — | **~$0.00** | **~$0.02** |
| **AI APIs** | Free tiers | **$0.00** | **$0.00*** |

> \* Using Groq + Gemini free tiers. Paid providers (Claude/GPT-4o) may incur costs at high volume.

### Cost Optimization Tips
- ✅ Lambda ARM64 (Graviton2) = 20% cheaper than x86
- ✅ DynamoDB PAY_PER_REQUEST = no idle costs
- ✅ TTL auto-cleanup = storage stays minimal
- ✅ CloudFront caching = minimal S3 reads
- ✅ Free AI provider tiers = $0 for normal usage

---

## 🗑️ Cleanup / Destroy

To completely remove all AWS resources:

### Using the Deployment Script
```powershell
.\deploy.ps1 -Destroy
```

### Manual Cleanup

```bash
# 1. Empty the S3 bucket (required before deletion)
aws s3 rm s3://nexucv-frontend-bucket-xxxxx --recursive

# 2. Delete the CloudFormation/SAM stack
sam delete --stack-name nexucv-backend --region us-east-1

# 3. Confirm deletion when prompted
# Note: Cognito User Pool has deletion protection.
# If needed, disable it first:
aws cognito-idp update-user-pool \
  --user-pool-id us-east-1_XXXXXXXXX \
  --deletion-protection INACTIVE

# 4. Then delete the stack again
sam delete --stack-name nexucv-backend --region us-east-1 --no-prompts
```

### What Gets Deleted:
- ✅ Lambda functions
- ✅ API Gateway
- ✅ DynamoDB tables (and all data)
- ✅ S3 bucket
- ✅ CloudFront distribution
- ✅ Cognito User Pool (and all user accounts)
- ✅ IAM roles and policies
- ✅ CloudWatch log groups

> ⚠️ **Warning:** This action is irreversible. All user data and accounts will be permanently deleted.

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

### Steps

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make** your changes
4. **Test** thoroughly
   ```bash
   cd frontend && npm run build   # Ensure frontend builds
   cd backend && sam build        # Ensure backend builds
   ```
5. **Commit** with a clear message
   ```bash
   git commit -m "feat: add amazing feature"
   ```
6. **Push** to your branch
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open** a Pull Request

### Guidelines

- Follow existing code style and conventions
- Write meaningful commit messages (conventional commits preferred)
- Update documentation for any new features
- Ensure no secrets are committed
- Test both frontend build and SAM build pass

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Preethi Prasanna

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 👩‍💻 Author

<div align="center">

**Preethi Prasanna**

Developed by Preethi | Built with ❤️ using React, AWS, and AI

*If this project helped you, consider giving it a ⭐!*

</div>

---

<div align="center">

**[⬆ Back to Top](#-nexucv--ai-resume-intelligence-platform)**

</div>

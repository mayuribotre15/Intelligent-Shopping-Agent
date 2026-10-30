# 🛍️ Intelligent Shopping Agentic AI

> **Powered by IBM watsonx.ai · Llama 3.3 70B Instruct · Deployed on IBM Cloud**

A fully functional, web-based Intelligent Shopping Agent that delivers personalised product discovery, multimodal search (text/voice/image), cross-platform price comparison, predictive shopping insights, review analysis, sustainability information, and an interactive **Smart Shopping Pulse** dashboard.

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111%2B-green)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![IBM watsonx.ai](https://img.shields.io/badge/IBM-watsonx.ai-purple)](https://www.ibm.com/watsonx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **Agentic AI** | Multi-step reasoning with intent classification, tool orchestration, and transparent explanations |
| 🔍 **Multimodal Search** | Text query, voice upload (WAV/MP3), and image upload (JPEG/PNG) |
| ⚖️ **Cross-Platform Compare** | Side-by-side comparison across Amazon, eBay, Walmart, Best Buy |
| 📈 **Price Trend Analysis** | Historical price charts with buy-now-or-wait recommendation |
| 🔬 **Review Analysis** | AI review summarisation with pattern detection |
| 🌿 **Sustainability Insights** | Environmental scoring from available product data |
| 📋 **Shopping Lists** | Personalised lists with target-price alerts |
| 📊 **Smart Shopping Pulse** | Live dashboard with trends, savings, and AI-generated insights |
| 🔒 **Responsible AI** | No fabricated data, source + timestamp on all prices, uncertainty disclosed |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                     IBM Cloud                        │
│                                                      │
│  React Frontend  ──▶  FastAPI Backend                │
│  (port 3000)          (port 8000)                    │
│                        │                             │
│              ┌─────────▼──────────────┐              │
│              │  IBM watsonx.ai        │              │
│              │  Llama 3.3 70B         │              │
│              │  au-syd.ml.cloud.ibm.com│             │
│              └────────────────────────┘              │
│                                                      │
│  PostgreSQL (auth + lists)   Redis (cache)           │
└──────────────────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
intelligent-shopping-ai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Settings (pydantic-settings)
│   │   ├── database.py          # Async SQLAlchemy engine
│   │   ├── models/              # ORM models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── api/                 # Route handlers
│   │   ├── agents/              # ShoppingAgent orchestrator
│   │   ├── services/            # watsonx.ai + product aggregator
│   │   ├── multimodal/          # Text / voice / image search
│   │   └── utils/               # JWT auth helpers
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/               # Dashboard, Search, Compare, Agent …
│   │   ├── components/          # Layout, ProductCard, Charts …
│   │   ├── services/api.js      # Axios API client
│   │   └── store/store.js       # Zustand state
│   ├── package.json
│   └── Dockerfile
├── tests/
│   ├── test_api.py
│   └── test_agent.py
├── deployment/
│   ├── deploy-ibmcloud.sh
│   ├── backend-app.yaml
│   └── frontend-app.yaml
├── docker-compose.yml
├── run.bat                      # One-click Windows launcher
└── README.md
```

---

## 🚀 Quick Start (Local)

### Prerequisites
- Python 3.11+
- Node.js 18 or 20
- PostgreSQL 16 *(optional — only needed for auth & shopping lists)*

### Option A — One click (Windows)
```
Double-click  run.bat
```
Opens the backend on `http://localhost:8000` and frontend on `http://localhost:3000`.

---

### Option B — Manual

**Terminal 1 — Backend**
```bash
cd intelligent-shopping-ai/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend**
```bash
cd intelligent-shopping-ai/frontend
npm install --legacy-peer-deps
# First time only — create .env
echo "SKIP_PREFLIGHT_CHECK=true" > .env
echo "REACT_APP_API_URL=/api/v1" >> .env
npm start
```

### Option C — Docker Compose (full stack)
```bash
cd intelligent-shopping-ai
docker-compose up -d
```

---

## 🌐 URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/api/docs |
| Health Check | http://localhost:8000/api/v1/health |

---

## 🧪 Tests

```bash
cd intelligent-shopping-ai/backend
python -m pytest ../tests/ -v
```

Expected: **29 passed** — all agent logic, API endpoints, and data-integrity checks.

---

## 📡 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/auth/register` | POST | Register user |
| `/api/v1/auth/login` | POST | Login → JWT |
| `/api/v1/search/text` | POST | Text product search |
| `/api/v1/search/voice` | POST | Voice search (audio upload) |
| `/api/v1/search/image` | POST | Image search (image upload) |
| `/api/v1/products/search` | GET | Query products by keyword |
| `/api/v1/products/trending` | GET | Trending products |
| `/api/v1/products/{id}/price-history` | GET | Historical price data |
| `/api/v1/products/compare` | POST | AI-powered comparison |
| `/api/v1/products/{id}/reviews/analysis` | GET | Review analysis |
| `/api/v1/products/{id}/sustainability` | GET | Sustainability insights |
| `/api/v1/products/{id}/price-trend-analysis` | GET | Buy-now-or-wait analysis |
| `/api/v1/agent/query` | POST | Agentic AI chat |
| `/api/v1/agent/compare-prices` | GET | Best price across platforms |
| `/api/v1/agent/dashboard` | GET | Smart Shopping Pulse data |
| `/api/v1/preferences/` | GET / PUT | User preferences |
| `/api/v1/lists/` | GET / POST | Shopping lists |
| `/api/v1/lists/alerts` | GET / POST | Price alerts |

---

## 🤖 IBM watsonx.ai Configuration

| Parameter | Value |
|---|---|
| **Model** | `meta-llama/llama-3-3-70b-instruct` |
| **Endpoint** | `https://au-syd.ml.cloud.ibm.com` |
| **Project ID** | `7396b694-7544-4ab3-a0ef-98f74b1ea489` |
| **API Version** | `2024-05-31` |

To override, set these in `backend/.env`:
```env
WATSONX_API_KEY=your_key_here
WATSONX_PROJECT_ID=your_project_id
WATSONX_URL=https://au-syd.ml.cloud.ibm.com
```

---

## ☁️ IBM Cloud Deployment

```bash
cd intelligent-shopping-ai/deployment
chmod +x deploy-ibmcloud.sh
export IBM_API_KEY="your-api-key"
./deploy-ibmcloud.sh
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| AI Model | Llama 3.3 70B Instruct via IBM watsonx.ai |
| Backend | Python 3.11+, FastAPI, SQLAlchemy (async) |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Frontend | React 18, React Router 6, Zustand, Chart.js |
| Auth | JWT (python-jose), bcrypt |
| Container | Docker, docker-compose |
| Deployment | IBM Cloud Code Engine |

---

## 🔒 Responsible AI

- No fabricated data — only authorised product feeds
- Every price includes source platform and fetch timestamp
- All AI forecasts include explicit uncertainty statements
- Review patterns flagged, never claimed as fake
- User confirmation required before any purchase
- Uploaded images/audio processed transiently, not stored

---

## 🤝 Built with IBM Bob

Designed, developed, debugged, tested, and documented using **IBM Bob** — IBM's AI-powered software engineering assistant.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

*Intelligent Shopping Agentic AI · IBM watsonx.ai · Llama 3.3 70B Instruct*

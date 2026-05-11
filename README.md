Primely/README.md
# Primely

Shorten Links. Scan for malware. Track with ease.

**Primely** is a full stack URL Shortner with automatic malware scanning, click event analytics, and a personal dashboard. Built as a portfolio project with FastAPI and Tanstack Start.

---
## Features

- **URL Shortning**: Paste a long URL, get a short link instantly.

- **Malware Scanning**: Every link is scanned for malicious activities via [Google Safe Browsing](https://en.wikipedia.org/wiki/Google_Safe_Browsing) API (v4) before it goes live.

- **Link Management**: Add, view and manage all your shortened links in one place.

- **Click Analytics**: Tracks country and browser for every click. View stats per link or across your whole account.


## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React, Tanstack Start, Tanstack Query, Tanstack Router, Zustand, Tailwind CSS |
| Backend | FastAPI, SQLModel, PostgreSQL |
|Background| APScheduler (in Process) |
| HTTP Client | Httpx |
| Testing | Pytest|

---
## How It Works

An authorized user submits a long URL, it is saved to the database with a status of scanning, the frontend polls every 3 seconds for a result.

A background job is triggered every 10s to fetch links with a status of scanning or failed limited at 500 links from the database.

They are sent at once to the Google Safe Browsing API v4, on successful response, each link status is updated to either active or malicious based on the response got, and a short code is being generated and assigned to the active links, on unsuccessful response, each link status is updated to failed.

The frontend keeps polling every 3 seconds till there are no links with a status of scanning or failed.

Clicks are tracked asynchronously so redirect stays fast, each click resolves the country from the IP and captures the browser, all without adding latency to the redirect itself

---

## Key Decisions

- **APScheduler over Celery**: Running in process background jobs with FastAPI lifespan keeps the dev setup simple. No broker, no redis, no separate service. Right call for a portfolio project.
- **Polling over Websockets**: The scanning flow needs real time feeling, not real time infrastructure. Polling every 3 seconds is invisible to the user and costs nothing extra.
- **Batch Scanning Process**: Scanning links in batches rather than one at a time uses Google Safe Browsing API effectively and respects its rate limits.

---

## Project Structure

```
Primely/
  backend/    # FastAPI backend 
  frontend/   # Tanstack Start frontend app
  README.md   # Project overview and setup instructions
  .gitignore  # Root gitignore for both apps
```

---

## Getting Started

### 1. Clone the Repository

```sh
git clone https://github.com/BuiltByElly/Primely.git
cd Primely
```

---

### 2. Backend Setup

```sh
cd Backend

uv sync

cp .env #fill in DATABASE_URL, DUMMY_PASSWORD, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS, REFRESH_TOKEN_EXPIRE_DAY, ENV, GOOGLE_SAFE_BROWSING_API_KEY

fastapi dev #or uv run uvicorn app.main:app --reload
```

---

### 3. Frontend Setup

```sh
cd Frontend
bun install

# Run the Vite development server
bun run dev     
```

---

## Additional Files

- `.gitignore` — Root ignore file for Python, Node, and OS-specific files.
- Add more documentation as needed (e.g., `docs/`, API specs, etc.).


---

**Built By [Elliot Otoijagha](https://elliot-otoijagha.pxxl.click) (@BuiltByElly)**

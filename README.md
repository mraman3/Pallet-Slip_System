# Pallet Slip Management System
A full-stack production system for creating, managing, and printing delivery slips for a client.  
This system replaces manual slip tracking with a secure, cloud-hosted, business-grade solution.

## 🚀 Live System

**Frontend**
https://pallet-slip-system.vercel.app  

**Backend / API**
https://pallet-slip-system.onrender.com

> 🔒 System is protected with a secure Application Lock.  
Only authorized staff can access it.

## 🧠 System Overview

| Layer        | Tech |
|-------------|------|
| Frontend     | React + TypeScript + Vite + Vercel |
| Backend      | Node.js + Express + TypeScript + Render (Docker) |
| Database     | PostgreSQL (Neon) |
| ORM          | Prisma v7 (adapter architecture) |
| PDF Engine   | Puppeteer + Chromium |
| Security     | Global App Lock + API Gate |
| Monitoring   | Internal Status Dashboard |

This platform is **enterprise-grade**, **client-safe**, and built with **production reliability first**.

# ✨ Core Features
### 🧾 Slip Creation System
- Create new slips
- Edit existing slips
- Multi-item line support
- Auto-assigned slip numbers
- Historical slip lookup
- Pagination + filtering

### 📄 PDF Delivery Slip Generator
- Generates **official printable delivery documents**
- Multi-page support
- Precise formatting
- Embedded branding + fonts
- Runs fully in headless Chromium
- **Sub-second performance**

### 🔒 Security — Application Lock
This is **not a public website**.  
Only staff may access via a password gate.

- Global access token system
- Backend enforcement middleware
- Frontend application lock UI
- Auto-relock on invalid credentials

### 🗄️ Master Data Admin
Includes admin controls for:
- Clients
- Shipping addresses
- Clerks
- Pallet types

### 🧭 Internal Monitoring Dashboard
Reports:
- System health
- DB status + latency
- Puppeteer readiness
- Page pool + usage
- Uptime

# 🌐 Deployment Architecture

### Backend
- Hosted on **Render**
- Dockerized
- Uses Prisma migrations
- Neon PostgreSQL

### Frontend
- Hosted on **Vercel**
- Calls backend via environment variable
- Fully cloud-hosted — no localhost dependency

# 🧪 Stability Notes
- Schema locked + correct
- PDFs stable + optimized
- Production verified
- Error-safe
- Client approved

## 👤 Author
**Aman Braich**




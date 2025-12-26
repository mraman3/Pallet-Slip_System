# 📦 Pallet Slip Management System

A full-stack, production-grade system for creating, managing, and printing delivery slips for a commercial pallet operation.

This platform replaces manual and error-prone slip tracking with a secure, cloud-hosted, business-ready solution designed for real-world operational use.

---

## 🚀 Live System

### Frontend  
https://pallet-slip-system.vercel.app  

### Backend / API  
https://pallet-slip-system.onrender.com  

> 🔒 **Access Controlled**  
> This is a private internal system protected by a secure Application Lock.  
> Only authorized staff may access the platform.

---

## 🧠 System Overview

| Layer        | Technology |
|-------------|------------|
| Frontend     | React, TypeScript, Vite, Vercel |
| Backend      | Node.js, Express, TypeScript, Docker, Render |
| Database     | PostgreSQL (Neon – serverless) |
| ORM          | Prisma v7 (adapter architecture) |
| PDF Engine   | Puppeteer + Headless Chromium |
| Security     | Global Application Lock + API Gate |
| Monitoring   | Internal Status & Health Dashboard |

This system is built with production reliability, data integrity, and operational safety as first-class concerns.

---

## ✨ Core Features

### 🧾 Slip Management
- Create and edit delivery slips
- Multi-item line support
- Auto-assigned, immutable slip numbers
- Historical slip search
- Pagination and advanced filtering

### 📄 PDF Delivery Slip Generator
- Generates official, print-ready delivery slips
- Multi-page support
- Precise layout and formatting
- Embedded branding and custom fonts
- Runs fully in headless Chromium
- Sub-second PDF generation performance

### 🔒 Security — Application Lock
This system is not publicly accessible.

Security includes:
- Global application access token
- Backend middleware enforcement
- Frontend lock screen UI
- Automatic relock on invalid credentials

### 🗄️ Master Data Administration
Admin tools for managing:
- Clients
- Shipping addresses
- Clerks
- Pallet types

### 🧭 Internal Monitoring Dashboard
Live system visibility including:
- Application health
- Database status and latency
- Puppeteer / Chromium readiness
- Page pool usage
- Server uptime

---

## 🗄️ Database Architecture (Neon PostgreSQL)

The system uses Neon, a serverless PostgreSQL platform, for production data storage.

### Database Highlights
- Fully managed cloud-hosted PostgreSQL
- Serverless scaling with zero maintenance
- Secure TLS connections
- Production-safe automated backups
- No local database dependencies

### Prisma Integration
- Prisma v7 with adapter architecture
- Schema locked and validated
- Incremental, migration-only schema changes
- Referential integrity fully enforced
- Production-safe and migration-stable

> ⚠️ **Important:**  
> The database schema is authoritative and must not be recomputed or regenerated.  
> All future changes require incremental Prisma migrations only.

---

## 🌐 Deployment Architecture

### Backend (Render)
- Dockerized Node.js application
- Prisma migrations run against Neon
- Environment-based configuration
- API protected by a global access gate

### Frontend (Vercel)
- Static Vite build
- Environment-based API routing
- Fully cloud-hosted
- No localhost or manual configuration required

---

## 🧪 Stability & Production Notes
- Database schema locked and validated
- PDF generation optimized and stable
- Production tested end-to-end
- Error-safe and fault tolerant
- Client approved and actively used

---

## 👤 Author

**Aman Braich**  
Full-Stack Software Developer

# Lead Outreach Application
## System Architecture & Application Flow Documentation

---

**Document Version:** 1.0  
**Date:** January 2025  
**Application:** Lead Outreach Management System  
**Framework:** Next.js 15 with TypeScript  
**Database:** Supabase (PostgreSQL)  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Application Flow](#application-flow)
4. [Technical Specifications](#technical-specifications)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Security Implementation](#security-implementation)
8. [Deployment Architecture](#deployment-architecture)

---

## Executive Summary

The Lead Outreach Application is a comprehensive email marketing and lead management system designed for high-volume cold email campaigns. The application leverages Gmail Workspace integration for professional email delivery, real-time tracking capabilities, and advanced analytics to optimize outreach performance.

### Key Features
- **Multi-Account Email Sending:** Rotate through multiple Gmail Workspace accounts
- **Advanced Tracking:** Real-time open rates, click rates, and reply tracking
- **Lead Management:** Import, organize, and segment leads effectively
- **Campaign Analytics:** Comprehensive performance metrics and reporting
- **Professional UI:** Modern, responsive interface with dark/light theme support

---

## System Architecture

### High-Level Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 15 App Router + React 19 + TypeScript                 │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Dashboard     │ │   Auth System   │ │   Components    │   │
│  │   - Analytics   │ │   - Login       │ │   - Tables      │   │
│  │   - Campaigns   │ │   - Registration│ │   - Forms       │   │
│  │   - Leads       │ │   - Verification│ │   - Charts      │   │
│  │   - Tracking    │ │                 │ │   - UI Library  │   │
│  │   - Settings    │ │                 │ │                 │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes + Server Actions                           │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Campaign API  │ │   Tracking API  │ │  Analytics API  │   │
│  │   - Start       │ │   - Open Track  │ │   - Metrics     │   │
│  │   - Pause       │ │   - Click Track │ │   - Export      │   │
│  │   - Resume      │ │   - Reply Track │ │   - Reports     │   │
│  │   - Delete      │ │   - Link Track  │ │                 │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │    Lead API     │ │    Auth API     │ │   Settings API  │   │
│  │   - CRUD Ops    │ │   - Login       │ │   - Profile     │   │
│  │   - CSV Import  │ │   - Register    │ │   - Preferences │   │
│  │   - Validation  │ │   - Logout      │ │   - Account     │   │
│  │   - Bulk Ops    │ │   - Session     │ │                 │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BUSINESS LOGIC LAYER                      │
├─────────────────────────────────────────────────────────────────┤
│  Service Classes + Utility Functions                           │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │Gmail Workspace  │ │   Email Utils   │ │   Validators    │   │
│  │   - Multi-Acc   │ │   - Templates   │ │   - Email       │   │
│  │   - Rotation    │ │   - Tracking    │ │   - Forms       │   │
│  │   - Rate Limits │ │   - Links       │ │   - Data        │   │
│  │   - Auth        │ │   - Variables   │ │                 │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │  Analytics      │ │  Campaign Mgmt  │ │   Lead Mgmt     │   │
│  │   - Metrics     │ │   - Scheduling  │ │   - Import      │   │
│  │   - Reports     │ │   - Templates   │ │   - Validation  │   │
│  │   - Export      │ │   - Execution   │ │   - Segmentation│   │
│  │   - Benchmarks  │ │   - Tracking    │ │   - Status      │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA ACCESS LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Supabase Client + Server Integration                          │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Client SDK    │ │   Server SDK    │ │   Middleware    │   │
│  │   - Browser     │ │   - API Routes  │ │   - Auth Check  │   │
│  │   - Real-time   │ │   - Server Comp │ │   - Session     │   │
│  │   - Auth        │ │   - Database    │ │   - Routing     │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL) + Row Level Security                    │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │     Users       │ │     Leads       │ │   Campaigns     │   │
│  │   - id (PK)     │ │   - id (PK)     │ │   - id (PK)     │   │
│  │   - email       │ │   - name        │ │   - name        │   │
│  │   - created_at  │ │   - email       │ │   - subject     │   │
│  │   - updated_at  │ │   - company     │ │   - html        │   │
│  │                 │ │   - status      │ │   - status      │   │
│  │                 │ │   - user_id(FK) │ │   - user_id(FK) │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Email Tracking  │ │ Campaign Leads  │ │ Link Tracking   │   │
│  │   - id (PK)     │ │   - id (PK)     │ │   - id (PK)     │   │
│  │   - lead_id(FK) │ │   - campaign_id │ │   - tracking_id │   │
│  │   - campaign_id │ │   - lead_id(FK) │ │   - original_url│   │
│  │   - opened_at   │ │   - status      │ │   - clicked_at  │   │
│  │   - clicked_at  │ │   - sent_at     │ │   - ip_address  │   │
│  │   - replied_at  │ │                 │ │   - user_agent  │   │
│  │   - sender_email│ │                 │ │                 │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

### Technology Stack

**Frontend:**
- Next.js 15 (App Router)
- React 19
- TypeScript 5.0
- Tailwind CSS 4.0
- Shadcn/UI Components
- Recharts for Analytics
- Next-themes for Theme Management

**Backend:**
- Next.js API Routes
- Server Actions
- Supabase Integration
- Gmail Workspace SMTP
- Nodemailer for Email Sending

**Database:**
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Real-time Subscriptions
- Automatic Backups

**Infrastructure:**
- Vercel Deployment
- Environment Variables
- GitHub Integration
- Automatic CI/CD

---

## Application Flow

### 1. User Authentication Flow

\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Landing     │───▶│ Login/      │───▶│ Email       │───▶│ Dashboard   │
│ Page        │    │ Signup      │    │ Verification│    │ Access      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Redirect    │    │ Supabase    │    │ Email       │    │ Protected   │
│ Logic       │    │ Auth        │    │ Confirm     │    │ Routes      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
\`\`\`

### 2. Lead Management Flow

\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Add Lead    │───▶│ Validate    │───▶│ Store in    │───▶│ Available   │
│ (Manual/CSV)│    │ Email       │    │ Database    │    │ for Campaign│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Form Input/ │    │ Format      │    │ Supabase    │    │ Campaign    │
│ CSV Parse   │    │ Check       │    │ Insert      │    │ Selection   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
\`\`\`

### 3. Campaign Creation & Execution Flow

\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Create      │───▶│ Select      │───▶│ Start       │───▶│ Email       │
│ Campaign    │    │ Leads       │    │ Campaign    │    │ Sending     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Template    │    │ Lead        │    │ Gmail       │    │ Track       │
│ Creation    │    │ Targeting   │    │ Rotation    │    │ Results     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Variables   │    │ Campaign    │    │ Multi-      │    │ Email       │
│ & Content   │    │ Leads Table │    │ Account     │    │ Tracking    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
\`\`\`

### 4. Email Tracking Flow

\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Email Sent  │───▶│ Tracking    │───▶│ Open        │───▶│ Click       │
│             │    │ Pixel       │    │ Detection   │    │ Tracking    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Database    │    │ Pixel Load  │    │ Update      │    │ Link        │
│ Record      │    │ Event       │    │ Database    │    │ Redirect    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Tracking ID │    │ API Call    │    │ Timestamp   │    │ Analytics   │
│ Generation  │    │ to Server   │    │ Recording   │    │ Update      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
\`\`\`

### 5. Analytics & Reporting Flow

\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Raw Data    │───▶│ Data        │───▶│ Visualization│───▶│ Export      │
│ Collection  │    │ Aggregation │    │ & Charts    │    │ Functionality│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Database    │    │ SQL         │    │ Recharts    │    │ CSV/JSON    │
│ Queries     │    │ Calculations│    │ Components  │    │ Download    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
\`\`\`

### 6. Gmail Workspace Integration Flow

\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Load        │───▶│ Validate    │───▶│ Rotate      │───▶│ Send Email  │
│ Accounts    │    │ Credentials │    │ Selection   │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Environment │    │ App         │    │ Round Robin │    │ SMTP        │
│ Variables   │    │ Passwords   │    │ Algorithm   │    │ Connection  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ JSON Parse  │    │ Connection  │    │ Daily Limit │    │ Track Usage │
│ & Validate  │    │ Test        │    │ Management  │    │ & Results   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
\`\`\`

---

## Technical Specifications

### Performance Requirements
- **Page Load Time:** < 2 seconds
- **Email Sending Rate:** Up to 2000 emails/day per Gmail account
- **Concurrent Users:** Supports 100+ simultaneous users
- **Database Response:** < 500ms for standard queries

### Scalability Features
- **Horizontal Scaling:** Multi-account Gmail rotation
- **Database Optimization:** Indexed queries and RLS policies
- **Caching Strategy:** Next.js built-in caching and Supabase edge functions
- **CDN Integration:** Vercel Edge Network for global performance

### Security Measures
- **Authentication:** Supabase Auth with JWT tokens
- **Authorization:** Row Level Security (RLS) policies
- **Data Encryption:** TLS 1.3 for data in transit
- **Input Validation:** Server-side validation for all inputs
- **CSRF Protection:** Built-in Next.js CSRF protection

---

## Database Schema

### Core Tables

**users**
\`\`\`sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**leads**
\`\`\`sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**campaigns**
\`\`\`sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

**email_tracking**
\`\`\`sql
CREATE TABLE email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  tracking_id VARCHAR(255) UNIQUE NOT NULL,
  sender_email VARCHAR(255),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE
);
\`\`\`

### Indexes for Performance
\`\`\`sql
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_email_tracking_campaign_id ON email_tracking(campaign_id);
CREATE INDEX idx_email_tracking_lead_id ON email_tracking(lead_id);
CREATE INDEX idx_email_tracking_tracking_id ON email_tracking(tracking_id);
\`\`\`

---

## API Documentation

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/user` - Get current user

### Campaign Management
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create new campaign
- `PUT /api/campaigns/[id]` - Update campaign
- `DELETE /api/campaigns/[id]` - Delete campaign
- `POST /api/campaigns/[id]/start` - Start campaign
- `POST /api/campaigns/[id]/pause` - Pause campaign

### Lead Management
- `GET /api/leads` - List all leads
- `POST /api/leads` - Create new lead
- `PUT /api/leads/[id]` - Update lead
- `DELETE /api/leads/[id]` - Delete lead
- `POST /api/leads/import` - Import leads from CSV

### Tracking Endpoints
- `GET /api/track/open` - Track email opens
- `GET /api/track/click` - Track link clicks
- `POST /api/track/reply` - Mark email as replied

### Analytics Endpoints
- `GET /api/analytics/metrics` - Get campaign metrics
- `GET /api/analytics/export` - Export analytics data

---

## Security Implementation

### Authentication & Authorization
- **Supabase Auth:** JWT-based authentication system
- **Row Level Security:** Database-level access control
- **Session Management:** Secure session handling with httpOnly cookies
- **Password Security:** Bcrypt hashing with salt rounds

### Data Protection
- **Input Sanitization:** XSS protection on all user inputs
- **SQL Injection Prevention:** Parameterized queries only
- **CORS Configuration:** Restricted cross-origin requests
- **Rate Limiting:** API endpoint rate limiting

### Email Security
- **SMTP Authentication:** App passwords for Gmail Workspace
- **TLS Encryption:** Encrypted email transmission
- **SPF/DKIM Records:** Email authentication protocols
- **Bounce Handling:** Automatic bounce detection and handling

---

## Deployment Architecture

### Production Environment
- **Platform:** Vercel Edge Network
- **Database:** Supabase Cloud (Multi-region)
- **CDN:** Vercel Edge Functions
- **Monitoring:** Built-in Vercel Analytics
- **Backup:** Automated daily backups

### Environment Configuration
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GMAIL_WORKSPACE_ACCOUNTS=json_array_of_accounts
NEXT_PUBLIC_APP_URL=your_app_url
\`\`\`

### CI/CD Pipeline
1. **Code Push:** GitHub repository update
2. **Automatic Build:** Vercel build process
3. **Testing:** Automated test suite execution
4. **Deployment:** Zero-downtime deployment
5. **Monitoring:** Real-time performance monitoring

---

**Document End**

*This document serves as the comprehensive technical specification for the Lead Outreach Application. For updates or modifications, please refer to the development team.*

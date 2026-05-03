# TabRelay Rental Management - Deployment Guide

## Overview
TabRelay Rental Management is a comprehensive property management platform for landlords.

## Requirements
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Environment Variables

Create a `.env` file with the following:

```env
DATABASE_URL=postgresql://username:password@host:5432/database_name
SESSION_SECRET=your-secure-random-string-here
NODE_ENV=production
PORT=5000
```

## Database Setup

1. Create a PostgreSQL database
2. Run the schema setup:

```bash
npm install
npx drizzle-kit push
```

The schema file (`schema.ts`) contains all table definitions.

## Installation & Running

```bash
# Install dependencies
npm install --production

# Start the server
node index.cjs
```

The app will be available at `http://localhost:5000`

## Features
- Public landing page with rental application forms
- Landlord authentication portal
- Property management with owner information
- Tenant tracking with archive functionality
- Payment recording with automated receipts
- Expense tracking with categories
- Viewing scheduling
- Email template customization
- Tax reports with PDF export
- Application-to-tenant conversion workflow

## Hosting on Custom Domain

After deploying to your server:
1. Point your DNS A record for `rentals.tabelay.com` to your server's IP
2. Set up SSL/TLS (recommend using Certbot/Let's Encrypt)
3. Configure your reverse proxy (nginx/Apache) to forward to port 5000

## File Structure
```
deployment/
├── index.cjs           # Compiled server
├── public/             # Built frontend assets
├── package.json        # Dependencies
├── schema.ts           # Database schema
├── drizzle.config.ts   # Drizzle ORM config
├── uploads/            # Upload directory
│   └── receipts/       # Expense receipt uploads
└── README.md           # This file
```

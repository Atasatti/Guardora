# Guardora web dashboard

Guardora Control is a Next.js 15 admin dashboard for managing a smart residential community.
It includes security monitoring, visitor management, maintenance, facilities, billing, announcements, moderation, social, and messaging workflows.

## Tech Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- shadcn/ui + Radix UI components
- Server Actions for backend API integration
- Socket.IO client + WebSocket integrations for real-time modules

## Main Modules

- Dashboard overview + analytics
- User management (view/create/edit/delete + profile details)
- Messages and chat
- Surveillance and live alert feed
- Alerts and logs review
- Visitor logs
- Safety map
- Maintenance tickets (table + kanban)
- Facility booking management
- Finance and billing
- Announcements
- Content moderation
- AI Model Lab for controlled text, image, and video inference
- Ads and social content management
- Account settings

## Prerequisites

- Node.js 20+
- npm

## Environment Variables

Copy `.env.example` to `.env.local` and configure the backend, Socket.IO, and
AI WebSocket endpoints. Values prefixed with `NEXT_PUBLIC_` are visible in the
browser and must never contain credentials.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the local URL printed by Next.js.

## Available Scripts

```bash
npm run dev    # Start local development server (Turbopack)
npm run build  # Production build (Turbopack)
npm run start  # Start production server
npm run lint   # Run ESLint
```

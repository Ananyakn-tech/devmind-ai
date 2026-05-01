# 🧠 DevMind — AI Developer Platform
 
> An AI-powered developer productivity platform built with Next.js 14, Express, Anthropic Claude API, Socket.io & PostgreSQL.

---
 
## 🚀 Features
 
- **AI Code Review** — Instant intelligent feedback on your code with severity ratings, line-by-line suggestions, and security analysis
- **Doc Generator** — Auto-generate README, JSDoc, docstrings, and API docs from your code in seconds
- **Bug Tracker** — Kanban-style bug tracker with AI-suggested fixes
- **Team Workspace** — Invite your team, assign roles, and collaborate in real-time
- **Real-time Updates** — Live collaboration with Socket.io
- **Analytics Dashboard** — Track productivity with detailed metrics and activity feeds
---
 
## 🛠 Tech Stack
 
| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| AI | Anthropic Claude API |
| Real-time | Socket.io |
| Auth | JWT (JSON Web Tokens) |
| DevOps | Docker, Docker Compose |
 
---
 
## 📁 Project Structure
 
```
devmind/
├── backend/
│   ├── src/
│   │   ├── routes/        # Express route handlers
│   │   ├── middleware/    # Auth, error handling
│   │   └── lib/           # Prisma, Socket.io setup
│   └── prisma/
│       ├── schema.prisma  # Database schema
│       └── seed.ts        # Demo data seeder
├── frontend/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   └── lib/               # API client, utilities
└── docker-compose.yml
```
 
---
 
## 🔑 Key Concepts Demonstrated
 
- **Full-stack TypeScript** — end-to-end type safety across frontend and backend
- **AI/LLM Integration** — Anthropic Claude API for code review and doc generation
- **Real-time features** — Socket.io for live collaboration
- **Database design** — PostgreSQL with Prisma ORM, migrations, and seeding
- **REST API design** — JWT authentication, rate limiting, input validation with Zod
- **Modern React** — App Router, Zustand state management, custom hooks
---
 
## 🙋‍♀️ Author
 
Built by **Ananya** as a full-stack portfolio project.
 

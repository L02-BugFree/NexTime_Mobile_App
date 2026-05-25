# NexTime Backend API

Production-ready NestJS REST API for NexTime productivity app - Group Schedule Heatmap & AI Checklists.

## Features
- Modular architecture: schedule, checklist, group modules
- Mongoose ODM with discriminators for event/checklist subtypes
- Full Swagger/OpenAPI docs at `/api-docs`
- DTOs with class-validator & @ApiProperty
- Global validation pipe
- ConfigModule for .env (MongoDB Atlas)
- Docker & docker-compose ready (local Mongo)
- Controller-Service pattern

## Quick Start

1. Setup .env from `.env.example` with your MongoDB URI:
   ```
   MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/nextime
   PORT=3000
   ```

2. Install & run:
   ```
   cd backend
   npm install
   npm run start:dev
   ```

3. Open http://localhost:3000/api-docs

## Key APIs

**Schedule:**
- `POST /schedule/weekly` - Create weekly event (DTO validated)
- `POST /schedule/oneshot` - One-shot event
- `GET /schedule` - List
- `GET /schedule/heatmap/:groupId` - Aggregate busy count heatmap stub

**Checklist:**
- `POST /checklists/preview` body `{prompt: 'split $20 dinner with Alice'}` - Mock AI parse
- `POST /checklists/confirm` - Save preview

**Group:**
- `POST /group` - Create
- `GET /group/heatmap/:id`

## Docker

```
docker-compose up -d
```

Local Mongo + app.

## Production

```
npm run build
npm run start:prod
```

Multi-stage Dockerfile ready for cloud.

## Folder Structure

```
src/
├── configs/     - DB config
├── common/      - Guards/filters (stub)
├── modules/
│   ├── schedule/ - Events CRUD + Heatmap
│   ├── checklist/ - AI preview + types
│   └── group/
├── app.module.ts
└── main.ts (Swagger + Pipes)
```

SOLID, enterprise-ready. Extend with auth (JWT), User module.

All core requirements implemented.

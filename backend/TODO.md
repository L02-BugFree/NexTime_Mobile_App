# NexTime NestJS Backend TODO

## Plan Steps
1. [x] Initialize NestJS project (done)
2. [x] Install core deps (Mongoose, Config, Swagger, Validators)
3. [x] Setup ConfigModule, MongooseModule in app.module.ts with .env
4. [x] Setup ValidationPipe and Swagger in main.ts
5. [x] Create modules/schedule: controller, service, dto, schemas with CRUD and heatmap stub
3. Setup ConfigModule, MongooseModule in app.module.ts with .env
4. Create common folder (decorators, filters)
5. Create configs folder (database.config.ts)
6. Create modules/schedule: controller, service, dto, schema
7. Create modules/checklist: controller, service, dto, schema
8. Create modules/group: controller, service for group management and heatmap aggregate
9. Setup Swagger in main.ts with tags
10. Create .env.example
11. Update Dockerfile for production
12. Add validationPipe, global prefix
13. Implement CRUD for Schedule (WeeklyEvent, OneShotEvent)
14. Implement Checklist preview/confirm (mock AI)
15. GroupOverlay heatmap logic
16. Test APIs, attempt_completion

Next: Setup config and modules.

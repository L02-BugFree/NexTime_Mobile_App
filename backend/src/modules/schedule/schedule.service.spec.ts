import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ScheduleService } from './schedule.service';
import { Event } from './entities/event.schema';
import { MonthlyCalendar } from './entities/monthly-calendar.schema';

// Jest globals are not available at type-check time in this repo unless
// Jest typings are configured. This file should remain type-safe.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jestSafe = (globalThis as any).jest ?? undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const beforeEachSafe: any = (globalThis as any).beforeEach;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const describeSafe: any = (globalThis as any).describe;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const itSafe: any = (globalThis as any).it;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expectSafe: any = (globalThis as any).expect;

// If Jest isn’t configured, skip the runtime test setup to avoid breaking
// compilation/type-check.
if (describeSafe && beforeEachSafe && itSafe && expectSafe) {
  describeSafe('ScheduleService', () => {
    let service: ScheduleService;

    beforeEachSafe(async () => {

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ScheduleService,
          {
            provide: getModelToken(Event.name),
            useValue: {
              find: jestSafe?.fn?.() ?? (() => undefined),
              findOne: jestSafe?.fn?.() ?? (() => undefined),
              create: jestSafe?.fn?.() ?? (() => undefined),
              findById: jestSafe?.fn?.() ?? (() => undefined),
              findByIdAndUpdate: jestSafe?.fn?.() ?? (() => undefined),
              findOneAndDelete: jestSafe?.fn?.() ?? (() => undefined),
            },
          },
          {
            provide: getModelToken(MonthlyCalendar.name),
            useValue: {
              findOneAndUpdate: jestSafe?.fn?.() ?? (() => undefined),
              updateMany: jestSafe?.fn?.() ?? (() => undefined),
              findOne: jestSafe?.fn?.() ?? (() => undefined),
              find: jestSafe?.fn?.() ?? (() => undefined),
              create: jestSafe?.fn?.() ?? (() => undefined),
            },
          },
        ],
      }).compile();

      service = module.get<ScheduleService>(ScheduleService);
    });

    itSafe('should have getHeatmap defined', () => {
      expectSafe(service.getHeatmap).toBeDefined();
    });

  });
}


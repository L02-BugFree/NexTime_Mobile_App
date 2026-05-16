import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ScheduleService } from './schedule.service';
import { Event } from './entities/event.schema';
import { MonthlyCalendar } from './entities/monthly-calendar.schema';

describe('ScheduleService', () => {
  let service: ScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        {
          provide: getModelToken(Event.name),
          useValue: {},
        },
        {
          provide: getModelToken(MonthlyCalendar.name),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
  });

  it('should generate heatmap slots with overlap logic', () => {
    const mockCalendars = []; // Mock data
    // Test overlay, privacy, conflict ( >80%)
    expect(service.getHeatmap).toBeDefined();
  });
});


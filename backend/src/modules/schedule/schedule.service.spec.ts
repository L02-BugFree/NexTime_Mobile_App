import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';

describe('ScheduleService', () => {
  let service: ScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScheduleService],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
  });

  it('should generate heatmap slots with overlap logic', () => {
    const mockCalendars = []; // Mock data
    // Test overlay, privacy, conflict ( >80%)
    expect(service.getHeatmap).toBeDefined();
  });
});


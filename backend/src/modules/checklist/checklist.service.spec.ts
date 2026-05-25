import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { Checklist } from './entities/checklist.schema';

describe('ChecklistService', () => {
  let service: ChecklistService;
  let checklistModel: any;
  let saveMock: jest.Mock;

  beforeEach(async () => {
    saveMock = jest.fn().mockResolvedValue({ _id: 'c1', type: 'task' });

    const checklistModelMock: any = jest.fn().mockImplementation((data) => ({
      ...data,
      save: saveMock,
    }));

    checklistModelMock.find = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistService,
        {
          provide: getModelToken(Checklist.name),
          useValue: checklistModelMock,
        },
      ],
    }).compile();

    service = module.get<ChecklistService>(ChecklistService);
    checklistModel = module.get(getModelToken(Checklist.name));
  });

  it('returns task preview by default', async () => {
    const result = await service.preview('prepare grocery list');
    expect(result.type).toBe('task');
    expect(result.parsedData).toEqual([]);
  });

  it('returns payment preview for money prompts', async () => {
    const result = await service.preview('split money for dinner');
    expect(result.type).toBe('payment');
  });

  it('returns poll preview for vote prompts', async () => {
    const result = await service.preview('create a poll and vote');
    expect(result.type).toBe('poll');
  });

  it('throws for missing tasks in task checklist', async () => {
    await expect(service.confirm({ type: 'task' }, 'u1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws for missing debtors in payment checklist', async () => {
    await expect(service.confirm({ type: 'payment' }, 'u1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws for missing options in poll checklist', async () => {
    await expect(service.confirm({ type: 'poll' }, 'u1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('saves valid task checklist', async () => {
    const dto = {
      type: 'task',
      title: 'Sprint Tasks',
      tasks: [{ taskName: 'Write tests', assignees: ['u1'] }],
    };

    const result = await service.confirm(dto, 'u1');

    expect(saveMock).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ _id: 'c1', type: 'task' });
  });

  it('findAllForUser applies ownership/assignee/debtor filter', async () => {
    const exec = jest.fn().mockResolvedValue([{ _id: 'c1' }]);
    checklistModel.find.mockReturnValue({ exec });

    const result = await service.findAllForUser('u1');

    expect(checklistModel.find).toHaveBeenCalledWith({
      $or: [{ creatorId: 'u1' }, { 'tasks.assignees': 'u1' }, { 'debtors.name': 'u1' }],
    });
    expect(result).toEqual([{ _id: 'c1' }]);
  });

  it('findAll returns all checklists', async () => {
    const exec = jest.fn().mockResolvedValue([{ _id: 'c1' }, { _id: 'c2' }]);
    checklistModel.find.mockReturnValue({ exec });

    const result = await service.findAll();

    expect(checklistModel.find).toHaveBeenCalledWith();
    expect(result).toEqual([{ _id: 'c1' }, { _id: 'c2' }]);
  });
});

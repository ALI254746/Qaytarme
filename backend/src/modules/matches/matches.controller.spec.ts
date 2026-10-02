import { Test, TestingModule } from '@nestjs/testing';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

describe('MatchesController', () => {
  let controller: MatchesController;
  const matchesService = {
    getUserMatches: jest.fn(),
    markUserMatchesRead: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchesController],
      providers: [{ provide: MatchesService, useValue: matchesService }],
    }).compile();

    controller = module.get<MatchesController>(MatchesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('marks the authenticated user’s matches as read', async () => {
    const userId = 'user-id';
    matchesService.markUserMatchesRead.mockResolvedValue({ modifiedCount: 2 });

    await expect(controller.markAllRead({ user: { id: userId } })).resolves.toEqual({
      modifiedCount: 2,
    });
    expect(matchesService.markUserMatchesRead).toHaveBeenCalledWith(userId);
  });
});

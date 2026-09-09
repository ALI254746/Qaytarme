import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Ariza } from '../../schemas/ariza.schema';
import { Match } from '../../schemas/match.schema';
import { MatchesService } from './matches.service';

describe('MatchesService', () => {
  let service: MatchesService;
  let matchModel: {
    exists: jest.Mock;
    create: jest.Mock;
  };
  let arizaModel: {
    find: jest.Mock;
  };

  beforeEach(async () => {
    matchModel = {
      exists: jest.fn().mockResolvedValue(false),
      create: jest.fn().mockResolvedValue({}),
    };
    arizaModel = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        { provide: getModelToken(Match.name), useValue: matchModel },
        { provide: getModelToken(Ariza.name), useValue: arizaModel },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
  });

  it('creates a real match using category and explainable scoring', async () => {
    const lostId = new Types.ObjectId();
    const foundId = new Types.ObjectId();
    const lostUser = new Types.ObjectId();
    const foundUser = new Types.ObjectId();
    const lostItem = {
      _id: lostId,
      user: lostUser,
      status: 'lost',
      moderationStatus: 'approved',
      category: 'tech',
      itemType: 'Samsung S23',
      itemName: 'Qora Samsung telefon',
      itemDescription: 'Samsung Galaxy S23 256 GB',
      region: 'Toshkent',
      district: 'Chilonzor',
      location: 'Chilonzor metro',
      coordinates: { lat: 41.275, lng: 69.203 },
      date: '2026-09-09',
      createdAt: new Date('2026-09-09T10:00:00Z'),
    } as Ariza;
    const foundItem = {
      _id: foundId,
      user: foundUser,
      status: 'found',
      moderationStatus: 'approved',
      category: 'tech',
      itemType: 'samsung galaxy s23',
      itemName: 'Qora telefon topildi',
      itemDescription: 'Samsung S23 qora 256gb',
      region: 'Tashkent',
      district: 'Chilanzar',
      location: 'Chilonzor metro oldi',
      coordinates: { lat: 41.276, lng: 69.204 },
      date: '2026-09-10',
      createdAt: new Date('2026-09-10T08:00:00Z'),
    };

    arizaModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([foundItem]),
    });

    const result = await service.findAndCreateMatches(lostItem);

    expect(result).toEqual([foundId]);
    expect(arizaModel.find).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'found', category: 'tech' }),
    );
    expect(matchModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        lostItem: lostId,
        foundItem: foundId,
        similarity: expect.any(Number),
        reason: expect.stringContaining('Kategoriya'),
      }),
    );
  });

  it('does not create a match when category signals conflict', async () => {
    const newItem = {
      _id: new Types.ObjectId(),
      user: new Types.ObjectId(),
      status: 'lost',
      category: 'docs',
      itemType: 'pasport',
      itemDescription: 'AA 1234567 pasport',
      createdAt: new Date(),
    } as Ariza;
    const candidate = {
      _id: new Types.ObjectId(),
      user: new Types.ObjectId(),
      status: 'found',
      category: 'docs',
      itemType: 'haydovchilik guvohnomasi',
      itemDescription: 'prava AB 7654321',
      createdAt: new Date(),
    };

    arizaModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([candidate]),
    });

    await expect(service.findAndCreateMatches(newItem)).resolves.toEqual([]);
    expect(matchModel.create).not.toHaveBeenCalled();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ArizaService } from './ariza.service';

describe('ArizaService', () => {
  let service: ArizaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArizaService],
    }).compile();

    service = module.get<ArizaService>(ArizaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

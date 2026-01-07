import { Test, TestingModule } from '@nestjs/testing';
import { ArizaController } from './ariza.controller';

describe('ArizaController', () => {
  let controller: ArizaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArizaController],
    }).compile();

    controller = module.get<ArizaController>(ArizaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

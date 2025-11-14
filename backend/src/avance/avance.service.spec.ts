import { Test, TestingModule } from '@nestjs/testing';
import { AvanceService } from './avance.service';
import { AvanceBackupRepository } from '../db/bkp/avance-backup.repository';
import { HttpModule } from '@nestjs/axios';
describe('AvanceService', () => {
  let service: AvanceService;
  let mockAvanceBackupRepository: jest.Mocked<AvanceBackupRepository>;

  beforeEach(async () => {
    mockAvanceBackupRepository = {
      upsert: jest.fn(),
      get: jest.fn(),
    } as any;


    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        AvanceService,

        { provide: AvanceBackupRepository, useValue: mockAvanceBackupRepository },
      ],
    }).compile();

    service = module.get<AvanceService>(AvanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

});

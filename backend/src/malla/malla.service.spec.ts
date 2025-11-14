import { HttpModule } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { MallaBackupRepository } from '../db/bkp/malla-backup.repository';
import { MallaService } from './malla.service';
import { MallaBackupRepository } from '../db/bkp/malla-backup.repository';
import { HttpModule } from '@nestjs/axios';
 
class MallaDto {
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
  prereq: string;
} 

describe('MallaService', () => {
  let service: MallaService;
  let mockMallaRepository: jest.Mocked<MallaBackupRepository>;

  beforeEach(async () => {
    mockMallaRepository = {
      get: jest.fn(),
      upsert: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        MallaService,
        { provide: MallaBackupRepository, useValue: mockMallaRepository },
      ],
    }).compile();

    service = module.get<MallaService>(MallaService);
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();

  });

  it('getMalla usa stub en tests', async () => {
    const result = (await service.getMalla('8606', '201610')) as any[];

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]).toHaveProperty('codigo');
    expect(result[0]).toHaveProperty('asignatura');
  });
});

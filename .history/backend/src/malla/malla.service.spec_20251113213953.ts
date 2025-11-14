import { HttpModule } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { MallaBackupRepository } from '../db/bkp/malla-backup.repository';
import { MallaService } from './malla.service';

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
    } as any


    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [MallaService, { provide: MallaBackupRepository, useValue: mockMallaRepository }],
    }).compile();

    service = module.get<MallaService>(MallaService);
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();

  });
  it('getMallas ', async () => {

    expect(service.getMalla("8606", "201610")).toMatchObject(Array(MallaDto));

  })
});

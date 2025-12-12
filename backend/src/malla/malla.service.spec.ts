import { HttpService } from "@nestjs/axios";
import { HttpException } from "@nestjs/common";
import { TestingModule, Test } from "@nestjs/testing";
import { AxiosResponse } from "axios";
import { of, throwError } from "rxjs";
import { MallaBackupRepository } from "../db/bkp/malla-backup.repository";
import { MallaService } from "./malla.service";

// Mock data
const mockMallaData = [
  {
    codigo: 'DCCB-00107',
    asignatura: 'Algebra I',
    creditos: 6,
    nivel: 1,
    prereq: '',
  },
  {
    codigo: 'DCCB-00106',
    asignatura: 'Calculo I',
    creditos: 6,
    nivel: 1,
    prereq: '',
  },
];

describe('MallaService', () => {
  let service: MallaService;
  let mockMallaRepository: jest.Mocked<MallaBackupRepository>;
  let mockHttpService: jest.Mocked<HttpService>;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    process.env.USE_STUBS = 'false';
    process.env.USE_BACKUP_FALLBACK = 'false';
    process.env.UCN_BASE_HAWAII = 'https://api.ucn.cl';
    process.env.HAWAII_AUTH = 'test-auth-token';

    mockHttpService = {
      get: jest.fn(),
    } as any;

    mockMallaRepository = {
      get: jest.fn(),
      upsert: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MallaService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: MallaBackupRepository, useValue: mockMallaRepository },
      ],
    }).compile();

    service = module.get<MallaService>(MallaService);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMalla', () => {
    describe('when USE_STUBS is true', () => {
      // Use nested beforeEach to set env AFTER parent beforeEach
      beforeEach(() => {
        process.env.USE_STUBS = 'true';
      });

      it('should return stub data without HTTP call', async () => {
        const result = await service.getMalla('8606', '201610');

        expect(Array.isArray(result)).toBe(true);
        expect((result as any[]).length).toBeGreaterThanOrEqual(2);
        expect((result as any[])[0]).toHaveProperty('codigo');
        expect((result as any[])[0]).toHaveProperty('asignatura');
        // HTTP should NOT be called when using stubs
        expect(mockHttpService.get).not.toHaveBeenCalled();
      });
    });

    describe('when USE_STUBS is false (HTTP calls)', () => {
      beforeEach(() => {
        process.env.USE_STUBS = 'false';
      });

      it('should return malla data on successful API call', async () => {
        const mockAxiosResponse: AxiosResponse = {
          data: mockMallaData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        };

        mockHttpService.get.mockReturnValue(of(mockAxiosResponse));

        const result = await service.getMalla('8606', '201610');

        expect(result).toEqual(mockMallaData);
        expect(mockHttpService.get).toHaveBeenCalledWith(
          expect.stringContaining('https://api.ucn.cl/mallas?8606-201610'),
          expect.objectContaining({
            headers: { 'X-HAWAII-AUTH': 'test-auth-token' },
          })
        );
      });

      it('should throw HttpException on API error', async () => {
        const mockError = {
          response: {
            status: 500,
            data: { message: 'Internal server error' },
          },
        };

        mockHttpService.get.mockReturnValue(throwError(() => mockError));

        await expect(service.getMalla('8606', '201610')).rejects.toThrow(HttpException);

        try {
          await service.getMalla('8606', '201610');
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getStatus()).toBe(500);
        }
      });

      it('should throw HttpException with 502 when no response status', async () => {
        const mockError = { response: undefined };

        mockHttpService.get.mockReturnValue(throwError(() => mockError));

        try {
          await service.getMalla('8606', '201610');
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getStatus()).toBe(502);
          expect(error.getResponse()).toEqual({ message: 'error malla ucn' });
        }
      });
    });

    describe('when USE_BACKUP_FALLBACK is true', () => {
      beforeEach(() => {
        process.env.USE_STUBS = 'false';
        process.env.USE_BACKUP_FALLBACK = 'true';
      });

      it('should return backup data when API fails and backup exists', async () => {
        const backupData = { data: mockMallaData };
        mockMallaRepository.get.mockResolvedValue(backupData as any);

        const mockError = {
          response: { status: 500, data: { message: 'error' } },
        };
        mockHttpService.get.mockReturnValue(throwError(() => mockError));

        const result = await service.getMalla('8606', '201610');

        expect(result).toEqual(mockMallaData);
        expect(mockMallaRepository.get).toHaveBeenCalledWith('8606', '201610');
      });

      it('should throw HttpException when API fails and no backup exists', async () => {
        mockMallaRepository.get.mockResolvedValue(null);

        const mockError = {
          response: { status: 502, data: { message: 'gateway error' } },
        };
        mockHttpService.get.mockReturnValue(throwError(() => mockError));

        await expect(service.getMalla('8606', '201610')).rejects.toThrow(HttpException);
      });
    });
  });
});
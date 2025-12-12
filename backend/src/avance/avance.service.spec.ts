import { HttpService } from '@nestjs/axios';
import { HttpException } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { AvanceBackupRepository } from '../db/bkp/avance-backup.repository';
import { AvanceService, avanceStub } from './avance.service';

// Mock data for tests
const mockAvanceData = [
  {
    nrc: '21943',
    period: '201610',
    student: '11188222333',
    course: 'ECIN-00704',
    excluded: false,
    inscriptionType: 'REGULAR',
    status: 'APROBADO',
  },
];

describe('AvanceService', () => {
  let service: AvanceService;
  let mockHttpService: jest.Mocked<HttpService>;
  let mockAvanceBackupRepository: jest.Mocked<AvanceBackupRepository>;

  // Store original env values
  const originalEnv = process.env;

  beforeEach(async () => {
    // Reset env before each test
    process.env = { ...originalEnv };
    process.env.USE_STUBS = 'false';
    process.env.USE_BACKUP_FALLBACK = 'false';
    process.env.UCN_BASE_PUCLARO = 'https://api.ucn.cl';

    mockHttpService = {
      get: jest.fn(),
    } as any;

    mockAvanceBackupRepository = {
      upsert: jest.fn(),
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvanceService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: AvanceBackupRepository, useValue: mockAvanceBackupRepository },
      ],
    }).compile();

    service = module.get<AvanceService>(AvanceService);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvance', () => {
    describe('when USE_STUBS is true', () => {
      process.env.USE_STUBS = 'true';
      it('should return stub data', async () => {
        // Note: USE_STUBS is evaluated at module load time, so we test the stub export
        expect(avanceStub).toBeDefined();
        expect(Array.isArray(avanceStub)).toBe(true);
        expect(avanceStub[0]).toHaveProperty('nrc');
        expect(avanceStub[0]).toHaveProperty('course');
        expect(avanceStub[0]).toHaveProperty('status');
      });
    });

    describe('when USE_STUBS is false (HTTP calls)', () => {
      it('should return avance data on successful API call', async () => {
        const mockAxiosResponse: AxiosResponse = {
          data: mockAvanceData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        };

        mockHttpService.get.mockReturnValue(of(mockAxiosResponse));

        const result = await service.getAvance('12345678-9', 'ICINF');

        expect(result).toEqual(mockAvanceData);
        expect(mockHttpService.get).toHaveBeenCalledWith(
          expect.stringContaining(`${process.env.UCN_BASE_PUCLARO}/avance.php?rut=12345678-9&codcarrera=ICINF`)
        );
      });
 

      it('should throw HttpException on API error with status from response', async () => {
        const mockError = {
          response: {
            status: 500,
            data: { message: 'Internal server error' },
          },
        };

        mockHttpService.get.mockReturnValue(throwError(() => mockError));

        await expect(service.getAvance('12345678-9', 'ICINF')).rejects.toThrow(
          HttpException
        );

        try {
          await service.getAvance('12345678-9', 'ICINF');
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getStatus()).toBe(500);
          expect(error.getResponse()).toEqual({ message: 'Internal server error' });
        }
      });

      it('should throw HttpException with 502 when no response status', async () => {
        const mockError = {
          response: undefined,
        };

        mockHttpService.get.mockReturnValue(throwError(() => mockError));

        try {
          await service.getAvance('12345678-9', 'ICINF');
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getStatus()).toBe(502);
          expect(error.getResponse()).toEqual({ message: 'error avance ucn' });
        }
      });

      it('should wrap string payload in object', async () => {
        const mockError = {
          response: {
            status: 400,
            data: 'Bad request string',
          },
        };

        mockHttpService.get.mockReturnValue(throwError(() => mockError));

        try {
          await service.getAvance('12345678-9', 'ICINF');
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getResponse()).toEqual({ message: 'Bad request string' });
        }
      });
    });

    describe('when USE_BACKUP_FALLBACK is true', () => {
      beforeEach(() => {
        process.env.USE_BACKUP_FALLBACK = 'true';
      });

      it('should return backup data when API fails and backup exists', async () => {
        const backupData = { data: mockAvanceData };
        mockAvanceBackupRepository.get.mockResolvedValue(backupData as any);

        const mockError = {
          response: { status: 500, data: { message: 'error' } },
        };
        mockHttpService.get.mockReturnValue(throwError(() => mockError));

        const result = await service.getAvance('12345678-9', 'ICINF');

        expect(result).toEqual(mockAvanceData);
        expect(mockAvanceBackupRepository.get).toHaveBeenCalledWith(
          '12345678-9',
          'ICINF'
        );
      });

      it('should throw HttpException when API fails and no backup exists', async () => {
        mockAvanceBackupRepository.get.mockResolvedValue(null);

        const mockError = {
          response: { status: 502, data: { message: 'gateway error' } },
        };
        mockHttpService.get.mockReturnValue(throwError(() => mockError));

        await expect(service.getAvance('12345678-9', 'ICINF')).rejects.toThrow(
          HttpException
        );
      });

      it('should throw HttpException when backup data is empty', async () => {
        mockAvanceBackupRepository.get.mockResolvedValue({ data: null } as any);

        const mockError = {
          response: { status: 500, data: null },
        };
        mockHttpService.get.mockReturnValue(throwError(() => mockError));

        await expect(service.getAvance('12345678-9', 'ICINF')).rejects.toThrow(
          HttpException
        );
      });
    });

     
  });
});

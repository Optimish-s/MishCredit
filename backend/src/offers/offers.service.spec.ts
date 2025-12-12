import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OfferRepository } from '../db/offer.repository';

describe('OffersService', () => {
  let service: OffersService;
  let mockRepo: jest.Mocked<OfferRepository>;

  beforeEach(async () => {
    mockRepo = {
      upsertMany: jest.fn(),
      listByCourseAndPeriod: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffersService,
        { provide: OfferRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<OffersService>(OffersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== parseCsv() Tests ====================
  describe('parseCsv()', () => {
    const validHeader = 'period,nrc,course,codigoParalelo,dia,inicio,fin,sala,cupos';

    it('should parse valid CSV with single row', () => {
      const csv = `${validHeader}
202310,12345,CALC-001,A,LU,08:00,09:30,A-101,30`;

      const result = service.parseCsv(csv);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        period: '202310',
        nrc: '12345',
        course: 'CALC-001',
        codigoParalelo: 'A',
        cupos: 30,
        slots: [
          { dia: 'LU', inicio: '08:00', fin: '09:30', sala: 'A-101' },
        ],
      });
    });

    it('should parse multiple rows with same NRC (multiple slots)', () => {
      const csv = `${validHeader}
202310,12345,CALC-001,A,LU,08:00,09:30,A-101,30
202310,12345,CALC-001,A,MI,08:00,09:30,A-101,30`;

      const result = service.parseCsv(csv);

      expect(result).toHaveLength(1);
      expect(result[0].slots).toHaveLength(2);
      expect(result[0].slots[0].dia).toBe('LU');
      expect(result[0].slots[1].dia).toBe('MI');
    });

    it('should parse multiple different courses', () => {
      const csv = `${validHeader}
202310,12345,CALC-001,A,LU,08:00,09:30,A-101,30
202310,67890,ALGE-001,B,MA,10:00,11:30,B-202,25`;

      const result = service.parseCsv(csv);

      expect(result).toHaveLength(2);
      expect(result.find((r) => r.nrc === '12345')).toBeDefined();
      expect(result.find((r) => r.nrc === '67890')).toBeDefined();
    });

    it('should return empty array for CSV with only header', () => {
      const csv = validHeader;

      const result = service.parseCsv(csv);

      expect(result).toEqual([]);
    });

    it('should return empty array for empty CSV', () => {
      const result = service.parseCsv('');

      expect(result).toEqual([]);
    });

    it('should throw BadRequestException for missing column', () => {
      const invalidCsv = `period,nrc,course
202310,12345,CALC-001`;

      expect(() => service.parseCsv(invalidCsv)).toThrow(BadRequestException);
      expect(() => service.parseCsv(invalidCsv)).toThrow('csv invalido: falta columna');
    });

    it('should handle CSV with empty sala', () => {
      const csv = `${validHeader}
202310,12345,CALC-001,A,LU,08:00,09:30,,30`;

      const result = service.parseCsv(csv);

      expect(result[0].slots[0].sala).toBeUndefined();
    });

    it('should handle CSV with Windows line endings (CRLF)', () => {
      const csv = `${validHeader}\r\n202310,12345,CALC-001,A,LU,08:00,09:30,A-101,30`;

      const result = service.parseCsv(csv);

      expect(result).toHaveLength(1);
    });

    it('should handle header with different casing', () => {
      const csv = `PERIOD,NRC,Course,CodigoParalelo,DIA,Inicio,FIN,Sala,CUPOS
202310,12345,CALC-001,A,LU,08:00,09:30,A-101,30`;

      const result = service.parseCsv(csv);

      expect(result).toHaveLength(1);
    });

    it('should trim whitespace from values', () => {
      const csv = `${validHeader}
  202310 , 12345 , CALC-001 , A , LU , 08:00 , 09:30 , A-101 , 30 `;

      const result = service.parseCsv(csv);

      expect(result[0].period).toBe('202310');
      expect(result[0].nrc).toBe('12345');
      expect(result[0].course).toBe('CALC-001');
    });

    it('should parse cupos as number', () => {
      const csv = `${validHeader}
202310,12345,CALC-001,A,LU,08:00,09:30,A-101,30`;

      const result = service.parseCsv(csv);

      expect(typeof result[0].cupos).toBe('number');
      expect(result[0].cupos).toBe(30);
    });

    it('should handle missing cupos as 0', () => {
      const csv = `${validHeader}
202310,12345,CALC-001,A,LU,08:00,09:30,A-101,`;

      const result = service.parseCsv(csv);

      expect(result[0].cupos).toBe(0);
    });
  });

  // ==================== cargarOferta() Tests ====================
  describe('cargarOferta()', () => {
    const validCsv = `period,nrc,course,codigoParalelo,dia,inicio,fin,sala,cupos
202310,12345,CALC-001,A,LU,08:00,09:30,A-101,30`;

    it('should parse CSV and call repository upsertMany', async () => {
      mockRepo.upsertMany.mockResolvedValue(1);

      const result = await service.cargarOferta(validCsv);

      expect(mockRepo.upsertMany).toHaveBeenCalledTimes(1);
      expect(mockRepo.upsertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ nrc: '12345' }),
        ]),
      );
      expect(result).toEqual({ ok: true, upserts: 1, rows: 1 });
    });

    it('should return correct row count for multiple rows', async () => {
      const multiRowCsv = `period,nrc,course,codigoParalelo,dia,inicio,fin,sala,cupos
202310,12345,CALC-001,A,LU,08:00,09:30,A-101,30
202310,67890,ALGE-001,B,MA,10:00,11:30,B-202,25`;

      mockRepo.upsertMany.mockResolvedValue(2);

      const result = await service.cargarOferta(multiRowCsv);

      expect(result.rows).toBe(2);
      expect(result.upserts).toBe(2);
    });

    it('should throw BadRequestException for invalid CSV header', async () => {
      // CSV with invalid header AND data row to trigger column validation
      const invalidCsv = `invalid,csv,header
some,data,row`;

      await expect(service.cargarOferta(invalidCsv)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return empty result for CSV with only header', async () => {
      const headerOnlyCsv = 'period,nrc,course,codigoParalelo,dia,inicio,fin,sala,cupos';
      mockRepo.upsertMany.mockResolvedValue(0);

      const result = await service.cargarOferta(headerOnlyCsv);

      expect(result).toEqual({ ok: true, upserts: 0, rows: 0 });
    });
  });

  // ==================== listarOferta() Tests ====================
  describe('listarOferta()', () => {
    it('should call repository with correct parameters', async () => {
      const mockOffers = [
        {
          period: '202310',
          nrc: '12345',
          course: 'CALC-001',
          codigoParalelo: 'A',
          cupos: 30,
          slots: [],
        },
      ];
      mockRepo.listByCourseAndPeriod.mockResolvedValue(mockOffers);

      const result = await service.listarOferta('CALC-001', '202310');

      expect(mockRepo.listByCourseAndPeriod).toHaveBeenCalledWith(
        'CALC-001',
        '202310',
      );
      expect(result).toEqual(mockOffers);
    });

    it('should return empty array when no offers found', async () => {
      mockRepo.listByCourseAndPeriod.mockResolvedValue([]);

      const result = await service.listarOferta('NONEXISTENT', '202310');

      expect(result).toEqual([]);
    });
  });
});
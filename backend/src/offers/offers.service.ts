import { BadRequestException, Injectable } from '@nestjs/common';
import { OfferRepository } from '../db/offer.repository';
import type { OfferParallel } from './entities/offer.entity';

@Injectable()
export class OffersService {
  constructor(private readonly repo: OfferRepository) {}

  /**
   * Parse CSV string into OfferParallel array
   * Expected header: period,nrc,course,codigoParalelo,dia,inicio,fin,sala,cupos
   */
  parseCsv(csv: string): OfferParallel[] {
    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length <= 1) return [];

    const header = lines
      .shift()!
      .split(',')
      .map((x) => x.trim().toLowerCase());

    const idx = (k: string) => header.indexOf(k);
    const requiredColumns = [
      'period',
      'nrc',
      'course',
      'codigoparalelo',
      'dia',
      'inicio',
      'fin',
      'sala',
      'cupos',
    ];

    for (const k of requiredColumns) {
      if (idx(k) === -1) {
        throw new BadRequestException(`csv invalido: falta columna ${k}`);
      }
    }

    const map = new Map<string, OfferParallel>();

    for (const ln of lines) {
      const cols = ln.split(',').map((x) => x.trim());
      const key = cols[idx('nrc')];
      const slot = {
        dia: cols[idx('dia')],
        inicio: cols[idx('inicio')],
        fin: cols[idx('fin')],
        sala: cols[idx('sala')] || undefined,
      };

      const existing = map.get(key);
      if (existing) {
        existing.slots.push(slot);
      } else {
        map.set(key, {
          period: cols[idx('period')],
          nrc: cols[idx('nrc')],
          course: cols[idx('course')],
          codigoParalelo: cols[idx('codigoparalelo')],
          cupos: Number(cols[idx('cupos')] || 0),
          slots: [slot],
        });
      }
    }

    return [...map.values()];
  }

  /**
   * Load offers from CSV and upsert to database
   */
  async cargarOferta(csv: string): Promise<{ ok: boolean; upserts: number; rows: number }> {
    const rows = this.parseCsv(csv);
    const upserts = await this.repo.upsertMany(rows);
    return { ok: true, upserts, rows: rows.length };
  }

  /**
   * List offers by course and period
   */
  async listarOferta(course: string, period: string): Promise<OfferParallel[]> {
    return this.repo.listByCourseAndPeriod(course, period);
  }
}
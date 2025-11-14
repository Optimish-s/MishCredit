import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import { Observable, firstValueFrom } from 'rxjs';
import { MallaBackupRepository } from '../db/bkp/malla-backup.repository';
const useStubs: boolean = process.env.USE_STUBS === 'true';
type JsonUnknown = unknown;
const mallaStub = [
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
] as const;
@Injectable()
export class MallaService {

  private readonly logger = new Logger(MallaService.name);
  constructor(
    private readonly http: HttpService,
    private readonly mallaBackup: MallaBackupRepository,
  ) { }

  async getMalla(cod: string, catalogo: string): Promise<JsonUnknown> {
    if (useStubs) {
      this.logger.warn(`consultado malla stubs ${cod} ${catalogo}`);
      return mallaStub as JsonUnknown;
    }



    this.logger.log(`consultado malla ${cod} ${catalogo}`);
    const url = `${process.env.UCN_BASE_HAWAII}/mallas?${encodeURIComponent(
      cod,
    )}-${encodeURIComponent(catalogo)}`;

    try {
      const obs: Observable<AxiosResponse<unknown>> = this.http.get<unknown>(
        url,
        {
          headers: { 'X-HAWAII-AUTH': process.env.HAWAII_AUTH || '' },
        },
      );
      const res: AxiosResponse<unknown> = await firstValueFrom(obs);
      const data: unknown = res.data;
      return data;
    } catch (err: unknown) {
      const e = err as AxiosError<unknown>;
      const status = e.response?.status ?? 502;
      const payload = e.response?.data ?? { message: 'error malla ucn' };

      // log minimo de diagnostico

      console.warn('ucn malla fallo', {
        status,
        hasData: Boolean(e.response?.data),
        headerSent: Boolean(process.env.HAWAII_AUTH),
      });

      if (process.env.USE_BACKUP_FALLBACK === 'true') {
        const fallback = await this.mallaBackup.get(cod, catalogo);
        if (fallback?.data) return fallback.data as unknown;
      }

      throw new HttpException(
        typeof payload === 'string'
          ? { message: payload }
          : (payload as object),
        status,
      );
    }
  }
}

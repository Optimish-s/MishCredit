// gateways http hacia servicios oficiales ucn
// comentarios sin acentos ni punto final

import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import type { AxiosError, AxiosResponse } from 'axios';
import { firstValueFrom, type Observable } from 'rxjs';
import { AvanceBackupRepository } from 'src/db/bkp/avance-backup.repository';
import { MallaBackupRepository } from 'src/db/bkp/malla-backup.repository';

// bandera para usar datos de prueba locales
const useStubs: boolean = process.env.USE_STUBS === 'true';

// stubs internos por si el upstream falla o no tienes token
// puedes borrar estos stubs si prefieres mantenerlos en otro archivo
const loginStub = {
  rut: '11188222333',
  carreras: [{ codigo: '8606', nombre: 'ICCI', catalogo: '201610' }],
} as const;

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

const avanceStub = [
  {
    nrc: '21943',
    period: '201610',
    student: '11188222333',
    course: 'ECIN-00704',
    excluded: false,
    inscriptionType: 'REGULAR',
    status: 'APROBADO',
  },
] as const;

// tipo generico para no usar any
type JsonUnknown = unknown;

@Injectable()
export class LoginGateway {

  constructor(private readonly http: HttpService) { }
  private readonly logger = new Logger(LoginGateway.name);

  async login(rut: string, password: string): Promise<JsonUnknown> {

    // this.logger.log(`start logging service for ${rut}, ${password}`);
    // if (useStubs) return loginStub as JsonUnknown;

    // const url = `${process.env.UCN_BASE_PUCLARO}/login.php?email=${encodeURIComponent(
    //   rut,
    // )}&password=${encodeURIComponent(password)}`;

    // try {
    //   const obs: Observable<AxiosResponse<unknown>> =
    //     this.http.get<unknown>(url);
    //   const res: AxiosResponse<unknown> = await firstValueFrom(obs);
    //   const data: unknown = res.data;
    //   return data;
    // } catch (err: unknown) {
    //   const e = err as AxiosError<unknown>;
    //   const status = e.response?.status ?? 502;
    //   const payload = e.response?.data ?? { message: 'error login ucn' };

    //   // log minimo de diagnostico

    //   this.logger.warn('ucn login fallo', {
    //     status,
    //     hasData: Boolean(e.response?.data),
    //   });

    //   throw new HttpException(
    //     typeof payload === 'string'
    //       ? { message: payload }
    //       : (payload as object),
    //     status,
    //   );
    // }
    return null;
  }
}

@Injectable()
export class MallasGateway {
  private readonly logger = new Logger(MallasGateway.name);
  constructor(
    private readonly http: HttpService,
    private readonly mallaBackup: MallaBackupRepository,
  ) { }

  async malla(cod: string, catalogo: string): Promise<JsonUnknown> {
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

@Injectable()
export class AvanceGateway {
  private readonly logger = new Logger(AvanceGateway.name);
  constructor(
    private readonly http: HttpService,
    private readonly avanceBackup: AvanceBackupRepository,
  ) { }
  
  async avance(rut: string, codCarrera: string): Promise<JsonUnknown> {
    if (useStubs) {
      this.logger.warn(`Usando avance stubs `);
      return avanceStub as JsonUnknown;
    }
    this.logger.log(`consultando avance de rut: ${rut} codCarrera: ${codCarrera} `);

    const url = `${process.env.UCN_BASE_PUCLARO}/avance.php?rut=${encodeURIComponent(
      rut,
    )}&codcarrera=${encodeURIComponent(codCarrera)}`;

    try {
      const obs: Observable<AxiosResponse<unknown>> =
        this.http.get<unknown>(url);
      const res: AxiosResponse<unknown> = await firstValueFrom(obs);
      const data: unknown = res.data;
      return data;
    } catch (err: unknown) {
      const e = err as AxiosError<unknown>;
      const status = e.response?.status ?? 502;
      const payload = e.response?.data ?? { message: 'error avance ucn' };

      // log minimo de diagnostico

      console.warn('ucn avance fallo', {
        status,
        hasData: Boolean(e.response?.data),
      });

      if (process.env.USE_BACKUP_FALLBACK === 'true') {
        const fallback = await this.avanceBackup.get(rut, codCarrera);
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

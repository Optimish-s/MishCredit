import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import { Observable, firstValueFrom } from 'rxjs';
import { AvanceBackupRepository } from '../db/bkp/avance-backup.repository';

export const avanceStub = [
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

type JsonUnknown = unknown;

@Injectable()
export class AvanceService {
    private readonly logger = new Logger(AvanceService.name);
    constructor(
        private readonly http: HttpService,
        private readonly avanceBackup: AvanceBackupRepository,
    ) { }

    async getAvance(rut: string, codCarrera: string): Promise<JsonUnknown> {
        const useStubs: boolean = process.env.USE_STUBS === 'true';
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

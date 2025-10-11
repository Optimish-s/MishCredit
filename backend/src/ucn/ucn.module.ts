// modulo ucn que expone los endpoints proxy
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UcnController } from './ucn.controller';
import { AvanceGateway, LoginGateway, MallasGateway } from './ucn.gateways';
import { UcnBackupController } from './ucn.backup.controller';
import { AdminKeyGuard } from './admin-key.guard';
import { AvanceBackupRepository } from 'src/db/bkp/avance-backup.repository';
import { AvanceBackup, AvanceBackupSchema } from 'src/db/bkp/avance-backup.schema';
import { MallaBackupRepository } from 'src/db/bkp/malla-backup.repository';
import { MallaBackup, MallaBackupSchema } from 'src/db/bkp/malla-backup.schema';
import { MallaService } from 'src/malla/malla.service';
import { MallaModule } from 'src/malla/malla.module';
import { AvanceModule } from 'src/avance/avance.module';


@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: MallaBackup.name, schema: MallaBackupSchema },
      { name: AvanceBackup.name, schema: AvanceBackupSchema },
    ]),
    MallaModule,
    AvanceModule,
  ],
  controllers: [UcnController, UcnBackupController],
  providers: [
    LoginGateway,
    MallasGateway,
    AvanceGateway,
    AdminKeyGuard,
    MallaBackupRepository,
    AvanceBackupRepository,
   
  ],
  exports: [
    LoginGateway,
    MallasGateway,
    AvanceGateway,
    MallaBackupRepository,
    AvanceBackupRepository,
  ], // <- exporta para otros modulos
})
export class UcnModule {}

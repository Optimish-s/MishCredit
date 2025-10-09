// modulo ucn que expone los endpoints proxy
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UcnController } from './ucn.controller';
import { AvanceGateway, LoginGateway, MallasGateway } from './ucn.gateways';
 
import { AdminKeyGuard } from './admin-key.guard';
import { UcnBackupController } from './bkp/ucn.backup.controller';
import { AvanceBackupRepository } from '../db/bkp/avance-backup.repository';
import { AvanceBackup, AvanceBackupSchema } from '../db/bkp/avance-backup.schema';
import { MallaBackupRepository } from '../db/bkp/malla-backup.repository';
import { MallaBackup, MallaBackupSchema } from '../db/bkp/malla-backup.schema';
 
@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: MallaBackup.name, schema: MallaBackupSchema },
      { name: AvanceBackup.name, schema: AvanceBackupSchema },
    ]),
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

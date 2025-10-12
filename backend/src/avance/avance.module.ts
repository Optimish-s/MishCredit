import { Module } from '@nestjs/common';
import { AvanceService } from './avance.service';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { AvanceBackupRepository } from 'src/db/bkp/avance-backup.repository';
import { AvanceBackup, AvanceBackupSchema } from 'src/db/bkp/avance-backup.schema';
 
@Module({
   imports: [HttpModule,MongooseModule.forFeature([{ name: AvanceBackup.name, schema: AvanceBackupSchema }])],   // If using Mongoose

   providers: [AvanceService, AvanceBackupRepository],
   exports: [AvanceService]
})
export class AvanceModule { }

import { Module } from '@nestjs/common';
import { MallaService } from './malla.service';
import { HttpModule } from '@nestjs/axios/dist/http.module';
import { MallaBackupRepository } from 'src/db/bkp/malla-backup.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { MallaBackup, MallaBackupSchema } from 'src/db/bkp/malla-backup.schema';
 
@Module({
  imports: [HttpModule, MongooseModule.forFeature([{ name: MallaBackup.name, schema: MallaBackupSchema }])],
  providers: [MallaService,MallaBackupRepository],
  exports: [MallaService]
})
export class MallaModule {}

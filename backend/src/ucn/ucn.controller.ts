// controller web que expone los proxies seguros
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MallaParamsDto, AvanceQueryDto } from './dto/ucn.dto';
import { MallaService } from 'src/malla/malla.service';
import { AvanceService } from 'src/avance/avance.service';


@ApiTags('ucn')
@Controller('ucn')
export class UcnController {
  constructor(

    private readonly mallaService: MallaService,
    private readonly avanceService: AvanceService,
  ) { }


  @Get('malla/:cod/:catalogo')
  @ApiOperation({ summary: 'Obtener malla' })
  @ApiResponse({ status: 200 })
  malla(@Param() p: MallaParamsDto): Promise<unknown> {
    return this.mallaService.getMalla(p.cod, p.catalogo);
  }

  @Get('avance')
  @ApiOperation({ summary: 'Obtener avance' })
  @ApiQuery({ name: 'rut', required: true })
  @ApiQuery({ name: 'codcarrera', required: true })
  @ApiResponse({ status: 200 })
  avance(@Query() q: AvanceQueryDto): Promise<unknown> {
    return this.avanceService.getAvance(q.rut, q.codcarrera);
  }
}

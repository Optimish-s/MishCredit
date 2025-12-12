import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AdminKeyGuard } from '../ucn/admin-key.guard';
import { CargarOfertaDto, ListarOfertaDto } from './dto/offers.dto';
import { OffersService } from './offers.service';

@ApiTags('oferta')
@Controller('oferta')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post('cargar')
  @ApiOperation({ summary: 'Cargar oferta desde CSV' })
  @ApiBody({ schema: { properties: { csv: { type: 'string' } } } })
  @UseGuards(AdminKeyGuard)
  async cargar(@Body() dto: CargarOfertaDto) {
    return this.offersService.cargarOferta(dto.csv);
  }

  @Get('listar')
  @ApiOperation({ summary: 'Listar oferta por curso y periodo' })
  @ApiQuery({ name: 'course', required: true })
  @ApiQuery({ name: 'period', required: true })
  @ApiResponse({ status: 200 })
  listar(@Query() q: ListarOfertaDto) {
    return this.offersService.listarOferta(q.course, q.period);
  }
}
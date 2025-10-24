// controller http para proyecciones sin acentos ni punto final
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

 
import { GenerarProyeccionDto, GuardarProyeccionDto, FavoritaDto } from './dto/projection.dto';
import { ProjectionRepository } from 'src/db/projection.repository';
import { GenerateProjectionOptionsUseCase } from 'src/projection/use-cases/generate-projection-options.usecase';
import { GenerateProjectionUseCase } from 'src/projection/use-cases/generate-projection.usecase';



@ApiTags('proyecciones')
@Controller('proyecciones')
export class ProjectionsController {
  constructor(
    private readonly usecase: GenerateProjectionUseCase,
    private readonly repo: ProjectionRepository,
    private readonly usecaseOptions: GenerateProjectionOptionsUseCase,
  ) {}

  @Post('generar')
  @ApiOperation({ summary: 'Generar proyeccion sin oferta' })
  @ApiBody({ type: GenerarProyeccionDto })
  generar(@Body() dto: GenerarProyeccionDto) {
    return this.usecase.exec(dto);
  }

// For testing
  // @Post('generar')
  // generarPayloadCheck(@Body() params: any) {
  //   console.log('generar.payload', params);
  //   return this.usecase.exec(params);
  // }

  @Post('generar-opciones')
  @ApiOperation({ summary: 'Generar varias opciones de proyeccion (sin oferta)' })
  @ApiBody({ type: GenerarProyeccionDto })
  generarOpciones(@Body() dto: GenerarProyeccionDto & { maxOptions?: number }) {
    return this.usecaseOptions.exec(dto);
  }

  @Post('guardar')
  @ApiOperation({ summary: 'Generar y guardar proyeccion' })
  @ApiBody({ type: GuardarProyeccionDto })
  async guardar(@Body() dto: GuardarProyeccionDto) {
    const result = await this.usecase.exec(dto);
    return this.repo.createAndMaybeFavorite({
      rut: dto.rut,
      codCarrera: dto.codCarrera,
      catalogo: dto.catalogo,
      nombre: dto.nombre,
      favorite: dto.favorite,
      totalCreditos: result.totalCreditos,
      items: result.seleccion.map((x) => ({
        codigo: x.codigo,
        asignatura: x.asignatura,
        creditos: x.creditos,
        nivel: x.nivel,
        motivo: x.motivo,
        nrc: x.nrc, // ya tipado en ProjectionCourse
      })),
    });
  }

  @Post('guardar-directo')
  @ApiOperation({ summary: 'Guardar proyeccion desde items ya calculados' })
  @ApiBody({ description: 'Recibe items tal cual para persistir' })
  async guardarDirecto(
    @Body()
    body: {
      rut: string;
      codCarrera: string;
      catalogo: string;
      nombre?: string;
      favorite?: boolean;
      totalCreditos: number;
      items: Array<{
        codigo: string;
        asignatura: string;
        creditos: number;
        nivel: number;
        motivo: 'REPROBADO' | 'PENDIENTE';
        nrc?: string;
      }>;
    },
  ) {
    return this.repo.createAndMaybeFavorite(body);
  }

  @Get('mias')
  @ApiOperation({ summary: 'Listar mis proyecciones' })
  @ApiQuery({ name: 'rut', required: true })
  listar(@Query('rut') rut: string) {
    return this.repo.listByRut(rut);
  }

  @Patch('favorita/:id')
  @ApiOperation({ summary: 'Marcar proyeccion favorita' })
  async favorita(@Param('id') id: string, @Body() body: FavoritaDto) {
    await this.repo.setFavorite(body.rut, id);
    return { ok: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Borrar proyeccion' })
  async borrar(@Param('id') id: string, @Query('rut') rut: string) {
    await this.repo.delete(rut, id);
    return { ok: true };
  }

  @Patch(':id/nombre')
  @ApiOperation({ summary: 'Renombrar proyeccion' })
  async renombrar(
    @Param('id') id: string,
    @Body() body: { rut: string; nombre: string },
  ) {
    await this.repo.updateName(body.rut, id, body.nombre);
    return { ok: true };
  }

  @Get('demanda/agregada')
  @ApiOperation({ summary: 'Demanda agregada por codigo o nrc de favoritas' })
  @ApiQuery({ name: 'codCarrera', required: false })
  @ApiQuery({
    name: 'por',
    required: false,
    description: 'usar "nrc" para agrupar por nrc',
  })
  demanda(
    @Query('codCarrera') codCarrera?: string,
    @Query('por') por?: string,
  ) {
    return this.repo.demandByCourse(codCarrera, por === 'nrc');
  }
}

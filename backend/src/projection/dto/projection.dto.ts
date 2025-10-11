import { Type } from "class-transformer";
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsBoolean } from "class-validator";

export class GenerarProyeccionDto {
  @IsString() @IsNotEmpty() rut!: string;
  @IsString() @IsNotEmpty() codCarrera!: string;
  @IsString() @IsNotEmpty() catalogo!: string;
  @Type(() => Number) @IsNumber() @Min(1) topeCreditos!: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) nivelObjetivo?: number;
  @IsOptional() @Type(() => String) prioritarios?: string[];
}

export class GuardarProyeccionDto extends GenerarProyeccionDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsBoolean() favorite?: boolean;
}

export class GenerarConOfertaDto extends GenerarProyeccionDto {
  @IsString() @IsNotEmpty() period!: string;
}

export class FavoritaDto {
  @IsString() @IsNotEmpty() rut!: string;
}
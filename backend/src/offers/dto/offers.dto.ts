import { IsString, IsNotEmpty } from "class-validator";

export class CargarOfertaDto {
  @IsString() @IsNotEmpty() csv!: string;
}

export class ListarOfertaDto {
  @IsString() @IsNotEmpty() course!: string;
  @IsString() @IsNotEmpty() period!: string;
}
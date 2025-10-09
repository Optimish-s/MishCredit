import { IsString, IsNotEmpty } from "class-validator";

export class LoginDto {
  @IsString() @IsNotEmpty() email!: string;
  @IsString() @IsNotEmpty() password!: string;
}

export class MallaParamsDto {
  @IsString() @IsNotEmpty() cod!: string;
  @IsString() @IsNotEmpty() catalogo!: string;
}

export class AvanceQueryDto {
  @IsString() @IsNotEmpty() rut!: string;
  @IsString() @IsNotEmpty() codcarrera!: string;
}

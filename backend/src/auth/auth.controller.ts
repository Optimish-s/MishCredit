// controlador de autenticacion demo sin acentos ni punto final
import { BadRequestException, Body, Controller, Logger, Post } from '@nestjs/common';
import { AuthService } from './auth.service';



@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService){}
  
  @Post('login')
  login(@Body() body: { email?: string; password?: string }) {
    const email = (body.email || '').trim();
    const password = (body.password || '').trim();
    this.logger.log(`logging data email: ${body.email} pass: ${body.password}`);
    return this.authService.login(email,password);

    
  }
  

  @Post('forgot')
  forgot(@Body() body: { rut?: string; email?: string }) {
    const rut = (body.rut || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    return this.authService.forgot({rut, email});

  }
}


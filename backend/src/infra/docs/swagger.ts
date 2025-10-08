// Configures Swagger documentation for the API
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const setupSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('Planificador de Inscripcion UCN API')
    .setDescription('Documentacion inicial para la demo y QA del backend')
    .setVersion('0.1.0')
    .addTag('Health', 'Monitoreo del servicio')
    .addTag('Auth', 'Autenticacion con portales UCN')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
};

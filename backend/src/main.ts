import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  app.enableCors();

  const port = process.env.PORT || 3000;
  // NestJS aceitar conexoes do docker/maquina local
  await app.listen(port, '0.0.0.0');
  console.log(`Backend rodando na porta ${port}`);
}
bootstrap();

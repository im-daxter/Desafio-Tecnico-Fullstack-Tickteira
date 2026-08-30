import { Controller, Post, Headers, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { SecurityService } from '../security/security.service';
import { Request } from 'express';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly securityService: SecurityService,
  ) {}

  @Post('pagfacil')
  @HttpCode(HttpStatus.OK)
  async receberWebhook(
    @Headers('x-pagfacil-signature') signature: string,
    @Headers('x-pagfacil-event-id') eventId: string,
    @Body() payload: any,
    @Req() req: Request & { rawBody?: string },
  ) {
    // 1. Pega o corpo bruto da requisição para validar o HMAC
    const rawBody = JSON.stringify(payload);

    // 2. Valida a assinatura em milissegundos
    this.securityService.validarAssinatura(rawBody, signature);

    // 3. Registra e enfileira
    await this.webhooksService.processarWebhook(eventId, payload);

    // 4. Retorna HTTP 200 IMEDIATAMENTE (muito abaixo do limite de 5s)
    return { received: true };
  }
}

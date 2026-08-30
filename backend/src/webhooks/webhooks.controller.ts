import { Controller, Post, Headers, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { SecurityService } from '../security/security.service';

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
  ) {
    // Pega o JSON exato recebido para validar o HMAC
    const rawBody = JSON.stringify(payload);

    // Valida a assinatura de segurança
    this.securityService.validarAssinatura(rawBody, signature);

    // Registra e envia para a fila
    await this.webhooksService.processarWebhook(eventId, payload);

    // Retorna resposta imediata para o gateway
    return { received: true };
  }
}

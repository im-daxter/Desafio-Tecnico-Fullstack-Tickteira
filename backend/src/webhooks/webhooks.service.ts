import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('pagamentos') private readonly filaPagamentos: Queue,
  ) {}

  async processarWebhook(eventId: string, payload: any) {
    // 1. Checagem de Idempotência: Se o eventId já existe, ignora
    const eventoExistente = await this.prisma.eventoWebhook.findUnique({
      where: { eventId },
    });

    if (eventoExistente) {
      this.logger.log(`Evento duplicado ignorado: ${eventId}`);
      return { status: 'evento_ja_recebido' };
    }

    // 2. Registra o evento no PostgreSQL
    await this.prisma.eventoWebhook.create({
      data: {
        eventId: payload.event_id,
        eventType: payload.event_type,
        payload: payload,
      },
    });

    // 3. Adiciona na fila do BullMQ para ser processado em segundo plano
    await this.filaPagamentos.add('processar-pagamento', payload, {
      jobId: eventId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });

    this.logger.log(`Evento ${eventId} adicionado na fila.`);
    return { status: 'enfileirado' };
  }
}

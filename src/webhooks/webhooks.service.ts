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
    // 1. Checa se o eventId já existe no banco de dados (Garantia de Idempotência)
    const eventoExistente = await this.prisma.eventoWebhook.findUnique({
      where: { eventId },
    });

    if (eventoExistente) {
      this.logger.log(`Evento duplicado ignorado: ${eventId}`);
      return { status: 'evento_ja_recebido' };
    }

    // 2. Salva o evento bruto no PostgreSQL com a restrição @unique
    await this.prisma.eventoWebhook.create({
      data: {
        eventId: payload.event_id,
        eventType: payload.event_type,
        payload: payload,
      },
    });

    // 3. Adiciona o trabalho na fila do BullMQ para processamento assíncrono
    await this.filaPagamentos.add('processar-pagamento', payload, {
      jobId: eventId, // O próprio eventId serve como chave única do Job
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });

    this.logger.log(`Evento ${eventId} enfileirado com sucesso.`);
    return { status: 'enfileirado' };
  }
}

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

interface WebhookPayload {
  eventId: string;
  eventType: string;
  data: {
    pedidoId: string;
    compradorEmail: string;
    setorId?: string;
    [key: string]: any;
  };
}

@Processor('pagamentos')
export class PagamentosProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<WebhookPayload>): Promise<any> {
    const { eventId, eventType, data } = job.data;
    const { pedidoId, compradorEmail } = data;

    // 1. Evitar reprocessamento (Idempotência)
    const webhookExistente = await this.prisma.eventoWebhook.findUnique({
      where: { eventId },
    });

    if (webhookExistente) {
      return { status: 'ignorado', reason: 'Evento ja processado' };
    }

    // 2. Registrar o recebimento do webhook
    await this.prisma.eventoWebhook.create({
      data: {
        eventId,
        eventType,
        payload: JSON.parse(JSON.stringify(job.data)),
      },
    });

    // 3. Processar regras de negócio
    if (eventType === 'PAGAMENTO_APROVADO' || eventType === 'PAYMENT_APPROVED') {
      await this.prisma.pedido.update({
        where: { id: pedidoId },
        data: {
          status: 'APROVADO',
          compradorEmail: compradorEmail,
        },
      });

      const codigoIngresso = `ING-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      await this.prisma.ingresso.create({
        data: {
          codigo: codigoIngresso,
          code: codigoIngresso,
          status: 'ATIVO',
          pedidoId: pedidoId,
        },
      });

      const assunto = 'Seu ingresso foi gerado com sucesso!';
      const conteudo = `Olá! Seu pagamento foi confirmado. Código do ingresso: ${codigoIngresso}`;

      await this.prisma.logEmail.create({
        data: {
          pedidoId: pedidoId,
          destinatario: compradorEmail,
          compradorEmail: compradorEmail,
          assunto: assunto,
          corpo: conteudo,
          conteudo: conteudo,
          status: 'ENVIADO',
          tentativas: 1,
        },
      });
    } else if (eventType === 'PAGAMENTO_RECUSADO' || eventType === 'PAYMENT_REFUSED') {
      await this.prisma.pedido.update({
        where: { id: pedidoId },
        data: {
          status: 'CANCELADO',
        },
      });
    }

    return { status: 'sucesso', eventId };
  }
}

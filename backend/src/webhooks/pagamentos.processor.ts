import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Processor('pagamentos')
export class PagamentosProcessor extends WorkerHost {
  private readonly logger = new Logger(PagamentosProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const payload = job.data;
    const { event_type, data } = payload;
    const { order_reference } = data;

    this.logger.log(`[Job ${job.id}] Processando ${event_type} para pedido: ${order_reference}`);

    switch (event_type) {
      case 'payment.approved':
        await this.processarAprovacao(order_reference);
        break;

      case 'payment.refunded':
      case 'payment.chargeback':
        await this.processarEstorno(order_reference);
        break;

      case 'payment.refused':
        await this.processarRecusa(order_reference);
        break;

      default:
        this.logger.warn(`Tipo de evento não mapeado: ${event_type}`);
    }
  }

  /**
   * Processa a aprovação de pagamento garantindo limite de vagas via Transação no Postgres.
   */
  private async processarAprovacao(orderReference: string) {
    await this.prisma.$transaction(async (tx) => {
      // 1. Busca o pedido para obter as informações e o setor vinculado
      const pedido = await tx.pedido.findUnique({
        where: { reference: orderReference },
      });

      if (!pedido) {
        throw new Error(`Pedido com referência ${orderReference} não encontrado.`);
      }

      // Se o pedido já estiver marcado como PAGO, encerra a execução sem alterações (idempotência local)
      if (pedido.status === 'PAGO') {
        return;
      }

      // 2. Lock pessimista (FOR UPDATE) na tabela do Setor para evitar Race Condition
      const setores = await tx.$queryRaw<any[]>`
        SELECT * FROM "Setor" WHERE id = ${pedido.setorId} FOR UPDATE
      `;
      const setor = setores[0];

      // 3. Contagem dos ingressos válidos associados a este setor
      const ingressosEmitidos = await tx.ingresso.count({
        where: {
          setorId: setor.id,
          status: 'VALIDO',
        },
      });

      // Se a contagem atingir ou ultrapassar a capacidade máxima (ex: 400), cancela o pedido
      if (ingressosEmitidos >= setor.capacidadeTotal) {
        await tx.pedido.update({
          where: { id: pedido.id },
          data: { status: 'CANCELADO' },
        });
        this.logger.error(`Capacidade excedida no setor ${setor.nome}. Pedido ${orderReference} cancelado.`);
        return;
      }

      // 4. Atualiza o status do pedido para PAGO
      await tx.pedido.update({
        where: { id: pedido.id },
        data: { status: 'PAGO' },
      });

      // 5. Gera o ingresso com código único (UUID)
      const ingresso = await tx.ingresso.create({
        data: {
          pedidoId: pedido.id,
          setorId: setor.id,
          status: 'VALIDO',
        },
      });

      // 6. Registra o log de e-mail como PENDENTE para processamento de notificação
      await tx.logEmail.create({
        data: {
          pedidoId: pedido.id,
          compradorEmail: pedido.compradorEmail,
          assunto: 'Seu ingresso foi emitido!',
          conteudo: `Ingresso confirmado. Código QR: ${ingresso.code}`,
          status: 'PENDENTE',
        },
      });
    });
  }

  /**
   * Processa estornos e chargebacks invalidando os ingressos associados.
   */
  private async processarEstorno(orderReference: string) {
    await this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({
        where: { reference: orderReference },
      });

      if (!pedido) return;

      // Altera o pedido para ESTORNADO
      await tx.pedido.update({
        where: { id: pedido.id },
        data: { status: 'ESTORNADO' },
      });

      // Invalida todos os ingressos relacionados a este pedido
      await tx.ingresso.updateMany({
        where: { pedidoId: pedido.id },
        data: { status: 'INVALIDADO' },
      });
    });
  }

  /**
   * Atualiza pedidos recusados para CANCELADO.
   */
  private async processarRecusa(orderReference: string) {
    await this.prisma.pedido.updateMany({
      where: { reference: orderReference },
      data: { status: 'CANCELADO' },
    });
  }
}

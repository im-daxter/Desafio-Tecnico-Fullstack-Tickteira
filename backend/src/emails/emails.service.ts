import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailsService {
  constructor(private readonly prisma: PrismaService) {}

  // Lista todos os logs de e-mail para o suporte do João
  async listarLogs() {
    return this.prisma.logEmail.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        pedido: true,
      },
    });
  }

  // Permite que o João clique em "Reenviar"
  async reenviarEmail(id: string) {
    const log = await this.prisma.logEmail.findUnique({
      where: { id },
    });

    if (!log) {
      throw new NotFoundException('Log de e-mail não encontrado.');
    }

    // Reseta o status para PENDENTE para o worker tentar novamente
    return this.prisma.logEmail.update({
      where: { id },
      data: {
        status: 'PENDENTE',
        tentativas: log.tentativas + 1,
        erroMensagem: null,
      },
    });
  }
}

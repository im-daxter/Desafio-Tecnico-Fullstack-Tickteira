import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailsService {
  constructor(private readonly prisma: PrismaService) {}

  // Lista os logs que falharam para a tela do João
  async findFailedEmails() {
    return this.prisma.logEmail.findMany({
      where: { status: 'FALHA' }, // Ou 'FAILED' conforme o seu enum no schema.prisma
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        pedido: true,
      },
    });
  }

  // Reseta o e-mail para PENDENTE para o worker tentar o envio novamente
  async requeueEmail(id: string) {
    const log = await this.prisma.logEmail.findUnique({
      where: { id },
    });

    if (!log) {
      throw new NotFoundException('Log de e-mail não encontrado.');
    }

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

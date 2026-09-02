import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Ajuste o nome da tabela/campos conforme o seu schema.prisma se necessário
  await prisma.emailLog.create({
    data: {
      recipient: 'comprador@email.com',
      orderRef: 'TKT-000412',
      status: 'FAILED',
      errorMessage: 'SMTP Connection Timeout: Falha no servidor de e-mail.',
    },
  });

  console.log('✅ Registro de e-mail com falha criado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao inserir registro:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

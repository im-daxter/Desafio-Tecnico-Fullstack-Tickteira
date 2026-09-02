import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.logEmail.create({
    data: {
      destinatario: 'comprador@email.com',
      assunto: 'Seus ingressos para o Show de Lançamento',
      corpo: 'Abaixo estão os detalhes do seu ingresso...',
      status: 'ERRO',
      erroMensagem: 'SMTP Connection Timeout: Falha no servidor de e-mail.',
      tentativas: 1,
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

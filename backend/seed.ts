import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Limpa registros anteriores em ambiente de desenvolvimento
  await prisma.logEmail.deleteMany();
  await prisma.ingresso.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.setor.deleteMany();
  await prisma.eventoWebhook.deleteMany();

  // Cria um setor de testes com capacidade fixa de 400 lugares
  const setorPista = await prisma.setor.create({
    data: {
      nome: 'Pista Principal - Show dia 28',
      capacidadeTotal: 400,
    },
  });

  console.log(`Setor criado com sucesso: ${setorPista.nome} (ID: ${setorPista.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

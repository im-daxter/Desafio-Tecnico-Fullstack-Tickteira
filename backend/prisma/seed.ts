import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Criar o evento
  const evento = await prisma.evento.create({
    data: {
      nome: 'Show de Lançamento',
      data: new Date('2026-12-31T20:00:00Z'),
    },
  });

  // 2. Criar os setores vinculados ao evento criado
  const setorPista = await prisma.setor.create({
    data: {
      nome: 'Pista',
      capacidadeTotal: 500,
      precoCentavos: 5000,
      eventoId: evento.id,
    },
  });

  const setorVip = await prisma.setor.create({
    data: {
      nome: 'VIP',
      capacidadeTotal: 100,
      precoCentavos: 15000,
      eventoId: evento.id,
    },
  });

  console.log('Seed realizado com sucesso:', { evento, setorPista, setorVip });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

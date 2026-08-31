import * as crypto from 'crypto';

const API_URL = process.env.API_URL || 'http://localhost:3000/webhooks/pagfacil';
const SECRET = process.env.PAGFACIL_SECRET || 'minha_chave_secreta_dev';

// Estrutura do evento simulado do PagFácil
function gerarPayload(eventType: string, orderRef: string, eventId: string) {
  return {
    event_id: eventId,
    event_type: eventType,
    data: {
      order_reference: orderRef,
      amount_cents: 24000,
      buyer_name: 'Comprador Teste',
      buyer_email: 'comprador@email.com',
    },
  };
}

// Calcula o hash HMAC-SHA256 obrigatório no header
function calcularAssinatura(payload: object): string {
  const rawBody = JSON.stringify(payload);
  return crypto.createHmac('sha256', SECRET).update(rawBody).digest('hex');
}

async function dispararWebhook(eventType: string, orderRef: string, eventId: string) {
  const payload = gerarPayload(eventType, orderRef, eventId);
  const signature = calcularAssinatura(payload);

  console.log(`\n--------------------------------------------------`);
  console.log(`Disparando evento: ${eventType}`);
  console.log(`Event ID: ${eventId}`);
  console.log(`Pedido Ref: ${orderRef}`);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pagfacil-signature': signature,
        'x-pagfacil-event-id': eventId,
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json();
    console.log(`Status HTTP: ${response.status}`);
    console.log(`Resposta:`, body);
  } catch (error) {
    console.error('Erro ao conectar com a API:', error);
  }
}

async function rodarTestes() {
  const orderRef = 'TKT-000412';
  const eventIdUnico = `evt_${Date.now()}`;

  // 1. Envia Pagamento Aprovado
  await dispararWebhook('payment.approved', orderRef, eventIdUnico);

  // 2. Teste de Idempotência: Reenvia o MESMO eventId para garantir que o banco descarta
  console.log('\n>>> Testando Idempotência (Reenviando o mesmo eventId)...');
  await dispararWebhook('payment.approved', orderRef, eventIdUnico);

  // 3. Envia Estorno (refunded) para testar a invalidação do ingresso
  const eventIdEstorno = `evt_estorno_${Date.now()}`;
  console.log('\n>>> Testando Estorno...');
  await dispararWebhook('payment.refunded', orderRef, eventIdEstorno);
}

rodarTestes();

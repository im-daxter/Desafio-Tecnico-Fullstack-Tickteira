# Tickteira — Desafio Técnico Fullstack

Aplicação backend desenvolvida em **NestJS**, **Prisma ORM**, **PostgreSQL**, **Redis** e **BullMQ** para processamento assíncrono de ingressos e eventos de pagamento via Webhooks com garantia de idempotência.

---

## Tecnologias Utilizadas

* **Node.js** (v20) + **NestJS** (v10)
* **TypeScript**
* **Prisma ORM** + **PostgreSQL**
* **Redis** + **BullMQ** (Processamento de filas em segundo plano)
* **Docker** & **Docker Compose**

---

## Arquitetura e Recursos

1. **Processamento de Webhooks (PagFacil):** Recebimento de eventos de pagamento (`payment.approved` e `payment.refunded`).
2. **Garantia de Idempotência:** Impede o reprocessamento de eventos duplicados usando chaves de evento.
3. **Processamento Assíncrono:** Filas gerenciadas pelo BullMQ para execução de tarefas em segundo plano (ex: emissão de e-mails de confirmação).
4. **Resiliência e Persistência:** Banco de dados relacional isolado em container Docker.

---

## Como Executar o Projeto

### Pré-requisitos
* **Docker** e **Docker Compose** instalados na sua máquina.

### Passos para Inicialização

1. **Clonar o repositório:**
```bash
git clone
```

```bash 
cd tickteira
```

2. **Subir os containers Docker:**
```bash
docker compose up -d --build
```

3. **Executar as Migrações do Banco de Dados:**
```bash
docker compose exec backend npx prisma migrate dev
```

4. **Popular o Banco com Dados Iniciais (Seed):**
```bash
docker compose exec backend npm run seed
```

---

## Testando a Aplicação

1. **Testar o Webhook e Idempotência**

O projeto possui um script pronto em TypeScript para validar o recebimento de pagamentos, reenviá-los para testar a idempotência e simular estornos:

```bash
docker compose exec backend npm run test:webhook
```

2. Acompanhar os Logs da Aplicação e Filas (BullMQ)

Para visualizar o processamento dos eventos e das filas em tempo real:

```bash
docker compose logs -f backend
```

## Principais Endpoints

## Visualizando o Banco de Dados (Opcional)

Para abrir a interface gráfica do Prisma Studio e inspecionar as tabelas localmente:

```bash
docker compose exec backend npx prisma studio
```

Acesse no seu navegador em http://localhost:5555.

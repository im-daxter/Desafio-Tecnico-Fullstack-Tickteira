# Tickteira — Desafio Técnico Fullstack

Aplicação backend desenvolvida em **NestJS**, **Prisma ORM**, **PostgreSQL**, **Redis** e **BullMQ** para processamento assíncrono de ingressos e eventos de pagamento via Webhooks com garantia de idempotência.

---

## Como Executar o Projeto

### Pré-requisitos
* **Docker** e **Docker Compose** instalados na sua máquina.

### Passos para Inicialização

1. **Clonar o repositório:**
```bash
git clone https://github.com/im-daxter/Desafio-Tecnico-Fullstack-Tickteira.git
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

1. **Testar a tela do FrontEnd e Suporte**

O projeto possui o arquivo **`docker-compose.yml`** que possui o serviço **`frontend`** mapeado na porta **`3001`**.

* Acessar o Frontend Principal:
Abra o seu navegador e acesse:
    
```bash
http://localhost:3001
```

* Acessar o FrontEnd de suporte (João):
Acesse a rota dedicada para gestão e reenvio de e-mails com falha:

```bash
http://localhost:3001/suporte
```

2. **Simular os eventos de pagamentos (Webhoook)**

O projeto possui um script pronto em TypeScript para validar o recebimento de pagamentos, reenviá-los para testar a idempotência e simular estornos:

```bash
docker compose exec backend npm run test:webhook
```

  * O que acontece:
    O script simula a PagFacil enviando o evento **`payment.approved`**.
    O backend grava a transação, gera o lote de ingressos e envia a tarefa de e-mail para a fila do BullMQ.

Também possui um script para simular um erro de pagamento, para ser acesso no painel frontend **`http://localhost:3001/suporte`**.

```bash
docker compose exec backend npm run test:email-failure
```

3. **Acompanhar os Logs da Aplicação e Filas (BullMQ)**

Para visualizar o processamento dos eventos e das filas em tempo real:

```bash
docker compose logs -f backend
```

---

### Portas e Acesso

| **Serviços**       | **URL/Porta**                       | **Descrição**                                              |
| ------------------ | :---------------------------------: | :--------------------------------------------------------- |
| Frontend           | **`http://localhost:3001`**         | Interface web para navegação e compra                      |
| Painel de Suporte  | **`http://localhost:3001/suporte`** | Painel para visualização e reenvio de e-mails com falha    |
| Backend            | **`http://localhost:3000`**         | Endpoints da API REST e recepção de Webhooks               |
| PostgreSQL         | **`http://localhost:5432`**         | Banco de dados relacional                                  |
| Redis              | **`http://localhost:6379`**         | Cache e broker de mensagens                                |

---

## Tecnologias Utilizadas

* **NestJS (Backend)**: Escolhido pela arquitetura modular opinativa, suporte nativo a TypeScript e facilidade de integração com microsserviços e mensageria.
* **React + Next.js (Frontend)**: Permite renderização híbrida (SSR/SSG) para páginas de eventos de alta performance e SEO.
* **BullMQ + Redis**: O Redis já era um requisito da stack para suporte a cache. Adicionar o BullMQ permitiu gerenciar filas de alta vazão sem a complexidade operacional de manter um cluster RabbitMQ separado. O BullMQ oferece suporte nativo a retries, backoff delay e stalled jobs com pegada leve de memória.
* **Prisma ORM + PostgreSQL**: O Prisma garante type-safety absoluto de ponta a ponta em TypeScript, facilitando migrações declarativas e evitando erros de escrita em consultas complexas.

---

## Desenho da Solução

### **Fluxo de dados e processamento**

1. **Recepção Síncrona**: O webhook da PagFacil atinge a rota **`POST /webhooks/pagfacil`**. A requisição valida o payload e verifica a existência do **`eventId`** no Redis/PostgreSQL.
2. **Resposta Rápida**: Caso seja novo, o evento é registrado e um job é enfileirado no BullMQ. A API responde imediatamente **`200`** OK para o gateway.
3. **Processamento Assíncrono (Worker)**: O Worker do BullMQ consome o job, reserva o ingresso no PostgreSQL dentro de uma transação ACID e enfileira a notificação.
4. **Tratamento de Falhas e Suporte**: Caso ocorra erro irrecuperável no disparo do e-mail, a tentativa é registrada na tabela **`LogEmail`** (**`status: FALHA`**). O suporte pode visualizar os erros e acionar o reenvio manual via **`/support/resend-email/:id`** no Painel de Suporte.

```
[Gateway PagFacil] ──(POST Webhook)──> [NestJS API] ──(Verifica Idempotência)
                                            │
                                    (Enfileira Job)
                                            │
                                            ▼
[Worker BullMQ] <──(Consome Job)── [Redis Broker]
       │
       ├──> [PostgreSQL] (Atualiza Pedido / Reserva Ingresso)
       └──> [Serviço de Email]
                 │
                 ├── (Sucesso) ──> Cliente Notificado
                 └── (Falha)   ──> [LogEmail: FALHA] ──> [Painel de Suporte /suporte]        
```

---

## Modos de Falha e Tratamentos

| **Cenário de Falha**                     | **Tratamento Aplicado**                                                           | **Justificativa**                                                       |
| ---------------------------------------- |:---------------------------------------------------------------------------------:|:------------------------------------------------------------------------|
| Reenvio de Webhook Duplicado             | Validado via **`eventId`** único no banco/cache antes do processamento.           | Evita geração de ingressos duplicados (Garantia de Idempotência).       |
| Queda do Worker no Meio do Processamento | O BullMQ identifica o stalled job e reatribui a tarefa a outro worker ativo.      | Garante que nenhuma compra paga fique sem processamento.                |
| Falha na API Externa de E-mail           | Estratégia de retry com exponential backoff configurada no BullMQ (5 tentativas). | Reduz o impacto de instabilidades temporárias em serviços de terceiros. |
| Concorrência (Esgotamento de Ingressos)  | Lock pessimista/Transação ACID no banco durante a baixa de estoque.               | Evita overbooking no lote de ingressos.                                 |

---

## Trade-offs e Análise de Custo em Pico

* **Trade-off de Arquitetura**: Optou-se por processamento assíncrono para garantir baixa latência na resposta ao gateway, aceitando uma consistência eventual de alguns segundos na entrega do e-mail.

* **Custo em Pico (8.000 ingressos em 5 minutos / ~27 req/s)**:
  * Com **BullMQ + Redis**, a API apenas enfileira requisições (~5ms por chamada), suportando o pico sem degradação.
  * O gargalo principal migra para as conexões do PostgreSQL durante a gravação final. Para mitigar, utiliza-se Connection Pooling (PgBouncer/Prisma Client) e limites de concorrência nos workers do BullMQ.

---

## Testes Realizados

* **Integração / E2E**: Script de simulação de webhook (**`npm run test:webhook`**) testando o ciclo de vida completo: aprovação, idempotência e estorno.

* **Fluxo de Suporte**: Teste de ponta a ponta do recebimento de falhas de e-mail e reprocessamento/reenvio manual pela interface do frontend.

---

## A Decisão do E-mail

* **Decisão Adotada**: Envio do e-mail **somente após a confirmação do pagamento (**`payment.approved`**) pelo webhook**.
 
* **Justificativa**: O disparo no ato da reserva (solicitação do marketing) gera alto custo de infraestrutura e sobrecarga nos provedores de e-mail por transações abandonadas (PIX não pago/cartão recusado). O envio após o aceite financeiro garante que apenas clientes convertidos recebam confirmação e ingressos válidos, alinhando a eficiência operacional com a expectativa do cliente final.

---

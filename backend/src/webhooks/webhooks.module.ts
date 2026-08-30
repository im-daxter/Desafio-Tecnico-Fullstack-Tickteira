import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { SecurityService } from '../security/security.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'pagamentos',
    }),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, SecurityService],
})
export class WebhooksModule {}

import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { SupportEmailsController } from './emails.controller';

@Module({
  controllers: [SupportEmailsController],
  providers: [EmailsService],
  exports: [EmailsService],
})
export class EmailsModule {}

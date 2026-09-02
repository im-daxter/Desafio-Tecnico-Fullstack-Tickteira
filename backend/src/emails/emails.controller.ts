import { Controller, Get, Post, Param } from '@nestjs/common';
import { EmailsService } from './emails.service';

@Controller('support')
export class SupportEmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Get('failed-emails')
  async getFailedEmails() {
    return this.emailsService.findFailedEmails();
  }

  @Post('resend-email/:id')
  async resendEmail(@Param('id') id: string) {
    return this.emailsService.requeueEmail(id);
  }
}

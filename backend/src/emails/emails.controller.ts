import { Controller, Get, Post, Param } from '@nestjs/common';
import { EmailsService } from './emails.service';

@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Get('logs')
  async listarLogs() {
    return this.emailsService.listarLogs();
  }

  @Post(':id/reenviar')
  async reenviarEmail(@Param('id') id: string) {
    return this.emailsService.reenviarEmail(id);
  }
}

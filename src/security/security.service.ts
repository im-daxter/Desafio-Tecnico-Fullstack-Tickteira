import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class SecurityService {
  private readonly secret = process.env.PAGFACIL_SECRET || 'minha_chave_secreta_dev';

  validarAssinatura(rawBody: string, signatureHeader: string): boolean {
    if (!signatureHeader) {
      throw new UnauthorizedException('Header de assinatura ausente.');
    }

    // Calcula o HMAC-SHA256 em formato hexadecimal
    const hmacCalculado = crypto
      .createHmac('sha256', this.secret)
      .update(rawBody)
      .digest('hex');

    const hmacBuffer = Buffer.from(hmacCalculado);
    const signatureBuffer = Buffer.from(signatureHeader);

    // Garante tamanhos iguais para o timingSafeEqual
    if (hmacBuffer.length !== signatureBuffer.length) {
      throw new UnauthorizedException('Assinatura inválida.');
    }

    // Comparação em tempo constante
    const saoIguaise = crypto.timingSafeEqual(hmacBuffer, signatureBuffer);

    if (!saoIguaise) {
      throw new UnauthorizedException('Assinatura inválida.');
    }

    return true;
  }
}

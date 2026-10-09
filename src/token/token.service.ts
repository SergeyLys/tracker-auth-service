import { Inject, Injectable } from '@nestjs/common';
import { JWT_SIGNER, type JwtSigner } from './infra/jwt-signer.interface';

interface AccessTokenPayload {
  sub: string;
  email: string;
  roles?: string[];
}

@Injectable()
export class TokenService {
  constructor(
    @Inject(JWT_SIGNER)
    private readonly signer: JwtSigner,
  ) {}

  async createAccessToken(payload: AccessTokenPayload): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: process.env.JWT_KID!,
    };

    const body = {
      ...payload,
      iss: process.env.JWT_ISSUER ?? 'tracker-auth',
      aud: process.env.JWT_AUDIENCE ?? 'tracker-api',
      iat: now,
      exp: now + 15 * 60,
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
      'base64url',
    );

    const encodedPayload = Buffer.from(JSON.stringify(body)).toString(
      'base64url',
    );

    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signature = await this.signer.sign(signingInput);

    return `${signingInput}.${signature}`;
  }
}

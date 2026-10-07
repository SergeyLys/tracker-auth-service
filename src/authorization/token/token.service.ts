import { KmsJwtSigner } from './infra/kms-jwt-signer';

interface AccessTokenPayload {
  sub: string;
  email: string;
  roles?: string[];
}

export class TokenService {
  private readonly signer: KmsJwtSigner;

  constructor() {
    this.signer = new KmsJwtSigner();
  }

  async createAccessToken(payload: AccessTokenPayload): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: process.env.JWT_KEY_ID!,
    };

    const body = {
      ...payload,

      iss: 'tracker-auth',
      aud: 'tracker-api',

      iat: now,
      exp: now + 15 * 60,
    };

    const encodedHeader = Buffer
      .from(JSON.stringify(header))
      .toString('base64url');

    const encodedPayload = Buffer
      .from(JSON.stringify(body))
      .toString('base64url');

    const signingInput =
      `${encodedHeader}.${encodedPayload}`;

    const signature = await this.signer.sign(signingInput);

    return `${signingInput}.${signature}`;
  }
}

import { readFile } from 'node:fs/promises';
import { createPrivateKey, sign as cryptoSign } from 'node:crypto';
import { JwtSigner } from './jwt-signer.interface';

export class LocalJwtSigner implements JwtSigner {
  private privateKeyPromise?: ReturnType<typeof this.loadPrivateKey>;

  constructor(private readonly privateKeyPath: string) {}

  private async loadPrivateKey() {
    const pem = await readFile(this.privateKeyPath, 'utf8');
    return createPrivateKey(pem);
  }
  async sign(signingInput: string): Promise<string> {
    this.privateKeyPromise ??= this.loadPrivateKey();
    const privateKey = await this.privateKeyPromise;
    return cryptoSign(
      'RSA-SHA256',
      Buffer.from(signingInput),
      privateKey,
    ).toString('base64url');
  }
}

import { Module } from '@nestjs/common';
import { JWT_SIGNER } from './infra/jwt-signer.interface';
import { TokenService } from './token.service';
import { KmsJwtSigner } from './infra/kms-jwt-signer';
import { LocalJwtSigner } from './infra/local-jwt.signer';

@Module({
  providers: [
    TokenService,
    {
      provide: JWT_SIGNER,
      useFactory: () => {
        const mode = process.env.JWT_SIGNING_MODE;

        if (mode === 'local') {
          const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH;
          if (!privateKeyPath) {
            throw new Error('JWT_PRIVATE_KEY_PATH is required');
          }

          return new LocalJwtSigner(privateKeyPath);
        }

        if (mode === 'kms') {
          const keyId = process.env.JWT_KMS_KEY_ID;
          if (!keyId) {
            throw new Error('JWT_KMS_KEY_ID is required');
          }

          return new KmsJwtSigner(keyId);
        }

        throw new Error('JWT_SIGNING_MODE must be local or kms');
      },
    },
  ],
  exports: [TokenService],
})
export class TokenModule {}

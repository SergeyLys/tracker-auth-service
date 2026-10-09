import {
  KMSClient,
  SignCommand,
} from '@aws-sdk/client-kms';
import { RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import type { JwtSigner } from './jwt-signer.interface';

export class KmsJwtSigner implements JwtSigner {
  private readonly kms: KMSClient;

  constructor(
    private readonly keyId: string,
    region = process.env.AWS_REGION ?? 'eu-central-1',
  ) {
    this.kms = new KMSClient({ region });
  }

  async sign(signingInput: string): Promise<string> {
    const result = await this.kms.send(
      new SignCommand({
        KeyId: this.keyId,
        Message: Buffer.from(signingInput),
        MessageType: 'RAW',
        SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256',
      }),
    );

    if (!result.Signature) {
      throw new RpcException({
        code: GrpcStatus.INTERNAL,
        message: 'KMS did not return a signature',
      });
    }

    return Buffer.from(result.Signature).toString('base64url');
  }
}

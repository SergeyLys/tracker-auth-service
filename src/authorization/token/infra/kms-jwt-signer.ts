import { KMSClient, SignCommand } from '@aws-sdk/client-kms';
import { RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';

export class KmsJwtSigner {
  private readonly kms = new KMSClient({
    region: process.env.AWS_REGION,
  });

  async sign(data: string): Promise<string> {
    const command = new SignCommand({
      KeyId: process.env.JWT_KMS_KEY_ID,
      Message: Buffer.from(data),
      MessageType: 'RAW',
      SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256',
    });

    const result = await this.kms.send(command);

    if (!result.Signature) {
      throw new RpcException({
        code: GrpcStatus.INTERNAL,
        message: 'KMS did not return a signature',
      });
    }

    return Buffer.from(result.Signature).toString('base64url');
  }
}

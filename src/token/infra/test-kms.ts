import {
  KMSClient,
  SignCommand,
  GetPublicKeyCommand,
} from '@aws-sdk/client-kms';
import { createPublicKey, verify } from 'node:crypto';

async function main() {
  console.log('start');
  const keyId = process.env.JWT_KMS_KEY_ID;

  console.log(keyId);

  if (!keyId) {
    throw new Error('JWT_KMS_KEY_ID is required');
  }

  const kms = new KMSClient({
    region: process.env.AWS_REGION ?? 'eu-central-1',
  });

  const message = Buffer.from('tracker-kms-test');

  const result = await kms.send(
    new SignCommand({
      KeyId: keyId,
      Message: message,
      MessageType: 'RAW',
      SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256',
    }),
  );

  if (!result.Signature) {
    throw new Error('KMS returned no signature');
  }

  const publicKeyResult = await kms.send(
    new GetPublicKeyCommand({ KeyId: keyId }),
  );

  if (!publicKeyResult.PublicKey) {
    throw new Error('KMS returned no public key');
  }

  const publicKey = createPublicKey({
    key: Buffer.from(publicKeyResult.PublicKey),
    format: 'der',
    type: 'spki',
  });

  const valid = verify(
    'sha256',
    message,
    publicKey,
    Buffer.from(result.Signature),
  );

  console.log({ valid });

  if (!valid) {
    throw new Error('Signature verification failed');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

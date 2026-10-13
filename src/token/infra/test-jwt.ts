import {
  KMSClient,
  SignCommand,
  GetPublicKeyCommand,
} from '@aws-sdk/client-kms';
import { createPublicKey } from 'node:crypto';
import { exportJWK, createLocalJWKSet, jwtVerify } from 'jose';

async function main() {
  const keyId = process.env.JWT_KMS_KEY_ID;

  if (!keyId) {
    throw new Error('JWT_KMS_KEY_ID is required');
  }

  const kms = new KMSClient({
    region: process.env.AWS_REGION ?? 'eu-central-1',
  });

  // Keep this kid consistent between the JWT header and JWKS.
  const kid = 'tracker-2026-01';
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid,
  };

  const payload = {
    sub: 'test-user-123',
    email: 'test@tracker.local',
    iss: 'tracker-auth',
    aud: 'tracker-api',
    iat: now,
    exp: now + 15 * 60,
  };

  // JWT signing input: base64url(header).base64url(payload)
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');

  const signingInput = `${encode(header)}.${encode(payload)}`;

  // KMS signs the input without exposing the private key.
  const signResult = await kms.send(
    new SignCommand({
      KeyId: keyId,
      Message: Buffer.from(signingInput),
      MessageType: 'RAW',
      SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256',
    }),
  );

  if (!signResult.Signature) {
    throw new Error('KMS returned no signature');
  }

  const token = `${signingInput}.${Buffer.from(signResult.Signature).toString('base64url')}`;

  // Retrieve the public key. This operation does not expose the private key.
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

  // Convert the public key to the format used by a JWKS endpoint.
  const publicJwk = await exportJWK(publicKey);

  const jwk = {
    ...publicJwk,
    kid,
    use: 'sig',
    alg: 'RS256',
  };

  // Verify the actual JWT using only the public key.
  const localJwks = createLocalJWKSet({
    keys: [jwk],
  });

  const verified = await jwtVerify(token, localJwks, {
    issuer: 'tracker-auth',
    audience: 'tracker-api',
    algorithms: ['RS256'],
  });

  console.log({
    jwtCreated: true,
    signatureVerified: true,
    subject: verified.payload.sub,
    issuer: verified.payload.iss,
    audience: verified.payload.aud,
    expiresAt: new Date(verified.payload.exp! * 1000).toISOString(),
    jwks: {
      keys: [
        {
          kty: jwk.kty,
          kid: jwk.kid,
          use: jwk.use,
          alg: jwk.alg,
        },
      ],
    },
  });

  // Keep this only in the local test. Never log real production tokens.
  console.log('\nJWT:\n', token);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

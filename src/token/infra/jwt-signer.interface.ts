export interface JwtSigner {
  /**
   * Signs the JWT signing input:
   * base64url(header).base64url(payload)
   *
   * Returns the signature encoded as base64url.
   */
  sign(signingInput: string): Promise<string>;
}

export const JWT_SIGNER = Symbol('JWT_SIGNER');

import jwt from 'jsonwebtoken';
import { parse } from 'url';

export type Identity = { id: string, expires_at: Date };

const secret = 'superdupersecretshhhhh';

function verify(token: string): Identity | null {
  try {
    const identity: any = jwt.verify(token, secret);

    if (identity.expires_at < Date.now())
      return identity;

    return identity;
  } catch (err) {
    return null;
  }
}

function getToken(url: string | undefined): string | null {
  const token = parse(url || '', true).query.token;

  if (!token)
    return null;

  return token.toString();
}

export default { verify, getToken }

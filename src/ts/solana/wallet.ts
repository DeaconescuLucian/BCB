import { Keypair } from '@solana/web3.js';
import * as bs58 from 'bs58';

export const generateWallet = () => {
  const keyPair = Keypair.generate();
  return { publicKey: keyPair.publicKey.toBase58(), secretKey: keyPair.secretKey };
};

export function importKeypair(param: string) {
  let keyPair, secretKey;
  try {
    secretKey = Uint8Array.from(param.split(',').map(Number));
    keyPair = Keypair.fromSecretKey(secretKey);
  } catch {
    try {
      secretKey = bs58.decode(param);
      keyPair = Keypair.fromSecretKey(secretKey);
    } catch {
      return { status: 'fail', error: 'Invalid secret key.' };
    }
    return {
      status: 'success',
      message: 'Wallet imported successfully.',
      data: { keyPair: keyPair, publicKey: keyPair.publicKey.toBase58(), secretKey: param },
    };
  }
}

export function getKeyPairFromSecret(param: string) {
  let keyPair, secretKey;
  try {
    secretKey = Uint8Array.from(param.split(',').map(Number));
    keyPair = Keypair.fromSecretKey(secretKey);
    return keyPair;
  } catch {
    try {
      secretKey = bs58.decode(param);
      keyPair = Keypair.fromSecretKey(secretKey);
      return keyPair;
    } catch {
      return null;
    }
  }
}

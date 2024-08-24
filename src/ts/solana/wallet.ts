import { Keypair } from '@solana/web3.js';

export const generateWallet = () => {
  const keyPair = Keypair.generate();
  return { publicKey: keyPair.publicKey.toBase58(), secretKey: keyPair.secretKey };
};

export function importKeypair(param: string) {
  let keyPair, secretKey;
  try {
    secretKey = Uint8Array.from(param.split(',').map(Number));
    keyPair = Keypair.fromSecretKey(secretKey);
    return {
      status: 'success',
      message: 'Wallet imported successfully.',
      data: { keyPair: keyPair, publicKey: keyPair.publicKey.toBase58(), secretKey: param },
    };
  } catch {
    return { status: 'fail', message: 'Invalid secret key.' };
  }
}

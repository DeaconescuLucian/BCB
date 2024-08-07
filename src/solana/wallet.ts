import { Keypair } from "@solana/web3.js";
import bs58 from 'bs58';


export const generateWallet = () => {
    const keyPair =  Keypair.generate();
    const secret = bs58.encode(keyPair.secretKey)
    return {kp: keyPair, pub: keyPair.publicKey.toBase58(), secret: secret};
}
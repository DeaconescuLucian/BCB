import { Keypair } from "@solana/web3.js";


export const generateWallet = () => {
    const keyPair =  Keypair.generate();
    return {kp: keyPair, pub: keyPair.publicKey.toBase58(), secret: keyPair.secretKey};
}
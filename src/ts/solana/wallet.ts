import { Keypair } from "@solana/web3.js";
import * as bs58 from 'bs58';


export const generateWallet = () => {
    const keyPair =  Keypair.generate();
    return {kp: keyPair, pub: keyPair.publicKey.toBase58(), secret: keyPair.secretKey};
}

export function importKeypair(param:string){
    let keyPair,secretKey;
    try{
    secretKey = Uint8Array.from(param.split(',').map(Number));
    keyPair = Keypair.fromSecretKey(secretKey); 
    }
    catch{
        try{
            secretKey = bs58.decode(param);
            keyPair = Keypair.fromSecretKey(secretKey);
        }
        catch{
            console.error('Invalid keypair')
            return;
        }
    }
    return {kp: keyPair, pub: keyPair.publicKey.toBase58(), secret: keyPair.secretKey};
}


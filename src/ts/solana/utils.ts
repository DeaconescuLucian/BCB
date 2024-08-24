import { ComputeBudgetProgram,SystemProgram, TransactionInstruction, VersionedTransaction, TransactionMessage, Connection, PublicKey, LAMPORTS_PER_SOL, Keypair } from "@solana/web3.js";

export interface TransferParams {
    walletA : Keypair,
    walletB : Keypair | PublicKey,
    amount: number,
    cpuLimit?: number;
    prioFee?: number;
    jitoFee?: number;
}


export const TransferFeesDefault = {
    prioFee: 1000,
    cpuLimit: 1000
}

export function createConnection() {
    return new Connection('https://api.devnet.solana.com');
}


export async function getSolanaBalance(connection: Connection, publicKey: PublicKey):Promise<number> {
    return (await connection.getBalance(publicKey)/LAMPORTS_PER_SOL);
}

export async function createSignedTransaction(wallet:Keypair, connection: Connection, instructions: TransactionInstruction[], signers?: Keypair[], blockhash?: string): Promise<VersionedTransaction>{
    if (!blockhash){
        blockhash = (await connection.getLatestBlockhash('finalized')).blockhash
    }

    let payerKey: PublicKey;

    if (signers && !signers.some(signer => signer.publicKey.equals(wallet.publicKey))) {
        payerKey = signers[0].publicKey
    }
    else{
        payerKey = wallet.publicKey
    }

    const tx_msg = new TransactionMessage({
        payerKey: payerKey,
        instructions: instructions,
        recentBlockhash: blockhash
    }).compileToV0Message()

    const tx = new VersionedTransaction(tx_msg)
    let fsigners = signers || [wallet]
    tx.sign(fsigners)

    return tx;
}

export async function simpleTransfer(connection:Connection, TransferParams: TransferParams):Promise<void> {
    let { walletA ,walletB , amount, cpuLimit, prioFee} = TransferParams;

    const [lastbk, accountBalance, rent] = await Promise.all([
        connection.getLatestBlockhash('finalized').then(res => res.blockhash),
        connection.getBalance(walletA.publicKey, 'confirmed'),
        connection.getMinimumBalanceForRentExemption(0)
    ]);

    if (!prioFee){
        prioFee = TransferFeesDefault.prioFee;
    }

    if (!cpuLimit){
        cpuLimit = TransferFeesDefault.cpuLimit;
    }

    if (amount > accountBalance) {
        console.log('Insufficient funds');
        return;
    }

    const toPubkey = walletB instanceof PublicKey ? walletB : walletB.publicKey;

    let instructions = [
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: cpuLimit }),
        ComputeBudgetProgram.setComputeUnitLimit({ units: prioFee}),
        SystemProgram.transfer({
            fromPubkey: walletA.publicKey,
            toPubkey: toPubkey,
            lamports: amount
        }),
    ];

    const tx = await createSignedTransaction(walletA, connection, instructions, undefined, lastbk);

    const sim = await connection.simulateTransaction(tx, { commitment: 'confirmed' });

    if (sim.value.err) {
        console.log(sim.value.logs);
        console.log(sim.value.err);
        return;
    }

    console.log(`Simulation successful`);
    return;
}
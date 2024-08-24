import { ComputeBudgetProgram, 
    SystemProgram, 
    TransactionInstruction, 
    VersionedTransaction, 
    TransactionMessage, 
    Connection, 
    PublicKey, 
    LAMPORTS_PER_SOL, 
    Keypair, 
    clusterApiUrl } from "@solana/web3.js";

import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { SPL_ACCOUNT_LAYOUT } from "@raydium-io/raydium-sdk";

import { programs } from "@metaplex/js";
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
    //return new Connection(clusterApiUrl("devnet"), "confirmed");
    return new Connection('https://solana-mainnet.api.syndica.io/api-key/aS1Y8g8LYE1fxcFBtrG6v5GfsTZNhpBnoLF3YVXwESwmRu1RkAxm32ctxkVGNRkxLF78T7PWaDn5y4UGTvXDWNShHatT92pTzK')
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

export async function getTokensOwnedByWallet(connection: Connection, publicKey: PublicKey): Promise<void> {
    const { metadata: { Metadata } } = programs;
    const tokensAccs = await connection.getTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID });
    let name, symbol, mint, balance, uri;

    // mint = adresa tokenului
    
    for (const tokenAcc of tokensAccs.value) {
        balance = (await (connection.getTokenAccountBalance(tokenAcc.pubkey))).value.uiAmount;

        if (balance === 0){
            console.log(`Balance was 0 skipping`);
            continue;
        }
        
        mint = SPL_ACCOUNT_LAYOUT.decode(tokenAcc.account.data).mint;

        try{
            const metadataPDA = await Metadata.getPDA(mint);
            const metadataAccount = await Metadata.load(connection, metadataPDA);
            name = metadataAccount.data.data.name;
            symbol = metadataAccount.data.data.symbol;
            uri = metadataAccount.data.data.uri;
        }
        catch (err){
            continue;
        }
    }
    // ...
    return;
}
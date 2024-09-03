import { PublicKey, Keypair, Connection, TransactionInstruction, SystemProgram, ComputeBudgetProgram, VersionedTransaction, TransactionMessage, LAMPORTS_PER_SOL  } from '@solana/web3.js';
import * as raydium from '@raydium-io/raydium-sdk';
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction, createCloseAccountInstruction, createSyncNativeInstruction, createUpdateGroupMaxSizeInstruction } from '@solana/spl-token';
import BN from 'bn.js';
import {findRaydiumPoolInfo} from './utils'

async function simulateTransaction(tx:VersionedTransaction, connection:Connection){
    const sim = await connection.simulateTransaction(tx, {commitment: 'confirmed'})
    if(sim.value.err){
      console.log(sim.value.logs)
      console.log(sim.value.err)
      return {
        status: 'fail',
        error: 'Simulation failed'
      }
    }
    else{
      console.log(`Simulation successful`)
      return {
        status: 'success',
        message: 'Simulation successful'
      }
    }
}
  
async function sendTransaction(tx: VersionedTransaction, block: any, connection: Connection, simulate: boolean) {
    try {
      if (simulate) return simulateTransaction(tx, connection); else{
      const signature = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: true });
      console.log(`Transaction sent: ${signature}`);
  
      const confirmation = new Promise<{ status: string; message?: string; error?: string }>((resolve) => {
        connection.confirmTransaction({signature: signature, blockhash: block.blockhash,lastValidBlockHeight: block.lastValidBlockHeight},'confirmed')
        .then((result) => {
          if (result.value.err) {
            console.log(`Error confirming signature: ${signature}`);
            console.log(result.value.err);
            resolve({
              status: 'fail',
              error: 'Transaction was not confirmed',
            });
          } else {
            console.log(`Signature confirmed: ${signature}`);
            resolve({
              status: 'success',
              message: 'Transaction confirmed',
            });
          }
        });
      });
  
      return {
        status: 'pending',
        signature: signature,
        confirmation: confirmation
      };
    }
    } catch (e) {
      console.log(`Error sending transaction`);
      console.log(e);
      return {
        status: 'fail',
        error: 'Transaction was not sent'
      };
    }
}

async function createSignedTransaction(instructions: TransactionInstruction[], connection:Connection, signer: Keypair, blockhash?: string): Promise<VersionedTransaction>{
    if (!blockhash){
        blockhash = (await connection.getLatestBlockhash('finalized')).blockhash
    }
  
    const tx_msg = new TransactionMessage({
        payerKey: signer.publicKey,
        instructions: instructions,
        recentBlockhash: blockhash
    }).compileToV0Message()
  
    const tx = new VersionedTransaction(tx_msg)
    tx.sign([signer])
  
    return tx;
}

interface buyParams{
    wallet: Keypair;
    mint: PublicKey;
    amount: number;
    poolKeys?: raydium.LiquidityPoolKeysV4 | undefined;
}

interface sellParams{
    wallet: Keypair;
    mint: PublicKey;
    percentage: number;
    poolKeys?: raydium.LiquidityPoolKeysV4 | undefined;
}

interface simpleTransferParams {
    walletA: Keypair;
    walletB: Keypair | PublicKey;
    amount: number;
}
  
interface feesParams{
    prioFee: number;
}

export async function simpleTransfer(params: simpleTransferParams, fees: feesParams, connection:Connection, simulate:boolean) {
    let { walletA, walletB, amount } = params;
    amount = amount * LAMPORTS_PER_SOL;
  
    const [lastbk, accountBalance, rent] = await Promise.all([
      connection.getLatestBlockhash('finalized'),
      connection.getBalance(walletA.publicKey, 'confirmed'),
      connection.getMinimumBalanceForRentExemption(0),
    ]);
  
    const toPubkey = walletB instanceof PublicKey ? walletB : walletB.publicKey;
  
    let instructions = [
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
      ComputeBudgetProgram.setComputeUnitLimit({ units: (fees.prioFee)*LAMPORTS_PER_SOL }),
      SystemProgram.transfer({
        fromPubkey: walletA.publicKey,
        toPubkey: toPubkey,
        lamports: amount,
      }),
    ];
  
    const tx = await createSignedTransaction(instructions, connection, walletA, lastbk.blockhash);
    return sendTransaction(tx, lastbk, connection, simulate);
}

export async function buy(params:buyParams, fees:feesParams, connection:Connection, simulate: boolean){
  const quoteToken = raydium.Token.WSOL.mint;
  let { wallet, mint, amount, poolKeys } = params;

  const tokenAccount = getAssociatedTokenAddressSync(mint, wallet!.publicKey, true);
  const quotetokenAccount = getAssociatedTokenAddressSync(quoteToken, wallet!.publicKey, true);

  const quoteAmount = new BN(amount*LAMPORTS_PER_SOL)

  poolKeys = params.poolKeys || await findRaydiumPoolInfo(mint.toString(), quoteToken.toString(), connection);
  if (!poolKeys){
      console.log(`Pool not found`)
      return {
          status: 'fail',
          error: 'Pool not found'
      }
  }

  const { innerTransaction, address } = raydium.Liquidity.makeSwapFixedInInstruction(
  {
      poolKeys: poolKeys!,
      userKeys: {
      tokenAccountIn: quotetokenAccount!,
      tokenAccountOut: tokenAccount!,
      owner: wallet.publicKey,
      },
      amountIn: quoteAmount,
      minAmountOut: 0,
  },
  poolKeys!.version,
  );

  const lastbk = await connection.getLatestBlockhash('finalized')

  const instructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: fees.prioFee*LAMPORTS_PER_SOL}),
      createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, tokenAccount, wallet.publicKey, mint),
      ...innerTransaction.instructions
  ]

  const tx = await createSignedTransaction(instructions, connection, wallet, lastbk.blockhash)
  return sendTransaction(tx, lastbk, connection, simulate)
}

export async function unwrapSol(wallet:Keypair, fees:feesParams, connection:Connection, simulate: boolean){
  const ata = getAssociatedTokenAddressSync(raydium.Token.WSOL.mint, wallet.publicKey)
  const blockhash = await connection.getLatestBlockhash('finalized')
  const instructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 50000 }), 
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: fees.prioFee*LAMPORTS_PER_SOL }), 
      createCloseAccountInstruction(ata, wallet.publicKey, wallet.publicKey)
  ]
  const tx = await createSignedTransaction(instructions, connection, wallet)
  return sendTransaction(tx, blockhash, connection, simulate)
}

export async function wrapSol(wallet:Keypair, amount:number, fees:feesParams, connection:Connection, simulate: boolean){
  const ata = getAssociatedTokenAddressSync(raydium.Token.WSOL.mint, wallet.publicKey)
  const blockhash = await connection.getLatestBlockhash('finalized')
  const instructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 50000 }), 
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: fees.prioFee*LAMPORTS_PER_SOL }), 
      createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, ata, wallet.publicKey, raydium.Token.WSOL.mint),
      createSyncNativeInstruction(ata),
      SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: ata,
          lamports: BigInt(amount*LAMPORTS_PER_SOL)
      })
  ] 
  const tx = await createSignedTransaction(instructions, connection, wallet)
  return sendTransaction(tx, blockhash, connection, simulate)
}

export async function sell(params:sellParams, fees:feesParams, connection:Connection, simulate: boolean){
    const quoteToken = raydium.Token.WSOL.mint;

    const { wallet, mint, percentage } = params;
    const poolKeys = params.poolKeys || await findRaydiumPoolInfo(mint.toString(), quoteToken.toString(), connection)
    if (!poolKeys){
        console.log(`Pool not found`)
        return {
            status: 'fail',
            error: 'Pool not found'
        }
    }

    const tokenAccount = getAssociatedTokenAddressSync(mint, wallet.publicKey);
    const quotetokenAccount = getAssociatedTokenAddressSync(quoteToken, wallet.publicKey);

    let s;
    try{    
        s = await connection.getTokenAccountBalance(tokenAccount, 'confirmed')
    }catch{
        console.log('Token account does not exist')
        return {
            status: 'fail',
            error: 'Token account does not exist'
        }
    }   
    let initialsupply= new BN(s.value.amount)
    let amount = initialsupply.mul(new BN(percentage)).div(new BN(100))

    const { innerTransaction, address } = raydium.Liquidity.makeSwapFixedInInstruction(
    {
        poolKeys: poolKeys!,
        userKeys: {
        tokenAccountIn: tokenAccount,
        tokenAccountOut: quotetokenAccount,
        owner: wallet!.publicKey,
        },
        amountIn: amount,
        minAmountOut: 0,
    },
    poolKeys!.version,
    );

    let lastbk = (await connection.getLatestBlockhash('finalized')).blockhash

    const instructions = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: fees.prioFee*LAMPORTS_PER_SOL}),
        createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, quotetokenAccount, wallet.publicKey, quoteToken),
        ...innerTransaction.instructions
    ]

    const sell_tx = await createSignedTransaction(instructions, connection, wallet, lastbk)
    return sendTransaction(sell_tx, lastbk, connection, simulate)
}
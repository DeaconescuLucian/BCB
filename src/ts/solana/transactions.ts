import {
  PublicKey,
  Keypair,
  Connection,
  TransactionInstruction,
  SystemProgram,
  ComputeBudgetProgram,
  VersionedTransaction,
  TransactionMessage,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import * as raydium from '@raydium-io/raydium-sdk';
import * as raydiumv2 from '@raydium-io/raydium-sdk-v2';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  createUpdateGroupMaxSizeInstruction,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import BN from 'bn.js';
import { findRaydiumpoolKeys, getRaydiumPoolsbyMints, BasePoolKeys } from './utils';
import { sign } from 'crypto';

async function simulateTransaction(tx: VersionedTransaction, connection: Connection) {
  const sim = await connection.simulateTransaction(tx, { commitment: 'confirmed' });
  if (sim.value.err) {
    console.log(sim.value.logs);
    console.log(sim.value.err);
    return {
      status: 'fail',
      error: 'Simulation failed',
    };
  } else {
    console.log(`Simulation successful`);
    return {
      status: 'success',
      message: 'Simulation successful',
    };
  }
}

export async function confirmTransaction(connection: Connection, params: { signature: string; block: any }) {
  const { signature, block } = params;

  try{
    const result = await connection.confirmTransaction(
      { signature: signature, blockhash: block.blockhash, lastValidBlockHeight: block.lastValidBlockHeight },
      'confirmed'
    );
    if (result) {
      if (result.value.err) {
        console.log(`Error confirming signature: ${signature}`);
        console.log(result.value.err);
        return {
          status: 'fail',
          error: 'Transaction was not confirmed',
          signature: signature,
          date: new Date()
        };
      } else {
        console.log(`Signature confirmed: ${signature}`);
        return {
          status: 'success',
          message: 'Transaction confirmed',
          signature: signature,
          date: new Date()
        };
      }
    } else {
      return {
        status: 'fail',
        error: 'Transaction was not confirmed',
        signature: signature,
        date: new Date()
      };
    }
  } catch {
    return {
      status: 'fail',
      error: 'Transaction was not confirmed',
      signature: signature,
      date: new Date()
    };
  }

}

async function sendTransaction(tx: VersionedTransaction, block: any, connection: Connection, simulate: boolean, amount?: number) {
  try {
    if (simulate) return simulateTransaction(tx, connection);
    else {
      const signature = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: true });
      //const signature = '4ke375HLhV871nV5DkexZjxAe9LkBQGAnM7e2BcPqwP2XKxJrNPTiZEBwKY57tAYgzAcgCLH2SZTQv6CwsfWEbU7'
      const confirmation = confirmTransaction(connection, { signature: signature, block: block });
      console.log(`Transaction sent: ${signature}`);
      //const conf = confirmTransaction(connection, { signature: signature, block: block });
      if (signature) {
        return {
          status: 'success',
          message: `Transaction sent: ${signature}`,
          signature: signature,
          block: block,
          amount: amount,
          confirmation: confirmation
        };
      } else {
        return {
          status: 'fail',
          message: `Transaction could not be sent.`,
        };
      }
    }
  } catch (e) {
    console.log(`Error sending transaction`);
    console.log(e);
    return {
      status: 'fail',
      error: 'Transaction could not be sent.',
    };
  }
}

async function createSignedTransaction(
  instructions: TransactionInstruction[],
  connection: Connection,
  signer: Keypair,
  blockhash?: string
): Promise<VersionedTransaction> {
  if (!blockhash) {
    blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
  }

  const tx_msg = new TransactionMessage({
    payerKey: signer.publicKey,
    instructions: instructions,
    recentBlockhash: blockhash,
  }).compileToV0Message();

  const tx = new VersionedTransaction(tx_msg);
  tx.sign([signer]);

  return tx;
}

export interface swapParams {
  wallet: Keypair;
  mintA: PublicKey;
  mintB: PublicKey;
  amount: number;
  poolKeys?: raydium.LiquidityPoolKeysV4 | undefined;
}

interface sellParams {
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

export interface feesParams {
  prioFee: number;
}

export async function simpleTransfer(
  params: simpleTransferParams,
  fees: feesParams,
  connection: Connection,
  simulate: boolean
) {
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
    ComputeBudgetProgram.setComputeUnitLimit({ units: fees.prioFee * LAMPORTS_PER_SOL }),
    SystemProgram.transfer({
      fromPubkey: walletA.publicKey,
      toPubkey: toPubkey,
      lamports: amount,
    }),
  ];

  const tx = await createSignedTransaction(instructions, connection, walletA, lastbk.blockhash);
  return sendTransaction(tx, lastbk, connection, simulate);
}

export async function getPoolKeys(mint: PublicKey, connection: Connection) {
  const quoteToken = raydium.Token.WSOL.mint;

  let poolKeys = await findRaydiumpoolKeys(mint.toString(), quoteToken.toString(), connection);
  if (!poolKeys) {
    return undefined;
  }
  return poolKeys;
}

export async function swap(params: swapParams, fees: feesParams, connection: Connection, simulate: boolean, basepoolKeys: BasePoolKeys) {
  try{
  let { wallet, mintA, mintB, amount } = params;

  let poolKeys = basepoolKeys.poolKeys;
  // console.log(`enter swap`)
  // console.log(`basepoolKeys:`,basepoolKeys)

  const lastbk = await connection.getLatestBlockhash('finalized');
  const tokenAccount = getAssociatedTokenAddressSync(mintB, wallet!.publicKey, true);
  const quotetokenAccount = getAssociatedTokenAddressSync(mintA, wallet!.publicKey, true);

  let instructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: fees.prioFee * LAMPORTS_PER_SOL }),
  ];

  if(basepoolKeys.type === `Concentrated`){
    const INVERTED = basepoolKeys.mintA === mintB.toString();
    let apimintA = raydiumv2.toApiV3Token({address: poolKeys!.mintA.toBase58(), programId: TOKEN_PROGRAM_ID.toBase58(), decimals: poolKeys!.mintDecimalsA})
    let apimintB = raydiumv2.toApiV3Token({address: poolKeys!.mintB.toBase58(), programId: TOKEN_PROGRAM_ID.toBase58(), decimals: poolKeys!.mintDecimalsB})
    let clmminfo = await raydiumv2.PoolUtils.fetchComputeClmmInfo({
      connection,
      poolInfo: {
        id: poolKeys!.poolId.toBase58(),
        programId: poolKeys!.programId.toBase58(),
        mintA: apimintA,
        mintB: apimintB,
        config: poolKeys!.config,
        price: poolKeys!.price,
      }
    })

    const x = await raydiumv2.PoolUtils.fetchMultiplePoolTickArrays({connection:connection, poolKeys:[clmminfo], batchRequest: true})





    const quoteAmount = INVERTED ? new BN(amount * (10**poolKeys.mintDecimalsB)) : new BN(amount * (10**poolKeys!.mintDecimalsA));
    console.log(`quoteAmount:`,quoteAmount)
    console.log(`program id:`,poolKeys!.programId)

    const { minAmountOut, remainingAccounts} = raydiumv2.PoolUtils.computeAmountOutFormat({
      poolInfo: clmminfo,
      tickArrayCache: x[clmminfo.id.toString()],
      amountIn: quoteAmount,
      tokenOut: INVERTED ? apimintA : apimintB,
      slippage: 0.01,
      epochInfo: await connection.getEpochInfo(),
    })

    const clmm_swap = raydiumv2.ClmmInstrument.swapInstruction(
      poolKeys!.programId,
      wallet.publicKey,
      poolKeys!.poolId,
      poolKeys!.ammConfig,
      INVERTED ? tokenAccount : quotetokenAccount,
      INVERTED ? quotetokenAccount: tokenAccount,
      poolKeys!.vaultA,
      poolKeys!.vaultB,
      poolKeys!.mintA,
      poolKeys!.mintB,
      remainingAccounts,
      poolKeys!.observationId,
      quoteAmount,
      new BN(0),
      poolKeys!.sqrtPriceLimitX64,
      true,
      raydiumv2.getPdaExBitmapAccount(poolKeys!.programId, poolKeys!.poolId).publicKey,
    )
  
    instructions.push(createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, tokenAccount, wallet.publicKey, mintB),
    createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, quotetokenAccount, wallet.publicKey, mintA),
    clmm_swap);
  }
  else if(basepoolKeys.type === `Standard`){
    const INVERTED = basepoolKeys.mintA === mintB.toString();
    const quoteAmount = INVERTED ? new BN(amount * (10**poolKeys!.quoteDecimals)) : new BN(amount * (10**poolKeys!.baseDecimals));
    console.log(`decimal powert:`,quoteAmount)
    console.log(10**poolKeys!.quoteDecimals)
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
      poolKeys!.version
    );
    instructions.push(createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, tokenAccount, wallet.publicKey, mintB),
    createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, quotetokenAccount, wallet.publicKey, mintA),
    ...innerTransaction.instructions);
  }


  const tx = await createSignedTransaction(instructions, connection, wallet, lastbk.blockhash);
  return sendTransaction(tx, lastbk, connection, simulate, params.amount);
} catch (e) {
  console.log(e);
}
}

export async function unwrapSol(wallet: Keypair, connection: Connection, amount: number, simulate: boolean) {
  const ata = getAssociatedTokenAddressSync(raydium.Token.WSOL.mint, wallet.publicKey);
  const blockhash = await connection.getLatestBlockhash('finalized');
  const instructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 50000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
    createCloseAccountInstruction(ata, wallet.publicKey, wallet.publicKey),
  ];
  const tx = await createSignedTransaction(instructions, connection, wallet);
  return sendTransaction(tx, blockhash, connection, simulate, amount);
}

export async function wrapSol(wallet: Keypair, amount: number, connection: Connection, simulate: boolean) {
  const ata = getAssociatedTokenAddressSync(raydium.Token.WSOL.mint, wallet.publicKey);
  const blockhash = await connection.getLatestBlockhash('finalized');
  const instructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 50000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
    createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, ata, wallet.publicKey, raydium.Token.WSOL.mint),
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: ata,
      lamports: BigInt(amount * LAMPORTS_PER_SOL),
    }),
    createSyncNativeInstruction(ata),
  ];
  const tx = await createSignedTransaction(instructions, connection, wallet);
  return sendTransaction(tx, blockhash, connection, simulate, amount);
}

export async function sell(params: sellParams, fees: feesParams, connection: Connection, simulate: boolean) {
  const quoteToken = raydium.Token.WSOL.mint;

  const { wallet, mint, percentage } = params;
  const poolKeys = params.poolKeys || (await findRaydiumpoolKeys(mint.toString(), quoteToken.toString(), connection));
  if (!poolKeys) {
    console.log(`Pool not found`);
    return {
      status: 'fail',
      error: 'Pool not found',
    };
  }

  const tokenAccount = getAssociatedTokenAddressSync(mint, wallet.publicKey);
  const quotetokenAccount = getAssociatedTokenAddressSync(quoteToken, wallet.publicKey);

  let s;
  try {
    s = await connection.getTokenAccountBalance(tokenAccount, 'confirmed');
  } catch {
    console.log('Token account does not exist');
    return {
      status: 'fail',
      error: 'Token account does not exist',
    };
  }
  let initialsupply = new BN(s.value.amount);
  let amount = initialsupply.mul(new BN(percentage)).div(new BN(100));

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
    poolKeys!.version
  );

  let lastbk = (await connection.getLatestBlockhash('finalized')).blockhash;

  const instructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: fees.prioFee * LAMPORTS_PER_SOL }),
    createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey,
      quotetokenAccount,
      wallet.publicKey,
      quoteToken
    ),
    ...innerTransaction.instructions,
  ];

  const sell_tx = await createSignedTransaction(instructions, connection, wallet, lastbk);
  return sendTransaction(sell_tx, lastbk, connection, simulate);
}

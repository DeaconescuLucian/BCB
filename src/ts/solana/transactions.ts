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
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
} from '@solana/spl-token';
import BN from 'bn.js';
import { findRaydiumpoolKeys, getRaydiumPoolsbyMints, BasePoolKeys } from './utils';
import { sign } from 'crypto';
import axios from 'axios';

export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
  confirmation?: Promise<any>;
}

export async function simulateTransaction(tx: VersionedTransaction, connection: Connection) {
  try {
    const sim = await connection.simulateTransaction(tx, { commitment: 'processed' });
    console.log(sim)
    if (sim.value.err) {
      console.log(`Simulation failed`);
      console.log(sim.value.logs);
      console.log(sim.value.err);
      return {
        status: 'fail',
        error: 'Simulation failed',
        signature: '',
        block: null,
        amount: 0,
        confirmation: null,
      };
    } else {
      console.log(`Simulation successful`);
      return {
        status: 'success',
        message: 'Simulation successful',
        signature: '',
        block: null,
        amount: 0,
        confirmation: null,
      };
    }
  } catch (error) {
    console.log('Simulation error')
    console.log(error);
    return {
      status: 'fail',
      error: 'Simulation failed',
      signature: '',
      block: null,
      amount: 0,
      confirmation: null,
    };
  }
}

export async function confirmTransaction(connection: Connection, params: { signature: string; block: any }) {
  const { signature, block } = params;
  try {
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
          date: new Date(),
        };
      } else {
        console.log(`Signature confirmed: ${signature}`);
        return {
          status: 'success',
          message: 'Transaction confirmed',
          signature: signature,
          date: new Date(),
        };
      }
    } else {
      return {
        status: 'fail',
        error: 'Transaction was not confirmed',
        signature: signature,
        date: new Date(),
      };
    }
  } catch {
    return {
      status: 'fail',
      error: 'Transaction was not confirmed',
      signature: signature,
      date: new Date(),
    };
  }
}

export async function sendTransaction(
  tx: VersionedTransaction,
  block: any,
  connection: Connection,
  simulate: boolean
): Promise<TransactionResult> {
  if (simulate) {
    const simResult = await simulateTransaction(tx, connection);
    return {
      success: simResult.status === 'success',
      error: simResult.status === 'fail' ? simResult.error : undefined,
    };
  } else {
    try {
      const signature = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: true });
      console.log(`Transaction sent: ${signature}`);
      return {
        success: true,
        signature,
        confirmation: confirmTransaction(connection, { signature, block }),
      };
    } catch (e) {
      console.log(`Error sending transaction`, e);
      return {
        success: false,
        error: 'Transaction could not be sent.',
      };
    }
  }
}

export async function createSignedTransaction(
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
  walletB: PublicKey;
  amount: number;
}

interface simpleTokenTransferParams {
  walletA: Keypair;
  walletB: PublicKey;
  mint: PublicKey;
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
): Promise<TransactionResult> {
  let { walletA, walletB, amount } = params;
  amount = amount * LAMPORTS_PER_SOL;

  const [lastbk, accountBalance, rent] = await Promise.all([
    connection.getLatestBlockhash('finalized'),
    connection.getBalance(walletA.publicKey, 'confirmed'),
    connection.getMinimumBalanceForRentExemption(0),
  ]);

  const toPubkey = walletB;

  const decimals = 9;

  let instructions = [
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5000 }),
    ComputeBudgetProgram.setComputeUnitLimit({ units: fees.prioFee * LAMPORTS_PER_SOL }),
    SystemProgram.transfer({
      fromPubkey: walletA.publicKey,
      toPubkey: toPubkey,
      lamports: Number(amount.toFixed(decimals)),
    }),
  ];

  const tx = await createSignedTransaction(instructions, connection, walletA, lastbk.blockhash);
  return sendTransaction(tx, lastbk, connection, simulate);
}

export async function simpleTokenTransfer(
  params: simpleTokenTransferParams,
  fees: feesParams,
  connection: Connection,
  simulate: boolean
): Promise<TransactionResult> {
  let { walletA, walletB, amount, mint } = params;

  const [lastbk, accountBalance, rent] = await Promise.all([
    connection.getLatestBlockhash('finalized'),
    connection.getBalance(walletA.publicKey, 'confirmed'),
    connection.getMinimumBalanceForRentExemption(0),
  ]);

  const fromTokenAccount = getAssociatedTokenAddressSync(mint, walletA.publicKey, true);

  const decimals = (await connection.getTokenAccountBalance(fromTokenAccount)).value.decimals;

  const toTokenAccount = getAssociatedTokenAddressSync(mint, walletB, true);

  let instructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 50000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: fees.prioFee * LAMPORTS_PER_SOL }),
    createAssociatedTokenAccountIdempotentInstruction(walletA.publicKey, toTokenAccount, walletB, mint),
    createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      walletA.publicKey,
      Number(amount.toFixed(decimals)) * 10 ** decimals
    ),
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

export async function swapWithRaydiumAPI(
  connection: Connection,
  wallet: string,
  inputMint: string,
  outputMint: string,
  simulate: boolean,
  amount: number,
  keyPair: Keypair,
  fee: number,
  slippage: number
): Promise<TransactionResult> {
  console.log('Swap using Raydium api');
  const inputTokenAccount = getAssociatedTokenAddressSync(new PublicKey(inputMint), new PublicKey(wallet), true);
  const lastbk = await connection.getLatestBlockhash('finalized');
  const tokenAcc = getAssociatedTokenAddressSync(new PublicKey(inputMint), new PublicKey(wallet), true);
  const decimals = (await connection.getTokenAccountBalance(tokenAcc)).value.decimals;
  const stringAmount = Math.floor(Number(Number(amount).toFixed(decimals)) * 10 ** decimals);

  const { data: swapResponse } = await axios.get(
    `https://transaction-v1.raydium.io/compute/swap-base-in?inputMint=${inputMint}&outputMint=${outputMint}&amount=${stringAmount}&slippageBps=${slippage *
      100}&txVersion=V0`
  );

  const { data: swapTransactions } = await axios.post<{
    id: string;
    version: string;
    success: boolean;
    data: { transaction: string }[];
  }>(`https://transaction-v1.raydium.io/transaction/swap-base-in`, {
    computeUnitPriceMicroLamports: String(fee * LAMPORTS_PER_SOL),
    swapResponse,
    txVersion: 'V0',
    wallet: wallet,
    wrapSol: false,
    unwrapSol: false,
    inputAccount: inputTokenAccount.toString(),
  });

  const txBuf = Buffer.from(swapTransactions.data[0].transaction, 'base64');
  const transaction = VersionedTransaction.deserialize(txBuf);
  transaction.sign([keyPair]);
  return sendTransaction(transaction!, lastbk, connection, simulate);
}

export async function swapWithJupiterAPI(
  connection: Connection,
  wallet: string,
  inputMint: string,
  outputMint: string,
  simulate: boolean,
  amount: number,
  keyPair: Keypair,
  fee: number,
  slippage: number
): Promise<TransactionResult> {
  console.log('Swap using Jupiter api');
  const lastbk = await connection.getLatestBlockhash('finalized');
  const tokenAcc = getAssociatedTokenAddressSync(new PublicKey(inputMint), new PublicKey(wallet), true);
  const decimals = (await connection.getTokenAccountBalance(tokenAcc)).value.decimals;
  const stringAmount = Math.floor(Number(amount.toFixed(decimals)) * 10 ** decimals);

  const { data: swapResponse } = await axios.get(
    `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${stringAmount}&slippageBps=${slippage *
      100}&swapMode=ExactIn&onlyDirectRoutes=false&asLegacyTransaction=false&maxAccounts=64&minimizeSlippage=false`
  );

  const { data: swapTransaction } = await axios.post<any>(`https://quote-api.jup.ag/v6/swap`, {
    quoteResponse: swapResponse,
    userPublicKey: wallet,
    wrapAndUnwrapSol: false,
  });

  const swapTransactionBuf = Buffer.from(swapTransaction.swapTransaction, 'base64');
  var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
  transaction.sign([keyPair]);
  return sendTransaction(transaction!, lastbk, connection, simulate);
}

export async function swap(
  params: swapParams,
  fees: feesParams,
  connection: Connection,
  simulate: boolean,
  basepoolKeys: BasePoolKeys
) {
  try {
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

    if (basepoolKeys.type === `Concentrated`) {
      const INVERTED = basepoolKeys.mintA === mintB.toString();
      let apimintA = raydiumv2.toApiV3Token({
        address: poolKeys!.mintA.toBase58(),
        programId: TOKEN_PROGRAM_ID.toBase58(),
        decimals: poolKeys!.mintDecimalsA,
      });
      let apimintB = raydiumv2.toApiV3Token({
        address: poolKeys!.mintB.toBase58(),
        programId: TOKEN_PROGRAM_ID.toBase58(),
        decimals: poolKeys!.mintDecimalsB,
      });
      let clmminfo = await raydiumv2.PoolUtils.fetchComputeClmmInfo({
        connection,
        poolInfo: {
          id: poolKeys!.poolId.toBase58(),
          programId: poolKeys!.programId.toBase58(),
          mintA: apimintA,
          mintB: apimintB,
          config: poolKeys!.config,
          price: poolKeys!.price,
        },
      });

      const x = await raydiumv2.PoolUtils.fetchMultiplePoolTickArrays({
        connection: connection,
        poolKeys: [clmminfo],
        batchRequest: true,
      });

      const quoteAmount = INVERTED
        ? new BN(amount * 10 ** poolKeys.mintDecimalsB)
        : new BN(amount * 10 ** poolKeys!.mintDecimalsA);
      console.log(`quoteAmount:`, quoteAmount);
      console.log(`program id:`, poolKeys!.programId);

      const { minAmountOut, remainingAccounts } = raydiumv2.PoolUtils.computeAmountOutFormat({
        poolInfo: clmminfo,
        tickArrayCache: x[clmminfo.id.toString()],
        amountIn: quoteAmount,
        tokenOut: INVERTED ? apimintA : apimintB,
        slippage: 0.01,
        epochInfo: await connection.getEpochInfo(),
      });

      const clmm_swap = raydiumv2.ClmmInstrument.swapInstruction(
        poolKeys!.programId,
        wallet.publicKey,
        poolKeys!.poolId,
        poolKeys!.ammConfig,
        INVERTED ? tokenAccount : quotetokenAccount,
        INVERTED ? quotetokenAccount : tokenAccount,
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
        raydiumv2.getPdaExBitmapAccount(poolKeys!.programId, poolKeys!.poolId).publicKey
      );

      instructions.push(
        createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, tokenAccount, wallet.publicKey, mintB),
        createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, quotetokenAccount, wallet.publicKey, mintA),
        clmm_swap
      );
    } else if (basepoolKeys.type === `Standard`) {
      const INVERTED = basepoolKeys.mintA === mintB.toString();
      const quoteAmount = INVERTED
        ? new BN(amount * 10 ** poolKeys!.quoteDecimals)
        : new BN(amount * 10 ** poolKeys!.baseDecimals);
      console.log(`decimal powert:`, quoteAmount);
      console.log(10 ** poolKeys!.quoteDecimals);
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
      instructions.push(
        createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, tokenAccount, wallet.publicKey, mintB),
        createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, quotetokenAccount, wallet.publicKey, mintA),
        ...innerTransaction.instructions
      );
    }

    const tx = await createSignedTransaction(instructions, connection, wallet, lastbk.blockhash);
    return sendTransaction(tx, lastbk, connection, simulate);
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
  return sendTransaction(tx, blockhash, connection, simulate);
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
  return sendTransaction(tx, blockhash, connection, simulate);
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

import {
  ComputeBudgetProgram,
  SystemProgram,
  TransactionInstruction,
  VersionedTransaction,
  TransactionMessage,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Keypair,
} from '@solana/web3.js';

import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { SPL_ACCOUNT_LAYOUT } from '@raydium-io/raydium-sdk';

import { programs } from '@metaplex/js';
import BN from 'bn.js';
const { TokenListProvider, TokenInfo } = require('@solana/spl-token-registry');

export interface TransferParams {
  walletA: Keypair;
  walletB: Keypair | PublicKey;
  amount: number;
  cpuLimit?: number;
  prioFee?: number;
  jitoFee?: number;
}

export const TransferFeesDefault = {
  prioFee: 1000,
  cpuLimit: 1000,
};

export function createConnection() {
  //return new Connection(clusterApiUrl("devnet"), "confirmed");
  return new Connection(
    'https://solana-mainnet.api.syndica.io/api-key/aS1Y8g8LYE1fxcFBtrG6v5GfsTZNhpBnoLF3YVXwESwmRu1RkAxm32ctxkVGNRkxLF78T7PWaDn5y4UGTvXDWNShHatT92pTzK'
  );
}

export async function getSolanaBalance(connection: Connection, publicKey: PublicKey): Promise<number> {
  return (await connection.getBalance(publicKey)) / LAMPORTS_PER_SOL;
}

export async function createSignedTransaction(
  wallet: Keypair,
  connection: Connection,
  instructions: TransactionInstruction[],
  signers?: Keypair[],
  blockhash?: string
): Promise<VersionedTransaction> {
  if (!blockhash) {
    blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
  }

  let payerKey: PublicKey;

  if (signers && !signers.some((signer) => signer.publicKey.equals(wallet.publicKey))) {
    payerKey = signers[0].publicKey;
  } else {
    payerKey = wallet.publicKey;
  }

  const tx_msg = new TransactionMessage({
    payerKey: payerKey,
    instructions: instructions,
    recentBlockhash: blockhash,
  }).compileToV0Message();

  const tx = new VersionedTransaction(tx_msg);
  let fsigners = signers || [wallet];
  tx.sign(fsigners);

  return tx;
}

export async function simpleTransfer(connection: Connection, TransferParams: TransferParams): Promise<void> {
  let { walletA, walletB, amount, cpuLimit, prioFee } = TransferParams;

  const [lastbk, accountBalance, rent] = await Promise.all([
    connection.getLatestBlockhash('finalized').then((res) => res.blockhash),
    connection.getBalance(walletA.publicKey, 'confirmed'),
    connection.getMinimumBalanceForRentExemption(0),
  ]);

  if (!prioFee) {
    prioFee = TransferFeesDefault.prioFee;
  }

  if (!cpuLimit) {
    cpuLimit = TransferFeesDefault.cpuLimit;
  }

  if (amount > accountBalance) {
    console.log('Insufficient funds');
    return;
  }

  const toPubkey = walletB instanceof PublicKey ? walletB : walletB.publicKey;

  let instructions = [
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: cpuLimit }),
    ComputeBudgetProgram.setComputeUnitLimit({ units: prioFee }),
    SystemProgram.transfer({
      fromPubkey: walletA.publicKey,
      toPubkey: toPubkey,
      lamports: amount,
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

export interface IToken {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  isNft: boolean;
}

export interface ITokenAccount {
  publicKey: string;
  accountAddress: string;
  mint: string;
  amount: number;
}

export async function getTokensOwnedByWallet(
  connection: Connection,
  publicKey: PublicKey
): Promise<{
  tokens: IToken[];
  accounts: ITokenAccount[];
}> {
  const {
    metadata: { Metadata },
  } = programs;
  const tokensAccs = await connection.getTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID });
  let name, symbol, mint, accAddress, balance, amount, decimals, isNft;
  let tokens: any = [];
  let accounts: any = [];

  for (const tokenAcc of tokensAccs.value) {
    const accData = SPL_ACCOUNT_LAYOUT.decode(tokenAcc.account.data);
    if (!accData.amount.isZero()) {
      mint = accData.mint;
      accAddress = tokenAcc.pubkey.toBase58();
      balance = (await connection.getTokenAccountBalance(tokenAcc.pubkey)).value;
      amount = balance.uiAmount;
      decimals = balance.decimals;
      isNft = decimals === 0;
      try {
        const metadataPDA = await Metadata.getPDA(accData.mint);
        const metadataAccount = await Metadata.load(connection, metadataPDA);
        name = metadataAccount.data.data.name;
        symbol = metadataAccount.data.data.symbol;
        tokens.push({
          mint: mint.toString(),
          name: name,
          symbol: symbol,
          decimals: decimals,
          isNft: isNft,
        });
        accounts.push({
          publicKey: publicKey.toBase58(),
          accountAddress: accAddress,
          mint: mint.toString(),
          amount: amount,
        });
      } catch (err) {
        accounts.push({
          publicKey: publicKey.toBase58(),
          accountAddress: accAddress,
          mint: mint.toString(),
          amount: amount,
        });
        tokens.push({
          mint: mint.toString(),
          name: null,
          symbol: null,
          decimals: decimals,
          isNft: isNft,
        });
        continue;
      }
    }
  }

  return new Promise((resolve) => {
    resolve({
      tokens: tokens,
      accounts: accounts,
    });
  });
}

//LOAD SPL TOKENS
// const provider = new TokenListProvider();
// provider.resolve().then((tokens: any) => {
//   const tokenList = tokens.filterByClusterSlug('mainnet-beta').getList();
//   console.log(tokenList.length)
// });

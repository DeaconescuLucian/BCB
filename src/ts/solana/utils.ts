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
const { TokenListProvider } = require('@solana/spl-token-registry');

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
  name?: string;
  symbol?: string;
  icon?:string;
  decimals: number;
  isNft: boolean;
}

export interface ITokenAccount {
  publicKey: string;
  accountAddress: string;
  mint: string;
  amount: number;
}

async function fetchData(uri: string) {
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.log('There was a problem with the fetch operation:');
    return null;
  }
}

export async function getTokensOwnedByWallet(
  connection: Connection,
  publicKey: PublicKey,
  existingMints?: {mint: string, icon?: string}[]
): Promise<{
  tokens: IToken[];
  accounts: ITokenAccount[];
}> {
  const {
    metadata: { Metadata },
  } = programs;
  const tokensAccs = await connection.getTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID });
  let name, symbol, mint: string, accAddress, balance, amount, decimals, isNft, icon, uri;
  let tokens: any = [];
  let accounts: any = [];

  //LOAD SPL TOKENS
  let tokenList: any[] = [];
  const provider = new TokenListProvider();
  provider.resolve().then((tokens: any) => {
    tokenList = tokens.filterByClusterSlug('mainnet-beta').getList();
  });

  for (const tokenAcc of tokensAccs.value) {
    const accData = SPL_ACCOUNT_LAYOUT.decode(tokenAcc.account.data);
    if (!accData.amount.isZero()) {
      mint = accData.mint.toString();
      icon = tokenList?.find(e => e.address === mint)?.logoURI || existingMints?.find(e => e.mint === mint)?.icon || null;
      accAddress = tokenAcc.pubkey.toBase58();
      balance = (await connection.getTokenAccountBalance(tokenAcc.pubkey)).value;
      amount = balance.uiAmount;
      decimals = balance.decimals;
      isNft = decimals === 0;
      try {
        if(!existingMints?.find(e => e.mint === mint))
        {
          const metadataPDA = await Metadata.getPDA(accData.mint);
          const metadataAccount = await Metadata.load(connection, metadataPDA);
          name = metadataAccount.data.data.name;
          symbol = metadataAccount.data.data.symbol;
          uri = metadataAccount.data.data.uri;
          if(uri && !isNft && !icon)
          {
            let response = await fetchData(uri);
            if(response)
            {
              if(response.image)
              {
                icon = response.image;
              }
            }
          }
          tokens.push({
            mint: mint,
            name: name,
            symbol: symbol,
            decimals: decimals,
            isNft: isNft,
            icon: icon
          });
        }
        accounts.push({
          publicKey: publicKey.toBase58(),
          accountAddress: accAddress,
          mint: mint,
          amount: amount,
        });
      } catch (err) {
        accounts.push({
          publicKey: publicKey.toBase58(),
          accountAddress: accAddress,
          mint: mint,
          amount: amount,
        });
        tokens.push({
          mint: mint,
          name: null,
          symbol: null,
          decimals: decimals,
          isNft: isNft,
          icon: icon
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

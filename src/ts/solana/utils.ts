import { Connection, PublicKey, LAMPORTS_PER_SOL, Keypair, clusterApiUrl, Cluster } from '@solana/web3.js';

import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

import * as raydium from '@raydium-io/raydium-sdk';

import { programs } from '@metaplex/js';
import BN from 'bn.js';
import e from 'express';
const { TokenListProvider } = require('@solana/spl-token-registry');

export async function findRaydiumPoolInfo(
  baseMint: string,
  quoteMint: string,
  connection: Connection
): Promise<raydium.LiquidityPoolKeys | undefined> {
  const layout = raydium.LIQUIDITY_STATE_LAYOUT_V4;

  const programData = await connection.getProgramAccounts(raydium.MAINNET_PROGRAM_ID.AmmV4, {
    filters: [
      { dataSize: layout.span },
      {
        memcmp: {
          offset: layout.offsetOf('baseMint'),
          bytes: new PublicKey(baseMint).toBase58(),
        },
      },
      {
        memcmp: {
          offset: layout.offsetOf('quoteMint'),
          bytes: new PublicKey(quoteMint).toBase58(),
        },
      },
    ],
  });

  const collectedPoolResults = programData
    .map((info) => ({
      id: new PublicKey(info.pubkey),
      version: 4,
      programId: raydium.MAINNET_PROGRAM_ID.AmmV4,
      ...layout.decode(info.account.data),
    }))
    .flat();

  const pool = collectedPoolResults[0];

  if (!pool) {
    console.log('Pool not found');
    return undefined;
  }

  const market = await connection.getAccountInfo(pool.marketId).then((item) => ({
    programId: item!.owner,
    ...raydium.MARKET_STATE_LAYOUT_V3.decode(item!.data),
  }));

  const authority = raydium.Liquidity.getAssociatedAuthority({
    programId: raydium.MAINNET_PROGRAM_ID.AmmV4,
  }).publicKey;

  const marketProgramId = market.programId;

  const poolKeys = {
    id: pool.id,
    baseMint: pool.baseMint,
    quoteMint: pool.quoteMint,
    lpMint: pool.lpMint,
    baseDecimals: Number.parseInt(pool.baseDecimal.toString()),
    quoteDecimals: Number.parseInt(pool.quoteDecimal.toString()),
    lpDecimals: Number.parseInt(pool.baseDecimal.toString()),
    version: pool.version,
    programId: pool.programId,
    openOrders: pool.openOrders,
    targetOrders: pool.targetOrders,
    baseVault: pool.baseVault,
    quoteVault: pool.quoteVault,
    marketVersion: 3,
    authority: authority,
    marketProgramId,
    marketId: market.ownAddress,
    marketAuthority: raydium.Market.getAssociatedAuthority({
      programId: marketProgramId,
      marketId: market.ownAddress,
    }).publicKey,
    marketBaseVault: market.baseVault,
    marketQuoteVault: market.quoteVault,
    marketBids: market.bids,
    marketAsks: market.asks,
    marketEventQueue: market.eventQueue,
    withdrawQueue: pool.withdrawQueue,
    lpVault: pool.lpVault,
    lookupTableAccount: PublicKey.default,
  } as raydium.LiquidityPoolKeys;

  return poolKeys;
}

export function createConnection(connection: string) {
  if (connection.startsWith('http')) return new Connection(connection);
  else return new Connection(clusterApiUrl(connection as Cluster), 'confirmed');
}

export async function getSolanaBalance(connection: Connection, publicKey: PublicKey): Promise<number> {
  return (await connection.getBalance(publicKey)) / LAMPORTS_PER_SOL;
}

export interface IToken {
  mint: string;
  name?: string;
  symbol?: string;
  icon?: string;
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
  existingMints?: { mint: string; icon?: string }[]
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
    const accData = raydium.SPL_ACCOUNT_LAYOUT.decode(tokenAcc.account.data);
    if (!accData.amount.isZero()) {
      mint = accData.mint.toString();
      icon =
        tokenList?.find((e) => e.address === mint)?.logoURI ||
        existingMints?.find((e) => e.mint === mint)?.icon ||
        null;
      accAddress = tokenAcc.pubkey.toBase58();
      balance = (await connection.getTokenAccountBalance(tokenAcc.pubkey)).value;
      amount = balance.uiAmount;
      decimals = balance.decimals;
      isNft = decimals === 0;
      try {
        if (!existingMints?.find((e) => e.mint === mint)) {
          const metadataPDA = await Metadata.getPDA(accData.mint);
          const metadataAccount = await Metadata.load(connection, metadataPDA);
          name = metadataAccount.data.data.name;
          symbol = metadataAccount.data.data.symbol;
          uri = metadataAccount.data.data.uri;
          if (uri && !isNft && !icon) {
            let response = await fetchData(uri);
            if (response) {
              if (response.image) {
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
            icon: icon,
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
          icon: icon,
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

export async function getTokenDetails(connection: Connection, mint: string) {
  const {
    metadata: { Metadata },
  } = programs;
  try {
    let tokenList: any[] = [];
    let icon;
    const provider = new TokenListProvider();
    await provider.resolve().then((tokens: any) => {
      tokenList = tokens.filterByClusterSlug('mainnet-beta').getList();
      icon = tokenList?.find((e) => e.address === mint)?.logoURI || null;
    });
    const metadataPDA = await Metadata.getPDA(mint);
    const metadataAccount = await Metadata.load(connection, metadataPDA);
    let name = metadataAccount.data.data.name;
    let symbol = metadataAccount.data.data.symbol;
    let uri = metadataAccount.data.data.uri;
    let price = await getTokenPrice(mint);

    if (uri) {
      let response = await fetchData(uri);
      if (response) {
        if (response.image) {
          icon = response.image;
        }
      }
    }
    return {
      mint: mint,
      name,
      symbol,
      icon,
      price,
    };
  } catch (error) {
    let price = await getTokenPrice(mint);
    return {
      mint: mint,
      price: price,
    };
  }
}

export async function getTokenPrice(mint: string) {
  try {
    const response = await fetchData(`https://api-v3.raydium.io/mint/price?mints=${mint}`);
    return response.data[mint];
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    return null;
  }
}

export async function getTokensPrice(mints: string[]) {
  try {
    const response = await fetchData(`https://api-v3.raydium.io/mint/price?mints=${mints.join(',')}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    return null;
  }
}

//solana - dollar
//solana - mint
// export async function getTokenPrice(
//   mint: string,
//   connection: Connection,
//   solUSDCPoolKeys?: raydium.LiquidityPoolKeys,
//   solMintPoolKeys?: raydium.LiquidityPoolKeys
// ) {
//   const solToken = raydium.Token.WSOL.mint.toString();
//   const usdcToken = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
//   solUSDCPoolKeys = solUSDCPoolKeys || (await findRaydiumPoolInfo(usdcToken, solToken, connection));

//   let solQv = (await connection.getTokenAccountBalance(solUSDCPoolKeys?.quoteVault as PublicKey)).value.uiAmount;
//   let usdcBv = (await connection.getTokenAccountBalance(solUSDCPoolKeys?.baseVault as PublicKey)).value.uiAmount;

//   let solPrice = (usdcBv as number) / (solQv as number);
//   if (mint === solToken) {
//     return solPrice;
//   } else {
//     solMintPoolKeys = solMintPoolKeys || (await findRaydiumPoolInfo(mint, solToken, connection));
//   }

//   solQv = (await connection.getTokenAccountBalance(solMintPoolKeys?.quoteVault as PublicKey)).value.uiAmount;
//   let mintBv = (await connection.getTokenAccountBalance(solMintPoolKeys?.baseVault as PublicKey)).value.uiAmount;

//   let tokenSOLRatio = (mintBv as number) / (solQv as number);
//   let tokenPrice = solPrice / tokenSOLRatio;

//   return tokenPrice;
// }

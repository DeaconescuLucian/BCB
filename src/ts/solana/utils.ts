import { Connection, PublicKey, LAMPORTS_PER_SOL, Keypair, clusterApiUrl, Cluster } from '@solana/web3.js';

import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';

import * as raydium from '@raydium-io/raydium-sdk';
import { programs } from '@metaplex/js';
const { TokenListProvider } = require('@solana/spl-token-registry');

export async function findRaydiumpoolKeys(
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

export async function getWSOLBalance(connection: Connection, publicKey: PublicKey): Promise<number> {
  const wsol = raydium.Token.WSOL.mint;
  const tokenAccount = getAssociatedTokenAddressSync(wsol, publicKey, true);
  return (await connection.getTokenAccountBalance(tokenAccount)).value.uiAmount!;
}

export interface IToken {
  mint: string;
  name?: string;
  symbol?: string;
  icon?: string;
  decimals: number;
  isNft: boolean;
  favouriteIndex?: number;
}

export interface BasePoolKeys {
  type: 'Concentrated' | 'Standard';
  mintA: string;
  mintB: string;
  poolKeys: any;
}

export interface ITokenAccount {
  publicKey: string;
  accountAddress: string;
  mint: string;
  amount: number;
  toDelete?: boolean;
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

  existingMints?.forEach((m) => {
    if (!accounts.find((a: any) => a.mint === m.mint)) {
      accounts.push({
        publicKey: publicKey.toBase58(),
        mint: m.mint,
        toDelete: true,
      });
    }
  });

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
    console.error('Error fetching token price:', error);
    return null;
  }
}

export async function getTokensPrice(mints: string[]) {
  try {
    const response = await fetchData(`https://api-v3.raydium.io/mint/price?mints=${mints.join(',')}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tokens price:', error);
    return null;
  }
}

export async function getTokenList() {
  try {
    const response = await fetchData(`https://api-v3.raydium.io/mint/list`);
    const response1 = await fetchData(`https://tokens.jup.ag/tokens?tags=lst,community`);
    return [...response.data.mintList, ...response1];
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    return null;
  }
}

export async function getRaydiumPoolsbyMints(
  connection: Connection,
  baseMint: string,
  quoteMint: string,
  limit: number = 1
) {
  try {
    console.log(`base mint: ${baseMint}`);
    console.log(`quote mint: ${quoteMint}`);
    const msg = `https://api-v3.raydium.io/pools/info/mint?mint1=${baseMint}&mint2=${quoteMint}&poolType=all&poolSortField=default&sortType=desc&pageSize=${limit}&page=1`;
    const response = await fetchData(msg);
    const data = response.data.data[0];
    let poolKeys;
    let returnPoolKeys: BasePoolKeys | undefined = undefined;
    console.log(data);

    if (data.type === `Concentrated`) {
      poolKeys = await connection.getAccountInfo(new PublicKey(data.id)).then((item) => ({
        programId: item!.owner,
        config: data.config,
        price: data.price,
        poolId: new PublicKey(data.id),
        ...raydium.PoolInfoLayout.decode(item!.data),
      }));
      returnPoolKeys = {
        type: data.type,
        mintA: poolKeys.mintA.toBase58(),
        mintB: poolKeys.mintB.toBase58(),
        poolKeys: poolKeys,
      };
    } else if (data.type === `Standard`) {
      let resp = await connection.getAccountInfo(new PublicKey(data.id));
      let pool = {
        id: new PublicKey(data.id),
        version: 4,
        programId: resp!.owner,
        ...raydium.LIQUIDITY_STATE_LAYOUT_V4.decode(resp!.data),
      };
      const market = await connection.getAccountInfo(pool.marketId).then((item) => ({
        programId: item!.owner,
        ...raydium.MARKET_STATE_LAYOUT_V3.decode(item!.data),
      }));

      const authority = raydium.Liquidity.getAssociatedAuthority({
        programId: raydium.MAINNET_PROGRAM_ID.AmmV4,
      }).publicKey;

      const marketProgramId = market.programId;

      poolKeys = {
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

      console.log(`base mint: ${pool.baseMint.toBase58()}`);
      console.log(`quote mint: ${pool.quoteMint.toBase58()}`);

      returnPoolKeys = {
        type: data.type,
        mintA: poolKeys.baseMint.toBase58(),
        mintB: poolKeys.quoteMint.toBase58(),
        poolKeys: poolKeys,
      };
    }
    console.log(`return pool keys`);

    return returnPoolKeys as BasePoolKeys;
  } catch (error) {
    console.error('Error fetching pools:', error);
    return null;
  }
}

// function swapInstruction(
//   programId: PublicKey,
//   payer: PublicKey,
//   poolId: PublicKey,
//   ammConfigId: PublicKey,
//   inputTokenAccount: PublicKey,
//   outputTokenAccount: PublicKey,
//   inputVault: PublicKey,
//   outputVault: PublicKey,
//   inputMint: PublicKey,
//   outputMint: PublicKey,
//   tickArray: PublicKey[],
//   observationId: PublicKey,

//   amount: BN,
//   otherAmountThreshold: BN,
//   sqrtPriceLimitX64: BN,
//   isBaseInput: boolean,

//   exTickArrayBitmap?: PublicKey,
// ): TransactionInstruction {

//   const anchorDataBuf = {
//     createPool: [233, 146, 209, 142, 207, 104, 64, 188],
//     initReward: [95, 135, 192, 196, 242, 129, 230, 68],
//     setRewardEmissions: [112, 52, 167, 75, 32, 201, 211, 137],
//     openPosition: [77, 184, 74, 214, 112, 86, 241, 199],
//     closePosition: [123, 134, 81, 0, 49, 68, 98, 98],
//     increaseLiquidity: [133, 29, 89, 223, 69, 238, 176, 10],
//     decreaseLiquidity: [58, 127, 188, 62, 79, 82, 196, 96],
//     swap: [43, 4, 237, 11, 26, 201, 30, 98], // [248, 198, 158, 145, 225, 117, 135, 200],
//     collectReward: [18, 237, 166, 197, 34, 16, 213, 144],
//   };

//   const dataLayout = struct([
//     u64("amount"),
//     u64("otherAmountThreshold"),
//     u128("sqrtPriceLimitX64"),
//     bool("isBaseInput"),
//   ]);

//   const remainingAccounts = [
//     ...(exTickArrayBitmap ? [{ pubkey: exTickArrayBitmap, isSigner: false, isWritable: true }] : []),
//     ...tickArray.map((i) => ({ pubkey: i, isSigner: false, isWritable: true })),
//   ];

//   const keys = [
//     { pubkey: payer, isSigner: true, isWritable: false },
//     { pubkey: ammConfigId, isSigner: false, isWritable: false },

//     { pubkey: poolId, isSigner: false, isWritable: true },
//     { pubkey: inputTokenAccount, isSigner: false, isWritable: true },
//     { pubkey: outputTokenAccount, isSigner: false, isWritable: true },
//     { pubkey: inputVault, isSigner: false, isWritable: true },
//     { pubkey: outputVault, isSigner: false, isWritable: true },

//     { pubkey: observationId, isSigner: false, isWritable: true },

//     { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
//     { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
//     { pubkey: MEMO_PROGRAM_ID, isSigner: false, isWritable: false },

//     { pubkey: inputMint, isSigner: false, isWritable: false },
//     { pubkey: outputMint, isSigner: false, isWritable: false },

//     ...remainingAccounts,
//   ];

//   const data = Buffer.alloc(dataLayout.span);
//   dataLayout.encode(
//     {
//       amount,
//       otherAmountThreshold,
//       sqrtPriceLimitX64,
//       isBaseInput,
//     },
//     data,
//   );

//   const aData = Buffer.from([...anchorDataBuf.swap, ...data]);

//   return new TransactionInstruction({
//     keys,
//     programId,
//     data: aData,
//   });
// }

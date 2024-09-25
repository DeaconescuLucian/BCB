import { GetStructureSchema, LiquidityPoolKeys, struct, publicKey, MARKET_STATE_LAYOUT_V3, Liquidity, LiquidityStateV4, Market, MAINNET_PROGRAM_ID } from "@raydium-io/raydium-sdk";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey, Connection, Commitment, ConfirmedTransactionMeta } from "@solana/web3.js";


export type MinimalMarketStateLayoutV3 = typeof MINIMAL_MARKET_STATE_LAYOUT_V3;
export type MinimalMarketLayoutV3 =
  GetStructureSchema<MinimalMarketStateLayoutV3>;
export type MinimalTokenAccountData = {
mint: PublicKey;
address: PublicKey;
poolKeys?: LiquidityPoolKeys;
market?: MinimalMarketLayoutV3;
};
export const RAYDIUM_LIQUIDITY_PROGRAM_ID_V4 = MAINNET_PROGRAM_ID.AmmV4;
export const MINIMAL_MARKET_STATE_LAYOUT_V3 = struct([
publicKey('eventQueue'),
publicKey('bids'),
publicKey('asks'),
]);

export async function getMinimalMarketV3(
    connection: Connection,
    marketId: PublicKey,
    commitment?: Commitment,
  ): Promise<MinimalMarketLayoutV3> {
    const marketInfo = await connection.getAccountInfo(marketId, {
      commitment,
      dataSlice: {
        offset: MARKET_STATE_LAYOUT_V3.offsetOf('eventQueue'),
        length: 32 * 3,
      },
    });
  
    return MINIMAL_MARKET_STATE_LAYOUT_V3.decode(marketInfo!.data);
}

export async function checkIfTransactionIsLPBurn(txMeta: ConfirmedTransactionMeta|any, lpMintSupply:number) {
  if (txMeta.innerInstructions?.length) {
      return false;
  }
  const before = txMeta.preTokenBalances[0]?.uiTokenAmount?.uiAmount
  const after = txMeta.postTokenBalances[0]?.uiTokenAmount?.uiAmount
  if (txMeta.logMessages?.length) {
      let foundBurn = false
      for (let log of txMeta.logMessages) {
        if (log.includes('Instruction: Transfer')) {
          break
        }
        else if (log.includes('Instruction: Burn') || log.includes('Instruction: BurnChecked')) {
            foundBurn = true
            break
        }
      }
      console.log(`supply: ${lpMintSupply}, before: ${before}, after: ${after}`)
      if (!foundBurn) {
          return false
      }
      if(before !== lpMintSupply){
        return false;
      }
  } 
  else {
    return false
  }
  if (txMeta.postTokenBalances && after > 1) {
    return false
  }
  return true
}

export async function checkIFTransactionIsInitiate(txMeta: ConfirmedTransactionMeta): Promise<boolean> {
  if(txMeta.logMessages?.length !== 0){
  for(let log of txMeta.logMessages!){
      if (log.includes('initialize2: InitializeInstruction2')) {
          return true;
      }
  }
  }
  return false;
}

export function createPoolKeys(
  id: PublicKey,
  accountData: LiquidityStateV4,
  minimalMarketLayoutV3: MinimalMarketLayoutV3,
): LiquidityPoolKeys {
  return {
    id,
    baseMint: accountData.baseMint,
    quoteMint: accountData.quoteMint,
    lpMint: accountData.lpMint,
    baseDecimals: accountData.baseDecimal.toNumber(),
    quoteDecimals: accountData.quoteDecimal.toNumber(),
    lpDecimals: 5,
    version: 4,
    programId: RAYDIUM_LIQUIDITY_PROGRAM_ID_V4,
    authority: Liquidity.getAssociatedAuthority({
      programId: RAYDIUM_LIQUIDITY_PROGRAM_ID_V4,
    }).publicKey,
    openOrders: accountData.openOrders,
    targetOrders: accountData.targetOrders,
    baseVault: accountData.baseVault,
    quoteVault: accountData.quoteVault,
    marketVersion: 3,
    marketProgramId: accountData.marketProgramId,
    marketId: accountData.marketId,
    marketAuthority: Market.getAssociatedAuthority({
      programId: accountData.marketProgramId,
      marketId: accountData.marketId,
    }).publicKey,
    marketBaseVault: accountData.baseVault,
    marketQuoteVault: accountData.quoteVault,
    marketBids: minimalMarketLayoutV3.bids,
    marketAsks: minimalMarketLayoutV3.asks,
    marketEventQueue: minimalMarketLayoutV3.eventQueue,
    withdrawQueue: accountData.withdrawQueue,
    lpVault: accountData.lpVault,
    lookupTableAccount: PublicKey.default,
  };
}

export async function checkPrice(baseVault: PublicKey, quoteVault: PublicKey, connection:Connection, raw=false): Promise<number | null> {
  const tokenAmountPromise = checkSupply(baseVault, connection, false, undefined, undefined, undefined, 'processed', raw);
  const solAmountPromise = checkSupply(quoteVault, connection, false, undefined, undefined, undefined, 'processed', raw);
  const [tokenAmount, solAmount]  = await Promise.all([tokenAmountPromise, solAmountPromise]);

  if (tokenAmount === undefined || solAmount === undefined) {
    return null;
  }
  if (tokenAmount === null || solAmount === null) {
    return null;
  }

  const price = (solAmount as number) / (tokenAmount as number);
  return price;
}

export async function checkSupply(
  key: PublicKey,
  connection: Connection,
  isThisAMintAddress: boolean,
  retries: number = 40,
  delay: number = 100,
  validAmountReceived = false,
  commitment?: Commitment,
  raw = false
): Promise<string | number | undefined | null> {
  for (let i = 0; i < retries; i++) {
    try {
      let amount;
      if (isThisAMintAddress) {
        amount = (await connection.getTokenSupply(key, 'processed')).value.uiAmount;
      } else {
        if (!raw) {
          amount = (await connection.getTokenAccountBalance(key, 'processed')).value.uiAmount;
        } else {
          amount = (await connection.getTokenAccountBalance(key, 'processed')).value.amount;
        }
      }
      if (amount !== undefined) {
        return amount;
      } else if (validAmountReceived && amount === undefined || validAmountReceived && amount !== null) {
        return amount;
      }
    } catch (error: any) {
      if (error.message.includes('429 Too Many Requests')) {
        const waitTime = JSON.parse(error.message.split(': ')[1]).data.try_again_in;
        const waitTimeInMs = parseFloat(waitTime) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTimeInMs));
      }
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return;
}
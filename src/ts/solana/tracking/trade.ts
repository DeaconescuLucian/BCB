import { createAssociatedTokenAccountIdempotentInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { ComputeBudgetProgram, Connection, Finality, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { calculateTransactionCost, createSignedTransaction, sendTransaction } from '../transactions';
import { checkPrice, createPoolKeys, getFinalizedTransaction, getMinimalMarketV3, getReceivedAmount } from '../helpers';
import BN from 'bn.js';
import * as raydium from '@raydium-io/raydium-sdk';
import { TokenState } from '../filters';
import { ITrackProcessInterface } from './trackProcess';
import { generateGUID } from '../../generalUtils';
import TrackProcessManager from './trackProcessManager';
import { getTokenBalance } from '../utils';

export default class Trade {
  state: TokenState;
  token: PublicKey;
  status: 'open pending' | 'open' | 'open fail' | 'close fail' | 'closed' | 'close pending';
  openPrice: number | null;
  currentPrice: number | null;
  targetPercentage: number;
  stopLossPercentage: number;
  targetPrice: number | null;
  exitPrice: number | null;
  stopLossPrice: number | null;
  ownedTokenAmount: number | null;
  quoteAmount: number;
  sellPercentage: number;
  updateInterval: NodeJS.Timeout | null;
  connection: Connection;
  isSimulated: boolean;
  wallet: Keypair;
  trackProcess: ITrackProcessInterface;
  positionId: string;
  priceUpdateCount: number;
  closePositionRetries: number;
  closePositionRetryNo: number;
  openTime: string;
  mint: string;

  constructor(
    trackProcess: ITrackProcessInterface,
    state: TokenState,
    mint: string,
    quoteAmount: number,
    targetPercentage: number,
    stopLossPercentage: number,
    wallet: Keypair,
    sellPercentage: number = 100,
    isSimulated: boolean = false,
    positionId: string = ''
  ) {
    this.state = state;
    this.token = state.poolState.baseMint;
    this.status = 'open pending';
    this.openPrice = null;
    this.currentPrice = null;
    this.targetPercentage = targetPercentage;
    this.stopLossPercentage = stopLossPercentage;
    this.targetPrice = null;
    this.stopLossPrice = null;
    this.ownedTokenAmount = null;
    this.quoteAmount = quoteAmount;
    this.sellPercentage = sellPercentage;
    this.updateInterval = null;
    this.connection = state.connection;
    this.isSimulated = isSimulated;
    this.wallet = wallet;
    this.trackProcess = trackProcess;
    this.positionId = positionId;
    this.priceUpdateCount = 0;
    this.closePositionRetries = 2;
    this.closePositionRetryNo = 0;
    this.openTime = '';
    this.mint = mint;
    this.exitPrice = null;
  }

  private calculateTargetAndStopLossPrices() {
    if (this.openPrice === null) {
      throw new Error('Open price is not set');
    }
    this.targetPrice = this.openPrice * (this.targetPercentage / 100);
    this.stopLossPrice = this.openPrice * (this.stopLossPercentage / 100);
  }

  private startPriceUpdates() {
    this.updateInterval = setInterval(async () => {
      if (this.status === 'open') {
        await this.updatePrice();
        if (this.shouldSell()) {
          await this.sell();
        } else {
          this.closePositionRetryNo = 0;
        }
      }
    }, 500);
  }

  private async updatePrice() {
    try {
      if (!this.ownedTokenAmount) {
        try {
          this.ownedTokenAmount = await getTokenBalance(
            this.connection,
            new PublicKey(this.trackProcess.wallet.publicKey),
            this.mint
          );
        } catch (error) {}

        if (this.ownedTokenAmount)
          TrackProcessManager.getInstance().updatePositionAmount(this.positionId, this.ownedTokenAmount);
      }
      const newPrice = await checkPrice(
        this.state.poolState.baseVault,
        this.state.poolState.quoteVault,
        this.connection,
        false
      );
      this.currentPrice = newPrice;
      if (this.priceUpdateCount % 10 === 0) {
        this.getPerformance();
        await TrackProcessManager.getInstance().persistPositionCurrentPrice(this.positionId, newPrice!);
      }
      this.priceUpdateCount += 1;
    } catch (error) {
      console.error('Failed to update price:', error);
    }
  }

  private shouldSell(): boolean {
    if (this.currentPrice === null || this.targetPrice === null || this.stopLossPrice === null) return false;
    return this.currentPrice >= this.targetPrice || this.currentPrice <= this.stopLossPrice;
  }

  async buy(): Promise<boolean> {
    try {
      console.log(`buying`);
      const buyResult = await this.executeBuy();
      if (buyResult.success) {
        console.log(`Buy success`);
        return true;
      } else {
        console.log(`Buy failed`);
        return false;
      }
    } catch (error) {
      console.error('Buy failed:', error);
      return false;
    }
  }

  async reopen(amount: number, startingPrice: number, currentPrice: number, openTime: string, id: string) {
    console.log(`reopening trade...`);
    this.ownedTokenAmount = amount;
    this.openPrice = startingPrice;
    this.currentPrice = currentPrice;
    this.openTime = openTime;
    this.positionId = id;
    this.calculateTargetAndStopLossPrices();
    this.status = 'open';
    this.startPriceUpdates();
  }

  private async executeBuy(): Promise<{ success: boolean }> {
    this.status = 'open pending';
    let poolState = this.state.poolState;
    let key = this.state.poolState.baseMint;
    let tokenAccount = this.trackProcess.tokenAccounts.get(poolState.baseMint.toString());
    if (!tokenAccount) {
      const market = await getMinimalMarketV3(this.connection, poolState.marketId, `processed`);
      tokenAccount = this.trackProcess.saveTokenAccount(key, market);
    }

    const quoteToken = raydium.Token.WSOL.mint;
    const quotetokenAccount = getAssociatedTokenAddressSync(quoteToken, this.wallet!.publicKey, true);
    const quoteAmount = new BN(this.quoteAmount * LAMPORTS_PER_SOL);

    tokenAccount.poolKeys = createPoolKeys(this.state.poolId!, poolState, tokenAccount.market!);

    const { innerTransaction } = raydium.Liquidity.makeSwapFixedInInstruction(
      {
        poolKeys: tokenAccount.poolKeys,
        userKeys: {
          tokenAccountIn: quotetokenAccount,
          tokenAccountOut: tokenAccount.address,
          owner: this.wallet.publicKey,
        },
        amountIn: quoteAmount,
        minAmountOut: 0,
      },
      tokenAccount.poolKeys.version
    );

    const instructions = [
      createAssociatedTokenAccountIdempotentInstruction(
        this.wallet.publicKey,
        tokenAccount.address,
        this.wallet!.publicKey,
        key
      ),
      ...innerTransaction.instructions,
    ];

    const block = await this.connection.getLatestBlockhash('finalized');
    const units = await calculateTransactionCost(instructions, this.connection, this.wallet, block.blockhash);

    const realInstructions = [
      ...instructions,
      ComputeBudgetProgram.setComputeUnitLimit({ units: Math.floor(units! * 1.1) }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
    ];
    const tx = await createSignedTransaction(realInstructions, this.connection, this.wallet, block.blockhash);
    const positionId = generateGUID();
    this.positionId = positionId;
    const result = await sendTransaction(tx, block, this.connection, this.isSimulated);
    await this.trackProcess.savePosition(this.state.poolId?.toString()!, positionId, key.toString(), this.quoteAmount, result.signature!);
    if (result.success) {
      if (this.isSimulated) {
        return { success: true };
      } else {
        if (result.confirmation) {
          const c = await result.confirmation;
          if (c.status === 'success') {
            await this.openPosition(result.signature!, 'confirmed');
            return { success: true };
          } else {
            console.log('FAILED BUY CONFIRMATION');
            const trData = await getFinalizedTransaction(this.connection, result.signature!);
            if (trData) {
              console.log('FOUND FINALIZED BUY TRANSACTION');
              if (!trData.meta?.err) {
                await this.openPosition(result.signature!, 'finalized');
                return { success: true };
              } else {
                this.failOpen(positionId, result.signature!);
                return { success: false };
              }
            } else {
              this.failOpen(positionId, result.signature!);
              return { success: false };
            }
          }
        } else {
          console.log('NO BUY CONFIRMATION');
          this.failOpen(positionId, result.signature!);
          return { success: false };
        }
      }
    } else {
      console.log('FAILED BUY SEND TRANSACTION');
      this.failOpen(positionId, result.signature!);
      return { success: false };
    }
  }

  async sell(): Promise<boolean> {
    if (this.status !== 'open') return false;

    try {
      console.log('Selling');
      const sellResult = await this.executeSell();
      if (sellResult.success) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Sell failed:', error);
      return false;
    }
  }

  clearUpdateInterval(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  private async executeSell(): Promise<{ success: boolean; amount?: number; price?: number }> {
    this.status = 'close pending';
    if (this.isSimulated) {
      return { success: true };
    }
    let poolState = this.state.poolState;
    let tokenAccount = this.trackProcess.tokenAccounts.get(poolState.baseMint.toString());
    if (!tokenAccount) {
      const market = await getMinimalMarketV3(this.connection, poolState.marketId, `processed`);
      tokenAccount = this.trackProcess.saveTokenAccount(poolState.baseMint, market);
    }

    const quoteToken = raydium.Token.WSOL.mint;
    const quotetokenAccount = getAssociatedTokenAddressSync(quoteToken, this.wallet!.publicKey, true);
    const decimals = await this.state.getMintDecimals();
    const lamports_per_token = 10 ** decimals;
    const tokenAmount = new BN(this.ownedTokenAmount! * lamports_per_token);

    tokenAccount.poolKeys = createPoolKeys(this.state.poolId!, poolState, tokenAccount.market!);

    const { innerTransaction, address } = raydium.Liquidity.makeSwapFixedInInstruction(
      {
        poolKeys: tokenAccount.poolKeys,
        userKeys: {
          tokenAccountIn: tokenAccount.address,
          tokenAccountOut: quotetokenAccount,
          owner: this.wallet!.publicKey,
        },
        amountIn: tokenAmount,
        minAmountOut: 0,
      },
      tokenAccount.poolKeys.version
    );

    const instructions = [
      createAssociatedTokenAccountIdempotentInstruction(
        this.wallet.publicKey,
        quotetokenAccount,
        this.wallet.publicKey,
        quoteToken
      ),
      ...innerTransaction.instructions,
    ];

    const block = await this.connection.getLatestBlockhash('finalized');
    const units = await calculateTransactionCost(instructions, this.connection, this.wallet, block.blockhash);

    const realInstructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: Math.floor(units! * 1.1) }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
      ...instructions,
    ];
    const tx = await createSignedTransaction(realInstructions, this.connection, this.wallet, block.blockhash);
    const result = await sendTransaction(tx, block, this.connection, false);
    await this.trackProcess.updatePositionStatus(this.positionId, 'close pending', result.signature!, this.ownedTokenAmount! * this.currentPrice!);
    console.log(`SELL SIGNATURE: ${result.signature}`);
    if (result.success) {
      if (this.isSimulated) {
        const amount = 0;
        const token_price = await checkPrice(poolState.baseVault, poolState.quoteVault, this.connection, false);
        console.log(`execute sell with token price: ${token_price}`);
        const price = token_price ? token_price : 0;
        return { success: true, amount, price };
      } else {
        if (result.confirmation) {
          const c = await result.confirmation;
          if (c.status === 'success') {
            await this.closePosition(result.signature!, 'confirmed');
            return { success: true };
          } else {
            console.log('FAILED SELL CONFIRMATION');
            const trData = await getFinalizedTransaction(this.connection, result.signature!);
            if (trData) {
              console.log('FOUND FINALIZED SELL TRANSACTION');
              if (!trData.meta?.err) {
                await this.closePosition(result.signature!, 'finalized');
                return { success: true };
              } else {
                await this.failClose(result.signature!);
                return { success: false };
              }
            } else {
              await this.failClose(result.signature!);
              return { success: false };
            }
          }
        } else {
          console.log('NO SELL CONFIRMATION');
          await this.failClose(result.signature!);
          return { success: false };
        }
      }
    } else {
      console.log('FAILED SELL SEND TRANSACTION');
      await this.failClose(result.signature!);
      return { success: false };
    }
  }

  getPerformance() {
    let msg = `Percentage gain: ${(((this.currentPrice! - this.openPrice!) / this.openPrice!) * 100).toFixed(2)}%`;
    console.log(msg);
  }

  async failOpen(positionId: string, signature: string) {
    this.status = 'open fail';
    console.log('Removing trade.');
    await this.trackProcess.updatePositionStatus(positionId, 'open fail', signature);
  }

  async openPosition(signature: string, commitment?: Finality) {
    console.log('BUY CONFIRMED');
    let amountReceived = await getReceivedAmount(
      this.connection,
      signature,
      this.wallet.publicKey.toString(),
      this.mint,
      commitment
    );
    const amountPayed = this.quoteAmount;
    let price = await checkPrice(
      this.state.poolState.baseVault,
      this.state.poolState.quoteVault,
      this.connection,
      false
    );
    if (amountReceived === 0 && commitment !== 'finalized') {
      amountReceived = await getReceivedAmount(
        this.connection,
        signature,
        this.wallet.publicKey.toString(),
        this.mint,
        'finalized'
      );
    }
    if (amountReceived === 0) {
      try {
        amountReceived =
          (await getTokenBalance(this.connection, new PublicKey(this.trackProcess.wallet.publicKey), this.mint)) || 0;
      } catch (error) {}
    } else {
      price = amountPayed / amountReceived;
    }
    this.openPrice = price;
    this.openTime = new Date().toISOString();
    this.status = 'open';
    await this.trackProcess.openPosition(this.positionId, amountReceived, price!, this.openTime, signature);
    this.ownedTokenAmount = amountReceived;
    this.currentPrice = this.openPrice;
    this.calculateTargetAndStopLossPrices();
    this.startPriceUpdates();
  }

  async closePosition(signature: string, commitment?: Finality) {
    this.status = 'closed';
    console.log(`SELL CONFIRMATION SUCCESS: ${signature}`);
    let amountReceived = await getReceivedAmount(
      this.connection,
      signature,
      this.wallet.publicKey.toString(),
      raydium.Token.WSOL.mint.toString(),
      commitment
    );

    if (amountReceived === 0 && commitment !== 'finalized') {
      amountReceived = await getReceivedAmount(
        this.connection,
        signature,
        this.wallet.publicKey.toString(),
        raydium.Token.WSOL.mint.toString(),
        'finalized'
      );
    }
    let price = await checkPrice(
      this.state.poolState.baseVault,
      this.state.poolState.quoteVault,
      this.connection,
      false
    );

    if (amountReceived !== 0 && this.ownedTokenAmount) {
      price = amountReceived / this.ownedTokenAmount;
    }
    this.exitPrice = price || this.currentPrice || 0;
    this.clearUpdateInterval();
    console.log(`SELL SUCCEDED`);
    console.log('Removing trade.');
    await this.trackProcess.closePosition(this.positionId, this.exitPrice, new Date().toISOString(), signature);
  }

  async failClose(signature: string) {
    if (this.closePositionRetryNo === this.closePositionRetries) {
      console.log('SELL FAILED...max number of retries reached.');
      this.clearUpdateInterval();
      this.status = 'close fail';
      console.log('Removing trade.');
      await this.trackProcess.updatePositionStatus(this.positionId, 'close fail', signature);
    } else {
      this.status = 'open';
      console.log('SELL FAILED, retrying...');
      this.closePositionRetryNo += 1;
      await this.trackProcess.updatePositionStatus(this.positionId, 'open', signature);
    }
  }
}

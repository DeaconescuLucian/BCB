import { LiquidityPoolKeys, LiquidityStateV4, SPL_MINT_LAYOUT } from "@raydium-io/raydium-sdk";
import { ConfirmedSignatureInfo, ConfirmedTransactionMeta, Connection, PublicKey, VersionedTransactionResponse } from "@solana/web3.js";
import BN from "bn.js";
import { checkIFTransactionIsInitiate, checkIfTransactionIsLPBurn } from "./helpers";

export type FilterValue = number | undefined;

interface MintInfo {
    decimals: number;
    mintAuthorityOption: number;
    mintAuthority: PublicKey;
    supply: BN;
    isInitialized: number;
    freezeAuthorityOption: number;
    freezeAuthority: PublicKey;
}

type InitialTransactionType = {
    signature: ConfirmedSignatureInfo | any;
    transaction: VersionedTransactionResponse;
};


export const FILTERS = [
    'MINIMUM_SOLANA_POOL',
    'MAXIMUM_SOLANA_POOL',
    'MINIMUM_POOL_PERCENTAGE',
    'MINIMUM_POTATO_COUNT',
    'NOT_MINTABLE',
    'NOT_FREEZABLE',
] as const;

export type FilterKey = typeof FILTERS[number];

export type FilterList = Map<FilterKey, FilterValue>;

export class TokenState {
    public poolState: LiquidityStateV4;
    public filters: FilterList;
    public connection: Connection;
    public poolId: PublicKey | undefined;
    private mint_info: MintInfo | undefined;
    public baseMintVault: number | undefined;
    public quoteMintVault: number | undefined;
    public lpSupply: number | undefined;
    private lpchecker: LPStateChecker;
    public initP: Promise<void> | undefined;
    constructor(
        poolState: LiquidityStateV4,
        filters: FilterList,
        connection: Connection
    ) {
        this.poolState = poolState;
        this.filters = filters;
        this.connection = connection;
        this.lpchecker = new LPStateChecker(poolState, connection);
    }
    
    public async init(): Promise<void> {
        this.initP = new Promise<void>(async (resolve, reject) => {
            try {
                const tx = await this.lpchecker.getInitiateTransaction();
                if (tx) {
                    await this.setInitVaultBalances(tx);
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    public async getMintInfo(retries=5, delay=100):Promise<MintInfo | undefined>{
        if (this.mint_info) return this.mint_info;
        for (let i = 0; i <= retries; i++){
            try {
                let response = await this.connection.getAccountInfo(this.poolState.baseMint, 'processed');
                let data = response ? response.data : null;
                if(!data) throw new Error;
                const info = SPL_MINT_LAYOUT.decode(data);
                this.mint_info = info;
                return info;
            } catch (e) {
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
        }
    }

    public async getMintSupplyRaw(): Promise<bigint> {
        let info = await this.getMintInfo();
        let decimals = info!.decimals;
        const supply = BigInt(info!.supply.toString()) / BigInt(10 ** decimals)
        return supply;
    }

    public async getMintDecimals(): Promise<number> {
        let info = await this.getMintInfo();
        return info!.decimals;
    }

    public async setInitVaultBalances(trx: VersionedTransactionResponse): Promise<void> {
    trx?.meta?.postTokenBalances?.forEach((balance) => {
        if(balance.mint === this.poolState.baseMint.toString() && balance.owner === '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1'){
        this.baseMintVault = balance.uiTokenAmount.uiAmount!;
        }
        if(balance.mint === this.poolState.quoteMint.toString() && balance.owner === '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1'){
        this.quoteMintVault = balance.uiTokenAmount.uiAmount!;
        }
        if(balance.mint === this.poolState.lpMint.toString()){
        this.lpSupply = balance.uiTokenAmount.uiAmount!;
        }
    });
    }

    public hasFilter(key: FilterKey): boolean {
        return this.filters.has(key);
    }

    public async checkMintable(): Promise<boolean> {
        let info = await this.getMintInfo();
        const mintAuthorityOption = info!.mintAuthorityOption;
        if (mintAuthorityOption === 0) {
            return true;
        } else {
            return false;
        }
    } 

    public async checkFreezable(): Promise<boolean> {
        let info = await this.getMintInfo();
        const freezeAuthorityOption = info!.freezeAuthorityOption;
        if (freezeAuthorityOption === 0) {
            return true;
        } else {
            return false;
        }
    }


    public async checkMinimumSolanaPool(value: number): Promise<boolean> {
        await this.initP;
        if(this.quoteMintVault) return this.quoteMintVault! >= value!;
        else return false;
    }

    public async checkMaximumSolanaPool(value: number): Promise<boolean> {
        await this.initP;
        if(this.quoteMintVault) return this.quoteMintVault! <= value!;
        else return false;
    }



    public async checkMinimumPoolPercentage(value: number): Promise<boolean> {
        await this.initP;
        let s = await this.getMintSupplyRaw();

        if(this.baseMintVault) return (this.baseMintVault! / Number(s) >= value!);
        else return false;
    }
}

class LPStateChecker {
    public oldTransactions: ConfirmedSignatureInfo[] | null = null;
    public initialTransaction: InitialTransactionType | null = null;
    public isLpBurned: boolean = false;
    public lpMintSupply:number | null = null;
    public quoteMintSupply:number | null = null;
    public baseMintSupply:number | null = null;
    private poolState;
    private connection:Connection;

    constructor(poolState: LiquidityStateV4, connection: Connection) {
      this.poolState = poolState;
        this.connection = connection;

    }

    private async createTransactionPromises(transactions: ConfirmedSignatureInfo[]) {
      let signatures = []
      for (let tx of transactions){
        signatures.push(tx.signature)
      }
      let promises = this.connection.getTransactions(signatures, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 2,
      });
      return promises;
    }

    public async getInitiateTransaction(retries=5, delay=500): Promise<VersionedTransactionResponse | undefined> {
      if (this.initialTransaction?.transaction) {
          return this.initialTransaction.transaction;
      } else {
        for (let i = 0; i <= retries; i++) {
          let transactions = await this.connection.getSignaturesForAddress(
              this.poolState.lpMint,
              { limit: 100 },
              'confirmed'
          );

        //   console.log(transactions)
  
          if (transactions.length === 0){ 
            console.log(`no transactions found #${i}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

        //   if(transactions.length !== 0){
        //   console.log(`transactions found`);
        //   console.log(transactions)
        //   }
  
          transactions = transactions.reverse();
          let txs = await this.createTransactionPromises(transactions);
  
          for (let tx of txs) {
              if (tx && tx.meta && tx.meta.err === null) {
                console.log(`checking tx`);
                  if (await checkIFTransactionIsInitiate(tx.meta)) {
                    console.log(`init tx found`);
                      this.initialTransaction = {
                          signature: tx,
                          transaction: tx
                      };
                      return tx;
                  }
              }
          }
          return;
      }
    }
  }


    public async checkLPMintBurn(poolState: LiquidityStateV4): Promise<boolean | undefined> {
        try {
        let transactions: ConfirmedSignatureInfo[] | null = null;

        if (!this.initialTransaction) {
            transactions = await this.connection.getSignaturesForAddress(
            poolState.lpMint,
            {
                limit: 100,
            },
            'confirmed',
            );
        } 

        else {
            transactions = await this.connection.getSignaturesForAddress(
            poolState.lpMint,
            {
                limit: 100,
                until: this.initialTransaction.signature.signature
            },
            'confirmed',
            );
        }

        if (!transactions) {
            return;
        }

        transactions=transactions.reverse();

        if (this.oldTransactions === transactions) {
            return;
        }

        let promises = await this.createTransactionPromises(transactions)

        if(!promises){
            return;
        }

        if (!this.initialTransaction && transactions.length === 1) {
            let restx = await promises[0];
            this.initialTransaction = {
            signature: transactions![0],
            transaction: restx!
            };
            return;
        }

        else if (!this.initialTransaction && transactions.length > 1) {
            for (let index = 0; index < promises.length; index++) {
            let restx = await promises[index];
            if(restx && restx.meta && restx.meta.err === null){
                this.initialTransaction = {
                signature: transactions![index],
                transaction: restx
                };
                promises.splice(0, index + 1);
                transactions!.splice(0, index + 1);

                break;
            }
            }
        }

        if(!promises.length && !transactions.length){
        return;
        }

        this.oldTransactions = transactions;

        for (let transactionPromise of promises) {
        let transactionData = await transactionPromise;
        if (transactionData && transactionData.meta && transactionData.meta.err === null) {
            const meta = transactionData.meta
            return checkIfTransactionIsLPBurn(meta, this.lpMintSupply as number);
        }
        }

        } catch (e) {
        console.log(`Timeout`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return;
        }
    }
}
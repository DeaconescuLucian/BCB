export function generateGUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function calculateProfitPCT(positions: any[]) {
  const netProfit = positions.reduce((accumulatedProfit, position) => {
    const { startingPrice, currentPrice, exitPrice, amount } = position;

    if (!startingPrice || !amount) {
      return accumulatedProfit;
    }

    const effectivePrice = exitPrice != null ? exitPrice : currentPrice;

    if (effectivePrice == null) {
      return accumulatedProfit;
    }
    const profit = (effectivePrice - startingPrice) * amount;
  
    return accumulatedProfit + profit;
  }, 0);

  const investment = positions.reduce((accumulatedProfit, position) => {
    const { startingPrice, amount } = position;

    if (!startingPrice || !amount) {
      return accumulatedProfit;
    }
    const investment = startingPrice * amount;
  
    return accumulatedProfit + investment;
  }, 0);

  const totalPct = ((investment + netProfit) / investment) * 100;
  return {totalPct, netProfit};
}

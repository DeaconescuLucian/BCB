import React from 'react';

function WrapOrUnrwap() {
  // const wrapSol = async () => {
  //   setLoading(true);
  //   const result = await window.electron.invoke(CustomEvents.wrapEvent, {
  //     wallet: selectedWalletDetails?.publicKey,
  //     amount: wrapAmount,
  //     simulate: simulate,
  //   });
  //   if (result) {
  //     if (result.data.message) {
  //       let publicKey = selectedWalletDetails?.publicKey;
  //       dispatch(updateSelectedWallet(publicKey));
  //       dispatch(getWalletDetails(publicKey));
  //       setLoading(false);
  //       showToast(result.data.message, 'success');
  //     } else {
  //       if (result.data.error) {
  //         showToast(result.data.error, 'fail');
  //       }
  //     }
  //   }
  // };

  // const unwrapSol = async () => {
  //   setLoading(true);
  //   const result = await window.electron.invoke(CustomEvents.unwrapEvent, {
  //     wallet: selectedWalletDetails?.publicKey,
  //     amount: wsolBalance,
  //     simulate: simulate,
  //   });
  //   if (result) {
  //     if (result.data.message) {
  //       let publicKey = selectedWalletDetails?.publicKey;
  //       dispatch(updateSelectedWallet(publicKey));
  //       dispatch(getWalletDetails(publicKey));
  //       setLoading(false);
  //       showToast(result.data.message, 'success');
  //     } else {
  //       if (result.data.error) {
  //         showToast(result.data.error, 'fail');
  //       }
  //     }
  //   }
  // };
  return (
    <div className="sell-page">
        Wrap / Unrwap
    </div>
  );
}

export default WrapOrUnrwap;
import React, { useEffect } from "react";
import Menu from "./components/Menu";
import TopBar from "./components/TopBar";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Trade from "./pages/Trade";
import Settings from "./pages/Settings";
import TransactionHistory from "./components/TransactionHistory";
import WalletPage from "./pages/Wallet";
import { useDispatch } from "react-redux";
import { updateWallets } from "./store/reducers/wallets";
import { ProcessType } from "../ts/events";

function App() {
  const dispatch = useDispatch();

  const walletProcess = ProcessType.WALLET;

  useEffect(() => {
    handleStartBackgroundProcess();
  }, []);

  const handleStartBackgroundProcess = async () => {
    await window.electron.invoke(walletProcess.startEvent, undefined);
  };

  useEffect(() => {
    const unsubscribe = window.electron.on(walletProcess.updateEvent, (msg) => {
      dispatch(updateWallets(msg));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="app-container">
      <Menu></Menu>
      <TopBar></TopBar>
      <TransactionHistory></TransactionHistory>
      <Routes>
        <Route path="/" element={<Home></Home>} />
        <Route path="/wallet-page" element={<WalletPage></WalletPage>} />
        <Route path="/trade" element={<Trade></Trade>} />
        <Route path="/settings" element={<Settings></Settings>} />
      </Routes>
    </div>
  );
}

export default App;

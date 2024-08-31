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
import { fetchWallets } from "./store/reducers/wallets";
import { useNavigate } from "react-router-dom";

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchWallets())
    navigate(window.localStorage.getItem('url') || `/home`)
  }, []);

  return (
    <div className="app-container">
      <Menu></Menu>
      <TopBar></TopBar>
      <TransactionHistory></TransactionHistory>
      <Routes>
        <Route path="/home" element={<Home></Home>} />
        <Route path="/wallet-page/*" element={<WalletPage></WalletPage>} />
        <Route path="/trade" element={<Trade></Trade>} />
        <Route path="/settings/*" element={<Settings></Settings>} />
      </Routes>
    </div>
  );
}

export default App;

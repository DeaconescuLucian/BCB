import React, { useEffect, useRef, useState } from 'react';
import Menu from './components/Menu';
import TopBar from './components/TopBar';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Trade from './pages/Trade';
import Settings from './pages/Settings';
import TransactionHistory from './components/TransactionHistory';
import WalletPage from './pages/Wallet';
import { useDispatch } from 'react-redux';
import { fetchWallets, fetchTokens, updateSelectedWallet, getWalletDetails } from './store/reducers/wallets';
import { useNavigate } from 'react-router-dom';

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mainHeight, setMainHeight] = useState(637);
  const mainContainerRef = useRef(null);

  useEffect(() => {
    dispatch(fetchWallets());
    const pub = window.localStorage.getItem('wallet-address');
    if (pub) {
      dispatch(updateSelectedWallet(pub));
      dispatch(getWalletDetails(pub));
    }
    dispatch(fetchTokens());
    navigate(window.localStorage.getItem('url') || `/home`);
  }, []);

  return (
    <div className="app-container">
      <Menu></Menu>
      <TopBar></TopBar>
      <TransactionHistory
        onResize={(distance) => {
          mainContainerRef.current.style.height = `${mainHeight + distance}px`;
          mainContainerRef.current.style.maxHeight = `${mainHeight + distance}px`;
        }}
        onResizeEnd={(distance) => {
          setMainHeight((prev) => prev + distance);
        }}
        onWindowResize={(terminalSize) => {
          const newSize = window.innerHeight - 30 - terminalSize;
          setMainHeight(newSize);
          mainContainerRef.current.style.height = `${newSize}px`;
          mainContainerRef.current.style.maxHeight = `${newSize}px`;
        }}
      ></TransactionHistory>
      <div className="main-container" ref={mainContainerRef}>
        <Routes>
          <Route path="/home" element={<Home></Home>} />
          <Route path="/wallet-page/*" element={<WalletPage></WalletPage>} />
          <Route path="/trade/*" element={<Trade></Trade>} />
          <Route path="/settings/*" element={<Settings></Settings>} />
        </Routes>
      </div>
    </div>
  );
}

export default App;

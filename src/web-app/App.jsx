import React, { useEffect, useRef, useState } from 'react';
import Menu from './components/Menu';
import TopBar from './components/TopBar';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Trade from './pages/Trade';
import Settings from './pages/Settings';
import TransactionHistory from './components/TransactionHistory';
import WalletPage from './pages/Wallet';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWallets, fetchTokens, updateSelectedWallet, getWalletDetails } from './store/reducers/wallets';
import { getValuesFromLocalStorage } from './store/reducers/feeAndSlippage';
import { fetchPoolFilters } from './store/reducers/poolFilters';
import { fetchTrackProcesses,  updateTrackProcess } from './store/reducers/trackProcess';
import { fetchDataCollectors,  updateDataCollector } from './store/reducers/dataCollectors';
import { useNavigate } from 'react-router-dom';
import Loading from './components/Loading';
import Tracking from './pages/Tracking';
import TrackProcess from './pages/Tracking/TrackProcess';
import DataCollector from './pages/Tracking/DataCollectProcess';
import { CustomEvents } from '../ts/events';

function App() {
  const { fetchWalletsDone, fetchTokensDone, getWalletDetailsDone } = useSelector((state) => state.wallets);
  const { fetchPoolFiltersDone } = useSelector((state) => state.poolFilters);
  const { fetchTrackProcessesDone } = useSelector((state) => state.trackProcess);
  const { fetchDataCollectorsDone } = useSelector((state) => state.dataCollector);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mainHeight, setMainHeight] = useState(607);
  const mainContainerRef = useRef(null);
  const appRef = useRef(null);

  useEffect(() => {
    dispatch(getValuesFromLocalStorage());
    dispatch(fetchWallets());
    const pub = window.localStorage.getItem('wallet-address');
    if (pub) {
      dispatch(updateSelectedWallet(pub));
      dispatch(getWalletDetails(pub));
    }
    dispatch(fetchTokens(true));
    dispatch(fetchPoolFilters(true));
    dispatch(fetchTrackProcesses(true));
    dispatch(fetchDataCollectors(true));
    navigate(window.localStorage.getItem('url') || `/home`);
    const unsubscribeUpdateTrackEvent = window.electron.on(CustomEvents.updateTrackProcessEvent, (msg) => {
      dispatch(updateTrackProcess(msg));
    });
    const unsubscribeUpdateDataCollectorEvent = window.electron.on(CustomEvents.updateDataCollectProcessEvent, (msg) => {
      dispatch(updateDataCollector(msg));
    });
    const trackProcessesTimeout = setInterval(() => {
      dispatch(fetchTrackProcesses(false));
    }, 10000);
    const dataCollectorsTimeout = setInterval(() => {
      dispatch(fetchDataCollectors(false));
    }, 10000);

    return () => {
      unsubscribeUpdateTrackEvent();
      unsubscribeUpdateDataCollectorEvent();
      clearInterval(trackProcessesTimeout);
      clearInterval(dataCollectorsTimeout);
    }
  }, []);

  return (
    <div className="app-container" ref={appRef}>
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
      {(fetchWalletsDone && fetchTokensDone && getWalletDetailsDone && fetchPoolFiltersDone && fetchTrackProcessesDone && fetchDataCollectorsDone) && (
        <div className="main-container" ref={mainContainerRef}>
          <Routes>
            <Route path="/home" element={<Home></Home>} />
            <Route path="/wallet-page/*" element={<WalletPage></WalletPage>} />
            <Route path="/trade/*" element={<Trade></Trade>} />
            <Route path="/settings/*" element={<Settings></Settings>} />
            <Route path="/track/*" element={<Tracking></Tracking>} />
            <Route path="/track-process/*" element={<TrackProcess></TrackProcess>} />
            <Route path="/data-collector/*" element={<DataCollector></DataCollector>} />
          </Routes>
        </div>
      )}

      {(!fetchWalletsDone || !fetchTokensDone || !getWalletDetailsDone || !fetchPoolFiltersDone || !fetchTrackProcessesDone || !fetchDataCollectorsDone) && (
        <Loading parentRef={appRef} text={'Gettings things ready'}></Loading>
      )}
    </div>
  );
}

export default App;

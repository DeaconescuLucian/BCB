import React, { useState, useEffect } from 'react';
import wallet from '../../assets/icons/wallet.svg';
import trade_icon from '../../assets/icons/trade.svg';
import settings_icon from '../../assets/icons/settings.svg';
import logout_icon from '../../assets/icons/logout.svg';
import home_icon from '../../assets/icons/home.svg';
import { useNavigate } from 'react-router-dom';

function Menu() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('home-menu-item');

  const handleMenuItemClick = (e) => {
    document.getElementById(selectedTab)?.classList?.remove('menu-item-selected');
    if (e.target.id) {
      document.getElementById(e.target.id)?.classList?.add('menu-item-selected');
      setSelectedTab(e.target.id);
    } else {
      document.getElementById('home-menu-item')?.classList?.add('menu-item-selected');
      setSelectedTab('home-menu-item');
    }
  };

  const solanaSVG = (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 96 96" fill="none">
      <g clipPath="url(#a)">
        <path
          fill="url(#b)"
          d="m108.53 75.69-17.72 19a4.099 4.099 0 0 1-3 1.31h-84a2.06 2.06 0 0 1-1.51-3.46l17.7-19a4.1 4.1 0 0 1 3-1.31h84a2.05 2.05 0 0 1 1.53 3.46ZM90.81 37.42a4.14 4.14 0 0 0-3-1.31h-84a2.06 2.06 0 0 0-1.51 3.46L20 58.58a4.14 4.14 0 0 0 3 1.31h84a2.06 2.06 0 0 0 1.5-3.46L90.81 37.42Zm-87-13.65h84a4.098 4.098 0 0 0 3-1.31l17.72-19a2.052 2.052 0 0 0-.387-3.14A2.05 2.05 0 0 0 107 0H23a4.1 4.1 0 0 0-3 1.31l-17.7 19a2.06 2.06 0 0 0 1.51 3.46Z"
        />
      </g>
      <defs>
        <linearGradient id="b" x1="10.81" x2="98.89" y1="98.29" y2="-1.01" gradientUnits="userSpaceOnUse">
          <stop offset=".08" stopColor="#9945FF" />
          <stop offset=".3" stopColor="#8752F3" />
          <stop offset=".5" stopColor="#5497D5" />
          <stop offset=".6" stopColor="#43B4CA" />
          <stop offset=".72" stopColor="#28E0B9" />
          <stop offset=".97" stopColor="#19FB9B" />
        </linearGradient>
        <clipPath id="a">
          <path fill="#fff" d="M0 0h96v96H0z" />
        </clipPath>
      </defs>
    </svg>
  );

  const changeSelectedTab = (id) => {
    document.getElementById(selectedTab)?.classList?.remove('menu-item-selected');
    document.getElementById(id)?.classList?.add('menu-item-selected');
    setSelectedTab(id);
  };

  useEffect(() => {
    if (window.localStorage.getItem('url'))
      switch (window.localStorage.getItem('url').split('?')[0]) {
        case '/':
          changeSelectedTab('home-menu-item');
          break;
        case '/wallet-page/list':
        case '/wallet-page/import':
        case '/wallet-page/generate':
        case '/wallet-page/view':
          changeSelectedTab('wallets-menu-item');
          break;
        case '/trade/buy':
        case '/trade/sell':
          changeSelectedTab('trade-menu-item');
          break;
        case '/settings/license':
        case '/settings/connection':
          changeSelectedTab('settings-menu-item');
          break;
        default:
          console.log('here1');
          changeSelectedTab('home-menu-item');
          break;
      }
  }, []);

  return (
    <div className="app-menu">
      <div
        className="app-menu-header"
        onClick={(e) => {
          handleMenuItemClick(e);
          window.localStorage.setItem('url', '/home');
          navigate('/');
        }}
      >
        <div className="app-menu-title">
          {solanaSVG}
          <h2>B C B</h2>
        </div>
        <div className="app-menu-subtitle">Blockchain Busters</div>
      </div>
      <div className="app-menu-content">
        <div
          id="home-menu-item"
          className="app-menu-item menu-item-selected"
          onClick={(e) => {
            handleMenuItemClick(e);
            window.localStorage.setItem('url', '/home');
            navigate('/home');
          }}
        >
          <img src={home_icon}></img>
          <span>Home</span>
        </div>
        <div
          id="wallets-menu-item"
          className="app-menu-item"
          onClick={(e) => {
            handleMenuItemClick(e);
            window.localStorage.setItem('url', '/wallet-page/list');
            navigate('/wallet-page/list');
          }}
        >
          <img src={wallet}></img>
          <span>Wallets</span>
        </div>
        <div
          id="trade-menu-item"
          className="app-menu-item"
          onClick={(e) => {
            handleMenuItemClick(e);
            window.localStorage.setItem('url', '/trade/buy');
            navigate('/trade/buy');
          }}
        >
          <img src={trade_icon}></img>
          <span>Trade</span>
        </div>
        <div className="app-menu-footer">
          <div
            id="settings-menu-item"
            className="app-menu-item"
            onClick={(e) => {
              handleMenuItemClick(e);
              window.localStorage.setItem('url', '/settings/license');
              navigate('/settings/license');
            }}
          >
            <img src={settings_icon}></img>
            <span>Settings</span>
          </div>
          <div className="app-menu-item">
            <img src={logout_icon}></img>
            <span>Logout</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Menu;

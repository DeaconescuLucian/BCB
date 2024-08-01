import React, { useState } from "react";
import btc_img from "../../assets/images/bitcoin-btc-logo.png";
import wallet_arrow_icon from "../../assets/icons/wallet-arrow.svg";
import add_icon from "../../assets/icons/plus.svg";
import trade_icon from "../../assets/icons/trade.svg";
import settings_icon from "../../assets/icons/settings.svg";
import logout_icon from "../../assets/icons/logout.svg";
import home_icon from "../../assets/icons/home.svg";
import { useNavigate } from "react-router-dom";

function Menu() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("home-menu-item");

  const handleMenuItemClick = (e) => {
    document.getElementById(selectedTab)?.classList?.remove("menu-item-selected");
    if(e.target.id)
    {
      document.getElementById(e.target.id)?.classList?.add("menu-item-selected");
      setSelectedTab(e.target.id);
    }
    else
    {
      document.getElementById("home-menu-item")?.classList?.add("menu-item-selected");
      setSelectedTab("home-menu-item");
    }   
  };

  return (
    <div className="app-menu">
      <div className="app-menu-header" onClick={(e) => {
            handleMenuItemClick(e);
            navigate("/");
          }}>
        <div className="app-menu-title">
          <img src={btc_img}></img>
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
            navigate("/");
          }}
        >
          <img src={home_icon}></img>
          <span>Home</span>
        </div>
        <div
          id="import-wallet-menu-item"
          className="app-menu-item"
          onClick={(e) => {
            handleMenuItemClick(e);
            navigate("/import-wallet");
          }}
        >
          <img src={wallet_arrow_icon}></img>
          <span>Import Wallet</span>
        </div>
        <div
          id="generate-wallet-menu-item"
          className="app-menu-item"
          onClick={(e) => {
            handleMenuItemClick(e);
            navigate("/generate-wallet");
          }}
        >
          <img src={add_icon}></img>
          <span>Generate Wallet</span>
        </div>
        <div
          id="trade-menu-item"
          className="app-menu-item"
          onClick={(e) => {
            handleMenuItemClick(e);
            navigate("/trade");
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
              navigate("/settings");
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

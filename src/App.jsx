import React from "react";
import Menu from "./components/Menu";
import TopBar from "./components/TopBar";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import ImportWallet from "./pages/ImportWallet";
import GenerateWallet from "./pages/GenerateWallet";
import Trade from "./pages/Trade";
import Settings from "./pages/Settings";

function App() {
  return (
    <div className="app-container">
      <Menu></Menu>
      <TopBar></TopBar>
      <Routes>
        <Route path="/" element={<Home></Home>} />
        <Route path="/import-wallet" element={<ImportWallet></ImportWallet>} />
        <Route path="/generate-wallet" element={<GenerateWallet></GenerateWallet>} />
        <Route path="/trade" element={<Trade></Trade>} />
        <Route path="/settings" element={<Settings></Settings>} />
      </Routes>
    </div>
  );
}

export default App;

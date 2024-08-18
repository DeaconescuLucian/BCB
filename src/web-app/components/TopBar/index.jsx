import React, { useState } from "react";
import close_icon from "../../assets/icons/close.svg";
import window_minimize_icon from "../../assets/icons/window-minimize.svg";
import window_maximize_icon from "../../assets/icons/window-maximize.svg";

function TopBar() {
  const minimizeWindow = () => {
    if (window.electron && typeof window.electron.minimizeWindow === "function") {
      window.electron.minimizeWindow();
    } else {
      console.error("Electron API is not available.");
    }
  };

  const maximizeWindow = () => {
    if (window.electron && typeof window.electron.maximizeWindow === "function") {
      window.electron.maximizeWindow();
      setIsMaximized(true);
    } else {
      console.error("Electron API is not available.");
    }
  };

  const unmaximizeWindow = () => {
    if (window.electron && typeof window.electron.maximizeWindow === "function") {
      window.electron.unmaximizeWindow();
      setIsMaximized(false);
    } else {
      console.error("Electron API is not available.");
    }
  };

  const closeWindow = () => {
    if (window.electron && typeof window.electron.closeWindow === "function") {
      window.electron.closeWindow();
    } else {
      console.error("Electron API is not available.");
    }
  };

  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <div className="top-bar">
      <div className="bar"></div>
      <div className="container-end">
        <div className="image-container" onClick={minimizeWindow}>
          <img src={window_minimize_icon} alt="" />
        </div>
        <div
          className="image-container"
          onClick={() => {
            if (!isMaximized) {
              maximizeWindow();
            } else {
              unmaximizeWindow();
            }
          }}
        >
          <img src={window_maximize_icon} alt="" />
        </div>
        <div className="image-container" onClick={closeWindow}>
          <img src={close_icon} alt="" />
        </div>
      </div>
    </div>
  );
}

export default TopBar;

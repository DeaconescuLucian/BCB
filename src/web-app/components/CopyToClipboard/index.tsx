import React, { useState } from "react";
import { copySvg, successSvg } from "../../assets/svg/index.jsx";

interface ICopyToClipboard {
  text: string;
}

function CopyToClipboard(props: ICopyToClipboard) {
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);
  const [copyToClipboardTitle, setCopyToClipboardTitle] = useState("Copy");


  const copyToClipboard = () => {
    setCopyToClipboardTitle("Copied");
    setButtonClicked(true);
    navigator.clipboard.writeText(props.text);

    setTimeout(() => {
      setCopyToClipboardTitle("Copy");
      setButtonClicked(false)
    }, 2000);
  };

  return (
    <span
      className="copy-icon"
      onClick={() => {
        copyToClipboard();
      }}
      onMouseEnter={() => {setShowMessageBox(true)}}
      onMouseLeave={() => {setShowMessageBox(false)}}
    >
      {
        !buttonClicked ? copySvg : successSvg
      }
      {showMessageBox && (
        <div className="copy-to-clipboard-message">
          <span>{copyToClipboardTitle}</span>
        </div>
      )}
    </span>
  );
}

export default CopyToClipboard;

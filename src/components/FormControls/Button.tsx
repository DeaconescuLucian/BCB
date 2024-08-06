import React from "react";
import { addSvg } from "../../assets/svg/index.jsx";
import { saveSvg } from "../../assets/svg/index.jsx";

type ButtonType = 'add' | 'save';
type ButtonTheme = 'primary' | 'secondary';

interface IButton {
  type?: ButtonType;
  theme?: ButtonTheme;
  text?: string;
  onClick: Function;
}

function Button(props: IButton) {

  const renderView = () => {
    switch (props.type) {
      case 'add':
        return addSvg;
      case 'save':
        return saveSvg;
      default:
        return null;
    }
  };

  return (
    <button className={`button-with-text-and-icon ${props.theme ? `theme-${props.theme}` : null}`} onClick={() => {props.onClick()}}>
      {
        renderView()
      }
      <div className="text">
        <h4>{props.text}</h4>
      </div>
    </button>
  );
}

export default Button;

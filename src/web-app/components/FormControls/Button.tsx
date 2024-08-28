import React from 'react';
import { addSvg, saveSvg, importWalletSvg, reloadSvg } from '../../assets/svg/index.jsx';

type ButtonType = 'add' | 'save' | 'import-wallet' | 'reload';
type ButtonTheme = 'primary' | 'secondary';

 /**
   * Button props:
   * - type?
   * - theme?
   * - text?
   * - onClick
   * - disabled?
   * - tooltipDisabled?
   */
interface IButton {
  /**
   * Type of the button. Can be one of:
   * - 'add'
   * - 'save'
   * - 'import-wallet'
   */
  type?: ButtonType;
  /**
   * Theme of the button. Can be one of:
   * - 'primary'
   * - 'secondary'
   */
  theme?: ButtonTheme;
  text?: string;
  onClick: Function;
  disabled?: boolean;
  /**
   * The tooltip displayed when the button is disabled:
   */
  tooltipDisabled?: string;
}

function Button(props: IButton) {
  const renderView = () => {
    switch (props.type) {
      case 'add':
        return addSvg;
      case 'save':
        return saveSvg;
      case 'import-wallet':
        return importWalletSvg;
      case 'reload':
        return reloadSvg;
      default:
        return null;
    }
  };

  return (
    <button
      className={`button-with-text-and-icon ${props.theme ? `theme-${props.theme}` : null}`}
      onClick={() => {
        props.onClick();
      }}
      disabled={props.disabled}
      title={(props.disabled && props.tooltipDisabled) ? props.tooltipDisabled : ""}
    >
      {renderView()}
      <div className="text">
        <h4>{props.text}</h4>
      </div>
    </button>
  );
}

export default Button;

import React, { useState, useEffect, useRef } from 'react';
import { downSvg } from '../../assets/svg';
import Dialog from '../Dialog';
import { crossSvg, addSvg, starSvg, emptyStarSvg } from '../../assets/svg';
import SearchBar from '../SearchBar';
import DefaultCoin from '../../assets/icons/coin.png';
import CopyToClipboard from '../CopyToClipboard';
import { CustomEvents } from '../../../ts/events';
import Loading from '../Loading';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTokens, getWalletDetails } from '../../store/reducers/wallets';

interface ITokenSelector {
  onChange: Function;
  initialToken: IToken;
  tokenList: any[];
  hasRemoteSearch: boolean;
  readOnly?: boolean;
}

interface IToken {
  address: string;
  logoURI: string;
  name: string;
  symbol: string;
  amount: number;
}

const TokenSelector = ({ onChange, initialToken, tokenList, hasRemoteSearch, readOnly }: ITokenSelector) => {
  const { selectedWallet } = useSelector(
    (state) => state.wallets
  );
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(initialToken);
  const [showDialog, setShowDialog] = useState(false);
  const [filter, setFilter] = useState('');
  const [tokenBatchNo, setTokenBatchNo] = useState(1);
  const tokenBatchSize = 20;
  const tokenListSize = 330;
  const listRef = useRef(null);
  const [innerTokenList, setInnerTokenList] = useState(tokenList);
  const dispatch = useDispatch();

  useEffect(() => {
    setInnerTokenList(tokenList);
  }, [tokenList]);

  useEffect(() => {
    setToken(initialToken);
  }, [initialToken]);

  const handleListScroll = (e) => {
    if (listRef.current) {
      if (listRef.current.scrollTop >= listRef.current.scrollHeight - tokenListSize) {
        setTokenBatchNo((prev) => prev + 1);
      }
    }
  };

  const handleTokenSearchRemote = async (mint) => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.getTokenDetailsEvent, mint);
    if (result && result.success) {
      if (!innerTokenList.find((e) => e.address === mint)) {
        setInnerTokenList((prev) => [
          ...prev,
          {
            address: result.data.mint,
            logoURI: result.data.icon,
            name: result.data.name,
            symbol: result.data.symbol,
            isNew: true,
          },
        ]);
      }
      setFilter(result.data.symbol);
    }
    setLoading(false);
  };

  const addToken = async (token) => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.addTokenEvent, {
      mint: token.address,
      icon: token.logoURI,
      name: token.name,
      symbol: token.symbol,
      isNft: false,
      decimals: 9,
    });
    if (result && result.success) {
      dispatch(fetchTokens());
    }
    setLoading(false);
  };

  const addToFavourites = async (token) => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.addTokenToFavouritesEvent, {
      mint: token.address,
      icon: token.logoURI,
      name: token.name,
      symbol: token.symbol,
      isNft: false,
      decimals: 9,
    });
    if(result)
    {
      if(result.success)
      {
        dispatch(getWalletDetails(selectedWallet));
        dispatch(fetchTokens());
      }
    }
    setLoading(false);
  }

  const removeFromFavourites = async (address) => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.removeTokenFromFavouritesEvent, address);
    if(result)
    {
      if(result.success)
      {
        dispatch(getWalletDetails(selectedWallet));
        dispatch(fetchTokens());
      }
    }
    setLoading(false);
  }

  return (
    <>
      <div
        className="token-selector"
        onClick={() => {
          if (!readOnly) setShowDialog(true);
        }}
      >
        <div className="icon-container">{token && <img src={token?.logoURI || DefaultCoin} />}</div>
        <div className="symbol">{token?.symbol}</div>
        {downSvg}
      </div>
      {showDialog && (
        <Dialog
          className="token-selector-dialog"
          onClose={() => {
            setFilter('');
            setShowDialog(false);
          }}
        >
          <div className="token-selector-dialog-header">
            <div className="title">
              {' '}
              <span>Select a token</span>
              <span
                onClick={() => {
                  setFilter('');
                  setShowDialog(false);
                }}
              >
                {crossSvg}
              </span>
            </div>
            <div className="subtitle">
              {' '}
              <span>
                {hasRemoteSearch ? 'Search our token list or past a mint' : 'Only owned tokens appear in here'}
              </span>
            </div>
            <div className="token-search-container">
              <SearchBar
                remoteSearch={hasRemoteSearch}
                placeholder="Search by symbol or paste address"
                withDropDown={false}
                onChange={(value) => {
                  setFilter(value);
                }}
                onSearch={(value) => {
                  if (hasRemoteSearch) handleTokenSearchRemote(value);
                }}
              ></SearchBar>
            </div>
            <div className="token-list-header">
              <span>Token</span>
              <span>Balance/Address</span>
            </div>
          </div>
          <div className="token-list" ref={listRef} onScroll={handleListScroll}>
            <div className="token-list-body">
              {innerTokenList.length > 0 &&
                innerTokenList
                  .filter((t) => t.symbol?.toLowerCase().includes(filter.toLowerCase()))
                  .slice(0, tokenBatchNo * tokenBatchSize)
                  .map((t) => (
                    <div
                      className="token-list-item"
                      key={`toke-list-item-${t.mint}`}
                      onClick={() => {
                        setToken(t);
                        setShowDialog(false);
                        setFilter('');
                        onChange(t);
                      }}
                    >
                      <div className="left-side">
                        {' '}
                        <div className="icon-container">
                          <img src={t.logoURI || DefaultCoin} />
                        </div>
                        <div className="name-container">
                          <div className="symbol">
                            <span className='truncate'>{t.symbol || 'N/A'}</span>
                            {t.isNew ? (
                              <span
                                className="add"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  addToken(t);
                                }}
                              >
                                {addSvg} Add token
                              </span>
                            ) : (
                              <>
                                {t.favouriteIndex ? (
                                  <span
                                    className="fav"
                                    title="Remove from favourites"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      removeFromFavourites(t.address);
                                    }}
                                  >
                                    {starSvg}
                                  </span>
                                ) : (
                                  <span
                                    className="not-fav"
                                    title="Add to favourites"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      addToFavourites(t);
                                    }}
                                  >
                                    {emptyStarSvg}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <span className="name">{t.name || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="right-side">
                        <div className="amount">{t.amount || 0}</div>
                        <div className="address">
                          <span className="truncate">{t.address}</span>{' '}
                          <CopyToClipboard text={t.address}></CopyToClipboard>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
            {loading && <Loading parentRef={listRef}></Loading>}
          </div>
        </Dialog>
      )}
    </>
  );
};

export default TokenSelector;

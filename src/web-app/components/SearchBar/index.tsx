import React, { useRef, useEffect, useState } from 'react';
import { searchSvg, crossSvg } from '../../assets/svg';
import ClickOutside from '../ClickOutside';

interface ISearchProps {
  onSearch?: (item: any) => void;
  searchArray?: any[];
  displayTemplate?: (value: any) => any;
  matchProperties?: { name: string; fullMatch: boolean }[] | [];
  placeholder?: string;
  remoteSearch?: boolean;
}

export default function SearchBar(props: ISearchProps) {
  const [value, setValue] = useState('');
  const [matchingValues, setMatchingValues] = useState([] as any[]);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null as any);

  const matchValues = (val) => {
    let matching: any[] = [];
    if (props.searchArray) {
      props.matchProperties?.forEach((prop) => {
        let currentMatches;
        if (!prop.fullMatch) {
          currentMatches =
            props.searchArray?.filter((item) => item[prop.name].toLowerCase().includes(val.toLowerCase())) || [];
        } else {
          currentMatches =
            props.searchArray?.filter((item) => item[prop.name].toLowerCase() === val.toLowerCase()) || [];
        }
        matching = [...matching, ...currentMatches];
      });
      setMatchingValues(matching);
    }
  };

  return (
    <ClickOutside
      className="column-self-center search-bar-wrapper"
      onClickOutside={() => {
        setIsFocused(false);
      }}
    >
      <div
        ref={containerRef}
        className="search-bar"
        onFocus={(event) => {
          if (value === '') {
            if (props.searchArray) setMatchingValues(props.searchArray || []);
          }
          if (containerRef.current && containerRef.current.contains(event.target)) {
            setIsFocused(true);
          }
        }}
        onBlur={(event) => {
          if (containerRef.current && !containerRef.current.contains(event.target)) {
            setIsFocused(false);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            setIsFocused(false);
            setValue('');
            if (props.remoteSearch && props.onSearch) props.onSearch(value);
            if (props.onSearch && matchingValues.length) props.onSearch(matchingValues[0]);
          }
        }}
      >
        <input
          type="text"
          placeholder={props.placeholder}
          onChange={(e) => {
            setValue(e.target.value);
            matchValues(e.target.value);
          }}
          value={value}
        ></input>
        {value && (
          <span
            className="clear-input"
            onClick={() => {
              setValue('');
            }}
          >
            {crossSvg}
          </span>
        )}
        <div
          className="search-button"
          onClick={() => {
            setIsFocused(false);
            setValue('');
            if (props.remoteSearch && props.onSearch) props.onSearch(value);
            if (props.onSearch && matchingValues.length) props.onSearch(matchingValues[0]);
          }}
        >
          {searchSvg}
        </div>
        {isFocused && matchingValues.length > 0 && (
          <div className="search-dropdown">
            {matchingValues.map((item, index) => {
              return (
                <div
                  key={index}
                  className="search-dropdown-item truncate"
                  onClick={() => {
                    setIsFocused(false);
                    setValue('');
                    if (props.onSearch && matchingValues.length) props.onSearch(item);
                  }}
                >
                  {props.displayTemplate && <span>{props.displayTemplate(item)}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ClickOutside>
  );
}

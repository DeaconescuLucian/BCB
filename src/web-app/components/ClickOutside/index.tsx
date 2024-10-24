import React, { useRef, useEffect } from 'react';

interface IClickProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
  exclude?: string;
  onClickOutside: (ev: MouseEvent) => void;
}

export default function ClickOutside(props: IClickProps) {
  const wrapperRef = useRef(null as null | HTMLDivElement);
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        if(props.exclude)
        {
          if(props.exclude !== event.srcElement.className) {
            props.onClickOutside(event);
          }
        }
        else 
        {
          if(event.srcElement.className !== 'image-container')
          {
            props.onClickOutside(event);
          }
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  });

  return (
    <span className={props.className} ref={wrapperRef}>
      {props.children}
    </span>
  );
}

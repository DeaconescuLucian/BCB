import React, { useRef, useEffect } from 'react';

interface IClickProps {
  children: JSX.Element | JSX.Element[];
  className?: string;
  onClickOutside: (ev: MouseEvent) => void;
}

export default function ClickOutside(props: IClickProps) {
  const wrapperRef = useRef(null as null | HTMLDivElement);
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        props.onClickOutside(event);
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

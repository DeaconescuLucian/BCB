import React, { useState, useEffect } from 'react';

interface ILoading {
  parentRef?: React.MutableRefObject<any>;
  text?: string;
}

const Loading = (props: ILoading) => {
  const [parentHeight, setParentHeight] = useState(0);
  const [parentBaseHeight, setParentBaseHeight] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    if (props.parentRef?.current) {
      setParentHeight(props.parentRef.current.scrollHeight);
      setParentBaseHeight(props.parentRef.current.offsetHeight);
      setScrollPosition(props.parentRef.current.scrollTop);
    }
  }, []);

  return (
    <div className="loading-spinner" style={{ height: `${parentHeight}px` }}>
      <div className="spinner-wrapper">
        <div
          className="spinner"
          style={{ marginTop: `${scrollPosition + Math.floor(parentBaseHeight / 2) - 32}px` }}
        ></div>
        {props.text && (
          <span style={{ marginTop: `${scrollPosition + Math.floor(parentBaseHeight / 2) - 32}px` }}>
            {props.text}
          </span>
        )}
      </div>
    </div>
  );
};

export default Loading;

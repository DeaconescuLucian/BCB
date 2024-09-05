import React, { useState } from 'react';
import { upSvg, downSvg } from '../../assets/svg';

interface ICollapse {
  collapseContent: JSX.Element | JSX.Element[];
  expandContent: JSX.Element | JSX.Element[];
  expandedByDefault: boolean;
}

const Collapse = (props: ICollapse) => {
  const [isExpanded, setIsExpanded] = useState(props.expandedByDefault);

  return (
    <div className="collapse-wrapper">
      {isExpanded ? props.expandContent : props.collapseContent}
      {isExpanded ? (
        <div
          className="collapse-button"
          onClick={() => {
            setIsExpanded(false);
          }}
        >
          {upSvg}
        </div>
      ) : (
        <div
          className="collapse-button"
          onClick={() => {
            setIsExpanded(true);
          }}
        >
          {downSvg}
        </div>
      )}
    </div>
  );
};

export default Collapse;

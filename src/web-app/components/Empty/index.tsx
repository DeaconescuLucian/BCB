import React from "react";
import { emptySvg } from "../../assets/svg/index.jsx";

interface IEmpty {
  text?: string;
}

function Empty(props: IEmpty) {

  return (
    <div className="empty-page">
        <div>{emptySvg}</div>
        <span>{props.text}</span>
    </div>
  );
}

export default Empty;

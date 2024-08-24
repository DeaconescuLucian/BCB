import React from "react";

interface IPageProps {
  children: any;
  hasTabstrip?: boolean;
}

export default function Page({ children, hasTabstrip }: IPageProps) {
  return (
    <div className="main-container">
      <div className="page-container">
        <div className={`page-content-container ${hasTabstrip ? 'page-with-tabstrip' : ''}`}>{children}</div>
      </div>
    </div>
  );
}

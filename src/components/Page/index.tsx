import React from "react";

interface IPageProps {
  children: any;
}

export default function Page({ children }: IPageProps) {
  return (
    <div className="main-container">
      <div className="page-container">
        <div className="page-content-container">{children}</div>
      </div>
    </div>
  );
}

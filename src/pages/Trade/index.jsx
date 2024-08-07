import React, {useRef, useEffect} from "react";
import fetch from "node-fetch";

function Trade() {
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const options = {
        method: "GET",
        headers: {
          "content-type": "application/json",
        },
      };
      fetch("http://localhost:5000/tokens", options)
        .then((response) => response.json())
        .then((response) => console.log(response))
        .catch((err) => console.error(err));
    }, 1000); 

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  },[])

  return (
    <div className="main-container">
      <h2>Trade Page</h2>
    </div>
  );
}

export default Trade;

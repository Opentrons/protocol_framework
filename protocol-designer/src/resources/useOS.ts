import { useState, useEffect } from "react";

export const useOS = () => {
  const [os, setOS] = useState<string | null>(null);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;

    if (userAgent.includes("Win")) {
      setOS("Windows");
    } else if (userAgent.includes("Mac")) {
      setOS("MacOS");
    } else if (userAgent.includes("Linux")) {
      setOS("Linux");
    } else {
      // smartphones, tablets and others
      setOS("Unknown");
    }
  }, []);

  return os;
};
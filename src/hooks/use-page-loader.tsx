import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export const usePageLoader = (minLoadTime: number = 800) => {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, minLoadTime);

    return () => clearTimeout(timer);
  }, [location.pathname, minLoadTime]);

  return isLoading;
};

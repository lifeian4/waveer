import { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import Preloader from "./Preloader";
import { usePageLoader } from "@/hooks/use-page-loader";

interface PageWrapperProps {
  children: ReactNode;
}

const PageWrapper = ({ children }: PageWrapperProps) => {
  const isLoading = usePageLoader(1000);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <Preloader />}
      </AnimatePresence>
      {children}
    </>
  );
};

export default PageWrapper;

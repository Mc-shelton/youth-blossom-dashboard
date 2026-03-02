import { createContext, useContext, useState, ReactNode } from "react";

type ModeContextType = {
  execMode: boolean;
  setExecMode: (v: boolean) => void;
};

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [execMode, setExecMode] = useState(false);
  return <ModeContext.Provider value={{ execMode, setExecMode }}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}

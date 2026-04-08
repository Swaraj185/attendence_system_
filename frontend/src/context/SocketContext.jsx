import { createContext, useContext } from "react";
import useSocket from "../hooks/useSocket";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketState = useSocket();
  return <SocketContext.Provider value={socketState}>{children}</SocketContext.Provider>;
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within SocketProvider");
  }
  return context;
}

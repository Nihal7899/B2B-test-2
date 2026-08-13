import { createContext, useContext, useRef, ReactNode } from 'react';

type BackHandler = () => boolean | void;

interface NavigationContextValue {
  registerBackHandler: (handler: BackHandler) => void;
  unregisterBackHandler: (handler: BackHandler) => void;
  triggerBack: () => boolean;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const handlersRef = useRef<BackHandler[]>([]);

  const registerBackHandler = (handler: BackHandler) => {
    handlersRef.current = [handler, ...handlersRef.current];
  };

  const unregisterBackHandler = (handler: BackHandler) => {
    handlersRef.current = handlersRef.current.filter(h => h !== handler);
  };

  const triggerBack = () => {
    const handler = handlersRef.current[0];
    if (handler) {
      const result = handler();
      return result !== false;
    }
    return false;
  };

  return (
    <NavigationContext.Provider value={{ registerBackHandler, unregisterBackHandler, triggerBack }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
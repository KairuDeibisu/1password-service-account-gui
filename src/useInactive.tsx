// TimeoutContext.tsx
import React, { createContext, ReactNode, useContext, useState } from "react";

interface TimeoutContextType {
    timeout: number;
    setTimeoutValue: (newTimeout: number) => void;
}

const TimeoutContext = createContext<TimeoutContextType | undefined>(undefined);

export const TimeoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [timeout, setTimeoutValue] = useState(15 * 60 * 1000); // Default to 15 minutes

    return (
        <TimeoutContext.Provider value={{ timeout, setTimeoutValue }}>
            {children}
        </TimeoutContext.Provider>
    );
};

export const useTimeout = (): TimeoutContextType => {
    const context = useContext(TimeoutContext);
    if (!context) {
        throw new Error("useTimeout must be used within a TimeoutProvider");
    }
    return context;
};

// useInactive.ts
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect } from "react";
import { useToast } from "./hooks/use-toast";

export function useInactive(timeout: number) {
    const [inactive, setInactive] = useState(false);
    const { toast } = useToast();

    const resetTimer = useCallback(() => {
        setInactive(false);
    }, []);

    const showWarningToast = useCallback(() => {
        toast({
          title: "Inactivity Warning",
          description: "The application will close in 5 minutes due to inactivity.",
          variant: "destructive",
        });
      }, [toast]);
    

    useEffect(() => {

        // Calculate warning time (5 minutes before timeout)


        const inactivityTimer = setTimeout(() => {
            setInactive(true);
        }, timeout);

        const handleActivity = () => {
            clearTimeout(inactivityTimer);
            resetTimer();
        };

        window.addEventListener("mousemove", handleActivity);
        window.addEventListener("keydown", handleActivity);
        window.addEventListener("click", handleActivity);

        return () => {
            clearTimeout(inactivityTimer);
            window.removeEventListener("mousemove", handleActivity);
            window.removeEventListener("keydown", handleActivity);
            window.removeEventListener("click", handleActivity);
        };
    }, [timeout, resetTimer, showWarningToast]);

    useEffect(() => {
        if (inactive) {
            const window = getCurrentWindow();
            window.close();
        }
    }, [inactive]);

    return { inactive, resetTimer };
}

// UserContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { invoke } from "@tauri-apps/api/core";

// Define the User type
interface User {
    created_at: string;
    email: string;
    last_auth_at: Date;
    name: string;
    updated_at: Date;
    user_type?: string;
}

// Define the context type
interface UserContextType {
    user: User | null;
    token: string;
    setToken: (token: string) => void;
    getMe: () => Promise<void>;
    setUser: (user: User | null) => void;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);
export const UserContextProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string>("");

    async function getMe() {
        try {
            const response = await invoke("get_me", { opServiceAccountToken: token }) as User;
            setUser(response);
        } catch (error) {
            console.error("Failed to fetch user:", error);
        }
    }

    return (
        <UserContext.Provider value={{ user, token, setToken, getMe, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUserContext must be used within a UserContextProvider");
    }
    return context;
};
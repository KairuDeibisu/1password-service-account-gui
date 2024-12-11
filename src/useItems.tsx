import { invoke } from "@tauri-apps/api/core";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { useUser } from "./useUser";

export interface Vault {
    id: string;
    name: string;
}

export interface Field {
    id: string;
    type: string;
    purpose?: string;
    label?: string;
    value?: string;
    reference?: string;
}

export interface Url {
    label: string;
    primary: boolean;
    href: string;
}

export interface VaultItem {
    id: string;
    title: string;
    version: number;
    vault: Vault;
    tags?: string[];
    category: string;
    last_edited_by: string;
    created_at: string;
    updated_at: string;
    additional_information?: string;
    urls?: Url[];
    fields?: Field[];
}

export interface ItemsContextType {
    items: VaultItem[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    fetchItems: () => Promise<void>;
    filteredItems: VaultItem[];
    setSelectedItem: (item: VaultItem | null) => void;
    selectedItem: VaultItem | null;
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export const ItemsProvider = ({ children }: { children: ReactNode }) => {
    const { token } = useUser();
    const [items, setItems] = useState<VaultItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const [filteredItems, setFilteredItems] = useState<VaultItem[]>(items);

    const fetchItems = async () => {
        try {
            const response = await invoke("get_items", {
                opServiceAccountToken: token,
                favorites: false,
                includeArchive: false,
            }) as Array<VaultItem>;

            setItems(response);
        } catch (error) {
            console.error("Failed to fetch items:", error);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    useEffect(() => {
        if (!workerRef.current) {
            workerRef.current = new Worker(new URL("./filterWorker.ts", import.meta.url), { type: "module" });
            
            workerRef.current.onmessage = (e: MessageEvent<VaultItem[]>) => {
                setFilteredItems(e.data);
            };
        }

        // Clean up on component unmount only
        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []);

    // Send `items` and `searchTerm` to the worker whenever they change
    useEffect(() => {
        if (workerRef.current) {
            workerRef.current.postMessage({ items, searchTerm });
        }
    }, [items, searchTerm]);
    

    return (
        <ItemsContext.Provider value={{ items, searchTerm, setSearchTerm, fetchItems, filteredItems, selectedItem, setSelectedItem }}>
            {children}
        </ItemsContext.Provider>
    );
};

export const useItems = () => {
    const context = useContext(ItemsContext);
    if (context === undefined) {
        throw new Error("useItems must be used within an ItemsProvider");
    }
    return context;
};
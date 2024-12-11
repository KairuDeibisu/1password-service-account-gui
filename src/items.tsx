import { invoke } from "@tauri-apps/api/core";
import { Clock, Edit, FileText, Tag, User, Vault } from "lucide-react";
import { TOTP } from "otpauth";
import { useEffect, useState } from "react";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { Progress } from "./components/ui/progress";
import { useItems } from "./useItems";
import { useUser } from "./useUser";

interface Vault {
    id: string;
    name: string;
}

interface Field {
    id: string;
    type: string;  // "STRING" or "CONCEALED"
    purpose?: string;  // "USERNAME", "PASSWORD", etc.
    label?: string;
    value?: string;
    reference?: string;
}

interface Url {
    label: string;
    primary: boolean;
    href: string;
}

interface VaultItem {
    id: string;
    title: string;
    version: number;
    vault: Vault;
    tags?: string[];
    category: string;  // Example: "LOGIN"
    last_edited_by: string;
    created_at: string;  // ISO format, e.g., "2022-09-16T23:14:55Z"
    updated_at: string;  // ISO format, e.g., "2022-09-16T23:14:55Z"
    additional_information?: string;
    urls?: Url[];
    fields?: Field[];
}

function Items() {

    const { token } = useUser();

    const { filteredItems, searchTerm, setSearchTerm, selectedItem, setSelectedItem, fetchItems } = useItems();
    const [open, setOpen] = useState(false);

    const [username, setUsername] = useState<Field | null>(null);
    const [password, setPassword] = useState<Field | null>(null);
    const [domain, setDomain] = useState<Field | null>(null);
    const [otp, setOTP] = useState<Field | null>(null);

    const [timeleft, setTimeleft] = useState<number | null>(null);

    const [code, setCode] = useState<string | null>(null);

    useEffect(() => {
        if (otp && otp.value) {
            const uri = new URL(otp.value);
            if (uri.protocol !== "otpauth:") return;
    
            const issuer = uri.searchParams.get("issuer");
            const label = uri.pathname;
            const algorithm = uri.searchParams.get("algorithm") ?? "SHA1";
            const secret = uri.searchParams.get("secret");
    
            if (!issuer || !label || !algorithm || !secret) return;
    
            const totp = new TOTP({
                issuer,
                label,
                digits: 6,
                period: 30,
                algorithm,
                secret
            });
    
            const intervalId = setInterval(() => {
                setCode(totp.generate());
                let seconds = totp.period - (Math.floor(Date.now() / 1000) % totp.period);
                setTimeleft(seconds);
            }, 1000); // Runs every second to update `timeleft` and generate code
    
            return () => clearInterval(intervalId);
        }
    }, [otp]);

    // when time is zero or less, update the code
    useEffect(() => {
        if (otp && otp.value) {
            const uri = new URL(otp.value);

            // check if it's a valid OTP URI
            if (uri.protocol !== "otpauth:") {
                return;
            }

            const issuer = uri.searchParams.get("issuer");
            const label = uri.searchParams.get("label");
            const algorithm = uri.searchParams.get("algorithm");
            const digits = parseInt(uri.searchParams.get("digits") ?? "6");
            const period = parseInt(uri.searchParams.get("period") ?? "30");
            const secret = uri.searchParams.get("secret");

            if (!issuer || !label || !algorithm || !digits || !period || !secret) {
                return;
            }

            const totp = new TOTP({
                issuer,
                label,
                algorithm,
                digits,
                period,
                secret
            });

            if (code !== totp.generate()) {
                setCode(totp.generate());
            }

        }
    }, [otp, timeleft]);


    useEffect(() => {
        if (selectedItem) {
            setOpen(true);
        }
    }, [selectedItem]);

    const handleCardClick = async (item: VaultItem) => {

        const response = await invoke("get_item", {
            opServiceAccountToken: token,
            itemId: item.id,
            vault: item.vault.id
        }) as VaultItem;

        setSelectedItem(response); // Fetch item details as needed
    };

    useEffect(() => {
        if (selectedItem) {

            const usernameField = selectedItem.fields?.find(
                (field) => field.id === "username"
            );

            const passwordField = selectedItem.fields?.find(
                (field) => field.id === "password"
            );

            const domainField = selectedItem.fields?.find(
                (field) => field?.label === "domain"
            );

            const otpField = selectedItem.fields?.find(
                (field) => field?.type === "OTP"
            );

            setUsername(usernameField ?? null);
            setPassword(passwordField ?? null);
            setDomain(domainField ?? null);
            setOTP(otpField ?? null);

            setOpen(true);
        }
    }, [selectedItem]);

    const [copiedField, setCopiedField] = useState<Field | null>(null);

    const copyToClipboard = (text: string, field: Field) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedField(field);
        });
    };

    useEffect(() => {
        fetchItems();
    }, []);



    return (
        <div className="flex flex-col items-center space-y-4 m-4">
            <Dialog open={open} onOpenChange={(props) => {
                setOpen(props);

                if (!props) {
                    setSelectedItem(null);
                }
            }}>

                <DialogContent className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>{selectedItem?.title}</DialogTitle>
                    </DialogHeader>
                    {username && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                {username.label}
                            </label>
                            <div className="flex items-center">
                                <Input
                                    type="text"
                                    value={username.value || ""}
                                    readOnly
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                />
                                <Button
                                    variant="ghost"
                                    onClick={() => copyToClipboard(username.value || '', username)}
                                >
                                    {copiedField?.id === 'username' ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                        </div>
                    )}
                    {password && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                {password.label}
                            </label>
                            <div className="flex items-center">
                                <Input
                                    type="password"
                                    value={password.value || ""}
                                    readOnly
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                />
                                <Button
                                    variant="ghost"
                                    onClick={() => copyToClipboard(password.value || '', password)}
                                >
                                    {copiedField?.id === password.id ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                        </div>
                    )}
                    {domain && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                {domain.label}
                            </label>
                            <div className="flex items-center">
                                <Input
                                    type="text"
                                    value={domain.value || ""}
                                    readOnly
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                />
                                <Button
                                    variant="ghost"
                                    onClick={() => copyToClipboard(domain.value || '', domain)}
                                >
                                    {copiedField?.id === domain.id ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                        </div>
                    )}
                    {otp && code && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                {otp.label}
                            </label>
                            <div className="flex space-y-4 items-center">
                                <Input
                                    type="text"
                                    value={code || ""}
                                    readOnly
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                />
                                <Button
                                    variant="ghost"
                                    onClick={() => copyToClipboard(code || '', otp)}
                                >
                                    {copiedField?.id === otp.id ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                            <Progress value={((timeleft ?? 30) / 30) * 100} max={100} />
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>

            </Dialog>

            <Input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 m-4 border rounded"
            />

            {filteredItems.length > 0 ? (
                 <div className="grid gap-4 grid-cols-1 lg:grid-cols-2  w-full max-w-7xl">
                {filteredItems.map((item) => (
                        <Card onClick={async () => await handleCardClick(item)} className="m-4 transition-shadow duration-300 ease-in-out hover:shadow-2xl" key={item.id}>
                            <CardHeader className="flex flex-col">
                                <CardTitle className="flex items-center gap-2 justify-between">
                                    <span className="truncate">{item.title}</span>
                                    <Badge variant="outline">{item.category}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <Vault className="w-4 h-4 mr-2" />
                                        <span className="text-sm">
                                            {item.vault && item.vault.name ? item.vault.name : 'Unknown Vault'}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <FileText className="w-4 h-4 mr-2" />
                                        <span className="text-sm">Version: {item.version}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {item.tags && item.tags.length > 0 && item.tags.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="text-xs">
                                                <Tag className="w-3 h-3 mr-1" />
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col items-start space-y-2 text-xs text-muted-foreground">
                                <div className="flex gap-2 items-center w-full justify-between">
                                    <span className="flex items-center">
                                        <User className="w-3 h-3 mr-1" />
                                        {item.last_edited_by}
                                    </span>
                                    <span className="flex items-center">
                                        <Edit className="w-3 h-3 mr-1" />
                                        {new Date(item.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Created: {new Date(item.created_at).toLocaleDateString()}
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <p>No items found</p>
            )}

            <Button onClick={async () => {
                await fetchItems();
            }}>Reload</Button>
        </div>

    );
}

export default Items;

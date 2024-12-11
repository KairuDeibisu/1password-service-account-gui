import { useState } from 'react'
import { LogOut, Settings, ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"



export interface PasswordManagerProfileProps {
    created_at?: string;
    email?: string;
    last_auth_at?: Date;
    name?: string;
    updated_at?: Date;
    user_type?: string;
    onLogout?: () => void
    onSecuritySettings?: () => void
}

export default function PasswordManagerProfile({
    name,
    // @ts-ignore - unused
    email,
    last_auth_at,
    onLogout = () => console.log("Logout clicked"),
    onSecuritySettings = () => console.log("Security settings clicked")
}: PasswordManagerProfileProps) {
    const [isOpen, setIsOpen] = useState(false)


    return (
        <Card className="w-full max-w-sm">
            <CardContent className="p-4">
                <p>Service Account</p>

                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" >
                        <p className="text-sm font-medium truncate">{name}</p>
                        <ChevronDown className="h-4 w-4 opacity-50" />



                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full max-w-sm p-0" align="start">
                        <div className="p-4 space-y-4">
                            <div className="space-y-1">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Last login</p>
                                <p className="text-sm font-medium">{last_auth_at?.toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                                {/* <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4" />
                  <p className="text-sm font-medium">{storedPasswords} stored passwords</p>
                </div> */}
                            </div>
                            <div className="flex space-x-2">
                                <Button onClick={onSecuritySettings} className="flex-1">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Security Settings
                                </Button>
                                <Button onClick={onLogout} variant="destructive" className="flex-1">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Log Out
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </CardContent>
        </Card>
    )
}
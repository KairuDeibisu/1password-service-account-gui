import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { useUser } from "./useUser";
import { Toaster } from "./components/ui/toaster";

function Header() {
    const { user, setUser } = useUser();

    return (
        <SidebarProvider>
            <header>
                <AppSidebar
                    user={user ? {
                        created_at: user.created_at,
                        email: user.email,
                        last_auth_at: user.last_auth_at,
                        name: user.name,
                        updated_at: user.updated_at,
                        onLogout: () => { setUser(null); },
                        onSecuritySettings: () => { /* handle security settings */ }
                    } : null}
                />
            </header>

            <main>
                <SidebarTrigger />
                <Outlet />
                <Toaster />
            </main>
        </SidebarProvider>
    );
}

export default Header;

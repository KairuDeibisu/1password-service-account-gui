import { useEffect, useState } from "react"
import { Home, Key } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import PasswordManagerProfile, { PasswordManagerProfileProps } from "./password-manager-profile"
import { Link } from "react-router-dom"

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
    requireAuth: false,
  },
  {
    title: "All Items",
    url: "/items",
    icon: Key,
    requireAuth: true,
  },
]

interface AppSidebarProps {
  user: PasswordManagerProfileProps | null
}

export function AppSidebar({ user }: AppSidebarProps) {

  const { state } = useSidebar()

  const [showProfile, setShowProfile] = useState(false);

  // Monitor sidebar state changes and update showProfile based on state
  useEffect(() => {
    if (state !== "collapsed" && user) {
      // Delay the display of profile slightly to allow the transition to finish
      const timeoutId = setTimeout(() => setShowProfile(true), 100);
      return () => clearTimeout(timeoutId);
    } else {
      setShowProfile(false);
    }
  }, [state, user]);

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {showProfile && (
                <SidebarMenuItem>
                  <PasswordManagerProfile {...user} />
                </SidebarMenuItem>
              )}
              {items
                .filter(item => !item.requireAuth || user) // Filter items based on authentication
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

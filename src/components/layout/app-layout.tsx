
"use client";

import type React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { mainNavItems, settingsNavItem } from '@/config/nav';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, MessageSquareText, Send } from 'lucide-react'; // Added Send icon
import { useToast } from "@/hooks/use-toast"; // Added useToast

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();

  const handleTelegramLogin = () => {
    toast({
      title: "Login con Telegram",
      description: "Questa funzionalità non è ancora implementata.",
    });
  };

  const handleLogout = () => {
    // Placeholder for logout functionality
    toast({
      title: "Logout",
      description: "Funzionalità di logout non ancora implementata.",
    });
  };

  return (
    <SidebarProvider defaultOpen={true} open={true}>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="p-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <MessageSquareText className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">TelePilot</h1>
          </Link>
           <div className="group-data-[collapsible=icon]:hidden"> {/* Placeholder to keep spacing when title is hidden */}
             {/* If you want a button here even when expanded, put it here */}
           </div>
        </SidebarHeader>
        <SidebarContent asChild>
          <ScrollArea className="h-full">
            <SidebarMenu className="px-2 py-2">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                    tooltip={{children: item.title, side: "right", className: "bg-card text-card-foreground"}}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter className="p-2">
           <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === settingsNavItem.href}
                  tooltip={{children: settingsNavItem.title, side: "right", className: "bg-card text-card-foreground"}}
                >
                  <Link href={settingsNavItem.href}>
                    <settingsNavItem.icon />
                    <span>{settingsNavItem.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
           </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
          <SidebarTrigger className="md:hidden" />
          <div className="ml-auto flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://placehold.co/100x100.png" alt="User avatar" data-ai-hint="user avatar" />
                    <AvatarFallback>TP</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Il Mio Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profilo</DropdownMenuItem>
                <DropdownMenuItem>Fatturazione</DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/settings">Impostazioni</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={handleTelegramLogin}>
                  <Send className="mr-2 h-4 w-4" />
                  <span>Accedi con Telegram</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

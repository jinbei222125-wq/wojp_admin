import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, Newspaper, Briefcase, FileText, LogOut, ChevronRight, Settings } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "./ui/button";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { adminTrpc } from "@/lib/adminTrpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "ダッシュボード", path: "/", description: "概要と統計" },
  { icon: Newspaper, label: "NEWS記事", path: "/news", description: "記事の管理" },
  { icon: Briefcase, label: "求人情報", path: "/jobs", description: "求人の管理" },
  { icon: FileText, label: "監査ログ", path: "/audit", description: "操作履歴" },
  { icon: Settings, label: "設定", path: "/settings", description: "アカウント設定" },
];

const SIDEBAR_WIDTH_KEY = "admin-sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 240;
const MAX_WIDTH = 400;

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, admin } = useAdminAuth();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();

  const logoutMutation = adminTrpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("ログアウトしました");
      setLocation("/login");
    },
  });

  useEffect(() => {
    if (!loading && !admin) {
      setLocation("/login");
    }
  }, [loading, admin, setLocation]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center animate-pulse">
            <span className="text-primary-foreground font-bold text-lg">W</span>
          </div>
          <p className="text-muted-foreground text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <ResizableSidebar
          sidebarWidth={sidebarWidth}
          setSidebarWidth={setSidebarWidth}
          admin={admin}
          onLogout={() => logoutMutation.mutate()}
        />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="flex h-16 items-center gap-4 border-b border-border/50 px-6 bg-background/80 backdrop-blur-sm">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="h-6 w-px bg-border" />
            <Breadcrumb />
          </header>
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function Breadcrumb() {
  const [location] = useLocation();
  const currentItem = menuItems.find((item) => item.path === location);
  
  return (
    <nav className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">管理画面</span>
      {currentItem && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          <span className="font-medium text-foreground">{currentItem.label}</span>
        </>
      )}
    </nav>
  );
}

function ResizableSidebar({
  sidebarWidth,
  setSidebarWidth,
  admin,
  onLogout,
}: {
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  admin: { name: string; email: string };
  onLogout: () => void;
}) {
  const [location] = useLocation();
  const { state } = useSidebar();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isResizing) {
      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, e.clientX));
        setSidebarWidth(newWidth);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, sidebarWidth, setSidebarWidth]);

  const sidebarStyle: CSSProperties =
    state === "expanded"
      ? {
          width: `${sidebarWidth}px`,
          minWidth: `${sidebarWidth}px`,
          maxWidth: `${sidebarWidth}px`,
        }
      : {};

  return (
    <Sidebar
      ref={sidebarRef}
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
      style={sidebarStyle}
    >
      <SidebarHeader className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-primary-foreground font-bold">W</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">W.O.JP</span>
            <span className="text-xs text-sidebar-foreground/50">Admin Panel</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-3 sidebar-scrollbar">
        <div className="mb-2 px-3 py-2">
          <span className="text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider">
            メニュー
          </span>
        </div>
        <SidebarMenu className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location === item.path;
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className={cn(
                    "h-11 px-3 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-primary/15 text-primary border-l-2 border-primary" 
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Link href={item.path}>
                    <item.icon className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-primary" : ""
                    )} />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{item.label}</span>
                      <span className={cn(
                        "text-xs",
                        isActive ? "text-primary/70" : "text-sidebar-foreground/40"
                      )}>
                        {item.description}
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-6 hover:bg-sidebar-accent rounded-lg transition-colors"
            >
              <Avatar className="h-9 w-9 border-2 border-primary/30">
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                  {admin.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left flex-1 min-w-0">
                <span className="text-sm font-medium text-sidebar-foreground truncate w-full">
                  {admin.name}
                </span>
                <span className="text-xs text-sidebar-foreground/50 truncate w-full">
                  {admin.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{admin.name}</p>
              <p className="text-xs text-muted-foreground">{admin.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                アカウント設定
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      {state === "expanded" && (
        <div
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors"
          onMouseDown={() => setIsResizing(true)}
        />
      )}
    </Sidebar>
  );
}

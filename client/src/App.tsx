import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewsManagement from "./pages/NewsManagement";
import JobsManagement from "./pages/JobsManagement";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";
import CategoryManagement from "./pages/CategoryManagement";
import AdminDashboardLayout from "./components/AdminDashboardLayout";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <AdminDashboardLayout>
          <Dashboard />
        </AdminDashboardLayout>
      </Route>
      <Route path="/news">
        <AdminDashboardLayout>
          <NewsManagement />
        </AdminDashboardLayout>
      </Route>
      <Route path="/jobs">
        <AdminDashboardLayout>
          <JobsManagement />
        </AdminDashboardLayout>
      </Route>
      <Route path="/audit">
        <AdminDashboardLayout>
          <AuditLogs />
        </AdminDashboardLayout>
      </Route>
      <Route path="/settings">
        <AdminDashboardLayout>
          <Settings />
        </AdminDashboardLayout>
      </Route>
      <Route path="/categories">
        <AdminDashboardLayout>
          <CategoryManagement />
        </AdminDashboardLayout>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

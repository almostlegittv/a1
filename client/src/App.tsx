/** SIGNAL RAID DESIGN REMINDER: retain a dark, broadcast-like canvas globally. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import BookingDashboard from "@/pages/BookingDashboard";
import CreatorManagement from "@/pages/CreatorManagement";
import AdminCreatorOnboarding from "./pages/AdminCreatorOnboarding";
import CreatorApplication from "./pages/CreatorApplication";
import AdminCreatorApplications from "./pages/AdminCreatorApplications";

function Router() {
  return (
    <Switch>
      <Route path="/" component={BookingDashboard} />
      <Route path="/home" component={Home} />
      <Route path="/booking" component={BookingDashboard} />
      <Route path="/booking/:creatorSlug" component={BookingDashboard} />
      <Route path="/creator" component={CreatorManagement} />
      <Route path="/admin/onboard" component={AdminCreatorOnboarding} />
      <Route path="/apply/creator" component={CreatorApplication} />
      <Route path="/admin/applications" component={AdminCreatorApplications} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" position="bottom-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

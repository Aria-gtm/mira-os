import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MiraProvider } from "./contexts/MiraContext";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Prototype from "./pages/Prototype";
import DailyGoals from "./pages/DailyGoals";
import Dashboard from "./pages/Dashboard";
import MiraOS from "./pages/MiraOS";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/os"} component={MiraOS} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/onboarding"} component={Onboarding} />
      <Route path={"/prototype"} component={Prototype} />
      <Route path={"/goals"} component={DailyGoals} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <MiraProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </MiraProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

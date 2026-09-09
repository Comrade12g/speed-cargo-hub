import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Consolidation from "@/pages/Consolidation";
import Dashboard from "@/pages/Dashboard";
import Index from "@/pages/Index";
import Intake from "@/pages/Intake";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Staff from "@/pages/Staff";
import Voyages from "@/pages/Voyages";

const queryClient = new QueryClient();

export default function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><LanguageProvider><AuthProvider><Sonner position="top-right" richColors /><BrowserRouter><Routes>
    <Route path="/" element={<Index />} />
    <Route path="/tracking" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
      <Route index element={<Dashboard />} />
      <Route path="intake" element={<Intake />} />
      <Route path="consolidation" element={<ProtectedRoute adminOnly><Consolidation /></ProtectedRoute>} />
      <Route path="voyages" element={<ProtectedRoute adminOnly><Voyages /></ProtectedRoute>} />
      <Route path="staff" element={<ProtectedRoute adminOnly><Staff /></ProtectedRoute>} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes></BrowserRouter></AuthProvider></LanguageProvider></TooltipProvider></QueryClientProvider>;
}

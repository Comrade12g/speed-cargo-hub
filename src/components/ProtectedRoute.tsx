import { Navigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f3f7fb]"><LoaderCircle className="size-8 animate-spin text-[#ed1c2a]" /></div>;
  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return <div className="grid min-h-screen place-items-center p-6 text-center"><p>Your account profile is not ready. Please contact an administrator.</p></div>;
  if (adminOnly && profile.role !== "ops_admin") return <Navigate to="/app" replace />;
  return children;
}

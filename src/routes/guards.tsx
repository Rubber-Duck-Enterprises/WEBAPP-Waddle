import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function PublicRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function AnyUserRoute({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  if (loading) return null;
  return <>{children}</>;
}

export function AuthOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function ProRoute({ children }: { children: React.ReactNode }) {
  const { user, isPro, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isPro) return <Navigate to="/upgrade" replace />;
  return <>{children}</>;
}
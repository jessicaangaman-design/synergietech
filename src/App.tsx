import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { SWRConfig } from "swr";

import { AppLayout } from "@/components/AppLayout";
import { Toaster } from "@/components/ui/sonner";
import { getAuthToken } from "@/lib/auth/token-storage";
import Router from './Router/globalRoute'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuth from "./hooks/authUser";
import axios from "axios";
import Loading from "./components/loading";


function PageLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Chargement…
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

export default function App() {
  const { loginPending, loginOnStart } = useAuth();

  useEffect(() => {
    loginOnStart();
  }, []);

  const fetcher = (url: string) => {
    const token = localStorage.getItem("token");

    return axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then(res => res.data);
  };

  if (loginPending) {
    return <Loading />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        }}
      >
        <Router />
        <Toaster richColors position="bottom-right" closeButton />
      </SWRConfig>
    </QueryClientProvider>
  );
}
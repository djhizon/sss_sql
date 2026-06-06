import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        navigate({ to: "/auth", replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center bg-sss-bg font-sans">
      <div className="w-16 h-16 border-4 border-sss-navy border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }
  return <Outlet />;
}

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

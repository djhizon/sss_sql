import { Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import sssLogo from "@/assets/SSS_logo.svg";

interface Props {
  user?: { email?: string | null } | null;
  isAdmin?: boolean;
}

export function SssHeader({ user, isAdmin }: Props) {
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="no-print">
      {/* Top navy band */}
      <div className="bg-sss-navy-dark text-white text-xs">
        <div className="max-w-6xl mx-auto px-4 py-1.5 flex justify-between items-center">
          <span className="opacity-90">Republic of the Philippines</span>
          <div className="flex gap-4 items-center">
            {user ? (
              <>
                <span className="opacity-80 hidden sm:inline">{user.email}</span>
                <button onClick={signOut} className="underline hover:opacity-80">
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <Link to="/auth" className="hover:underline">
                  Sign In
                </Link>
                <Link to="/auth" className="hover:underline">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main brand band */}
      <div className="bg-sss-navy text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <img src={sssLogo} alt="SSS seal" className="h-14 w-14 bg-white rounded-sm p-1" />
          <div className="flex-1">
            <div className="text-[10px] tracking-widest uppercase opacity-80">
              Republic of the Philippines
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Social Security System</h1>
            <div className="text-xs opacity-90">Member Services Portal</div>
          </div>
          {user && (
            <nav className="hidden md:flex gap-1 text-sm">
              <Link
                to="/dashboard"
                className="px-3 py-2 hover:bg-white/10 rounded"
                activeProps={{ className: "px-3 py-2 bg-white/15 rounded font-semibold" }}
              >
                My Applications
              </Link>
              <Link
                to="/apply"
                className="px-3 py-2 hover:bg-white/10 rounded"
                activeProps={{ className: "px-3 py-2 bg-white/15 rounded font-semibold" }}
              >
                Apply
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="px-3 py-2 hover:bg-white/10 rounded"
                  activeProps={{ className: "px-3 py-2 bg-white/15 rounded font-semibold" }}
                >
                  Admin
                </Link>
              )}
              <Link
                to="/settings"
                className="px-3 py-2 hover:bg-white/10 rounded"
                activeProps={{ className: "px-3 py-2 bg-white/15 rounded font-semibold" }}
              >
                Settings
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}

export function SssFooter() {
  return (
    <footer className="no-print mt-12 border-t bg-sss-navy-dark text-white/80 text-xs">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-end gap-2">
        <span>SSS Copyright © 2026</span>
      </div>
    </footer>
  );
}

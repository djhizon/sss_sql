import { useState } from "react";
import { Link, useRouter, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import sssLogo from "@/assets/SSS_logo.svg";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";

interface Props {
  user?: { email?: string | null } | null;
  isAdmin?: boolean;
}

export function SssHeader({ user, isAdmin }: Props) {
  const router = useRouter();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      <div className="bg-sss-navy text-white relative">
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
            <>
              {/* Desktop Nav */}
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

              {/* Mobile Nav Toggle */}
              <button 
                className="md:hidden p-2 rounded hover:bg-white/10 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </>
          )}
        </div>

        {/* Mobile Nav Menu */}
        {user && isMenuOpen && (
          <nav className="md:hidden flex flex-col bg-sss-navy-dark text-sm border-t border-white/10 absolute w-full left-0 z-50 shadow-xl">
            <Link
              to="/dashboard"
              className="px-6 py-4 hover:bg-white/10 border-b border-white/5 transition-colors"
              activeProps={{ className: "px-6 py-4 bg-white/10 font-semibold border-b border-white/5" }}
              onClick={() => setIsMenuOpen(false)}
            >
              My Applications
            </Link>
            <Link
              to="/apply"
              className="px-6 py-4 hover:bg-white/10 border-b border-white/5 transition-colors"
              activeProps={{ className: "px-6 py-4 bg-white/10 font-semibold border-b border-white/5" }}
              onClick={() => setIsMenuOpen(false)}
            >
              Apply
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="px-6 py-4 hover:bg-white/10 border-b border-white/5 transition-colors"
                activeProps={{ className: "px-6 py-4 bg-white/10 font-semibold border-b border-white/5" }}
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </Link>
            )}
            <Link
              to="/settings"
              className="px-6 py-4 hover:bg-white/10 transition-colors"
              activeProps={{ className: "px-6 py-4 bg-white/10 font-semibold" }}
              onClick={() => setIsMenuOpen(false)}
            >
              Settings
            </Link>
          </nav>
        )}
      </div>

      {/* Main Tab Navigation Band */}
      {user && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 flex gap-1 pt-3">
            {[
              { to: "/dashboard", label: "My Applications" },
              { to: "/apply", label: "Apply" },
              ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
              { to: "/settings", label: "Settings" }
            ].map((link) => {
              const isActive = location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative px-5 py-3 text-sm font-bold transition-colors rounded-t-lg
                    ${isActive 
                      ? "bg-white text-[#1a365d]" 
                      : "text-gray-500 hover:text-gray-700 bg-transparent"
                    }
                  `}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="mainNavIndicator"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-[#e09f3e]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
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

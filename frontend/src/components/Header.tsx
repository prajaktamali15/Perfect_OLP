import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useSearch } from "../context/SearchContext";

export default function Header() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { query, setQuery } = useSearch();

  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));
      setRole(localStorage.getItem("role"));
      setName(localStorage.getItem("name"));
      setEmail(localStorage.getItem("email"));

      if (localStorage.getItem("token")) {
        switch (localStorage.getItem("role")) {
          case "STUDENT":
            router.push("/student/dashboard");
            break;
          case "INSTRUCTOR":
            router.push("/instructor/dashboard");
            break;
          case "ADMIN":
            router.push("/admin/dashboard");
            break;
          default:
            break;
        }
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => setDropdownOpen(!dropdownOpen);
  const handleLogin = () => router.push("/auth/login");
  const handleSignup = () => router.push("/auth/register");
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    setToken(null);
    setRole(null);
    router.push("/");
  };

  const redirectDashboard = () => {
    if (!role) return;
    switch (role) {
      case "STUDENT":
        router.push("/student/dashboard");
        break;
      case "INSTRUCTOR":
        router.push("/instructor/dashboard");
        break;
      case "ADMIN":
        router.push("/admin/dashboard");
        break;
      default:
        router.push("/");
    }
  };

  return (
    <nav className="sticky top-0 bg-white shadow z-50">
      <div className="container flex items-center justify-between py-3">
        {/* Logo / Brand */}
        <span
          className="text-2xl font-bold text-blue-600 cursor-pointer tracking-tight"
          onClick={() => router.push("/")}
        >
          E-Learning
        </span>

        {/* Search + Profile Section */}
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search courses or instructors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-[280px] max-w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder-gray-400"
          />

          <div className="relative" ref={dropdownRef}>
            <img
              src="/profile.png"
              alt="Profile"
              className="w-10 h-10 rounded-full border border-gray-200 shadow-sm cursor-pointer hover:opacity-90 transition"
              onClick={handleProfileClick}
            />

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg p-2 z-50 transition-all duration-150">
                {token ? (
                  <>
                    <div className="mb-2 border-b border-gray-200 pb-2 text-sm">
                      <p className="font-semibold text-gray-800 truncate">{name}</p>
                      <p className="text-gray-500 truncate">{email}</p>
                      <p className="text-gray-400 text-xs">{role}</p>
                    </div>
                    <button
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition"
                      onClick={redirectDashboard}
                    >
                      Dashboard
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition"
                      onClick={handleLogin}
                    >
                      Login
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition"
                      onClick={handleSignup}
                    >
                      Signup
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

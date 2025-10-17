import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useSearch } from "../context/SearchContext";

export default function StudentHeader() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { query, setQuery } = useSearch();

  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<string>("/profile.png");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));
      setName(localStorage.getItem("name"));
      setEmail(localStorage.getItem("email"));
      const storedProfile = localStorage.getItem("profile");
      if (storedProfile) setProfile(storedProfile);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedProfile = localStorage.getItem("profile");
      if (updatedProfile) setProfile(updatedProfile);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
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
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    localStorage.removeItem("profile");
    router.push("/auth/login");
  };
  const handleEditProfile = () => router.push("/student/profile");

  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-white/90 border-b border-gray-400 shadow-sm">
      <div className="container mx-auto px-4 flex items-center justify-between py-3">
        {/* Brand */}
        <span
          className="text-2xl font-semibold text-indigo-600 tracking-tight cursor-pointer hover:text-indigo-700 transition"
          onClick={() => router.push("/student/dashboard")}
        >
          E-Learning
        </span>

        {/* Search + Nav + Profile */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Search courses..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-400 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition outline-none"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1016.65 16.65z" />
            </svg>
          </div>

          {/* Nav Links */}
          <button
            className="text-gray-700 font-medium hover:text-indigo-600 transition"
            onClick={() => router.push("/student/dashboard")}
          >
            Home
          </button>

          <button
            className="text-gray-700 font-medium hover:text-indigo-600 transition"
            onClick={() => router.push("/student/courses/my-courses")}
          >
            My Courses
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <img
              src={profile}
              alt="Profile"
              className="rounded-full w-10 h-10 border-2 border-indigo-400 hover:border-indigo-400 cursor-pointer transition"
              onClick={handleProfileClick}
            />

            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-60 bg-white rounded-lg shadow-xl border border-gray-100 z-50 animate-fadeIn">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm">{name || "Student"}</p>
                  <p className="text-xs text-gray-500 truncate">{email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={handleEditProfile}
                    className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-indigo-50 text-gray-700"
                  >
                    ✏️ Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-red-50 text-red-600"
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

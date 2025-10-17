import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "../context/UserContext";
import { useSearch } from "../context/SearchContext";

export default function InstructorHeader() {
  const router = useRouter();
  const user = useUser();
  const { query, setQuery } = useSearch();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));
      setName(localStorage.getItem("name"));
      setEmail(localStorage.getItem("email"));
      setProfile(localStorage.getItem("profile"));
    }
  }, []);

  useEffect(() => {
    const handleStorage = () => setProfile(localStorage.getItem("profile"));
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
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
    localStorage.clear();
    router.push("/");
  };
  const handleEditProfile = () => router.push("/instructor/ProfilePage");

  return (
    <nav className="sticky top-0 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 z-50">
      <div className="container mx-auto flex items-center justify-between px-6 py-3">
        {/* Brand */}
        <span
          className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent cursor-pointer hover:opacity-90 transition"
          onClick={() => router.push("/instructor/dashboard")}
        >
          E-Learning
        </span>

        {/* Right Section */}
        <div className="flex items-center gap-5">
          {/* Search */}
          <div className="relative group">
            <input
              type="text"
              placeholder="Search courses..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-48 group-focus-within:w-64 transition-all duration-300 border border-gray-300 rounded-lg px-4 py-2 pl-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.2-5.2m2.4-4.8a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Notification Icon */}
          <button className="relative hover:bg-gray-100 p-2 rounded-full transition">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14V10a6 6 0 00-12 0v4c0 .386-.146.757-.405 1.06L4 17h5m6 0a3 3 0 11-6 0h6z" />
            </svg>
            {/* Notification dot */}
            <span className="absolute top-2 right-2 block w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <img
              src={profile || user?.profile || "/profile.png"}
              alt="Profile"
              className="rounded-full w-10 h-10 cursor-pointer border border-gray-300 hover:border-indigo-400 shadow-sm hover:shadow-md transition"
              onClick={handleProfileClick}
            />

            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 rounded-xl bg-white border border-gray-200 shadow-xl ring-1 ring-gray-100 overflow-hidden transition-all z-50">
                {/* Header */}
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {name || user?.name || "Instructor"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{email || user?.email || ""}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col py-1">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                    onClick={handleEditProfile}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h2m2 0h2m-4 0h2m-6 4h2m2 0h2m-6 0h2m2 0h2m-8 4h2m2 0h2m-8 0h2m2 0h2m4 4H8" />
                    </svg>
                    Edit Profile
                  </button>

                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 11-4 0v-1" />
                    </svg>
                    Logout
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

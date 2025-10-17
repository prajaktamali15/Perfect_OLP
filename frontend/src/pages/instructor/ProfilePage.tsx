"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import InstructorHeader from "../../components/InstructorHeader";
import { API_BASE_URL, getInstructorAnalytics } from "../../lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type CourseAnalytics = {
  courseId: number;
  title: string;
  totalStudents: number;
  completionRate: number;
  lessonsCount: number;
};

export default function InstructorProfilePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [profile, setProfile] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeOption, setActiveOption] = useState<
    "photo" | "info" | "password" | "stats"
  >("photo");

  const [analytics, setAnalytics] = useState<CourseAnalytics[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // -----------------------------
  // Load profile from localStorage
  // -----------------------------
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      const storedName = localStorage.getItem("name");
      const storedEmail = localStorage.getItem("email");
      const storedRole = localStorage.getItem("role");
      const storedProfile = localStorage.getItem("profile");
      const storedBio = localStorage.getItem("bio");

      if (!storedToken) {
        router.push("/auth/login");
        return;
      }

      setToken(storedToken);
      setName(storedName || "");
      setEmail(storedEmail || "");
      setRole(storedRole || "");
      setProfile(storedProfile || null);
      setBio(storedBio || "");
      setLoading(false);
    }
  }, []);

  // -----------------------------
  // Save profile info (name & bio)
  // -----------------------------
  const handleSaveProfile = async () => {
    if (!token) return;
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, bio, profile }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      localStorage.setItem("name", name);
      localStorage.setItem("bio", bio);
      setMessage("✅ Profile updated successfully!");
    } catch (err: any) {
      setMessage(`⚠️ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // Change password
  // -----------------------------
  const handleChangePassword = async () => {
    if (!token) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("⚠️ Please fill all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("⚠️ New password and confirm password do not match.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/users/me/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to change password");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("✅ Password changed successfully!");
    } catch (err: any) {
      setMessage(`⚠️ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // Profile photo handlers
  // -----------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewSrc(URL.createObjectURL(file));
    }
  };

  const handleUploadPhoto = async () => {
    if (!token || !selectedFile) return;

    setSaving(true);
    setMessage("");

    const formData = new FormData();
    formData.append("photo", selectedFile);

    try {
      const res = await fetch(`${API_BASE_URL}/users/me/photo`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload photo");

      const path = data?.path || "";
      const fullPath = path ? `${API_BASE_URL}/${path}?t=${Date.now()}` : profile;

      if (fullPath) {
        setProfile(fullPath);
        localStorage.setItem("profile", fullPath);
      }

      setPreviewSrc(null);
      setSelectedFile(null);
      setMessage("✅ Profile photo updated successfully!");
    } catch (err: any) {
      setMessage(`⚠️ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // Load Analytics
  // -----------------------------
  const loadAnalytics = async () => {
    if (!token) return;
    setLoadingAnalytics(true);
    try {
      const data = await getInstructorAnalytics(token);
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (activeOption === "stats") loadAnalytics();
  }, [activeOption]);

  if (loading) return <p className="p-4">Loading profile...</p>;

  return (
    <>
      {/* Header with visible bottom border and shadow */}
      <div className="border-b border-gray-400 shadow-sm">
        <InstructorHeader />
      </div>

      <div className="container mx-auto py-10 px-4 md:px-16">
        {message && (
          <div className="mb-4 p-4 rounded-lg bg-blue-100 text-blue-700 border border-blue-200">
            {message}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-1/4 flex-shrink-0 space-y-2">
            <div className="text-center mb-4">
              <img
                src={profile || "/profile.png"}
                alt="Profile"
                className="rounded-full mx-auto border-2 border-gray-400 w-20 h-20"
              />
            </div>
            {[
              { key: "photo", label: "Profile Photo" },
              { key: "info", label: "Profile Information" },
              { key: "password", label: "Change Password" },
              { key: "stats", label: "Statistics" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveOption(item.key as any)}
                className={`w-full text-left px-4 py-2 rounded-lg border transition-colors ${
                  activeOption === item.key
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold"
                    : "border-gray-400 bg-white text-gray-800 hover:bg-gray-50 hover:text-indigo-600"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Panel */}
          <div className="md:w-3/4 flex-1 space-y-6">
            {/* Profile Photo */}
            {activeOption === "photo" && (
              <div className="bg-white border border-gray-400 rounded-2xl shadow p-6">
                <h5 className="text-xl font-semibold mb-4 border-b border-gray-300 pb-2">
                  Profile Photo
                </h5>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={previewSrc || profile || "/profile.png"}
                    alt="Profile"
                    className="rounded-full border w-20 h-20"
                  />
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                </div>
                <button
                  onClick={handleUploadPhoto}
                  disabled={saving || !selectedFile}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  {saving ? "Uploading..." : "Upload Photo"}
                </button>
              </div>
            )}

            {/* Profile Info */}
            {activeOption === "info" && (
              <div className="bg-white border border-gray-400 rounded-2xl shadow p-6 space-y-4">
                <h5 className="text-xl font-semibold border-b border-gray-300 pb-2">
                  Profile Information
                </h5>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-400 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full border border-gray-400 rounded-lg px-4 py-2 bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-400 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}

            {/* Password */}
            {activeOption === "password" && (
              <div className="bg-white border border-gray-400 rounded-2xl shadow p-6 space-y-4">
                <h5 className="text-xl font-semibold border-b border-gray-300 pb-2">
                  Change Password
                </h5>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full border border-gray-400 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-400 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-400 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  {saving ? "Updating..." : "Change Password"}
                </button>
              </div>
            )}

            {/* Analytics */}
            {activeOption === "stats" && (
              <div className="bg-white border border-gray-400 rounded-2xl shadow p-6 space-y-4">
                <h5 className="text-xl font-semibold border-b border-gray-300 pb-2">
                  Course Statistics
                </h5>
                {loadingAnalytics ? (
                  <p>Loading analytics...</p>
                ) : analytics.length === 0 ? (
                  <p>You have not created any courses yet.</p>
                ) : (
                  <>
                    <div className="w-full h-80">
                      <ResponsiveContainer>
                        <BarChart data={analytics}>
                          <XAxis dataKey="title" />
                          <YAxis yAxisId="left" orientation="left" />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={[0, 100]}
                            tickFormatter={(v: number) => `${v}%`}
                          />
                          <Tooltip
                            formatter={(value: number, name: string) =>
                              name === "completionRate"
                                ? `${value.toFixed(2)}%`
                                : value
                            }
                          />
                          <Legend />
                          <Bar
                            yAxisId="left"
                            dataKey="totalStudents"
                            name="Enrollments"
                            fill="#8884d8"
                          />
                          <Bar
                            yAxisId="right"
                            dataKey="completionRate"
                            name="Completion %"
                            fill="#82ca9d"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <h6 className="text-lg font-semibold mt-4">Per-Course Analytics</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      {analytics.map((course) => (
                        <div
                          key={course.courseId}
                          className="bg-white border border-gray-400 rounded-xl shadow-sm p-4"
                        >
                          <h6 className="font-semibold">{course.title}</h6>
                          <p>Total Enrollments: {course.totalStudents}</p>
                          <p>Completion Rate: {course.completionRate.toFixed(2)}%</p>
                          <p>Lessons: {course.lessonsCount}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

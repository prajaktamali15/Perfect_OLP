"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "../../components/StudentHeader";
import { API_BASE_URL } from "../../lib/api";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CourseStats {
  title: string;
  progress: number;
}

export default function StudentProfilePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [profile, setProfile] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeOption, setActiveOption] = useState<
    "photo" | "info" | "password" | "statistics"
  >("photo");

  const [stats, setStats] = useState<CourseStats[]>([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

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

      fetchStatistics(storedToken);
    }
  }, []);

  const fetchStatistics = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/enrollments/my-courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch courses");

      const courses: CourseStats[] = data.data.map((c: any) => ({
        title: c.title,
        progress: c.progress,
      }));

      setStats(courses);
      setEnrolledCount(courses.length);
      setCompletedCount(courses.filter((c) => c.progress >= 100).length);
    } catch (err: any) {
      console.error("Failed to fetch statistics:", err);
    }
  };

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
        body: JSON.stringify({ name, bio }),
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

      const path = data.path.startsWith("/") ? data.path.substring(1) : data.path;
      const fullPath = `${API_BASE_URL}/${path}?t=${Date.now()}`;
      setProfile(fullPath);
      localStorage.setItem("profile", fullPath);

      setPreviewSrc(null);
      setSelectedFile(null);
      setMessage("✅ Profile photo updated successfully!");
    } catch (err: any) {
      setMessage(`⚠️ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6 text-center text-gray-600">Loading profile...</p>;

  const barData = {
    labels: stats.map((c) => c.title),
    datasets: [
      {
        label: "Progress %",
        data: stats.map((c) => c.progress),
        backgroundColor: "rgba(79, 70, 229, 0.6)",
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Course Progress", font: { size: 18 } },
    },
    scales: { y: { beginAtZero: true, max: 100 } },
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-6 md:px-12">
        {message && (
          <div className="max-w-3xl mx-auto mb-6 text-center text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-400 rounded-lg p-3">
            {message}
          </div>
        )}

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-1/4 bg-white rounded-2xl shadow-sm border border-gray-400 p-6">
            <div className="text-center mb-6">
              <img
                src={profile || "/profile.png"}
                alt="Profile"
                className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-indigo-500"
              />
              <h3 className="mt-3 font-semibold text-gray-800">{name}</h3>
              <p className="text-sm text-gray-500">{role}</p>
            </div>

            <div className="flex flex-col space-y-2">
              {["photo", "info", "password", "statistics"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setActiveOption(opt as any)}
                  className={`text-left px-4 py-2 rounded-lg font-medium transition ${
                    activeOption === opt
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {opt === "photo"
                    ? "Profile Photo"
                    : opt === "info"
                    ? "Profile Information"
                    : opt === "password"
                    ? "Change Password"
                    : "Statistics"}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <section className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-400 p-6">
            {activeOption === "statistics" && (
              <div>
                <h5 className="text-xl font-semibold text-gray-800 mb-4">
                  Your Course Statistics
                </h5>
                <p>
                  <strong>Total Enrolled:</strong> {enrolledCount}
                </p>
                <p className="mb-4">
                  <strong>Completed:</strong> {completedCount}
                </p>
                {stats.length > 0 ? (
                  <Bar data={barData} options={barOptions} />
                ) : (
                  <p className="text-gray-500">No course data available.</p>
                )}
              </div>
            )}

            {activeOption === "photo" && (
              <div>
                <h5 className="text-xl font-semibold text-gray-800 mb-4">
                  Profile Photo
                </h5>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={previewSrc || profile || "/profile.png"}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-sm text-gray-600"
                  />
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

            {activeOption === "info" && (
              <div>
                <h5 className="text-xl font-semibold text-gray-800 mb-4">
                  Profile Information
                </h5>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-400 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      disabled
                      className="w-full border border-gray-400 rounded-lg px-4 py-2 bg-gray-100 text-gray-600"
                      value={email}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Bio
                    </label>
                    <textarea
                      rows={4}
                      className="w-full border border-gray-400 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
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
              </div>
            )}

            {activeOption === "password" && (
              <div>
                <h5 className="text-xl font-semibold text-gray-800 mb-4">
                  Change Password
                </h5>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="w-full border border-gray-400 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="w-full border border-gray-400 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="w-full border border-gray-400 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

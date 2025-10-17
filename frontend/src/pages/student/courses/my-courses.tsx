"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import StudentHeader from "../../../components/StudentHeader";
import { getMyCourses, Course } from "../../../lib/api";
import { useSearch } from "../../../context/SearchContext";
import { useProgress } from "../../../context/ProgressContext";
import axios from "axios";
import classNames from "classnames";

interface DashboardCourse {
  id: number;
  title: string;
  description: string | null;
  instructor?: {
    id: number;
    name: string;
    email: string;
  } | null;
  enrolled: boolean;
  progress: number;
  certificateUrl: string | null;
}

interface CertificateResponse {
  success: boolean;
  certificateUrl: string;
}

const API_BASE_URL = "http://localhost:4000";

export default function MyCoursesPage() {
  const router = useRouter();
  const { query: search } = useSearch();
  const { progressMap } = useProgress();

  const [token, setToken] = useState<string | null>(null);
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);

  // Load token & role
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      if (!storedToken || role !== "STUDENT") {
        router.replace("/auth/login");
        return;
      }
      setToken(storedToken);
    }
  }, [router]);

  // Fetch courses
  useEffect(() => {
    if (!token) return;

    const fetchCourses = async () => {
      setLoading(true);
      try {
        const myCourses: any[] = await getMyCourses(token);
        const mergedCourses: DashboardCourse[] = myCourses.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description ?? null,
          instructor: c.instructor
            ? {
                id: c.instructor.id,
                name: c.instructor.name ?? "",
                email: c.instructor.email ?? "",
              }
            : null,
          enrolled: true,
          progress: c.progress ?? 0,
          certificateUrl: c.certificateUrl ?? null,
        }));
        setCourses(mergedCourses);
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [token]);

  // Sync progress context
  useEffect(() => {
    if (!progressMap || courses.length === 0) return;
    setCourses((prev) =>
      prev.map((c) =>
        c.enrolled && progressMap[c.id] !== undefined
          ? { ...c, progress: progressMap[c.id] }
          : c
      )
    );
  }, [progressMap]);

  const handleExpand = (id: number) =>
    setExpandedCourseId(expandedCourseId === id ? null : id);

  const handleContinue = (id: number) => router.push(`/student/courses/${id}`);

  const handleGenerateCertificate = async (course: DashboardCourse) => {
    if (!token) return;
    try {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, certificateUrl: "LOADING" } : c
        )
      );

      const res = await axios.patch<CertificateResponse>(
        `${API_BASE_URL}/enrollments/course/${course.id}/generate-certificate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const certUrl = `${API_BASE_URL}${res.data.certificateUrl}`;
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, certificateUrl: certUrl } : c
        )
      );

      window.open(certUrl, "_blank");
    } catch (err: any) {
      console.error(err);
      alert(
        err?.response?.data?.message ||
          err.message ||
          "Failed to generate certificate"
      );
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, certificateUrl: null } : c
        )
      );
    }
  };

  if (loading)
    return (
      <p className="p-8 text-center text-gray-600 text-lg">
        ⏳ Loading your courses...
      </p>
    );

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <StudentHeader />

      {/* Page Header */}
      <div className="text-center py-10 px-6">
        <h2 className="text-4xl font-bold text-indigo-700 mb-3">🎓 My Courses</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Continue your learning journey, track progress, and download
          certificates for completed courses.
        </p>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto pb-16 px-6">
        {filteredCourses.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">
            No courses found matching your search.
          </p>
        ) : (
          <div className="space-y-6">
            {filteredCourses.map((course) => {
              const isExpanded = expandedCourseId === course.id;
              return (
                <div
                  key={course.id}
                  className={classNames(
                    "bg-white border border-gray-400 rounded-2xl shadow-sm hover:shadow-md transition-all duration-400 cursor-pointer overflow-hidden",
                    { "ring-2 ring-indigo-400": isExpanded }
                  )}
                  onClick={() => handleExpand(course.id)}
                >
                  <div className="flex justify-between items-center p-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {course.instructor?.name
                          ? `👨‍🏫 ${course.instructor.name}`
                          : "Instructor: Unknown"}
                      </p>
                    </div>
                    <span
                      className={classNames(
                        "px-3 py-1 text-xs font-semibold rounded-full",
                        course.progress === 100
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      )}
                    >
                      {course.progress === 100 ? "Completed" : "Enrolled"}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-6">
                      <p className="text-gray-700 mb-2">
                        {course.description || "No description available."}
                      </p>

                      {/* Progress Bar */}
                      <div className="mt-3 mb-5">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-sm font-medium text-gray-700">
                            Progress
                          </label>
                          <span className="text-sm font-semibold text-indigo-600">
                            {course.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-400 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-2.5 transition-all duration-500"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContinue(course.id);
                          }}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
                        >
                          Continue
                        </button>

                        {course.progress === 100 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateCertificate(course);
                            }}
                            disabled={course.certificateUrl === "LOADING"}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-60"
                          >
                            {course.certificateUrl === "LOADING"
                              ? "Generating..."
                              : "🎓 Certificate"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import StudentHeader from "../../../components/StudentHeader";
import {
  getAllCourses,
  getMyCourses,
  enrollInCourse,
  Course,
} from "../../../lib/api";
import classNames from "classnames";
import { useSearch } from "../../../context/SearchContext";
import { useProgress } from "../../../context/ProgressContext";
import axios from "axios";

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

export default function StudentCoursesPage() {
  const router = useRouter();
  const { query: search } = useSearch();
  const { progressMap, updateProgress } = useProgress();

  const [token, setToken] = useState<string | null>(null);
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);

  // Load token & check role
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
        // FETCH PUBLIC COURSES
        const allCourses: Course[] = await getAllCourses(); // internally uses /courses/public
        const myCourses: any[] = await getMyCourses(token); // includes progress/certificateUrl

        const mergedCourses: DashboardCourse[] = allCourses.map(c => {
          const enrolledCourse = myCourses.find(mc => mc.id === c.id);

          return {
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
            enrolled: Boolean(enrolledCourse),
            progress: enrolledCourse?.progress ?? 0,
            certificateUrl: enrolledCourse?.certificateUrl ?? null,
          };
        });

        // Sort: enrolled courses first
        mergedCourses.sort((a, b) => Number(b.enrolled) - Number(a.enrolled));

        setCourses(mergedCourses);
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [token]);

  // Sync progress from context
  useEffect(() => {
    if (!progressMap || courses.length === 0) return;
    setCourses(prev =>
      prev.map(c =>
        c.enrolled && progressMap[c.id] !== undefined
          ? { ...c, progress: progressMap[c.id] }
          : c
      )
    );
  }, [progressMap]);

  const handleExpand = (id: number) =>
    setExpandedCourseId(expandedCourseId === id ? null : id);

  const handleEnroll = async (id: number) => {
    if (!token) return;
    try {
      await enrollInCourse(token, id);
      setCourses(prev =>
        prev.map(c => (c.id === id ? { ...c, enrolled: true, progress: 0 } : c))
      );
      updateProgress(id, 0);
    } catch (err: any) {
      alert(err.message || "Enrollment failed");
    }
  };

  const handleContinue = (id: number) => router.push(`/student/courses/${id}`);
  const handleView = (id: number) =>
    router.push(`/student/courses/preview/${id}`);

  const handleGenerateCertificate = async (course: DashboardCourse) => {
    if (!token) return;
    try {
      setCourses(prev =>
        prev.map(c => (c.id === course.id ? { ...c, certificateUrl: "LOADING" } : c))
      );

      const res = await axios.patch<CertificateResponse>(
        `${API_BASE_URL}/enrollments/course/${course.id}/generate-certificate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const certUrl = `${API_BASE_URL}${res.data.certificateUrl}`;
      setCourses(prev =>
        prev.map(c => (c.id === course.id ? { ...c, certificateUrl: certUrl } : c))
      );

      window.open(certUrl, "_blank");
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err.message || "Failed to generate certificate");
      setCourses(prev =>
        prev.map(c => (c.id === course.id ? { ...c, certificateUrl: null } : c))
      );
    }
  };

  if (loading) return <p className="p-6 text-center">⏳ Loading courses...</p>;

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-vh-100 bg-light">
      <StudentHeader />
      <div className="container py-5">
        <h2 className="text-center text-primary mb-4">📚 All Courses</h2>
        {filteredCourses.length === 0 && (
          <p className="text-center text-muted">No courses match your search.</p>
        )}

        <div className="list-group">
          {filteredCourses.map(course => {
            const isExpanded = expandedCourseId === course.id;
            return (
              <div
                key={course.id}
                className={classNames(
                  "list-group-item mb-2 rounded shadow-sm",
                  { "bg-info bg-opacity-25": isExpanded },
                  { "bg-white": !isExpanded }
                )}
                style={{ cursor: "pointer" }}
                onClick={() => handleExpand(course.id)}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{course.title}</h5>
                  {course.enrolled && (
                    <span>
                      {course.progress === 100 ? "✅ Completed" : "📌 Enrolled"}
                    </span>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-3">
                    <p className="text-muted">{course.description}</p>
                    <p className="text-muted small">
                      Instructor: {course.instructor?.name || "Unknown"}
                    </p>

                    {course.enrolled && (
                      <div className="mb-2">
                        <label className="form-label small">Progress</label>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: "8px" }}>
                            <div
                              className="progress-bar bg-primary"
                              role="progressbar"
                              style={{ width: `${course.progress}%` }}
                              aria-valuenow={course.progress}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            ></div>
                          </div>
                          <span className="fw-bold text-primary">{course.progress}%</span>
                        </div>
                      </div>
                    )}

                    <div className="d-flex gap-2 mt-3">
                      {!course.enrolled ? (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={e => {
                              e.stopPropagation();
                              handleView(course.id);
                            }}
                          >
                            View
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={e => {
                              e.stopPropagation();
                              handleEnroll(course.id);
                            }}
                          >
                            Enroll
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={e => {
                            e.stopPropagation();
                            handleContinue(course.id);
                          }}
                        >
                          Continue
                        </button>
                      )}

                      {course.enrolled && course.progress === 100 && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={e => {
                            e.stopPropagation();
                            handleGenerateCertificate(course);
                          }}
                          disabled={course.certificateUrl === "LOADING"}
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
      </div>
    </div>
  );
}

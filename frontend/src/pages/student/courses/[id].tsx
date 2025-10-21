"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import StudentHeader from "../../../components/StudentHeader";

interface Lesson {
  id: number;
  title: string;
  content: string;
  videoUrl?: string;
  attachmentUrl?: string | null;
  completed?: boolean;
}

interface Instructor {
  id: number;
  name?: string;
  email: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: Instructor;
  lessons: Lesson[];
  progress: number;
  certificateUrl?: string | null;
}

const API_BASE_URL = "http://localhost:4000";

export default function CourseDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
  const [showCourseInfo, setShowCourseInfo] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const lessonRefs = useRef<{ [key: number]: HTMLLIElement | null }>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);
    }
  }, []);

  const fetchCourse = async () => {
    if (!id || !token) return;

    const courseId = Array.isArray(id) ? id[0] : id;

    setLoading(true);
    try {
      const res = await axios.get<{ success: boolean; data: Course }>(
        `${API_BASE_URL}/enrollments/course-details/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCourse(res.data.data);
      setCurrentLessonId(res.data.data.lessons[0]?.id);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load course.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id, token]);

  const handleNextLesson = () => {
    if (!course || currentLessonId === null) return;
    const currentIndex = course.lessons.findIndex((l) => l.id === currentLessonId);
    const nextIndex = currentIndex + 1;
    if (nextIndex < course.lessons.length) {
      setCurrentLessonId(course.lessons[nextIndex].id);
      lessonRefs.current[course.lessons[nextIndex].id]?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handlePreviousLesson = () => {
    if (!course || currentLessonId === null) return;
    const currentIndex = course.lessons.findIndex((l) => l.id === currentLessonId);
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentLessonId(course.lessons[prevIndex].id);
      lessonRefs.current[course.lessons[prevIndex].id]?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const completeLesson = async (lessonId: number) => {
    if (!id || !token) return;

    const courseId = Array.isArray(id) ? id[0] : id;

    try {
      await axios.patch(
        `${API_BASE_URL}/enrollments/course/${courseId}/complete-lesson`,
        { lessonId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchCourse();

      if (course) {
        const lessonIds = course.lessons.map((l) => l.id);
        const nextIndex = lessonIds.indexOf(lessonId) + 1;
        const nextLessonId = lessonIds[nextIndex];
        if (nextLessonId) {
          setCurrentLessonId(nextLessonId);
          lessonRefs.current[nextLessonId]?.scrollIntoView({ behavior: "smooth" });
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to complete lesson.");
    }
  };

  const handleGenerateCertificate = async () => {
    if (!token || !course) return;

    try {
      setCourse({ ...course, certificateUrl: "LOADING" });

      const res = await axios.patch<{ certificateUrl: string }>(
        `${API_BASE_URL}/enrollments/course/${course.id}/generate-certificate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const certUrl = `${API_BASE_URL}${res.data.certificateUrl}`;
      setCourse({ ...course, certificateUrl: certUrl });

      window.open(certUrl, "_blank");
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err.message || "Failed to generate certificate");
      setCourse({ ...course, certificateUrl: null });
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-600">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!course) return <div className="p-6 text-center">Course not found</div>;

  const currentLesson = course.lessons.find((l) => l.id === currentLessonId);
  const completedLessons = course.lessons.filter((l) => l.completed).length;
  const progressPercent = Math.round((completedLessons / course.lessons.length) * 100);

  return (
    <div>
      <StudentHeader />

      <div className="container mx-auto py-6 px-4 lg:px-8">
        {/* Header: Course Title & Progress */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <h2
            className="text-2xl font-semibold text-gray-800 cursor-pointer hover:text-indigo-600 transition"
            onClick={() => setShowCourseInfo((prev) => !prev)}
          >
            {course.title}{" "}
            <span className="text-gray-500 text-lg">{showCourseInfo ? "▲" : "▼"}</span>
          </h2>

          <div className="flex-1 md:ml-6">
            <div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-400"
                style={{ width: `${Math.min(course.progress, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">
              {Math.min(course.progress, 100)}% completed
            </p>
          </div>
        </div>

        {/* Course Info */}
        {showCourseInfo && (
          <div className="bg-white border border-gray-600 rounded-lg shadow-sm p-5 mb-6">
            <p className="text-gray-700 mb-2">
              {course.description || "No description available"}
            </p>
            <p className="text-sm text-gray-600 mb-3">
              Instructor: <span className="font-medium">{course.instructor?.name || course.instructor?.email}</span>
            </p>
            {progressPercent === 100 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateCertificate();
                }}
                disabled={course.certificateUrl === "LOADING"}
                className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition disabled:opacity-60"
              >
                {course.certificateUrl === "LOADING" ? "Generating..." : "Download Certificate"}
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Lessons Sidebar */}
          <div className="w-full lg:w-1/4 bg-gray-50 border border-gray-600 rounded-lg p-4">
            <h5 className="text-lg font-semibold text-gray-800 mb-3">Lessons</h5>
            <ul className="space-y-2">
              {course.lessons.map((lesson) => (
                <li
                  key={lesson.id}
                  ref={(el) => (lessonRefs.current[lesson.id] = el)}
                  onClick={() => setCurrentLessonId(lesson.id)}
                  className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm cursor-pointer transition ${
                    currentLessonId === lesson.id
                      ? "bg-indigo-100 text-indigo-700 font-medium border border-indigo-600"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <span>{lesson.title}</span>
                  {lesson.completed && (
                    <span className="text-green-600 text-xs font-semibold">✓</span>
                  )}
                </li>
              ))}
            </ul>

            {/* Progress */}
            <div className="mt-5">
              <label className="block text-sm text-gray-600 mb-1">
                Progress: {progressPercent}%
              </label>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-600"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Lesson Content */}
          <div className="flex-1 bg-white border border-gray-600 rounded-lg shadow-sm p-6">
            {currentLesson && (
              <>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {currentLesson.title}
                </h3>
                <p className="text-gray-700 mb-4">{currentLesson.content}</p>

                {currentLesson.videoUrl && (
                  <div className="mb-4">
                    <video
                      controls
                      src={`http://localhost:4000${currentLesson.videoUrl}`}
                      className="w-full rounded-lg border border-gray-600"
                      style={{ maxHeight: "600px", objectFit: "contain" }}
                    />
                  </div>
                )}

                {currentLesson.attachmentUrl && (
                  <div className="mb-4">
                    <a
                      href={`http://localhost:4000${currentLesson.attachmentUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition"
                    >
                      Download PDF
                    </a>
                  </div>
                )}

                {!currentLesson.completed && (
                  <div className="mb-4">
                    <button
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
                      onClick={() => completeLesson(currentLesson.id)}
                    >
                      Mark as Completed
                    </button>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                  <button
                    className="px-4 py-2 text-sm rounded-lg border border-gray-600 text-gray-700 hover:bg-gray-100 transition"
                    onClick={handlePreviousLesson}
                    disabled={currentLessonId === course.lessons[0]?.id}
                  >
                    Previous
                  </button>
                  <button
                    className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                    onClick={handleNextLesson}
                    disabled={
                      currentLessonId === course.lessons[course.lessons.length - 1]?.id
                    }
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

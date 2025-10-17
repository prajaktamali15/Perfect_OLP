// src/pages/student/courses/preview/[id].tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import StudentHeader from "../../../../components/StudentHeader";
import { enrollInCourse } from "../../../../lib/api";

interface Instructor {
  id: number;
  name: string;
  email: string;
}

interface Lesson {
  id: number;
  title: string;
}

interface Course {
  id: number;
  title: string;
  description: string | null;
  instructor: Instructor;
  lessons: Lesson[];
}

export default function CoursePreviewPage() {
  const router = useRouter();
  const { id } = router.query;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchCourse = async () => {
      try {
        const res = await fetch(`http://localhost:4000/courses/${id}`);
        if (!res.ok) throw new Error("Course not found");
        const data: Course = await res.json();
        setCourse(data);
      } catch (err) {
        console.error(err);
        router.replace("/student/courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, router]);

  const handleEnroll = async () => {
    if (!token || !course) {
      router.push("/auth/login");
      return;
    }
    try {
      await enrollInCourse(token, course.id);
      router.replace(`/student/courses/${course.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to enroll");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 text-lg">
        ⏳ Loading course preview...
      </div>
    );

  if (!course)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 text-lg">
        Course not found
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <StudentHeader />

      <div className="flex justify-center items-center px-4 py-12">
        <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white p-8 text-center">
            <h1 className="text-4xl font-bold mb-3">{course.title}</h1>
            <p className="text-indigo-100 text-lg mb-2">
              {course.description || "No description available for this course."}
            </p>
            <p className="text-sm text-indigo-200">
              Instructor:{" "}
              <span className="font-medium text-white">
                {course.instructor?.name || "Unknown"}
              </span>
            </p>
          </div>

          {/* Content Section */}
          <div className="p-8">
            {course.lessons.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  What You'll Learn
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {course.lessons.slice(0, 6).map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-indigo-50 transition"
                    >
                      <span className="text-indigo-600 text-lg">📘</span>
                      <p className="text-gray-700">{lesson.title}</p>
                    </div>
                  ))}
                </div>
                {course.lessons.length > 6 && (
                  <p className="text-gray-500 mt-2 italic text-sm">
                    ...and {course.lessons.length - 6} more lessons
                  </p>
                )}
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleEnroll}
                className="px-10 py-4 rounded-lg bg-indigo-600 text-white font-semibold text-lg shadow-md hover:bg-indigo-700 transition"
              >
                Enroll Now
              </button>
              <p className="text-gray-500 text-sm mt-3">
                Lifetime access • Learn at your own pace
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import StudentHeader from "../../../components/StudentHeader";
import { getAllCourses, enrollInCourse, Course } from "../../../lib/api";
import { useSearch } from "../../../context/SearchContext";

// ✅ Extend enrollment type to include progress/completed
interface Enrollment {
  id: number;
  studentId: number;
  progress?: number;
  completed?: boolean;
}

// ✅ Extend Course type locally to include our fixed enrollment structure
interface ExtendedCourse extends Course {
  enrollments?: Enrollment[];
}

const HARD_CODED_CATEGORIES = [
  { id: 1, name: "Web Development", description: "Courses about building websites" },
  { id: 2, name: "Data Science", description: "Courses about data analysis and ML" },
  { id: 3, name: "Design", description: "Courses about UI/UX and graphic design" },
  { id: 4, name: "Marketing", description: "Courses about marketing and sales" },
];

export default function StudentCourses() {
  const router = useRouter();
  const { query } = useSearch();
  const [token, setToken] = useState<string | null>(null);
  const [courses, setCourses] = useState<ExtendedCourse[]>([]);
  const [categories] = useState<typeof HARD_CODED_CATEGORIES>(HARD_CODED_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<"All" | number>("All"); // Removed "Other"
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = localStorage.getItem("token");
    setToken(t);

    if (!t) {
      setError("Not authenticated. Please log in.");
      setLoading(false);
      return;
    }

    setLoading(true);
    getAllCourses()
      .then((data) => {
        setCourses(data);
        setLoading(false);
      })
      .catch((err: any) => {
        console.error(err);
        setError(err?.message || "Failed to load courses");
        setLoading(false);
      });
  }, [router]);

  const toggleCourse = (id: number) => {
    setExpandedCourseId(expandedCourseId === id ? null : id);
  };

  const filteredCourses =
    selectedCategory === "All"
      ? courses
      : courses.filter(
          (c) =>
            c.category &&
            c.category.name.toLowerCase() ===
              categories.find((cat) => cat.id === selectedCategory)?.name.toLowerCase()
        );

  const searchedCourses = filteredCourses.filter((course) =>
    course.title.toLowerCase().includes(query.trim().toLowerCase())
  );

  // Updated categoryCounts: Removed "Other"
  const categoryCounts: Record<string | number, number> = {
    All: courses.length,
    ...categories.reduce((acc, cat) => {
      acc[cat.id] = courses.filter(
        (c) => c.category && c.category.name.toLowerCase() === cat.name.toLowerCase()
      ).length;
      return acc;
    }, {} as Record<number, number>),
  };

  const isEnrolled = (courseId: number) => {
    const course = courses.find((c) => c.id === courseId);
    return course?.enrollments?.some((e) => e.studentId === Number(token)) || false;
  };

  const getCourseProgress = (courseId: number) => {
    const course = courses.find((c) => c.id === courseId);
    const enrollment = course?.enrollments?.find((e) => e.studentId === Number(token));
    return enrollment?.progress ?? 0;
  };

  const isCourseCompleted = (courseId: number) => {
    const course = courses.find((c) => c.id === courseId);
    return (
      course?.enrollments?.some(
        (e) => e.studentId === Number(token) && e.completed
      ) || false
    );
  };

  const handleEnroll = async (courseId: number) => {
    if (!token) return alert("You must be logged in to enroll");

    if (isEnrolled(courseId)) {
      router.push("/student/courses/my-courses");
      return;
    }

    try {
      await enrollInCourse(token, courseId);
      alert("Successfully enrolled!");
      router.push("/student/courses/my-courses");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to enroll.");
    }
  };

  if (loading) return <p className="p-4 text-center">Loading courses...</p>;
  if (error) return <p className="p-4 text-center text-red-600">Error: {error}</p>;

  return (
    <div>
      <StudentHeader />
      <div className="container mx-auto py-6 flex gap-4">
        {/* Sidebar */}
        <div
          className="flex-shrink-0 transition-all duration-300 relative"
          style={{ width: sidebarOpen ? "220px" : "40px" }}
        >
          <button
            className="inline-flex items-center justify-center mb-3 w-9 h-9 border rounded text-gray-600 hover:bg-gray-50 transition"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? "<" : ">"}
          </button>

          {sidebarOpen && (
            <div className="bg-gray-100 p-3 rounded shadow-sm">
              <ul className="bg-white border rounded-lg divide-y">
                <li
                  className={`px-3 py-2 flex justify-between items-center cursor-pointer rounded-lg ${
                    selectedCategory === "All"
                      ? "bg-indigo-50 border border-indigo-600 text-indigo-700 font-semibold"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedCategory("All")}
                >
                  All
                  <span
                    className={`ml-2 inline-flex items-center px-2 py-0.5 text-xs rounded ${
                      selectedCategory === "All"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {categoryCounts["All"]}
                  </span>
                </li>

                {categories.map((cat) => (
                  <li
                    key={cat.id}
                    className={`px-3 py-2 flex justify-between items-center cursor-pointer rounded-lg ${
                      selectedCategory === cat.id
                        ? "bg-indigo-50 border border-indigo-600 text-indigo-700 font-semibold"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                    <span
                      className={`ml-2 inline-flex items-center px-2 py-0.5 text-xs rounded ${
                        selectedCategory === cat.id
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {categoryCounts[cat.id]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-400 pb-3">
            <h3 className="text-xl font-semibold">Welcome, Student!</h3>
          </div>

          {searchedCourses.length === 0 ? (
            <p className="p-4 text-center text-gray-500">No courses found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {searchedCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600">
                    {course.thumbnailUrl ? (
                      <img
                        src={`http://localhost:4000${course.thumbnailUrl}`}
                        alt={course.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`absolute inset-0 flex items-center justify-center ${course.thumbnailUrl ? 'hidden' : ''}`}>
                      <div className="text-center text-white">
                        <svg className="mx-auto h-12 w-12 mb-2 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm font-medium">Course Thumbnail</p>
                      </div>
                    </div>
                    {/* Difficulty Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          course.difficulty === "Beginner"
                            ? "bg-green-100 text-green-800"
                            : course.difficulty === "Intermediate"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {course.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <div
                      className="flex items-center justify-between border-b border-gray-200 pb-2 cursor-pointer"
                      onClick={() => toggleCourse(course.id)}
                    >
                      <h5 className="text-lg font-semibold text-gray-800">
                        {course.title}
                      </h5>
                    </div>

                    {course.duration && (
                      <p className="text-sm text-gray-500">
                        Duration: {course.duration}
                      </p>
                    )}

                    {expandedCourseId === course.id && (
                      <div className="mt-3 space-y-2 text-sm text-gray-700">
                        <p>Lessons: {course.lessons?.length || 0}</p>
                        <p>Enrollments: {course.enrollments?.length || 0}</p>
                        <p>Category: {course.category?.name || "Uncategorized"}</p>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {isEnrolled(course.id) ? (
                            <>
                              <button className="px-2 py-1 text-sm rounded bg-indigo-100 text-indigo-700">
                                Progress: {getCourseProgress(course.id)}%
                              </button>
                              <button
                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                                onClick={() =>
                                  router.push(`/student/courses/preview/${course.id}`)
                                }
                              >
                                Continue
                              </button>
                              {isCourseCompleted(course.id) && (
                                <button
                                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                                  onClick={() => alert("Certificate Generated!")}
                                >
                                  Generate Certificate
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <button
                                className="px-3 py-1.5 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition text-sm"
                                onClick={() =>
                                  router.push(`/student/courses/preview/${course.id}`)
                                }
                              >
                                View
                              </button>
                              <button
                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                                onClick={() => handleEnroll(course.id)}
                              >
                                Enroll
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

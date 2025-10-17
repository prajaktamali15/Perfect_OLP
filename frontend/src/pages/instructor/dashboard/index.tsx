"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import InstructorHeader from "../../../components/InstructorHeader";
import { getInstructorCourses, Course, deleteCourse } from "../../../lib/api";
import { useSearch } from "../../../context/SearchContext";

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function InstructorCourses() {
  const router = useRouter();
  const { query } = useSearch();
  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"All" | number>("All"); // Removed "Other"
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const t = localStorage.getItem("token");
    const n = localStorage.getItem("name");
    setToken(t);
    setName(n);

    if (!t) {
      setError("Not authenticated. Please log in.");
      setLoading(false);
      return;
    }

    setLoading(true);

    getInstructorCourses(t)
      .then((data) => {
        setCourses(data);
        setLoading(false);
      })
      .catch((err: any) => {
        console.error("Error fetching courses:", err);
        if (err?.message?.toLowerCase().includes("unauthorized")) {
          setError("Unauthorized access. Please log in again.");
          localStorage.removeItem("token");
          router.push("/auth/login");
        } else {
          setError(err?.message || "Failed to load courses");
        }
        setLoading(false);
      });

    fetch("http://localhost:4000/instructor/courses/categories", {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((res) => res.json())
      .then((data: Category[]) => setCategories(data))
      .catch((err) => {
        console.error("Error fetching categories:", err);
      });
  }, [router]);

  const toggleCourse = (id: number) => {
    setExpandedCourseId(expandedCourseId === id ? null : id);
  };

  const filteredCourses =
    selectedCategory === "All"
      ? courses
      : courses.filter((c) => c.categoryId === selectedCategory); // Removed "Other" logic

  const searchedCourses = filteredCourses.filter((course) =>
    course.title.toLowerCase().includes(query.trim().toLowerCase())
  );

  const categoryCounts: Record<string | number, number> = {
    All: courses.length,
    ...categories.reduce((acc, cat) => {
      acc[cat.id] = courses.filter((c) => c.categoryId === cat.id).length;
      return acc;
    }, {} as Record<number, number>),
  };

  if (loading) return <p className="p-4 text-center">Loading courses...</p>;
  if (error) return <p className="p-4 text-center text-red-600">Error: {error}</p>;

  return (
    <div>
      <InstructorHeader />
          
      <div className="border-b border-gray-400 mb-4"></div>

      <div className="container mx-auto py-6 flex gap-4">
        {/* Sidebar */}
        <div
          className="flex-shrink-0 transition-width duration-300 relative"
          style={{ width: sidebarOpen ? "200px" : "40px" }}
        >
          <button
            className="inline-flex items-center justify-center mb-3 w-9 h-9 border rounded text-gray-600 hover:bg-gray-50"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? "<" : ">"}
          </button>

          {sidebarOpen && (
            <div className="bg-gray-100 p-3 rounded shadow-sm mt-2">
              <ul className="bg-white border rounded-lg divide-y">
                <li
                  className={`px-3 py-2 flex justify-between items-center cursor-pointer rounded-lg ${
                    selectedCategory === "All" ? "bg-indigo-50 border border-indigo-600 text-indigo-700 font-semibold" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedCategory("All")}
                >
                  All
                  <span
                    className={`ml-2 inline-flex items-center px-2 py-0.5 text-xs rounded ${
                      selectedCategory === "All" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {categoryCounts["All"]}
                  </span>
                </li>

                {categories.map((cat) => (
                  <li
                    key={cat.id}
                    className={`px-3 py-2 flex justify-between items-center cursor-pointer rounded-lg ${
                      selectedCategory === cat.id ? "bg-indigo-50 border border-indigo-600 text-indigo-700 font-semibold" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                    <span
                      className={`ml-2 inline-flex items-center px-2 py-0.5 text-xs rounded ${
                        selectedCategory === cat.id ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {categoryCounts[cat.id] || 0}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header with separation line */}
          <div className="flex items-center justify-between border-b border-gray-400 pb-3">
            <h3 className="text-xl font-semibold">Welcome, {name || "Instructor"}!</h3>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              onClick={() => router.push("/instructor/courses/create")}
            >
              Create New Course
            </button>
          </div>

          {searchedCourses.length === 0 ? (
            <p className="p-4 text-center">No courses found.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {searchedCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white border border-gray-400 rounded-lg shadow-sm hover:shadow-md overflow-hidden"
                >
                  {course.thumbnailUrl && (
                    <img
                      src={`http://localhost:4000${course.thumbnailUrl}`}
                      alt={course.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6 space-y-2">
                    {/* Card header */}
                    <div
                      className="flex items-center justify-between cursor-pointer border-b border-gray-200 pb-2"
                      onClick={() => toggleCourse(course.id)}
                    >
                      <h5 className="text-lg font-semibold">{course.title}</h5>
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          course.difficulty === "Beginner"
                            ? "bg-green-100 text-green-700"
                            : course.difficulty === "Intermediate"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {course.difficulty}
                      </span>
                    </div>

                    {course.duration && <p className="text-sm text-gray-500 mt-2">Duration: {course.duration}</p>}

                    {expandedCourseId === course.id && (
                      <div className="mt-3 space-y-2">
                        <p>Lessons: {course.lessons?.length || 0}</p>
                        <p>Enrollments: {course.enrollments?.length || 0}</p>
                        <p>Category: {course.category?.name || "Uncategorized"}</p>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {/* Removed Edit button */}
                          <button
                            className="px-3 py-1.5 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition text-sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!token) return alert("Not authenticated");
                              if (!confirm("Are you sure you want to delete this course?")) return;
                              try {
                                await deleteCourse(course.id, token);
                                alert("Course deleted successfully");
                                setCourses((prev) => prev.filter((c) => c.id !== course.id));
                              } catch (err: any) {
                                console.error(err);
                                alert(err?.message || "Failed to delete course");
                              }
                            }}
                          >
                            Delete
                          </button>
                          <button
                            className="px-3 py-1.5 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/instructor/courses/${course.id}/content`);
                            }}
                          >
                            Edit Course
                          </button>
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

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import { getAllCourses, enrollInCourse, getMyCourses, Course } from "../lib/api";
import { useSearch } from "../context/SearchContext";

const HARD_CODED_CATEGORIES = [
  { id: 1, name: "Web Development" },
  { id: 2, name: "Data Science" },
  { id: 3, name: "Design" },
  { id: 4, name: "Marketing" },
];

export default function LandingPage() {
  const router = useRouter();
  const { query } = useSearch();
  const [token, setToken] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<"All" | number>("All");
  const [categories] = useState<typeof HARD_CODED_CATEGORIES>(HARD_CODED_CATEGORIES);

  useEffect(() => {
    const savedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setToken(savedToken);

    const fetchCoursesData = async () => {
      try {
        const allCourses = await getAllCourses();
        let enrolledCourses: Course[] = [];

        if (savedToken) {
          enrolledCourses = await getMyCourses(savedToken);
          setEnrolledCourseIds(enrolledCourses.map((c) => Number(c.id)));
        }

        const normalizedCourses: Course[] = allCourses.map((c: any) => ({
          ...c,
          id: Number(c.id),
          description: c.description ?? "",
          instructor: c.instructor
            ? {
                id: Number(c.instructor.id),
                name: c.instructor.name ?? "",
                email: c.instructor.email ?? "",
              }
            : undefined,
          lessons: c.lessons?.map((l: any) => ({ id: Number(l.id), title: l.title })) ?? [],
          prerequisites: c.prerequisites?.map((p: any) => ({ id: Number(p.id), title: p.title })) ?? [],
          progress: c.progress ?? 0,
          enrolled: enrolledCourses.some((ec) => Number(ec.id) === Number(c.id)),
          certificateUrl: c.certificateUrl ?? null,
          category: c.category
            ? { id: Number(c.category.id), name: c.category.name }
            : undefined,
        }));

        setCourses(normalizedCourses);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoursesData();
  }, []);

  const toggleExpand = (id: number) =>
    setExpandedCourseId(expandedCourseId === id ? null : id);

  const handleEnroll = async (courseId: number) => {
    if (!token) {
      alert("⚠️ Please log in to enroll in this course.");
      return;
    }

    try {
      await enrollInCourse(token, courseId);
      alert("✅ Successfully enrolled!");
      setEnrolledCourseIds((prev) => [...prev, courseId]);
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, enrolled: true } : c))
      );
    } catch (err: any) {
      alert(err.message || "Enrollment failed");
    }
  };

  const handleView = (course: Course) => {
    if (token) {
      router.push(`/courses/${course.id}`);
    } else {
      setPreviewCourse(course);
    }
  };

  // Filter courses by category (without "Other")
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

  // Count courses per category (without "Other")
  const categoryCounts: Record<string | number, number> = {
    All: courses.length,
    ...categories.reduce((acc, cat) => {
      acc[cat.id] = courses.filter(
        (c) => c.category && c.category.name.toLowerCase() === cat.name.toLowerCase()
      ).length;
      return acc;
    }, {} as Record<number, number>),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />
      <div className="border-b border-gray-200 mb-8"></div>

      {/* Hero / Intro Section */}
      <main className="container mx-auto px-6 pb-16">
        <section className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 mb-4">
            Explore Our Courses
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Learn from expert instructors, gain new skills, and take your career to the next level.
          </p>
        </section>

        {/* Layout */}
        <div className="flex gap-8">
          {/* Sidebar */}
          <div
            className={`transition-all duration-300 relative bg-white rounded-xl shadow-sm border border-gray-200`}
            style={{ width: sidebarOpen ? 220 : 48 }}
          >
            <button
              className="absolute top-3 -right-4 w-8 h-8 bg-white border rounded-full shadow flex items-center justify-center text-gray-600 hover:bg-gray-50 transition"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? "<" : ">"}
            </button>

            {sidebarOpen && (
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Categories
                </h3>
                <ul className="bg-gray-50 border rounded-lg divide-y">
                  <li
                    className={`px-4 py-2 flex justify-between items-center cursor-pointer rounded-t-lg ${
                      selectedCategory === "All"
                        ? "bg-indigo-600 text-white font-semibold"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedCategory("All")}
                  >
                    All
                    <span
                      className={`ml-2 px-2 py-0.5 text-xs rounded ${
                        selectedCategory === "All"
                          ? "bg-white text-indigo-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {categoryCounts["All"]}
                    </span>
                  </li>

                  {categories.map((cat) => (
                    <li
                      key={cat.id}
                      className={`px-4 py-2 flex justify-between items-center cursor-pointer ${
                        selectedCategory === cat.id
                          ? "bg-indigo-600 text-white font-semibold"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.name}
                      <span
                        className={`ml-2 px-2 py-0.5 text-xs rounded ${
                          selectedCategory === cat.id
                            ? "bg-white text-indigo-700"
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

          {/* Course Grid */}
          <div className="flex-1 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <p className="col-span-full text-center text-gray-500">
                ⏳ Loading courses...
              </p>
            ) : searchedCourses.length === 0 ? (
              <p className="col-span-full text-center text-gray-500">
                No courses found.
              </p>
            ) : (
              searchedCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
                >
                  <div className="relative h-44 bg-gradient-to-br from-indigo-500 to-purple-600">
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
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div onClick={() => toggleExpand(course.id)} className="cursor-pointer">
                      <h2 className="text-lg font-semibold text-gray-800 hover:text-indigo-600 transition">
                        {course.title}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {course.description}
                      </p>
                      {course.instructor && (
                        <p className="text-sm text-gray-600 mt-2">
                          👨‍🏫 {course.instructor.name}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex justify-between items-center">
                      {expandedCourseId === course.id && (
                        <div className="flex gap-2 mt-3 w-full">
                          <button
                            className="flex-1 px-4 py-2 bg-gray-100 border rounded-lg hover:bg-gray-200 text-gray-800 font-medium transition"
                            onClick={() => handleView(course)}
                          >
                            View
                          </button>
                          {!course.enrolled && (
                            <button
                              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
                              onClick={() => handleEnroll(course.id)}
                            >
                              Enroll
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Guest Preview Modal */}
      {previewCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setPreviewCourse(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-11/12 max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {previewCourse.title}
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700 text-lg"
                onClick={() => setPreviewCourse(null)}
              >
                ✕
              </button>
            </div>
            <p className="mb-3 text-gray-700">{previewCourse.description}</p>
            <p className="mb-3">
              <strong>Instructor:</strong> {previewCourse.instructor?.name || "N/A"}
            </p>
            <h6 className="font-semibold mb-2 text-gray-800">📖 Lessons (Preview):</h6>
            {previewCourse.lessons?.length ? (
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {previewCourse.lessons.map((l) => (
                  <li key={l.id}>{l.title}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No lessons available for preview.</p>
            )}
            <div className="mt-5 text-right">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition text-gray-700 font-medium"
                onClick={() => setPreviewCourse(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

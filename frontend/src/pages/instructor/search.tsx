"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface Lesson {
  id: number;
  title: string;
  content?: string;
  videoUrl?: string;
  attachmentUrl?: string;
}

interface Course {
  id: number;
  title: string;
  description?: string;
  lessons: Lesson[];
  enrollments: any[];
}

export default function InstructorSearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!query) return;

    const token = localStorage.getItem("token");

    fetch(`/api/instructor/courses/search?query=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [query]);

  if (loading) return <p className="text-center mt-5">Loading courses...</p>;

  return (
    <div className="container mt-4">
      <h2>Search Results for "{query}"</h2>
      {courses.length === 0 ? (
        <p>No courses found.</p>
      ) : (
        <div className="list-group">
          {courses.map((course) => (
            <div
              key={course.id}
              className="list-group-item list-group-item-action mb-2"
              style={{ cursor: "pointer" }}
              onClick={() => router.push(`/instructor/courses/${course.id}`)}
            >
              <h5>{course.title}</h5>
              <p className="mb-1">{course.description}</p>
              <small>{course.lessons.length} Lessons</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import InstructorHeader from "../../../../components/InstructorHeader";
import { getCourseById, Course } from "../../../../lib/api";

export default function ViewCoursePage() {
  const router = useRouter();
  const { id } = router.query;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // Fix: cast id to string instead of converting to number
    getCourseById(id as string, token)
      .then((data) => setCourse(data))
      .catch((err) => {
        console.error(err);
        setCourse(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading course...</p>;
  if (!course) return <p>Course not found</p>;

  return (
    <div>
      <InstructorHeader />
      <div className="container mt-4">
        <h2>{course.title}</h2>
        <p>Description: {course.description || "No description"}</p>
        <p>Lessons: {course.lessons?.length || 0}</p>
        <p>Enrollments: {course.enrollments?.length || 0}</p>
      </div>
    </div>
  );
}

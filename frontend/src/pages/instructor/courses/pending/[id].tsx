"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import InstructorHeader from "../../../../components/InstructorHeader";
import {
  getCourseById,
  Course,
  deleteCourse,
  cancelPublishRequest,
} from "../../../../lib/api";

export default function PendingCoursePage() {
  const router = useRouter();
  const { id } = router.query;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const courseId = Array.isArray(id) ? id[0] : id; // keep as string for getCourseById
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    getCourseById(courseId, token)
      .then((data) => setCourse(data))
      .catch(() => setError("Failed to load course"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEdit = () => {
    if (!id) return;
    router.push(`/instructor/courses/${id}/edit`);
  };

  const handleCancelRequest = async () => {
    if (!id) return;
    if (!confirm("Are you sure you want to cancel the publish request?")) return;

    try {
      const token = localStorage.getItem("token") || "";
      const courseIdNum = Array.isArray(id) ? Number(id[0]) : Number(id);
      await cancelPublishRequest(courseIdNum, token);
      alert("Publish request canceled. Course moved back to draft.");
      router.push("/instructor/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to cancel request");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      const token = localStorage.getItem("token") || "";
      const courseIdNum = Array.isArray(id) ? Number(id[0]) : Number(id);
      await deleteCourse(courseIdNum, token);
      alert("Course deleted successfully");
      router.push("/instructor/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to delete course");
    }
  };

  const handleGoToContent = () => {
    if (!id) return;
    router.push(`/instructor/courses/${id}/content`);
  };

  if (loading) return <p className="text-center mt-4">Loading course...</p>;
  if (error) return <p className="text-center mt-4 text-danger">{error}</p>;
  if (!course) return <p className="text-center mt-4">Course not found</p>;

  return (
    <div>
      <InstructorHeader />
      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <h2 className="card-title">{course.title}</h2>
            <p className="card-text">
              <strong>Description:</strong> {course.description || "No description"}
            </p>
            <p className="card-text">
              <strong>Lessons:</strong> {course.lessons?.length || 0}
            </p>
            <p className="card-text">
              <strong>Enrollments:</strong> {course.enrollments?.length || 0}
            </p>

            <p className="card-text">
              <strong>Status:</strong>{" "}
              <span
                className={`fw-bold ${
                  course.status === "PUBLISHED"
                    ? "text-success"
                    : course.status === "PENDING"
                    ? "text-warning"
                    : course.status === "DRAFT"
                    ? "text-secondary"
                    : "text-danger"
                }`}
              >
                {course.status}
              </span>
            </p>

            <div className="d-flex gap-2 mt-3">
              <button onClick={handleEdit} className="btn btn-primary">
                Edit
              </button>

              <button onClick={handleGoToContent} className="btn btn-info">
                Go to Course Content
              </button>

              {course.status === "PENDING" && (
                <button onClick={handleCancelRequest} className="btn btn-warning">
                  Cancel Request
                </button>
              )}

              <button onClick={handleDelete} className="btn btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

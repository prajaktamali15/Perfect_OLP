// src/pages/courses/[id].tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import { enrollInCourse } from "../../lib/api";

interface Lesson {
  id: number;
  title: string;
  content?: string;
}

interface Course {
  id: number;
  title: string;
  description: string | null;
  instructor?: { name: string };
  lessons?: Lesson[];
  enrolled?: boolean;
  progress?: number;
  completed?: boolean;
  certificateUrl?: string | null;
}

export default function CourseDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!id) return;

    const fetchCourse = async () => {
      try {
        if (!token) {
          // Guest → fetch public preview
          const res = await fetch(`http://localhost:4000/courses/${id}/public`);
          if (!res.ok) throw new Error("Failed to fetch course preview");
          const data = await res.json();
          setCourse(data);
        } else {
          // Logged-in → fetch full details
          const res = await fetch(`http://localhost:4000/courses/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to fetch course details");
          const data = await res.json();
          setCourse(data);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unable to load course details.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, token]);

  const handleEnroll = async () => {
    if (!token) {
      alert("⚠️ Please log in to enroll in this course.");
      return;
    }
    if (!course) return;

    setEnrolling(true);
    setError("");
    setMessage("");

    try {
      await enrollInCourse(token, course.id);
      setCourse((prev) => (prev ? { ...prev, enrolled: true } : prev));
      setMessage("✅ Successfully enrolled in this course!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to enroll.");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <p className="p-4">Loading course details...</p>;
  if (error) return <p className="p-4 text-danger">{error}</p>;
  if (!course) return <p className="p-4">Course not found.</p>;

  return (
    <>
      <Header />
      <div className="container my-5">
        <div className="card shadow-sm p-4">
          <h2 className="card-title mb-3">{course.title}</h2>
          <p className="card-text">{course.description}</p>
          {course.instructor && (
            <p>
              <strong>Instructor:</strong> {course.instructor.name}
            </p>
          )}

          {/* Not Enrolled State */}
          {!course.enrolled && (
            <div className="mt-3 d-flex gap-3">
              <button
                className="btn btn-success"
                onClick={handleEnroll}
                disabled={enrolling}
              >
                {token ? (enrolling ? "Enrolling..." : "Enroll") : "Login to Enroll"}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setPreviewVisible((prev) => !prev)}
              >
                {previewVisible ? "Hide Preview" : "View Preview"}
              </button>
            </div>
          )}

          {/* Enrolled State */}
          {course.enrolled && (
            <div className="mt-4">
              <p className="fw-bold text-primary">
                Progress: {course.progress || 0}%
              </p>
              {course.completed && course.certificateUrl && (
                <a
                  href={course.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-success me-2"
                >
                  🎓 Download Certificate
                </a>
              )}
              <button
                className="btn btn-primary"
                onClick={() => router.push(`/student/courses/${course.id}`)}
              >
                {course.progress && course.progress > 0
                  ? "Continue Course"
                  : "View Course"}
              </button>
            </div>
          )}

          {message && <p className="mt-3 text-success">{message}</p>}
        </div>

        {/* Lessons Section */}
        {(previewVisible || course.enrolled) && (
          <div className="card mt-4 p-3">
            <h4>Lessons</h4>
            <ul className="list-group list-group-flush">
              {course.lessons && course.lessons.length > 0 ? (
                course.lessons.map((lesson) => (
                  <li key={lesson.id} className="list-group-item">
                    <strong>{lesson.title}</strong>
                    {course.enrolled && lesson.content && (
                      <p className="mb-0">{lesson.content}</p>
                    )}
                  </li>
                ))
              ) : (
                <p className="text-muted p-3">No lessons available.</p>
              )}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import InstructorHeader from "../../../components/InstructorHeader";
import { getInstructorCourses, Course } from "../../../lib/api";

export default function InstructorCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    getInstructorCourses(token)
      .then((data) => setCourses(data))
      .catch(() => setError("Failed to load courses"))
      .finally(() => setLoading(false));
  }, []);

  const handleGoToCourse = (id: number) => {
    router.push(`/instructor/courses/${id}`);
  };

  const handleEditCourse = (id: number) => {
    router.push(`/instructor/courses/${id}/edit`);
  };

  if (loading) return <p className="text-center mt-4">Loading courses...</p>;
  if (error) return <p className="text-center mt-4 text-danger">{error}</p>;
  if (courses.length === 0) return <p className="text-center mt-4">No courses found</p>;

  return (
    <div>
      <InstructorHeader />
      <div className="container mt-4">
        <h2>My Courses</h2>
        <div className="row">
          {courses.map((course) => (
            <div className="col-md-4 mb-3" key={course.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{course.title}</h5>
                  <p className="card-text">
                    {course.description?.substring(0, 100) || "No description"}
                  </p>
                  <p className="card-text">
                    <strong>Status:</strong>{" "}
                    <span
                      className={`fw-bold ${
                        course.status === "PUBLISHED"
                          ? "text-success"
                          : course.status === "PENDING"
                          ? "text-warning"
                          : "text-secondary"
                      }`}
                    >
                      {course.status}
                    </span>
                  </p>
                  <div className="d-flex gap-2 mt-2">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleGoToCourse(course.id)}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEditCourse(course.id)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

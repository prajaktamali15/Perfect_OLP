// src/components/CoursesList.tsx
import { useState } from "react";
import { useRouter } from "next/router";

export interface Instructor {
  id: number;
  name: string | null;
  email: string;
}

export interface Course {
  id: number;
  title: string;
  description: string | null;
  instructor: Instructor;
  enrolled?: boolean;
  completed?: boolean;
}

interface CoursesListProps {
  courses: Course[];
}

export default function CoursesList({ courses }: CoursesListProps) {
  const router = useRouter();
  const [loadingIds, setLoadingIds] = useState<number[]>([]);

  const handleNavigate = (courseId: number) => {
    router.push(`/courses/${courseId}`);
  };

  return (
    <div className="container mt-4">
      <div className="row">
        {courses.map((course) => (
          <div className="col-md-6 mb-3" key={course.id}>
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{course.title}</h5>
                <p className="card-text">{course.description || "No description available."}</p>
                {course.instructor && (
                  <p className="card-text">
                    <small className="text-muted">Instructor: {course.instructor.name}</small>
                  </p>
                )}
                {course.enrolled !== undefined && (
                  <p className={`fw-bold ${course.completed ? "text-success" : "text-primary"}`}>
                    {course.completed ? "Completed ✅" : course.enrolled ? "Enrolled" : "Not Enrolled"}
                  </p>
                )}
                <button
                  className="btn btn-primary"
                  onClick={() => handleNavigate(course.id)}
                  disabled={loadingIds.includes(course.id)}
                >
                  {loadingIds.includes(course.id) ? "Loading..." : "View Course"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

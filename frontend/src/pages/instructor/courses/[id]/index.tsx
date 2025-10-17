"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import InstructorHeader from "../../../../components/InstructorHeader";
import { getCourseById, Course } from "../../../../lib/api";

const BACKEND_URL = "http://localhost:4000"; // your backend URL

export default function CourseDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    getCourseById(id as string, token)
      .then((data: Course) => {
        const updatedLessons = data.lessons?.map((lesson) => {
          const videoUrl =
            lesson.videoUrl && lesson.videoUrl.trim() !== ""
              ? lesson.videoUrl.startsWith("http")
                ? lesson.videoUrl
                : `${BACKEND_URL}${lesson.videoUrl.startsWith("/") ? "" : "/"}${lesson.videoUrl}`
              : undefined;

          const attachmentUrl =
            lesson.attachmentUrl && lesson.attachmentUrl.trim() !== ""
              ? lesson.attachmentUrl.startsWith("http")
                ? lesson.attachmentUrl
                : `${BACKEND_URL}${lesson.attachmentUrl.startsWith("/") ? "" : "/"}${lesson.attachmentUrl}`
              : undefined;

          return {
            ...lesson,
            videoUrl,
            attachmentUrl,
          };
        }) || [];

        setCourse({ ...data, lessons: updatedLessons });
        setSelectedLessonIndex(0);
      })
      .catch(() => setError("Failed to load course"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-center mt-4">Loading...</p>;
  if (error) return <p className="text-center text-danger mt-4">{error}</p>;
  if (!course) return <p className="text-center mt-4">Course not found</p>;
  if (!course.lessons || course.lessons.length === 0)
    return <p className="text-center mt-4">No lessons added yet.</p>;

  const lessons = course.lessons;
  const selectedLesson = lessons[selectedLessonIndex];

  const handlePrev = () => {
    if (selectedLessonIndex > 0) setSelectedLessonIndex(selectedLessonIndex - 1);
  };

  const handleNext = () => {
    if (selectedLessonIndex < lessons.length - 1)
      setSelectedLessonIndex(selectedLessonIndex + 1);
  };

  return (
    <div>
      <InstructorHeader />

      <div className="container-fluid mt-4">
        <div className="row">
          {/* Sidebar */}
          <div className="col-md-3 mb-3" style={{ maxHeight: "80vh", overflowY: "auto" }}>
            <h4>Lessons</h4>
            <div className="list-group">
              {lessons.map((lesson, idx) => (
                <button
                  key={lesson.id}
                  className={`list-group-item list-group-item-action ${
                    idx === selectedLessonIndex ? "active" : ""
                  }`}
                  onClick={() => setSelectedLessonIndex(idx)}
                >
                  {lesson.title}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="col-md-9 d-flex flex-column" style={{ maxHeight: "80vh", overflowY: "auto" }}>
            <div>
              <h2>{course.title}</h2>
              <p>{course.description}</p>

              <h4 className="mt-4">{selectedLesson.title}</h4>
              {selectedLesson.content && <p>{selectedLesson.content}</p>}

              {selectedLesson.videoUrl && (
                <div className="mb-3">
                  <div className="ratio ratio-16x9">
                    <video controls className="w-100 h-100 rounded">
                      <source src={selectedLesson.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}

              {selectedLesson.attachmentUrl && (
                <div className="mb-3">
                  <a
                    href={selectedLesson.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download Attachment
                  </a>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-auto d-flex justify-content-between">
              <button
                className="btn btn-secondary"
                onClick={handlePrev}
                disabled={selectedLessonIndex === 0}
              >
                Previous
              </button>
              <button
                className="btn btn-primary"
                onClick={handleNext}
                disabled={selectedLessonIndex === lessons.length - 1}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

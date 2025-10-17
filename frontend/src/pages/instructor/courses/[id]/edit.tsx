"use client";

import { useRouter } from "next/router";
import { useEffect, useState, ChangeEvent } from "react";
import InstructorHeader from "../../../../components/InstructorHeader";
import {
  getCourseById,
  addLesson,
  updateLesson,
  updateCourse,
  Course,
  LessonFormData,
} from "../../../../lib/api";

const BACKEND_URL = "http://localhost:4000";

interface LessonForm extends LessonFormData {
  id?: number;
  videoUrl?: string | null;
  attachmentUrl?: string | null;
  videoFile?: File | null;
  attachmentFile?: File | null;
}

export default function EditCoursePage() {
  const router = useRouter();
  const { id } = router.query;

  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lessons, setLessons] = useState<LessonForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch course data
  useEffect(() => {
    if (!id) return;
    const courseId = Array.isArray(id) ? id[0] : id;
    const token = localStorage.getItem("token") || "";
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    getCourseById(courseId, token)
      .then((data) => {
        setCourse(data);
        setTitle(data.title);
        setDescription(data.description || "");

        const preparedLessons =
          data.lessons?.map((l: any) => ({
            ...l,
            videoFile: null,
            attachmentFile: null,
            videoUrl: l.videoUrl ? `${BACKEND_URL}${l.videoUrl}` : null,
            attachmentUrl: l.attachmentUrl ? `${BACKEND_URL}${l.attachmentUrl}` : null,
          })) || [];
        setLessons(preparedLessons);
      })
      .catch(() => setError("Failed to load course"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLessonChange = (
    index: number,
    field: keyof LessonForm,
    value: string | File | null
  ) => {
    const updated = [...lessons];
    updated[index] = { ...updated[index], [field]: value };
    setLessons(updated);
  };

  const handleFileChange = (
    index: number,
    field: "videoFile" | "attachmentFile",
    e: ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleLessonChange(index, field, file);

      // Preview immediately
      const previewUrl = URL.createObjectURL(file);
      if (field === "videoFile") handleLessonChange(index, "videoUrl", previewUrl);
      if (field === "attachmentFile") handleLessonChange(index, "attachmentUrl", previewUrl);
    }
  };

  const handleAddLesson = () => {
    setLessons([
      ...lessons,
      { title: "", content: "", videoFile: null, attachmentFile: null, videoUrl: null, attachmentUrl: null },
    ]);
  };

  const handleRemoveLesson = (index: number) => {
    setLessons(lessons.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!course) return;
    const token = localStorage.getItem("token") || "";
    if (!token) {
      alert("Not authenticated");
      return;
    }
    if (!title.trim()) return alert("Title is required");

    setSaving(true);
    try {
      const courseId = Number(course.id);
      const savedLessons: LessonForm[] = [];

      for (const lesson of lessons) {
        const formData = new FormData();
        formData.append("title", lesson.title);
        if (lesson.content) formData.append("content", lesson.content);

        // Only append new files; backend will preserve existing files if none uploaded
        if (lesson.videoFile) formData.append("videoFile", lesson.videoFile);
        if (lesson.attachmentFile) formData.append("attachmentFile", lesson.attachmentFile);

        let savedLesson;
        if (lesson.id) {
          savedLesson = await updateLesson(lesson.id, formData, token);
        } else {
          savedLesson = await addLesson(courseId, formData, token);
        }

        savedLessons.push({
          id: savedLesson.id,
          title: savedLesson.title,
          content: savedLesson.content,
          videoUrl: savedLesson.videoUrl ? `${BACKEND_URL}${savedLesson.videoUrl}` : null,
          attachmentUrl: savedLesson.attachmentUrl ? `${BACKEND_URL}${savedLesson.attachmentUrl}` : null,
          videoFile: null,
          attachmentFile: null,
        });
      }

      setLessons(savedLessons);

      // Update course title & description
      await updateCourse(courseId, { title, description }, token);

      alert("Course updated successfully");
      router.push(`/instructor/courses/${course.id}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center mt-4">Loading course...</p>;
  if (error) return <p className="text-center mt-4 text-danger">{error}</p>;
  if (!course) return <p className="text-center mt-4">Course not found</p>;

  return (
    <div>
      <InstructorHeader />
      <div className="container mt-4">
        <h2>Edit Course: {course.title}</h2>

        <div className="mb-3">
          <label className="form-label">Title</label>
          <input
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <h4>Lessons</h4>
        {lessons.map((lesson, idx) => (
          <div key={idx} className="border p-3 mb-3 rounded">
            <div className="mb-2">
              <label className="form-label">Lesson Title</label>
              <input
                className="form-control"
                value={lesson.title}
                onChange={(e) => handleLessonChange(idx, "title", e.target.value)}
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Content</label>
              <textarea
                className="form-control"
                value={lesson.content || ""}
                onChange={(e) => handleLessonChange(idx, "content", e.target.value)}
              />
            </div>

            <div className="mb-2">
              <label className="form-label">Video</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleFileChange(idx, "videoFile", e)}
              />
              {lesson.videoUrl && (
                <video
                  src={lesson.videoUrl}
                  controls
                  style={{ width: "320px", height: "180px", marginTop: "8px", borderRadius: "8px" }}
                />
              )}
            </div>

            <div className="mb-2">
              <label className="form-label">Attachment (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFileChange(idx, "attachmentFile", e)}
              />
              {lesson.attachmentUrl && (
                <a
                  href={lesson.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="d-block mt-1"
                >
                  Current Attachment
                </a>
              )}
            </div>

            <button className="btn btn-danger mt-2" onClick={() => handleRemoveLesson(idx)}>
              Remove Lesson
            </button>
          </div>
        ))}

        <button className="btn btn-secondary mb-3" onClick={handleAddLesson}>
          Add New Lesson
        </button>

        <div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

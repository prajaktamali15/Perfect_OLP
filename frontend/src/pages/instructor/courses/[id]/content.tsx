"use client";

import { useRouter } from "next/router";
import { useEffect, useState, ChangeEvent, useRef } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import InstructorHeader from "../../../../components/InstructorHeader";
import {
  getCourseById,
  Course,
  addLesson,
  deleteLesson as apiDeleteLesson,
  updateLesson as apiUpdateLesson,
  reorderLessons as apiReorderLessons,
} from "../../../../lib/api";

export default function CourseContentPage() {
  const router = useRouter();
  const { id } = router.query;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  const lessonRefs = useRef<{ [key: number]: HTMLLIElement | null }>({});
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);

  const fetchCourse = () => {
    if (!id || !token) return;
    const courseId = Array.isArray(id) ? id[0] : id;
    getCourseById(courseId, token)
      .then((data) => {
        setCourse(data);
        setCurrentLessonId(data.lessons?.[0]?.id ?? null);
      })
      .catch(() => setError("Failed to load course"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourse();
  }, [id, token]);

  const handleSaveLesson = async () => {
    if (!lessonTitle) return alert("Lesson title is required");
    try {
      const courseIdNum = Array.isArray(id) ? Number(id[0]) : Number(id);
      const formData = new FormData();
      formData.append("title", lessonTitle);
      formData.append("content", lessonContent || "");
      if (videoFile) formData.append("videoFile", videoFile);
      if (attachmentFile) formData.append("attachmentFile", attachmentFile);

      if (editingLessonId) {
        const updatedLesson = await apiUpdateLesson(editingLessonId, formData, token);
        setCourse((prev) =>
          prev
            ? {
                ...prev,
                lessons: prev.lessons?.map((l) => (l.id === editingLessonId ? updatedLesson : l)) ?? [],
              }
            : prev
        );
        alert("Lesson updated successfully");
      } else {
        const newLesson = await addLesson(courseIdNum, formData, token);
        setCourse((prev) =>
          prev ? { ...prev, lessons: prev.lessons ? [...prev.lessons, newLesson] : [newLesson] } : prev
        );
        alert("Lesson added successfully");
      }

      setLessonTitle("");
      setLessonContent("");
      setVideoFile(null);
      setAttachmentFile(null);
      setEditingLessonId(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save lesson");
    }
  };

  const handleEditLesson = (lesson: any) => {
    setLessonTitle(lesson.title);
    setLessonContent(lesson.content || "");
    setEditingLessonId(lesson.id);
    setVideoFile(null);
    setAttachmentFile(null);
    setCurrentLessonId(lesson.id);
  };

  const handleDeleteLesson = async (lessonId?: number) => {
    if (!lessonId || !confirm("Are you sure you want to delete this lesson?")) return;
    try {
      await apiDeleteLesson(lessonId, token);
      alert("Lesson deleted successfully");
      setCourse((prev) =>
        prev ? { ...prev, lessons: prev.lessons?.filter((l) => l.id !== lessonId) ?? [] } : prev
      );
      if (currentLessonId === lessonId) setCurrentLessonId(course?.lessons?.[0]?.id ?? null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete lesson");
    }
  };

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) =>
    e.target.files && setVideoFile(e.target.files[0]);
  const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) =>
    e.target.files && setAttachmentFile(e.target.files[0]);

  const handleNextLesson = () => {
    if (!course || currentLessonId === null) return;
    const idx = course.lessons.findIndex((l) => l.id === currentLessonId);
    if (idx + 1 < course.lessons.length) setCurrentLessonId(course.lessons[idx + 1].id);
  };

  const handlePreviousLesson = () => {
    if (!course || currentLessonId === null) return;
    const idx = course.lessons.findIndex((l) => l.id === currentLessonId);
    if (idx > 0) setCurrentLessonId(course.lessons[idx - 1].id);
  };

  function SortableLessonItem({ lessonId, active }: { lessonId: number; active: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lessonId });
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    return (
      <li
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`py-2 px-3 flex justify-between items-center rounded-md mb-1 border cursor-pointer transition-all ${
          active
            ? "bg-indigo-100 border-l-4 border-indigo-600 text-indigo-700 shadow-sm"
            : "bg-white hover:bg-gray-50 text-gray-700"
        }`}
        onClick={() => setCurrentLessonId(lessonId)}
      >
        <span className="truncate font-medium">
          {course?.lessons?.find((l) => l.id === lessonId)?.title}
        </span>
        <span className="text-gray-400">⋮⋮</span>
      </li>
    );
  }

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !course || !active || active.id === over.id) return;
    const oldIndex = course.lessons.findIndex((l) => l.id === Number(active.id));
    const newIndex = course.lessons.findIndex((l) => l.id === Number(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const newLessons = arrayMove(course.lessons, oldIndex, newIndex);
    setCourse({ ...course, lessons: newLessons });
    try {
      const courseIdNum = Array.isArray(id) ? Number(id[0]) : Number(id);
      await apiReorderLessons(courseIdNum, newLessons.map((l) => l.id), token);
    } catch {
      alert("Failed to reorder lessons");
      setCourse({ ...course, lessons: arrayMove(newLessons, newIndex, oldIndex) });
    }
  };

  if (loading) return <p className="text-center mt-8 text-gray-600">Loading course...</p>;
  if (error) return <p className="text-center mt-8 text-red-600">{error}</p>;
  if (!course) return <p className="text-center mt-8 text-gray-600">Course not found</p>;

  const currentLesson = course.lessons.find((l) => l.id === currentLessonId);

  return (
    <div className="bg-gray-50 min-h-screen">
      <InstructorHeader />
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3 lg:col-span-3 bg-white border border-gray-400 rounded-xl p-4 shadow-sm h-[calc(100vh-7rem)] overflow-y-auto sticky top-24">
            <h5 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              📚 Lessons
            </h5>
            <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={course.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-1">
                  {course.lessons.map((lesson) => (
                    <SortableLessonItem
                      key={lesson.id}
                      lessonId={lesson.id}
                      active={currentLessonId === lesson.id}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>

          {/* Lesson Content */}
          <div className="col-span-12 md:col-span-9 lg:col-span-9 space-y-6">
            {currentLesson && (
              <div className="bg-white rounded-xl border border-gray-400 shadow-sm p-5">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{currentLesson.title}</h4>
                <p className="text-gray-700 mb-4">{currentLesson.content || "No content provided."}</p>

                {currentLesson.videoUrl && (
                  <div className="mb-4">
                    <video
                      controls
                      src={`http://localhost:4000${currentLesson.videoUrl}`}
                      className="w-full rounded-lg shadow-sm border border-gray-400 max-h-[400px] object-contain"
                    />
                  </div>
                )}

                {currentLesson.attachmentUrl && (
                  <div className="mb-4">
                    <a
                      href={`http://localhost:4000${currentLesson.attachmentUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50 transition"
                    >
                      📎 Download Attachment
                    </a>
                  </div>
                )}

                <div className="flex gap-3 mb-5">
                  <button
                    className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-800 transition"
                    onClick={() => handleEditLesson(currentLesson)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
                    onClick={() => handleDeleteLesson(currentLesson.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>

                <div className="flex justify-between">
                  <button
                    className="px-5 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition text-gray-700 font-medium"
                    onClick={handlePreviousLesson}
                    disabled={currentLessonId === course.lessons[0]?.id}
                  >
                    ← Previous
                  </button>
                  <button
                    className="px-5 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition disabled:opacity-50"
                    onClick={handleNextLesson}
                    disabled={currentLessonId === course.lessons[course.lessons.length - 1]?.id}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Add/Edit Lesson Form */}
            <div className="bg-white rounded-xl border border-gray-400 shadow-sm p-5">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                {editingLessonId ? "✏️ Edit Lesson" : "➕ Add New Lesson"}
              </h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Lesson Title"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                />
                <textarea
                  placeholder="Lesson Content"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none min-h-[100px]"
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                />
                <input
                  type="file"
                  accept="video/mp4"
                  className="w-full text-sm text-gray-600 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer"
                  onChange={handleVideoChange}
                />
                <input
                  type="file"
                  accept="application/pdf"
                  className="w-full text-sm text-gray-600 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer"
                  onChange={handleAttachmentChange}
                />
                <button
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
                  onClick={handleSaveLesson}
                >
                  {editingLessonId ? "💾 Update Lesson" : "➕ Add Lesson"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

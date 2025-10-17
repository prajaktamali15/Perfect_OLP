"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import InstructorLayout from "../../../components/InstructorLayout";
import { createCourse, addLesson, LessonFormData, getCategories } from "../../../lib/api";
import { toast } from "react-hot-toast";

// ----------------------
// Extend LessonFormData to include duration
// ----------------------
interface LessonForm extends LessonFormData {
  duration?: string;
}

interface Category {
  id: number;
  name: string;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced" | "">("");
  const [duration, setDuration] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [lessons, setLessons] = useState<LessonForm[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // ----------------------
  // Fetch categories dynamically
  // ----------------------
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");

        const data = await getCategories(token);
        setCategories(data);

        if (data.length) setCategoryId(data[0].id);
      } catch (err: any) {
        console.error("Failed to load categories:", err);
        toast.error("Failed to load categories");
      }
    };
    fetchCategories();
  }, []);

  // ----------------------
  // Lessons Handlers
  // ----------------------
  const handleAddLesson = () => {
    setLessons([
      ...lessons,
      { title: "", content: "", videoFile: null, attachmentFile: null, duration: "" },
    ]);
  };

  const handleLessonChange = (index: number, field: keyof LessonForm, value: any) => {
    const updated = [...lessons];
    (updated[index] as any)[field] = value;
    setLessons(updated);
  };

  // ----------------------
  // Prerequisites Handlers
  // ----------------------
  const handleAddPrerequisite = () => setPrerequisites([...prerequisites, ""]);
  const handlePrerequisiteChange = (index: number, value: string) => {
    const updated = [...prerequisites];
    updated[index] = value;
    setPrerequisites(updated);
  };
  const handleRemovePrerequisite = (index: number) => {
    setPrerequisites(prerequisites.filter((_, i) => i !== index));
  };

  // ----------------------
  // Submit Handler
  // ----------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      toast.loading("Creating course...");

      const course = await createCourse(
        {
          title,
          description,
          prerequisites,
          categoryId,
          difficulty: difficulty || undefined,
          duration,
          thumbnail,
        },
        token
      );

      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        const formData = new FormData();
        formData.append("title", lesson.title);
        formData.append("content", lesson.content || "");
        if (lesson.duration) formData.append("duration", lesson.duration);
        if (lesson.videoFile) formData.append("videoFile", lesson.videoFile);
        if (lesson.attachmentFile) formData.append("attachmentFile", lesson.attachmentFile);
        await addLesson(course.id, formData, token);
      }

      toast.dismiss();
      toast.success("Course created successfully!");
      router.push("/instructor/dashboard");
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <InstructorLayout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-6 md:px-16">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Create New Course
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Title */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Course Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Category</label>
              <select
                value={categoryId ?? ""}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              >
                {categories.length === 0 && <option>Loading...</option>}
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select difficulty</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 3h 30m"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Thumbnail</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Prerequisites */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Prerequisites</label>
              <div className="space-y-3">
                {prerequisites.map((pre, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Enter prerequisite"
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={pre}
                      onChange={(e) => handlePrerequisiteChange(index, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePrerequisite(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddPrerequisite}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  + Add Prerequisite
                </button>
              </div>
            </div>

            {/* Lessons */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Lessons</h3>
              <div className="space-y-6">
                {lessons.map((lesson, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4 shadow-sm">
                    <input
                      type="text"
                      placeholder="Lesson Title"
                      className="w-full mb-2 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={lesson.title}
                      onChange={(e) => handleLessonChange(index, "title", e.target.value)}
                      required
                    />
                    <textarea
                      placeholder="Lesson Content"
                      rows={2}
                      className="w-full mb-2 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={lesson.content || ""}
                      onChange={(e) => handleLessonChange(index, "content", e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g., 15m)"
                      className="w-full mb-2 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={lesson.duration || ""}
                      onChange={(e) => handleLessonChange(index, "duration", e.target.value)}
                    />
                    <input
                      type="file"
                      accept="video/*"
                      className="w-full mb-2 border border-gray-300 rounded-lg px-4 py-2"
                      onChange={(e) =>
                        handleLessonChange(index, "videoFile", e.target.files?.[0] || null)
                      }
                    />
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="w-full mb-3 border border-gray-300 rounded-lg px-4 py-2"
                      onChange={(e) =>
                        handleLessonChange(index, "attachmentFile", e.target.files?.[0] || null)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setLessons(lessons.filter((_, i) => i !== index))}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      Remove Lesson
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddLesson}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  + Add Lesson
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Course"}
            </button>
          </form>
        </div>
      </div>
    </InstructorLayout>
  );
}

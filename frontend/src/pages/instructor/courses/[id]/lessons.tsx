import { useRouter } from 'next/router';
import { useState } from 'react';
import InstructorLayout from '../../../../components/InstructorLayout';
import { addLesson } from '../../../../lib/api';

export default function LessonsPage() {
  const router = useRouter();
  const { id } = router.query; // course ID

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert('Lesson title is required');

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('videoUrl', videoUrl);
      await addLesson(Number(id), formData, token);
      alert('Lesson added successfully!');
      setTitle('');
      setContent('');
      setVideoUrl('');
    } catch (err) {
      console.error(err);
      alert('Failed to add lesson');
    } finally {
      setLoading(false);
    }
  };

  return (
    <InstructorLayout>
      <h1 className="text-2xl font-bold mb-4">Add Lessons for Course {id}</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow max-w-md">
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Video URL</label>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Lesson'}
        </button>
      </form>
    </InstructorLayout>
  );
}

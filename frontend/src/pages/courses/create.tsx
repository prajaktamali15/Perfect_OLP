import { useState } from 'react';
import Header from '../../components/Header';
import { createCourse } from '../../services/courseService';

export default function CreateCoursePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Pass all fields to backend
      const course = await createCourse(
        JSON.stringify({
          title,
          description,
          duration: duration || undefined,
          thumbnailUrl: thumbnailUrl || undefined,
        }),
        token
      );

      setMessage('Course created successfully!');
      setTitle('');
      setDescription('');
      setDuration('');
      setThumbnailUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to create course.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
        <h1>Create Course</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <input
            type="text"
            placeholder="Duration (e.g., 2h 30m)"
            value={duration}
            onChange={e => setDuration(e.target.value)}
          />
          <input
            type="text"
            placeholder="Thumbnail URL"
            value={thumbnailUrl}
            onChange={e => setThumbnailUrl(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Course'}
          </button>
        </form>
        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </>
  );
}

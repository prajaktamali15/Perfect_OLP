// src/pages/courses/[id]/add-prerequisite.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../../../components/Header';
import { getAllCourses, addPrerequisite } from '../../../services/courseService';

interface Course {
  id: number;
  title: string;
}

export default function AddPrerequisitePage() {
  const router = useRouter();
  const { id } = router.query;

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token || !id) return;

    async function fetchCourses() {
      try {
        const allCourses: Course[] = await getAllCourses();
        // Exclude current course from selection
        setCourses(allCourses.filter(c => c.id !== Number(id)));
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Unable to load courses.');
      }
    }

    fetchCourses();
  }, [id, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id || !selectedCourseId) return;

    setLoading(true);
    setMessage('');
    setError('');

    try {
      await addPrerequisite(Number(id), selectedCourseId, token);
      setMessage('Prerequisite added successfully!');
      setSelectedCourseId(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to add prerequisite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
        <h1>Add Prerequisite</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Select Prerequisite Course:</label>
            <select
              value={selectedCourseId ?? ''}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            >
              <option value="">-- Select a course --</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0070f3',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Adding...' : 'Add Prerequisite'}
          </button>
        </form>
        {message && <p style={{ color: 'green', marginTop: '1rem' }}>{message}</p>}
        {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
      </div>
    </>
  );
}

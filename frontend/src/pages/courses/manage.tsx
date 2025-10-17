// src/pages/courses/manage.tsx
import { useEffect, useState } from 'react';
import Header from '../../components/Header';

interface Course {
  id: number;
  title: string;
  description: string;
}

export default function ManageCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCourse, setNewCourse] = useState({ title: '', description: '' });
  const [lessonData, setLessonData] = useState({ title: '', content: '', courseId: 0 });
  const [prereqData, setPrereqData] = useState({ courseId: 0, prerequisiteId: 0 });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) return;

    const fetchCourses = async () => {
      try {
        const res = await fetch('http://localhost:4000/courses/auth', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch courses');
        const data: Course[] = await res.json();
        setCourses(data);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [token]);

  const refreshCourses = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:4000/courses/auth', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch courses');
      const data: Course[] = await res.json();
      setCourses(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  };

  const handleCreateCourse = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:4000/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newCourse),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create course');
      alert('Course created successfully!');
      setNewCourse({ title: '', description: '' });
      await refreshCourses();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddLesson = async () => {
    if (!token || lessonData.courseId === 0) return alert('Select a course');
    try {
      const res = await fetch(`http://localhost:4000/courses/${lessonData.courseId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: lessonData.title, content: lessonData.content }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to add lesson');
      }
      alert('Lesson added successfully!');
      setLessonData({ title: '', content: '', courseId: 0 });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddPrerequisite = async () => {
    if (!token || prereqData.courseId === 0 || prereqData.prerequisiteId === 0)
      return alert('Select both course and prerequisite');
    try {
      const res = await fetch(`http://localhost:4000/courses/${prereqData.courseId}/prerequisites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prerequisiteId: prereqData.prerequisiteId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to add prerequisite');
      }
      alert('Prerequisite added successfully!');
      setPrereqData({ courseId: 0, prerequisiteId: 0 });
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <>
      <Header />
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Manage Courses</h1>

        {/* Create New Course */}
        <section style={{ marginBottom: '2rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
          <h2>Create New Course</h2>
          <input
            type="text"
            placeholder="Title"
            value={newCourse.title}
            onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
            style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
          />
          <textarea
            placeholder="Description"
            value={newCourse.description}
            onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
            style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
          />
          <button onClick={handleCreateCourse} style={{ padding: '0.5rem 1rem' }}>Create Course</button>
        </section>

        {/* Add Lesson */}
        <section style={{ marginBottom: '2rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
          <h2>Add Lesson</h2>
          <select
            value={lessonData.courseId}
            onChange={e => setLessonData({ ...lessonData, courseId: Number(e.target.value) })}
            style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
          >
            <option value={0}>Select Course</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Lesson Title"
            value={lessonData.title}
            onChange={e => setLessonData({ ...lessonData, title: e.target.value })}
            style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
          />
          <textarea
            placeholder="Lesson Content"
            value={lessonData.content}
            onChange={e => setLessonData({ ...lessonData, content: e.target.value })}
            style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
          />
          <button onClick={handleAddLesson} style={{ padding: '0.5rem 1rem' }}>Add Lesson</button>
        </section>

        {/* Add Prerequisite */}
        <section style={{ marginBottom: '2rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
          <h2>Add Prerequisite</h2>
          <select
            value={prereqData.courseId}
            onChange={e => setPrereqData({ ...prereqData, courseId: Number(e.target.value) })}
            style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
          >
            <option value={0}>Select Course</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
          <select
            value={prereqData.prerequisiteId}
            onChange={e => setPrereqData({ ...prereqData, prerequisiteId: Number(e.target.value) })}
            style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
          >
            <option value={0}>Select Prerequisite</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
          <button onClick={handleAddPrerequisite} style={{ padding: '0.5rem 1rem' }}>Add Prerequisite</button>
        </section>

        {/* Course List */}
        <section>
          <h2>Existing Courses</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {courses.map(course => (
              <li key={course.id} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

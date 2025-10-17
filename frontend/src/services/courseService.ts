const API_BASE = 'http://localhost:4000/courses'; // Make sure this points to your backend

const getToken = (token?: string) => {
  if (token) return token;
  if (typeof window !== 'undefined') return localStorage.getItem('token');
  return null;
};

export const getAllCourses = async () => {
  const res = await fetch(`${API_BASE}/public`);
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
};

export const getCourseById = async (id: number) => {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch course details');
  return res.json();
};

export const createCourse = async (title: string, description?: string, token?: string) => {
  const authToken = getToken(token);
  if (!authToken) throw new Error('Authorization token is missing');

  const res = await fetch(`${API_BASE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ title, description }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create course');
  return data;
};

export const addLesson = async (
  courseId: number,
  title: string,
  content?: string,
  videoUrl?: string,
  token?: string,
) => {
  const authToken = getToken(token);
  if (!authToken) throw new Error('Authorization token is missing');

  const res = await fetch(`${API_BASE}/${courseId}/lessons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ title, content, videoUrl }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to add lesson');
  return data;
};

export const addPrerequisite = async (
  courseId: number,
  prerequisiteId: number,
  token?: string,
) => {
  const authToken = getToken(token);
  if (!authToken) throw new Error('Authorization token is missing');

  const res = await fetch(`${API_BASE}/${courseId}/prerequisites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ prerequisiteId }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to add prerequisite');
  return data;
};

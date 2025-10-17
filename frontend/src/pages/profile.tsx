import { useEffect, useState } from 'react';
import Header from '../components/Header';
import ProfileForm from '../components/ProfileForm';
import EnrollmentList from '../components/EnrollmentList';
import { useRouter } from 'next/router';

interface User {
  id: number;
  email: string;
  name?: string;
  role: string;
}

interface Enrollment {
  id: number;
  course: { id: number; title: string; completed: boolean };
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      router.replace('/auth/login');
      return;
    }

    async function fetchProfile() {
      try {
        const resUser = await fetch('http://localhost:4000/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await resUser.json();
        setUser(userData);

        const resEnroll = await fetch('http://localhost:4000/users/me/enrollments', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const enrollData = await resEnroll.json();
        setEnrollments(enrollData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [router, token]);

  const handleUpdate = async (data: { name?: string; password?: string }) => {
    const res = await fetch('http://localhost:4000/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    const updatedUser = await res.json();
    setUser(updatedUser);
  };

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!user) return <p>No user data</p>;

  return (
    <>
      <Header />
      <div className="max-w-xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <ProfileForm user={user} token={token!} onUpdate={handleUpdate} />
        <h2 className="text-xl font-semibold mb-2">My Enrollments</h2>
        <EnrollmentList enrollments={enrollments} />
      </div>
    </>
  );
}

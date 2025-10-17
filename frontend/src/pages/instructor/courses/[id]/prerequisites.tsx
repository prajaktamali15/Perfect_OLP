import { useRouter } from 'next/router';
import { useState } from 'react';
import InstructorLayout from '../../../../components/InstructorLayout';
import { addPrerequisite } from '../../../../lib/api';

export default function PrerequisitesPage() {
  const router = useRouter();
  const { id } = router.query; // course ID

  const [prerequisite, setPrerequisite] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prerequisite.trim()) return alert('Prerequisite name is required');

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      await addPrerequisite(Number(id), prerequisite, token);
      alert('Prerequisite added successfully!');
      setPrerequisite('');
    } catch (err) {
      console.error(err);
      alert('Failed to add prerequisite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <InstructorLayout>
      <h1 className="text-2xl font-bold mb-4">Add Prerequisites for Course {id}</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow max-w-md">
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Prerequisite Name</label>
          <input
            type="text"
            value={prerequisite}
            onChange={(e) => setPrerequisite(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Prerequisite'}
        </button>
      </form>
    </InstructorLayout>
  );
}

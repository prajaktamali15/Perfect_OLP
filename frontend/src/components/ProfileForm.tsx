import { useState } from 'react';

interface ProfileFormProps {
  user: { name?: string; email: string };
  token: string;
  onUpdate: (data: { name?: string; password?: string }) => Promise<void>;
}

export default function ProfileForm({ user, token, onUpdate }: ProfileFormProps) {
  const [name, setName] = useState(user.name || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await onUpdate({ name, password: password || undefined });
      setMessage('Profile updated successfully');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Update failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="mb-4">
        <label className="block font-semibold mb-1">Email</label>
        <input 
          type="email" 
          value={user.email} 
          disabled 
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Name</label>
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Password</label>
        <input 
          type="password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          placeholder="Leave blank to keep current" 
          className="w-full p-2 border rounded"
        />
      </div>

      <button 
        type="submit" 
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Update Profile
      </button>

      {message && <p className="text-green-600 mt-2">{message}</p>}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </form>
  );
}

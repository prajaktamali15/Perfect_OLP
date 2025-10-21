import React, { useState, useEffect } from 'react';
import { apiClient, createAuthenticatedClient, handleApiError } from '../lib/api-client';
import type { paths } from '../lib/generated-api';

// Example component showing how to use the generated API client
export default function ApiClientExample() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Example: Fetch courses using the typed API client
  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Using the typed API client
      const response = await apiClient.getCourses();
      setCourses(response as any[]);
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  // Example: Authenticated request
  const fetchInstructorCourses = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found');
      return;
    }

    try {
      // Create authenticated client
      const authClient = createAuthenticatedClient(token);
      const response = await authClient.getInstructorCourses();
      console.log('Instructor courses:', response);
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
    }
  };

  // Example: Create course with file upload
  const createCourseWithThumbnail = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found');
      return;
    }

    try {
      const authClient = createAuthenticatedClient(token);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', 'New Course');
      formData.append('description', 'Course description');
      formData.append('categoryId', '1');
      formData.append('difficulty', 'Beginner');
      
      // Add thumbnail file if available
      const thumbnailInput = document.getElementById('thumbnail') as HTMLInputElement;
      if (thumbnailInput?.files?.[0]) {
        formData.append('thumbnail', thumbnailInput.files[0]);
      }

      const response = await authClient.createCourse(formData);
      console.log('Course created:', response);
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo.message);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">OpenAPI Client Example</h1>
      
      <div className="space-y-6">
        {/* Public Courses */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Public Courses</h2>
          {loading && <p>Loading courses...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {courses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course: any) => (
                <div key={course.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{course.title}</h3>
                  <p className="text-gray-600 text-sm">{course.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Difficulty: {course.difficulty}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Authenticated Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Authenticated Actions</h2>
          <div className="space-y-4">
            <button
              onClick={fetchInstructorCourses}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Fetch Instructor Courses
            </button>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">Thumbnail Upload:</label>
              <input
                id="thumbnail"
                type="file"
                accept="image/*"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                onClick={createCourseWithThumbnail}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Create Course with Thumbnail
              </button>
            </div>
          </div>
        </div>

        {/* API Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">API Client Features</h2>
          <ul className="space-y-2 text-sm">
            <li>✅ <strong>Type Safety:</strong> Full TypeScript support with generated types</li>
            <li>✅ <strong>Authentication:</strong> Automatic token handling</li>
            <li>✅ <strong>Error Handling:</strong> Consistent error management</li>
            <li>✅ <strong>File Uploads:</strong> Support for FormData and file uploads</li>
            <li>✅ <strong>Auto-completion:</strong> IntelliSense for all API endpoints</li>
            <li>✅ <strong>Easy Regeneration:</strong> Run <code>pnpm run generate-api</code> to update</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

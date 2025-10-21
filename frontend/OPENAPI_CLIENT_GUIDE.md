# OpenAPI Client Documentation

## Overview

This project now includes a fully typed OpenAPI client generated from your NestJS backend's Swagger/OpenAPI specification. The client provides type-safe API calls with full IntelliSense support.

## Files Generated

- `frontend/src/lib/generated-api.ts` - Auto-generated TypeScript types from your OpenAPI spec
- `frontend/src/lib/api-client.ts` - Wrapper class for easy API usage
- `frontend/src/components/ApiClientExample.tsx` - Example component showing usage

## Quick Start

### 1. Basic Usage

```typescript
import { apiClient } from '../lib/api-client';

// Fetch public courses
const courses = await apiClient.getCourses();

// Health check
const health = await apiClient.healthCheck();
```

### 2. Authenticated Requests

```typescript
import { createAuthenticatedClient } from '../lib/api-client';

const token = localStorage.getItem('token');
const authClient = createAuthenticatedClient(token);

// Fetch instructor courses
const instructorCourses = await authClient.getInstructorCourses();

// Create course with thumbnail
const formData = new FormData();
formData.append('title', 'New Course');
formData.append('thumbnail', thumbnailFile);

const newCourse = await authClient.createCourse(formData);
```

### 3. Error Handling

```typescript
import { handleApiError } from '../lib/api-client';

try {
  const courses = await apiClient.getCourses();
} catch (error) {
  const errorInfo = handleApiError(error);
  console.error('API Error:', errorInfo.message);
}
```

## Available Methods

### Authentication
- `login(credentials)` - User login
- `register(userData)` - User registration
- `setAuthToken(token)` - Set authentication token
- `removeAuthToken()` - Remove authentication token

### Courses
- `getCourses()` - Get all public courses
- `getCourseById(id)` - Get specific course
- `createCourse(courseData)` - Create new course
- `updateCourse(id, courseData)` - Update course
- `deleteCourse(id)` - Delete course

### Instructor Operations
- `getInstructorCourses()` - Get instructor's courses
- `getInstructorProfile()` - Get instructor profile
- `updateInstructorProfile(data)` - Update instructor profile
- `getCategories()` - Get course categories
- `searchCourses(query)` - Search courses

### Lessons
- `addLesson(courseId, lessonData)` - Add lesson to course
- `updateLesson(lessonId, lessonData)` - Update lesson
- `deleteLesson(lessonId)` - Delete lesson
- `reorderLessons(courseId, lessonIds)` - Reorder lessons

### Student Operations
- `enrollInCourse(courseId)` - Enroll in course
- `getMyCourses()` - Get enrolled courses
- `getCourseProgress(courseId)` - Get course progress
- `markLessonComplete(courseId, lessonId)` - Mark lesson complete

### Analytics
- `getInstructorAnalytics()` - Get instructor analytics
- `getTotalStudents()` - Get total students count
- `getCompletionRate()` - Get completion rate

## Regenerating the Client

When you make changes to your backend API, regenerate the client:

```bash
# Make sure your backend is running
cd backend
npm run start:dev

# In another terminal, regenerate the client
cd frontend
pnpm run generate-api
```

## Type Safety Benefits

### 1. Full IntelliSense Support
```typescript
// You get autocomplete for all available methods
apiClient. // <- IntelliSense shows all available methods
```

### 2. Type-Safe Parameters
```typescript
// TypeScript will catch incorrect parameter types
apiClient.getCourseById("invalid"); // ❌ Error: expects number
apiClient.getCourseById(123); // ✅ Correct
```

### 3. Type-Safe Responses
```typescript
// Response types are automatically inferred
const courses = await apiClient.getCourses();
// courses is typed as the correct response type
```

## File Upload Support

The client handles file uploads seamlessly:

```typescript
// Course creation with thumbnail
const formData = new FormData();
formData.append('title', 'Course Title');
formData.append('description', 'Course Description');
formData.append('thumbnail', thumbnailFile);

const course = await authClient.createCourse(formData);
```

## Configuration

### Base URL
The default base URL is `http://localhost:4000`. To change it:

```typescript
import { ApiClient } from '../lib/api-client';

const customClient = new ApiClient('https://your-api.com');
```

### Timeout
Default timeout is 10 seconds. You can modify this in the `api-client.ts` file.

## Error Handling

The client provides consistent error handling:

```typescript
try {
  const result = await apiClient.someMethod();
} catch (error) {
  const errorInfo = handleApiError(error);
  
  if (errorInfo.status === 401) {
    // Handle authentication error
    localStorage.removeItem('token');
    router.push('/login');
  } else if (errorInfo.status === 0) {
    // Handle network error
    showNotification('Network error - please check your connection');
  } else {
    // Handle other errors
    showNotification(errorInfo.message);
  }
}
```

## Integration with Existing Code

You can gradually migrate your existing API calls to use the new client:

### Before (Old API calls)
```typescript
const response = await fetch('/api/courses', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const courses = await response.json();
```

### After (New typed client)
```typescript
const authClient = createAuthenticatedClient(token);
const courses = await authClient.getCourses();
```

## Benefits

✅ **Type Safety** - Full TypeScript support with generated types  
✅ **IntelliSense** - Auto-completion for all API endpoints  
✅ **Error Handling** - Consistent error management  
✅ **File Uploads** - Built-in support for FormData  
✅ **Authentication** - Automatic token handling  
✅ **Easy Updates** - One command to regenerate after API changes  
✅ **No Breaking Changes** - Works alongside existing code  

## Troubleshooting

### Client Generation Fails
1. Ensure your backend is running on `http://localhost:4000`
2. Check that `/api/docs-json` is accessible
3. Verify you have the latest version of `openapi-typescript`

### Type Errors
1. Regenerate the client after backend changes
2. Check that your backend Swagger annotations are correct
3. Ensure all required fields are properly documented

### Authentication Issues
1. Verify the token is valid and not expired
2. Check that the backend is properly configured for CORS
3. Ensure the Authorization header format is correct

## Next Steps

1. **Start using the client** in your existing components
2. **Gradually migrate** from manual fetch calls to the typed client
3. **Regenerate regularly** when you update your backend API
4. **Add more endpoints** to the wrapper as needed

The OpenAPI client is now ready to use and will significantly improve your development experience with full type safety and IntelliSense support!

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { paths } from './generated-api';

// Base configuration
const API_BASE_URL = 'http://localhost:4000';

// Create axios instance
const createApiClient = (baseURL: string = API_BASE_URL): AxiosInstance => {
  return axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// API Client class with typed methods
export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.client = createApiClient(baseURL);
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Remove authentication token
  removeAuthToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }

  // Generic request method with type safety
  async request<T extends keyof paths>(
    path: T,
    config: AxiosRequestConfig = {}
  ): Promise<paths[T]> {
    try {
      const response = await this.client.request({
        url: path as string,
        ...config,
      });
      return response.data;
    } catch (error) {
      console.error(`API request failed for ${path}:`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health', { method: 'GET' });
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      data: credentials,
    });
  }

  async register(userData: { name: string; email: string; password: string; role: string }) {
    return this.request('/auth/register', {
      method: 'POST',
      data: userData,
    });
  }

  // Course endpoints
  async getCourses() {
    return this.request('/courses/public', { method: 'GET' });
  }

  async getCourseById(id: number) {
    return this.request(`/courses/${id}`, { method: 'GET' });
  }

  async createCourse(courseData: any) {
    return this.request('/instructor/courses', {
      method: 'POST',
      data: courseData,
    });
  }

  async updateCourse(id: number, courseData: any) {
    return this.request(`/instructor/courses/${id}`, {
      method: 'PATCH',
      data: courseData,
    });
  }

  async deleteCourse(id: number) {
    return this.request(`/instructor/courses/${id}`, { method: 'DELETE' });
  }

  // Instructor endpoints
  async getInstructorCourses() {
    return this.request('/instructor/courses/me', { method: 'GET' });
  }

  async getInstructorProfile() {
    return this.request('/instructor/courses/me', { method: 'GET' });
  }

  async updateInstructorProfile(profileData: any) {
    return this.request('/instructor/courses/me', {
      method: 'PATCH',
      data: profileData,
    });
  }

  // Lesson endpoints
  async addLesson(courseId: number, lessonData: FormData) {
    return this.request(`/instructor/courses/${courseId}/lessons`, {
      method: 'POST',
      data: lessonData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async updateLesson(lessonId: number, lessonData: FormData) {
    return this.request(`/instructor/courses/lessons/${lessonId}`, {
      method: 'PATCH',
      data: lessonData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async deleteLesson(lessonId: number) {
    return this.request(`/instructor/courses/lessons/${lessonId}`, { method: 'DELETE' });
  }

  async reorderLessons(courseId: number, lessonIds: number[]) {
    return this.request(`/instructor/courses/${courseId}/lessons/reorder`, {
      method: 'PATCH',
      data: { lessonIds },
    });
  }

  // Student endpoints
  async enrollInCourse(courseId: number) {
    return this.request(`/student/courses/${courseId}/enroll`, { method: 'POST' });
  }

  async getMyCourses() {
    return this.request('/student/courses/my-courses', { method: 'GET' });
  }

  async getCourseProgress(courseId: number) {
    return this.request(`/student/courses/${courseId}/progress`, { method: 'GET' });
  }

  async markLessonComplete(courseId: number, lessonId: number) {
    return this.request(`/student/courses/${courseId}/lessons/${lessonId}/complete`, {
      method: 'POST',
    });
  }

  // Analytics endpoints
  async getInstructorAnalytics() {
    return this.request('/analytics/instructor/courses', { method: 'GET' });
  }

  async getTotalStudents() {
    return this.request('/analytics/instructor/total-students', { method: 'GET' });
  }

  async getCompletionRate() {
    return this.request('/analytics/instructor/completion-rate', { method: 'GET' });
  }

  // Categories
  async getCategories() {
    return this.request('/instructor/courses/categories', { method: 'GET' });
  }

  // Search
  async searchCourses(query: string) {
    return this.request('/instructor/courses/search', {
      method: 'GET',
      params: { query },
    });
  }
}

// Create default instance
export const apiClient = new ApiClient();

// Export types for use in components
export type { paths } from './generated-api';

// Helper function to create authenticated client
export const createAuthenticatedClient = (token: string) => {
  const client = new ApiClient();
  client.setAuthToken(token);
  return client;
};

// Helper function to handle API errors
export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      status,
      message: data?.message || 'An error occurred',
      data: data,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      status: 0,
      message: 'Network error - please check your connection',
    };
  } else {
    // Something else happened
    return {
      status: 0,
      message: error.message || 'An unexpected error occurred',
    };
  }
};

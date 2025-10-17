import { getMyCourses, getCourses, enrollInCourse } from '../lib/api';

export interface Instructor {
  id: number;
  name: string;
  email: string;
}

export interface Course {
  id: number;
  title: string;
  description: string | null;
  instructor: Instructor;
  progress: number;
  certificateUrl: string | null;
  completed: boolean;
  completionPercentage: number;
}

/**
 * Fetch the courses the student is enrolled in
 */
export const fetchMyCourses = async (token: string): Promise<Course[]> => {
  const res = await getMyCourses(token); // res is already Course[]
  return res.map((c: any) => ({
    ...c,
    completionPercentage: c.progress ?? 0,
    completed: (c.progress ?? 0) >= 100,
  }));
};

/**
 * Fetch all courses available
 */
export const fetchAllCourses = async (token: string): Promise<Course[]> => {
  const res = await getCourses(token); // res is already Course[]
  return res.map((c: any) => ({
    ...c,
    completionPercentage: c.progress ?? 0,
    completed: (c.progress ?? 0) >= 100,
  }));
};

/**
 * Enroll the student in a course
 */
export const enrollInCourseById = async (token: string, courseId: number): Promise<Course> => {
  const res = await enrollInCourse(token, courseId); // res is already Course
  return {
    ...res,
    completionPercentage: res.progress ?? 0,
    completed: (res.progress ?? 0) >= 100,
  };
};

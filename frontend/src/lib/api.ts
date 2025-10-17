export const API_BASE_URL = "http://localhost:4000";
import axios from "axios";
// -------------------- AUTH --------------------
export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  role: "STUDENT" | "INSTRUCTOR";
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    name?: string | null;
    role: "STUDENT" | "INSTRUCTOR";
  };
}

export async function registerUser(
  data: RegisterData
): Promise<{ authResponse?: AuthResponse; message?: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to register user");
  return { authResponse: json.authResponse, message: json.message };
}

export async function loginUser(data: { email: string; password: string }): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to login");
  }
  return res.json();
}

// -------------------- COURSES & LESSONS --------------------
export interface Instructor {
  id: number;
  name: string | null;
  email: string;
}

export interface Lesson {
  id?: number;
  title: string;
  content?: string;
  videoUrl?: string;
  attachmentUrl?: string;
  duration?: string;
  order?: number;
}

export interface Course {
  id: number;
  title: string;
  description: string | null;
  categoryId?: number;
  category?: { id: number; name: string };
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  instructor?: Instructor | null;
  lessons?: Lesson[];
  prerequisites?: { id: number; title: string }[];
  enrolledCount?: number;
  enrollments?: { id: number; studentId: number }[];
  thumbnailUrl?: string;
  duration?: string;
  // client-computed fields used in UI
  enrolled?: boolean;
  progress?: number;
  certificateUrl?: string | null;
}

function normalizeResponse(json: any): Course[] {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

// -------------------- COURSES & LESSONS --------------------

// Fetch categories dynamically
export async function getCategories(token: string) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses/categories`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to fetch categories");
  }

  return res.json();
}


// -------------------- LESSON FORM DATA --------------------
export interface LessonFormData {
  title: string;
  content?: string;
  videoFile?: File | null;
  attachmentFile?: File | null;
}

// -------------------- CREATE / UPDATE COURSE --------------------
export interface CreateCoursePayload {
  title: string;
  description?: string;
  prerequisites?: string[];
  categoryId?: number; 
  difficulty?: string;
  duration?: string;
  thumbnail?: File | null;
}

export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  lessons?: FormData[]; // each lesson as FormData
  prerequisites?: string[];
}

export async function createCourse(data: CreateCoursePayload, token: string) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create course");
  }
  const json = await res.json();
  return json.course;
}

export async function updateCourse(id: number, data: UpdateCoursePayload, token: string) {
  const hasFiles = data.lessons?.some((lesson) => lesson instanceof FormData);

  if (hasFiles) {
    const formData = new FormData();
    if (data.title) formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    if (data.prerequisites) formData.append("prerequisites", JSON.stringify(data.prerequisites));

    // Append all lessons FormData into one FormData
    data.lessons?.forEach((lessonFormData, index) => {
      for (const [key, value] of (lessonFormData as FormData).entries()) {
        formData.append(`lessons[${index}][${key}]`, value as any);
      }
    });

    const res = await fetch(`${API_BASE_URL}/instructor/courses/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update course");
    }
    return res.json();
  } else {
    const res = await fetch(`${API_BASE_URL}/instructor/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update course");
    }
    return res.json();
  }
}

// -------------------- LESSONS --------------------
export async function addLesson(courseId: number, formData: FormData, token: string) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses/${courseId}/lessons`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to add lesson");
  }
  return res.json();
}

export async function updateLesson(lessonId: number, formData: FormData, token: string) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses/lessons/${lessonId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update lesson");
  }
  return res.json();
}


export async function reorderLessons(courseId: number, lessonIds: number[], token: string) {
  const res = await fetch(`http://localhost:4000/instructor/courses/${courseId}/lessons/reorder`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ lessonIds }), // <-- must be an object with `lessonIds` key
  });

  if (!res.ok) throw new Error("Failed to reorder lessons");
  return res.json();
}





export async function deleteLesson(lessonId: number, token: string) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses/lessons/${lessonId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete lesson");
  }
  return res.json();
}

// -------------------- FETCH COURSES --------------------
export async function getInstructorCourses(token: string): Promise<Course[]> {
  const res = await fetch(`${API_BASE_URL}/courses/instructor/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch courses");
  return res.json();
}

export async function getInstructorAnalytics(token: string) {
  const res = await fetch(`${API_BASE_URL}/analytics/instructor/courses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch instructor analytics");
  return res.json();
}

export async function getCourses(token: string): Promise<Course[]> {
  const res = await fetch(`${API_BASE_URL}/courses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch courses");
  const json = await res.json();
  return normalizeResponse(json);
}

export async function getAllCourses(): Promise<Course[]> {
  const res = await fetch(`${API_BASE_URL}/courses/public`);
  if (!res.ok) throw new Error("Failed to fetch courses");
  const json = await res.json();
  return normalizeResponse(json);
}

export async function getCourseById(id: string | number, token?: string) {
  const res = await fetch(`${API_BASE_URL}/courses/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error("Failed to fetch course");
  return res.json();
}

// -------------------- DELETE COURSE --------------------
export async function deleteCourse(courseId: number, token: string) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses/${courseId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete course");
  }
  return res.json();
}

// -------------------- ENROLLMENTS --------------------
export async function getMyCourses(token: string): Promise<Course[]> {
  const res = await fetch(`${API_BASE_URL}/enrollments/my-courses`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    // Try to read error message from backend
    let errorMsg = "Failed to fetch enrolled courses";
    try {
      const errorJson = await res.json();
      errorMsg = errorJson.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  const json = await res.json();
  return normalizeResponse(json);
}


export async function enrollInCourse(token: string, courseId: number | string) {
  const res = await fetch(`${API_BASE_URL}/enrollments/course/${courseId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Enrollment failed");
  return json;
}

export async function completeLesson(token: string, courseId: number, lessonId: number) {
  const res = await fetch(`${API_BASE_URL}/enrollments/course/${courseId}/complete-lesson`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ lessonId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to mark lesson as completed");
  return json;
}

// -------------------- CERTIFICATE --------------------
export async function generateCertificate(courseId: number): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/enrollments/course/${courseId}/generate-certificate`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (!res.ok) throw new Error("Failed to generate certificate");
    const data = await res.json();
    return data.certificateUrl;
  } catch (err: any) {
    alert(err.message);
    return null;
  }
}


export async function addPrerequisite(courseId: number, prerequisiteName: string, token: string) {
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/prerequisites`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ prerequisiteName }),
  });
  if (!res.ok) throw new Error("Failed to add prerequisite");
  return res.json();
}




















// export const API_BASE_URL = "http://localhost:4000"; // Backend URL

// // -------------------- AUTH --------------------
// export interface RegisterData {
//   email: string;
//   password: string;
//   name?: string;
//   role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
// }

// export interface AuthResponse {
//   access_token: string;
//   user: {
//     id: number;
//     email: string;
//     name?: string | null;
//     role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
//   };
// }

// export async function registerUser(
//   data: RegisterData
// ): Promise<{ authResponse?: AuthResponse; message?: string }> {
//   const res = await fetch(`${API_BASE_URL}/auth/register`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(data),
//   });

//   const json = await res.json();
//   if (!res.ok) throw new Error(json.message || "Failed to register user");

//   return { authResponse: json.authResponse, message: json.message };
// }

// export async function loginUser(data: {
//   email: string;
//   password: string;
// }): Promise<AuthResponse> {
//   const res = await fetch(`${API_BASE_URL}/auth/login`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(data),
//   });

//   if (!res.ok) {
//     const error = await res.json();
//     throw new Error(error.message || "Failed to login");
//   }

//   return res.json();
// }

// // -------------------- STUDENT --------------------
// export interface Instructor {
//   id: number;
//   name: string | null;
//   email: string;
// }

// export interface Lesson {
//   id?: number;
//   title: string;
//   content?: string;
//   videoUrl?: string;
//   attachmentUrl?: string;
// }

// export interface Course {
//   id: number;
//   title: string;
//   description: string | null;
//   instructor?: Instructor | null;
//   enrolled?: boolean;
//   completed?: boolean;
//   progress?: number;
//   certificateUrl?: string | null;
//   lessons?: Lesson[];
//   prerequisites?: { id: number; title: string }[];
//   enrolledCount?: number;
//   enrollments?: { id: number; studentId: number }[];
//   status: "DRAFT" | "PENDING" | "PUBLISHED"; 
// }

// function normalizeResponse(json: any): Course[] {
//   if (Array.isArray(json)) return json;
//   if (Array.isArray(json?.data)) return json.data;
//   return [];
// }

// // -------------------- COURSES --------------------
// export interface CreateCoursePayload {
//   title: string;
//   description?: string;
//   lessons?: Lesson[];
//   prerequisites?: string[];
// }

// export async function createCourse(
//   data: CreateCoursePayload,
//   token: string
// ) {
//   const res = await fetch(`${API_BASE_URL}/instructor/courses`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//     body: JSON.stringify(data),
//   });

//   if (!res.ok) {
//     const err = await res.json().catch(() => ({}));
//     throw new Error(err.message || "Failed to create course");
//   }

//   const json = await res.json();
//   return json.course; // <-- return course object to get ID
// }

// // -------------------- LESSONS --------------------
// export interface LessonFormData {
//   title: string;
//   content?: string;
//   videoFile?: File | null;
//   attachmentFile?: File | null;
// }

// export async function addLesson(courseId: number, lesson: LessonFormData, token: string) {
//   const formData = new FormData();
//   formData.append("title", lesson.title);
//   if (lesson.content) formData.append("content", lesson.content);
//   if (lesson.videoFile) formData.append("videoFile", lesson.videoFile);
//   if (lesson.attachmentFile) formData.append("attachmentFile", lesson.attachmentFile);

//   const res = await fetch(`${API_BASE_URL}/instructor/courses/${courseId}/lessons`, {
//     method: "POST",
//     headers: { Authorization: `Bearer ${token}` },
//     body: formData,
//   });

//   if (!res.ok) {
//     const err = await res.json().catch(() => ({}));
//     throw new Error(err.message || "Failed to add lesson");
//   }

//   return res.json();
// }




// // -------------------- UPDATE COURSE --------------------
// export interface LessonPayload {
//   id?: number;
//   title: string;
//   content?: string;
//   videoFile?: File | null;
//   attachmentFile?: File | null;
//   videoUrl?: string;
//   attachmentUrl?: string;
// }

// export interface UpdateCoursePayload {
//   title?: string;
//   description?: string;
//   lessons?: LessonPayload[];
//   prerequisites?: string[];
// }

// export async function updateCourse(
//   id: number,
//   data: UpdateCoursePayload,
//   token: string
// ) {
//   const hasFiles = data.lessons?.some((lesson) => lesson.videoFile || lesson.attachmentFile);

//   if (hasFiles) {
//     const formData = new FormData();
//     if (data.title) formData.append("title", data.title);
//     if (data.description) formData.append("description", data.description);
//     if (data.prerequisites) formData.append("prerequisites", JSON.stringify(data.prerequisites));

//     data.lessons?.forEach((lesson, idx) => {
//       formData.append(`lessons[${idx}][title]`, lesson.title);
//       if (lesson.content) formData.append(`lessons[${idx}][content]`, lesson.content);
//       if (lesson.videoFile) formData.append("videoFile", lesson.videoFile);
//       if (lesson.attachmentFile) formData.append("attachmentFile", lesson.attachmentFile);
//     });

//     const res = await fetch(`${API_BASE_URL}/instructor/courses/${id}`, {
//       method: "PATCH",
//       headers: { Authorization: `Bearer ${token}` },
//       body: formData,
//     });

//     if (!res.ok) {
//       const err = await res.json().catch(() => ({}));
//       throw new Error(err.message || "Failed to update course");
//     }

//     return res.json();
//   } else {
//     const res = await fetch(`${API_BASE_URL}/instructor/courses/${id}`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//       body: JSON.stringify(data),
//     });

//     if (!res.ok) {
//       const err = await res.json().catch(() => ({}));
//       throw new Error(err.message || "Failed to update course");
//     }

//     return res.json();
//   }
// }

// // -------------------- FETCH COURSES --------------------
// export async function getInstructorCourses(token: string): Promise<Course[]> {
//   const res = await fetch(`${API_BASE_URL}/courses/instructor/me`, {
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//   });
//   if (!res.ok) throw new Error("Failed to fetch courses");
//   return res.json();
// }

// export async function getCourses(token?: string): Promise<Course[]> {
//   const url = token ? `${API_BASE_URL}/courses/auth` : `${API_BASE_URL}/courses/public`;
//   const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
//   const json = await res.json();
//   if (!res.ok) throw new Error(json.message || "Failed to fetch courses");
//   return normalizeResponse(json);
// }

// export async function getPublicCourses(): Promise<Course[]> {
//   const res = await fetch(`${API_BASE_URL}/courses/public`);
//   const json = await res.json();
//   if (!res.ok) throw new Error(json.message || "Failed to fetch public courses");
//   return normalizeResponse(json);
// }

// export async function getAllCourses(token: string): Promise<Course[]> {
//   const res = await fetch(`${API_BASE_URL}/courses/all`, {
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   const json = await res.json();
//   if (!res.ok) throw new Error(json.message || "Failed to fetch all courses");
//   return normalizeResponse(json);
// }

// // -------------------- ENROLLMENTS --------------------
// export async function getMyCourses(token: string): Promise<Course[]> {
//   const res = await fetch(`${API_BASE_URL}/enrollments/my-courses`, {
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   const json = await res.json();
//   if (!res.ok) throw new Error(json.message || "Failed to fetch enrolled courses");
//   return normalizeResponse(json);
// }

// export async function enrollInCourse(token: string, courseId: number | string) {
//   const res = await fetch(`${API_BASE_URL}/enrollments/course/${courseId}`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//   });
//   const json = await res.json();
//   if (!res.ok) throw new Error(json.message || "Enrollment failed");
//   return json;
// }

// export async function completeLesson(token: string, courseId: number, lessonId: number) {
//   const res = await fetch(`${API_BASE_URL}/enrollments/course/${courseId}/complete-lesson`, {
//     method: "PATCH",
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//     body: JSON.stringify({ lessonId }),
//   });
//   const json = await res.json();
//   if (!res.ok) throw new Error(json.message || "Failed to mark lesson as completed");
//   return json;
// }

// // -------------------- LESSONS & PREREQUISITES --------------------
// export async function addPrerequisite(courseId: number, prerequisiteName: string, token: string) {
//   const res = await fetch(`${API_BASE_URL}/courses/${courseId}/prerequisites`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//     body: JSON.stringify({ prerequisiteName }),
//   });
//   if (!res.ok) throw new Error("Failed to add prerequisite");
//   return res.json();
// }

// // -------------------- ANALYTICS --------------------
// export async function getCourseAnalytics(token: string) {
//   const res = await fetch(`${API_BASE_URL}/analytics/instructor/courses`, {
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   if (!res.ok) throw new Error("Failed to fetch analytics");
//   return res.json();
// }

// export async function getInstructorAnalytics(token: string) {
//   const res = await fetch(`${API_BASE_URL}/analytics/instructor/courses`, {
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   if (!res.ok) throw new Error("Failed to fetch instructor analytics");
//   return res.json();
// }

// // -------------------- COURSE BY ID --------------------
// export async function getCourseById(id: string | number, token: string) {
//   const res = await fetch(`${API_BASE_URL}/courses/${id}`, {
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   if (!res.ok) throw new Error("Failed to fetch course");
//   return res.json();
// }

// export async function requestPublishCourse(courseId: number, token: string) {
//   const res = await fetch(`${API_BASE_URL}/courses/${courseId}/request-publish`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//   });
//   if (!res.ok) throw new Error("Failed to request publish");
//   return res.json();
// }

// export async function updateCourseStatus(
//   courseId: number,
//   status: "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED",
//   token: string
// ) {
//   const res = await fetch(`${API_BASE_URL}/courses/${courseId}/status`, {
//     method: "PATCH",
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//     body: JSON.stringify({ status }),
//   });
//   if (!res.ok) {
//     const err = await res.json();
//     throw new Error(err.message || "Failed to update course status");
//   }
//   return res.json();
// }

// // -------------------- DELETE COURSE --------------------
// export async function deleteCourse(courseId: number, token: string) {
//   const res = await fetch(`${API_BASE_URL}/instructor/courses/${courseId}`, {
//     method: "DELETE",
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   if (!res.ok) {
//     const err = await res.json().catch(() => ({}));
//     throw new Error(err.message || "Failed to delete course");
//   }
//   return res.json();
// }

// // -------------------- ADMIN --------------------
// export async function getAnalytics(token: string) {
//   const res = await fetch(`${API_BASE_URL}/analytics/courses`, {
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   const json = await res.json();
//   if (!res.ok) throw new Error(json.message || "Failed to fetch analytics");
//   return json;
// }

// export async function getAllUsers(token: string) {
//   const res = await fetch(`${API_BASE_URL}/users`, {
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   const json = await res.json();
//   if (!res.ok) throw new Error(json.message || "Failed to fetch users");
//   return json;
// }

// export async function deleteUser(userId: number | string, token: string) {
//   const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
//     method: "DELETE",
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   const json = await res.json();
//   if (!res.ok) throw new Error(json.message || "Failed to delete user");
//   return json;
// }


// // Cancel publish request → just call updateStatus
// export async function cancelPublishRequest(courseId: number, token: string) {
//   const res = await axios.patch(
//     `${API_BASE_URL}/courses/${courseId}/status`,
//     { status: "DRAFT" },
//     { headers: { Authorization: `Bearer ${token}` } }
//   );
//   return res.data;
// }


// // Approve course (Admin only)
// export async function approveCourse(courseId: number, token: string) {
//   const res = await axios.patch(
//     `${API_BASE_URL}/admin/courses/${courseId}/approve`,
//     {},
//     { headers: { Authorization: `Bearer ${token}` } }
//   );
//   return res.data;
// }

// // Reject course (Admin only)
// export async function rejectCourse(courseId: number, token: string) {
//   const res = await axios.patch(
//     `${API_BASE_URL}/admin/courses/${courseId}/reject`,
//     {},
//     { headers: { Authorization: `Bearer ${token}` } }
//   );
//   return res.data;
// }

// export async function updateLesson(
//   lessonId: number,
//   data: { title?: string; content?: string; videoFile?: File | null; attachmentFile?: File | null },
//   token: string
// ) {
//   const formData = new FormData();

//   // Append only fields that exist
//   if (data.title) formData.append("title", data.title);
//   if (data.content) formData.append("content", data.content);
//   if (data.videoFile) formData.append("videoFile", data.videoFile);
//   if (data.attachmentFile) formData.append("attachmentFile", data.attachmentFile);

//   const res = await fetch(`${API_BASE_URL}/instructor/courses/lessons/${lessonId}`, {
//     method: "PATCH",
//     headers: {
//       Authorization: `Bearer ${token}`, // only auth header
//     },
//     body: formData,
//   });

//   if (!res.ok) {
//     const err = await res.json().catch(() => ({}));
//     throw new Error(err.message || "Failed to update lesson");
//   }

//   return res.json();
// }


// export async function deleteLesson(lessonId: number, token: string) {
//   const res = await fetch(`${API_BASE_URL}/instructor/lessons/${lessonId}`, {
//     method: "DELETE",
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });

//   if (!res.ok) {
//     const err = await res.json().catch(() => ({}));
//     throw new Error(err.message || "Failed to delete lesson");
//   }

//   return res.json();
// }

// export async function generateCertificate(courseId: number): Promise<string | null> {
//   try {
//     const res = await fetch(
//       `http://localhost:4000/enrollments/course/${courseId}/generate-certificate`,
//       {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${localStorage.getItem('token')}`, // adjust if needed
//         },
//       }
//     );
//     if (!res.ok) throw new Error('Failed to generate certificate');
//     const data = await res.json();
//     return data.certificateUrl;
//   } catch (err: any) {
//     alert(err.message);
//     return null;
//   }
// }


  
















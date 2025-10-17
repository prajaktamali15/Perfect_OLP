// src/context/StudentCoursesContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";
import { Course } from "../lib/api";

interface DashboardCourse extends Course {
  enrolled: boolean;
  progress?: number;
  certificateUrl?: string | null;
}

interface StudentCoursesContextType {
  courses: DashboardCourse[];
  setCourses: React.Dispatch<React.SetStateAction<DashboardCourse[]>>;
  updateCourseProgress: (id: number, progress: number, certificateUrl?: string | null) => void;
}

const StudentCoursesContext = createContext<StudentCoursesContextType | undefined>(undefined);

export function StudentCoursesProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<DashboardCourse[]>([]);

  const updateCourseProgress = (id: number, progress: number, certificateUrl?: string | null) => {
    setCourses(prev =>
      prev.map(c =>
        c.id === id ? { ...c, progress, certificateUrl: certificateUrl ?? c.certificateUrl } : c
      )
    );
  };

  return (
    <StudentCoursesContext.Provider value={{ courses, setCourses, updateCourseProgress }}>
      {children}
    </StudentCoursesContext.Provider>
  );
}

export function useStudentCourses() {
  const ctx = useContext(StudentCoursesContext);
  if (!ctx) throw new Error("useStudentCourses must be used inside StudentCoursesProvider");
  return ctx;
}

import React from 'react';

interface CourseListProps {
  courses: any[];
}

const CourseList: React.FC<CourseListProps> = ({ courses }) => {
  return (
    <ul>
      {courses.map(course => (
        <li key={course.id}>
          <strong>{course.title}</strong> - Instructor: {course.instructor.name}
        </li>
      ))}
    </ul>
  );
};

export default CourseList;

interface Enrollment {
  id: number;
  course: {
    id: number;
    title: string;
    completed: boolean;
  };
}

interface EnrollmentListProps {
  enrollments: Enrollment[];
}

export default function EnrollmentList({ enrollments }: EnrollmentListProps) {
  if (!enrollments.length) return <p>You are not enrolled in any courses yet.</p>;

  return (
    <ul>
      {enrollments.map(e => (
        <li key={e.id} className="mb-2">
          {e.course.title} - {e.course.completed ? 'Completed ✅' : 'In Progress'}
        </li>
      ))}
    </ul>
  );
}

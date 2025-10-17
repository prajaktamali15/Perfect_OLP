import React, { useState } from 'react';

interface CourseFormProps {
  onSubmit: (title: string, description: string) => void;
}

const CourseForm: React.FC<CourseFormProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSubmit(title, description);
      }}
    >
      <input
        type="text"
        placeholder="Course Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Course Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />
      <button type="submit">Create Course</button>
    </form>
  );
};

export default CourseForm;

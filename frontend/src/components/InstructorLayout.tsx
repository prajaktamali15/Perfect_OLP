import React from 'react';
import InstructorHeader from './InstructorHeader';

interface InstructorLayoutProps {
  children: React.ReactNode;
}

export default function InstructorLayout({ children }: InstructorLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <InstructorHeader />
      <main className="p-6">
        {children} {/* This is the content area */}
      </main>
    </div>
  );
}

// src/components/CourseAnalyticsChart.tsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CourseAnalyticsChartProps {
  data: { course: string; students: number }[];
}

const CourseAnalyticsChart: React.FC<CourseAnalyticsChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div>No analytics data available.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="course" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="students" fill="#8884d8" name="Enrolled Students" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CourseAnalyticsChart;

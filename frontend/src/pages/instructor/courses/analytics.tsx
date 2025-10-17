"use client";

import { useEffect, useState } from "react";
import InstructorHeader from "../../../components/InstructorHeader";
import { getInstructorAnalytics } from "../../../lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Type for course analytics
type CourseAnalytics = {
  courseId: number;
  title: string;
  totalStudents: number;
  completionRate: number;
  lessonsCount: number;
};

export default function CourseAnalyticsPage() {
  const [analytics, setAnalytics] = useState<CourseAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    getInstructorAnalytics(token)
      .then((data) => setAnalytics(data))
      .catch((err) => console.error("Failed to fetch analytics:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center mt-4">Loading analytics...</p>;
  if (!analytics.length)
    return <p className="text-center mt-4">You have not created any courses yet.</p>;

  return (
    <div>
      <InstructorHeader />
      <div className="container mt-4">
        <h3>Course Analytics Overview</h3>

        {/* Top Overview Chart */}
        <div className="mt-4" style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={analytics}>
              <XAxis dataKey="title" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === "completionRate" ? `${value.toFixed(2)}%` : value
                }
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="totalStudents"
                name="Enrollments"
                fill="#8884d8"
              />
              <Bar
                yAxisId="right"
                dataKey="completionRate"
                name="Completion %"
                fill="#82ca9d"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <h4 className="mt-5">Per-Course Analytics</h4>
        <div className="row mt-3">
          {analytics.map((course) => (
            <div key={course.courseId} className="col-md-6 mb-4">
              <div className="card shadow-sm p-3">
                <h5>{course.title}</h5>
                <p>Total Enrollments: {course.totalStudents}</p>
                <p>Completion Rate: {course.completionRate.toFixed(2)}%</p>
                <p>Lessons: {course.lessonsCount}</p>

                {/* Small per-course chart */}
                <div style={{ width: "100%", height: 150 }}>
                  <ResponsiveContainer>
                    <BarChart data={[course]}>
                      <XAxis dataKey="title" hide />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 100]}
                        hide
                      />
                      <Tooltip
                        formatter={(value: number, name: string) =>
                          name === "completionRate" ? `${value.toFixed(2)}%` : value
                        }
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="totalStudents"
                        name="Enrollments"
                        fill="#8884d8"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="completionRate"
                        name="Completion %"
                        fill="#82ca9d"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

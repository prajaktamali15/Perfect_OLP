import { PrismaClient, Role, Difficulty } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ------------------------------
  // Seed Users
  // ------------------------------
  const instructor = await prisma.user.upsert({
    where: { email: "test.instructor@gmail.com" },
    update: {},
    create: {
      email: "test.instructor@gmail.com",
      name: "Test Instructor",
      password: "test123", 
      role: Role.INSTRUCTOR,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "test.student@gmail.com" },
    update: {},
    create: {
      email: "test.student@gmail.com",
      name: "Test Student",
      password: "test123",
      role: Role.STUDENT,
    },
  });

  // ------------------------------
  // Seed Categories
  // ------------------------------
  const categoriesData = [
    { name: "Web Development", description: "Courses about building websites" },
    { name: "Data Science", description: "Courses about data analysis and ML" },
    { name: "Design", description: "Courses about UI/UX and graphic design" },
    { name: "Marketing", description: "Courses about marketing and sales" },
  ];

  const categories = await Promise.all(
    categoriesData.map((cat) =>
      prisma.courseCategory.upsert({
        where: { name: cat.name },
        update: {},
        create: cat,
      })
    )
  );

  // ------------------------------
  // Seed Courses (4 with proper lessons)
  // ------------------------------
  const coursesData = [
    {
      title: "Web Development Intermediate",
      description: "Intermediate level web dev course",
      difficulty: Difficulty.Intermediate,
      duration: "20",
      categoryName: "Web Development",
      prerequisites: ["Basic HTML & CSS"],
      lessons: [
        {
          title: "Lesson 1",
          content: "Lesson 1 content",
          videoUrl: "/uploads/lessons/1759731303317-110368073.mp4",
          attachmentUrl: "/uploads/lessons/1759731303653-241821430.pdf",
          duration: "15 minutes",
          order: 1,
        },
      ],
    },
    {
      title: "Data Science Course",
      description: "Data Science Course Description",
      difficulty: Difficulty.Intermediate,
      duration: "30",
      categoryName: "Data Science",
      prerequisites: ["Python Basics"],
      lessons: [
        {
          title: "Lesson 1",
          content: "Introduction to Data Science",
          videoUrl: "/uploads/lessons/1759730980461-713050991.mp4",
          attachmentUrl: "/uploads/lessons/1759730980842-119086574.pdf",
          duration: "20 minutes",
          order: 1,
        },
        {
          title: "Lesson 2",
          content: "Data Science Content",
          videoUrl: "/uploads/lessons/1759730980863-215921715.mp4",
          attachmentUrl: "/uploads/lessons/1759730981335-733554909.pdf",
          duration: "25 minutes",
          order: 2,
        },
      ],
    },
    {
      title: "Marketing Course",
      description: "Marketing strategies and practices",
      difficulty: Difficulty.Beginner,
      duration: "50",
      categoryName: "Marketing",
      prerequisites: ["Marketing basics"],
      lessons: [
        {
          title: "Lesson 1",
          content: "Intro to Marketing",
          videoUrl: "/uploads/lessons/1759743387884-297927601.mp4",
          attachmentUrl: "/uploads/lessons/1759743388405-994903400.pdf",
          duration: "18 minutes",
          order: 1,
        },
        {
          title: "Lesson 2",
          content: "Marketing Deep Dive",
          videoUrl: "/uploads/lessons/1759743388432-712796809.mp4",
          attachmentUrl: "/uploads/lessons/1759743389011-942370024.pdf",
          duration: "22 minutes",
          order: 2,
        },
      ],
    },
    {
      title: "Design Course",
      description: "Design fundamentals for beginners",
      difficulty: Difficulty.Beginner,
      duration: "25",
      categoryName: "Design",
      prerequisites: ["Basic design knowledge"],
      lessons: [
        {
          title: "Lesson 1",
          content: "Introduction to Design",
          videoUrl: "/uploads/lessons/1759731117000-220656718.mp4",
          attachmentUrl: "/uploads/lessons/1759731117492-417249669.pdf",
          duration: "12 minutes",
          order: 1,
        },
        {
          title: "Lesson 2",
          content: "Advanced UI/UX",
          videoUrl: "/uploads/lessons/1759731117505-60052439.mp4",
          attachmentUrl: "/uploads/lessons/1759731117868-76955612.pdf",
          duration: "16 minutes",
          order: 2,
        },
      ],
    },
  ];

  for (const courseData of coursesData) {
    const category = categories.find((c) => c.name === courseData.categoryName);

    await prisma.course.create({
      data: {
        title: courseData.title,
        description: courseData.description,
        instructorId: instructor.id,
        categoryId: category?.id ?? 1,
        difficulty: courseData.difficulty,
        duration: courseData.duration,
        prerequisites: courseData.prerequisites,
        lessons: {
          create: courseData.lessons,
        },
      },
    });
  }

  console.log("✅ Seed data inserted successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

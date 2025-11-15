import type { Course } from "@/components/CourseModal";

// Centralized course dataset used by Courses page and search bar
export const coursesData: Course[] = [
  {
    id: "course-1",
    title: "Web Development Fundamentals",
    description:
      "Learn the basics of web development including HTML, CSS, and JavaScript. This course is perfect for beginners who want to start their journey in web development.",
    instructor: "John Doe",
    level: "Beginner",
    duration: "10 hours",
    students: 1250,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80",
    category: "Web Development",
    subcourses: [
      {
        id: "subcourse-1-1",
        title: "HTML Basics",
        description:
          "Learn the fundamentals of HTML, including tags, attributes, and document structure.",
        duration: "2 hours",
        driveLink:
          "https://drive.google.com/file/d/1OXB0_Tbd2uvwnYl54u56Ghk6h0kiF018/",
      },
      {
        id: "subcourse-1-2",
        title: "CSS Styling",
        description:
          "Master CSS styling techniques to make your websites look professional and responsive.",
        duration: "3 hours",
        driveLink:
          "https://drive.google.com/file/d/1oejVByOgZy5eEDJc_qdAzdrxDMmLBWmT/",
      },
      {
        id: "subcourse-1-3",
        title: "JavaScript Basics",
        description:
          "Introduction to JavaScript programming for web interactivity.",
        duration: "5 hours",
        driveLink:
          "https://drive.google.com/file/d/1oejVByOgZy5eEDJc_qdAzdrxDMmLBWmT/view?usp=drive_link",
      },
    ],
  },
  {
    id: "course-2",
    title: "React.js Masterclass",
    description:
      "Comprehensive guide to building modern web applications with React.js. Learn component-based architecture, state management, and more.",
    instructor: "Jane Smith",
    level: "Intermediate",
    duration: "15 hours",
    students: 980,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    category: "Frontend",
    subcourses: [
      {
        id: "subcourse-2-1",
        title: "React Fundamentals",
        description:
          "Learn the core concepts of React including components, props, and state.",
        duration: "4 hours",
        driveLink: "https://drive.google.com/file/d/example4",
      },
      {
        id: "subcourse-2-2",
        title: "Hooks in Depth",
        description:
          "Master React hooks for state management and side effects.",
        duration: "5 hours",
        driveLink: "https://drive.google.com/file/d/example5",
      },
      {
        id: "subcourse-2-3",
        title: "Building a Full Application",
        description:
          "Apply your knowledge by building a complete React application from scratch.",
        duration: "6 hours",
        driveLink: "https://drive.google.com/file/d/example6",
      },
    ],
  },
  {
    id: "course-3",
    title: "Node.js Backend Development",
    description:
      "Learn server-side JavaScript with Node.js. Build RESTful APIs, connect to databases, and create scalable backend services.",
    instructor: "Michael Johnson",
    level: "Intermediate",
    duration: "12 hours",
    students: 750,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1627398242454-45a1465c2479?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
    category: "Backend",
    subcourses: [
      {
        id: "subcourse-3-1",
        title: "Node.js Basics",
        description: "Introduction to Node.js and its core modules.",
        duration: "3 hours",
        driveLink: "https://drive.google.com/file/d/example7",
      },
      {
        id: "subcourse-3-2",
        title: "Express.js Framework",
        description: "Build web applications with the Express.js framework.",
        duration: "4 hours",
        driveLink: "https://drive.google.com/file/d/example8",
      },
      {
        id: "subcourse-3-3",
        title: "Database Integration",
        description:
          "Connect your Node.js applications to MongoDB and SQL databases.",
        duration: "5 hours",
        driveLink: "https://drive.google.com/file/d/example9",
      },
    ],
  },
  {
    id: "course-4",
    title: "UI/UX Design Principles",
    description:
      "Learn the fundamentals of user interface and user experience design. Create beautiful, intuitive designs that users love.",
    instructor: "Sarah Williams",
    level: "Beginner",
    duration: "8 hours",
    students: 1100,
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80",
    category: "Design",
    subcourses: [
      {
        id: "subcourse-4-1",
        title: "Design Fundamentals",
        description: "Learn color theory, typography, and layout principles.",
        duration: "2 hours",
        driveLink: "https://drive.google.com/file/d/example10",
      },
      {
        id: "subcourse-4-2",
        title: "User Research",
        description: "Techniques for understanding user needs and behaviors.",
        duration: "3 hours",
        driveLink: "https://drive.google.com/file/d/example11",
      },
      {
        id: "subcourse-4-3",
        title: "Prototyping",
        description: "Create interactive prototypes using Figma and other tools.",
        duration: "3 hours",
        driveLink: "https://drive.google.com/file/d/example12",
      },
    ],
  },
];

export const allCategories = Array.from(
  new Set(coursesData.map((course) => course.category))
);
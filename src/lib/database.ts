import { database } from "./firebase";
import { ref, set, get, update, remove, push, onValue, off } from "firebase/database";

// User Profile Operations
export const createUserProfile = async (userId: string, userData: {
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: number;
}) => {
  const userRef = ref(database, `users/${userId}`);
  await set(userRef, userData);
};

export const getUserProfile = async (userId: string) => {
  const userRef = ref(database, `users/${userId}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const updateUserProfile = async (userId: string, updates: any) => {
  const userRef = ref(database, `users/${userId}`);
  await update(userRef, updates);
};

// Course Progress Operations
export const saveCourseProgress = async (userId: string, courseId: string, progress: {
  completed: boolean;
  percentage: number;
  lastAccessed: number;
}) => {
  const progressRef = ref(database, `progress/${userId}/${courseId}`);
  await set(progressRef, progress);
};

export const getCourseProgress = async (userId: string, courseId: string) => {
  const progressRef = ref(database, `progress/${userId}/${courseId}`);
  const snapshot = await get(progressRef);
  return snapshot.exists() ? snapshot.val() : null;
};

export const getAllUserProgress = async (userId: string) => {
  const progressRef = ref(database, `progress/${userId}`);
  const snapshot = await get(progressRef);
  return snapshot.exists() ? snapshot.val() : {};
};

// Enrollment Operations
export const enrollInCourse = async (userId: string, courseId: string) => {
  const enrollmentRef = ref(database, `enrollments/${userId}/${courseId}`);
  await set(enrollmentRef, {
    enrolledAt: Date.now(),
    status: "active"
  });
};

export const getUserEnrollments = async (userId: string) => {
  const enrollmentsRef = ref(database, `enrollments/${userId}`);
  const snapshot = await get(enrollmentsRef);
  return snapshot.exists() ? snapshot.val() : {};
};

// Real-time Listeners
export const subscribeToUserProfile = (userId: string, callback: (data: any) => void) => {
  const userRef = ref(database, `users/${userId}`);
  onValue(userRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
  return () => off(userRef);
};

export const subscribeToCourseProgress = (userId: string, courseId: string, callback: (data: any) => void) => {
  const progressRef = ref(database, `progress/${userId}/${courseId}`);
  onValue(progressRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
  return () => off(progressRef);
};

// Comments/Discussion Operations
export const addComment = async (courseId: string, userId: string, comment: {
  text: string;
  userName: string;
  userPhoto?: string;
}) => {
  const commentsRef = ref(database, `comments/${courseId}`);
  const newCommentRef = push(commentsRef);
  await set(newCommentRef, {
    ...comment,
    userId,
    timestamp: Date.now()
  });
};

export const getCourseComments = async (courseId: string) => {
  const commentsRef = ref(database, `comments/${courseId}`);
  const snapshot = await get(commentsRef);
  return snapshot.exists() ? snapshot.val() : {};
};

export const subscribeToComments = (courseId: string, callback: (data: any) => void) => {
  const commentsRef = ref(database, `comments/${courseId}`);
  onValue(commentsRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {});
  });
  return () => off(commentsRef);
};

// Favorites/Bookmarks
export const addToFavorites = async (userId: string, courseId: string) => {
  const favoriteRef = ref(database, `favorites/${userId}/${courseId}`);
  await set(favoriteRef, {
    addedAt: Date.now()
  });
};

export const removeFromFavorites = async (userId: string, courseId: string) => {
  const favoriteRef = ref(database, `favorites/${userId}/${courseId}`);
  await remove(favoriteRef);
};

export const getUserFavorites = async (userId: string) => {
  const favoritesRef = ref(database, `favorites/${userId}`);
  const snapshot = await get(favoritesRef);
  return snapshot.exists() ? snapshot.val() : {};
};

// Analytics/Stats
export const trackCourseView = async (courseId: string) => {
  const viewsRef = ref(database, `analytics/courseViews/${courseId}`);
  const snapshot = await get(viewsRef);
  const currentViews = snapshot.exists() ? snapshot.val() : 0;
  await set(viewsRef, currentViews + 1);
};

export const getUserStats = async (userId: string) => {
  const statsRef = ref(database, `stats/${userId}`);
  const snapshot = await get(statsRef);
  return snapshot.exists() ? snapshot.val() : {
    coursesCompleted: 0,
    totalLearningTime: 0,
    streak: 0
  };
};

export const updateUserStats = async (userId: string, stats: any) => {
  const statsRef = ref(database, `stats/${userId}`);
  await update(statsRef, stats);
};

import React, { createContext, useState, useContext, useEffect } from 'react';

const DataContext = createContext(null);

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    // --- State ---
    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [books, setBooks] = useState([]);
    const [enrollments, setEnrollments] = useState([]); // { id, courseId, studentId }
    const [courseAssignments, setCourseAssignments] = useState([]); // { id, courseId, teacherId } for Teacher assignments
    const [courseBooks, setCourseBooks] = useState([]); // { id, courseId, bookId }
    const [meetings, setMeetings] = useState([]);
    const [chats, setChats] = useState([]);

    // --- Persistence Helper ---
    const API_BASE = 'http://localhost:3000/api/data';

    const loadData = async (key, setter, defaultVal = []) => {
        try {
            const res = await fetch(`${API_BASE}/${key}`);
            if (res.ok) {
                const data = await res.json();
                if (data !== null) {
                    setter(data);
                    return;
                }
            }
            throw new Error('API returned null or error');
        } catch (err) {
            console.log(`Loading ${key} from LocalStorage (Fallback)`);
            const local = localStorage.getItem(key);
            if (local) {
                setter(JSON.parse(local));
            } else {
                setter(defaultVal);
            }
        }
    };

    const saveData = async (key, data) => {
        try {
            await fetch(`${API_BASE}/${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
        } catch (err) {
            console.error(`Failed to save ${key}`, err);
            // Fallback to localStorage just in case?
            // localStorage.setItem(key, JSON.stringify(data)); 
        }
    };

    // --- Initialization ---
    // --- Initialization ---
    useEffect(() => {
        const init = async () => {
            await loadData('users', setUsers);
            await loadData('courses', setCourses);
            await loadData('books', setBooks);
            await loadData('enrollments', setEnrollments);
            await loadData('courseAssignments', setCourseAssignments);
            await loadData('courseBooks', setCourseBooks);
            await loadData('meetings', setMeetings);
            await loadData('chats', setChats);
            await loadData('suggestedCourses', setSuggestedCourses);

            // Theme Init
            const isDark = localStorage.getItem('darkMode') === 'true';
            if (isDark) document.body.classList.add('dark-mode');
            setDarkMode(isDark);
        };
        init();
    }, []);

    // --- Actions ---

    // 1. Users
    const addUser = (userData, initialCourseId = null) => {
        // Generate Registration ID
        const year = new Date().getFullYear();
        const rolePrefix = userData.role === 'admin' ? 'ADM' : userData.role === 'teacher' ? 'FAC' : 'STD';
        // Simple sequential ID based on array length + 1 (padded)
        const count = users.filter(u => u.role === userData.role).length + 1;
        const regId = `${rolePrefix}-${year}-${String(count).padStart(3, '0')}`;

        const newUser = {
            ...userData,
            id: regId,
            phone: '',
            photo: null,
            completedCourses: [],
            permissions: userData.permissions || 'standard'
        };

        const updatedUsers = [...users, newUser]; // Fixed variable name from storedUsers to users
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        saveData('users', updatedUsers); // Persist to backend

        if (initialCourseId && newUser.role === 'student') { // Changed from userData.role to newUser.role
            enrollStudent(initialCourseId, newUser.id);
        } else if (initialCourseId && newUser.role === 'teacher') { // Added teacher assignment logic
            assignTeacher(initialCourseId, newUser.id);
        }

        return newUser;
    };

    const updateUser = (id, updates) => {
        const updatedUsers = users.map(u => u.id === id ? { ...u, ...updates } : u);
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        saveData('users', updatedUsers); // Persist to backend

        // Sync with Auth Context storage if this is the current user
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser && currentUser.id === id) {
            const updatedUser = updatedUsers.find(u => u.id === id);
            localStorage.setItem('user', JSON.stringify(updatedUser)); // AuthContext reads this on refresh
        }
    };



    const markCourseComplete = (studentId, courseId) => {
        const student = users.find(u => u.id === studentId);
        if (student && !student.completedCourses?.includes(courseId)) {
            const updatedCompleted = [...(student.completedCourses || []), courseId];

            // Generate Certificate
            const course = courses.find(c => c.id === courseId);
            const certificate = {
                id: `cert-${Date.now()}`,
                type: 'certificate',
                title: `Certified in ${course ? course.title : 'Course'}`,
                description: `Successfully completed all modules of ${course ? course.title : 'the course'}.`,
                date: new Date().toISOString(),
                icon: 'workspace_premium'
            };

            const updatedAchievements = [...(student.achievements || []), certificate];
            updateUser(studentId, { completedCourses: updatedCompleted, achievements: updatedAchievements });

            // Check for Milestone Medals
            if (updatedCompleted.length === 1) awardBadge(studentId, 'first_course', { title: 'First Steps', description: 'Completed your first course!', icon: 'school' });
            if (updatedCompleted.length === 5) awardBadge(studentId, 'high_flyer', { title: 'High Flyer', description: 'Completed 5 courses.', icon: 'flight_takeoff' });
        }
    };

    const awardBadge = (userId, badgeId, meta = {}) => {
        const student = users.find(u => u.id === userId);
        if (!student) return;

        // Prevent duplicate medals unless allowed (e.g. streaks can be upgraded, but here we keep simple unique medals)
        const currentAchievements = student.achievements || [];
        if (currentAchievements.some(a => a.id === badgeId)) return;

        const newBadge = {
            id: badgeId,
            type: 'medal',
            title: meta.title || 'Achievement Unlocked',
            description: meta.description || 'You earned a new badge!',
            date: meta.date || new Date().toISOString(),
            icon: meta.icon || 'military_tech'
        };

        const updatedAchievements = [...currentAchievements, newBadge];
        updateUser(userId, { achievements: updatedAchievements });
    };

    const checkStreaks = (userId) => {
        const student = users.find(u => u.id === userId);
        if (!student) return;

        const today = new Date().toDateString();
        const lastLogin = student.lastLoginDate ? new Date(student.lastLoginDate).toDateString() : null;

        let newStreak = student.currentStreak || 0;

        if (lastLogin !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastLogin === yesterday.toDateString()) {
                newStreak += 1;
            } else {
                newStreak = 1;
            }

            updateUser(userId, { lastLoginDate: new Date().toISOString(), currentStreak: newStreak });

            if (newStreak > 0 && newStreak % 20 === 0) {
                awardBadge(userId, `streak_${newStreak}`, {
                    title: `${newStreak} Day Streak`,
                    description: `Logged in for ${newStreak} consecutive days!`,
                    icon: 'local_fire_department'
                });
            }
        }
    };

    const deleteUser = (id) => {
        const updatedUsers = users.filter(u => u.id !== id);
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        saveData('users', updatedUsers);
    };

    // 2. Courses
    const addCourse = (courseData) => {
        const newCourse = { ...courseData, id: Date.now().toString() };
        const updated = [...courses, newCourse];
        setCourses(updated);
        saveData('courses', updated);
        return newCourse;
    };

    // AI Suggested Courses Management
    const [suggestedCourses, setSuggestedCourses] = useState([]);

    const addSuggestedCourse = (topic) => {
        if (suggestedCourses.some(c => c.title === topic)) return;
        const newCourse = {
            id: `ai-${Date.now()}`,
            title: topic,
            description: 'AI Generated Adaptive Course',
            isAI: true,
            currentLevel: 1
        };
        const updated = [...suggestedCourses, newCourse];
        setSuggestedCourses(updated);
        saveData('suggestedCourses', updated);
    };

    const updateSuggestedProgress = (courseId, newLevel) => {
        const updated = suggestedCourses.map(c =>
            c.id === courseId ? { ...c, currentLevel: newLevel } : c
        );
        setSuggestedCourses(updated);
        saveData('suggestedCourses', updated);
    };

    const updateCourse = (id, updates) => {
        const updatedCourses = courses.map(c => c.id === id ? { ...c, ...updates } : c);
        setCourses(updatedCourses);
        saveData('courses', updatedCourses);
    };

    // 3. Books
    const addBook = (bookData, courseId = null) => {
        const newBook = { ...bookData, id: Date.now().toString() };
        const updated = [...books, newBook];
        setBooks(updated);
        saveData('books', updated);

        if (courseId) {
            addBookToCourse(courseId, newBook.id);
        }

        return newBook;
    };

    // 4. Relationships: Enroll Student in Course
    const enrollStudent = (courseId, studentId) => {
        if (enrollments.some(e => e.courseId === courseId && e.studentId === studentId)) return;
        const newEnrollment = { id: Date.now().toString(), courseId, studentId };
        const updated = [...enrollments, newEnrollment];
        setEnrollments(updated);
        saveData('enrollments', updated);
    };

    // 5. Relationships: Assign Teacher to Course
    const assignTeacher = (courseId, teacherId) => {
        if (courseAssignments.some(ca => ca.courseId === courseId && ca.teacherId === teacherId)) return;
        const newAssignment = { id: Date.now().toString(), courseId, teacherId };
        const updated = [...courseAssignments, newAssignment];
        setCourseAssignments(updated);
        saveData('courseAssignments', updated);
    };

    const updateCourseAssignment = (courseId, teacherId) => {
        let updated = courseAssignments.filter(ca => ca.courseId !== courseId);
        if (teacherId) {
            const newAssignment = { id: Date.now().toString(), courseId, teacherId };
            updated = [...updated, newAssignment];
        }
        setCourseAssignments(updated);
        saveData('courseAssignments', updated);
    };

    // 6. Relationships: Add Book to Course
    const addBookToCourse = (courseId, bookId) => {
        if (courseBooks.some(cb => cb.courseId === courseId && cb.bookId === bookId)) return;
        const newLink = { id: Date.now().toString(), courseId, bookId };
        const updated = [...courseBooks, newLink];
        setCourseBooks(updated);
        saveData('courseBooks', updated);
    };

    // 7. Meetings
    const scheduleMeeting = (meetingData) => {
        const newMeeting = { ...meetingData, id: Date.now().toString() };
        const updated = [...meetings, newMeeting];
        setMeetings(updated);
        saveData('meetings', updated);
    };

    // 8. Chats
    const sendMessage = (msgData) => {
        const newMsg = { ...msgData, id: Date.now().toString(), timestamp: new Date().toISOString() };
        const updated = [...chats, newMsg];
        setChats(updated);
        saveData('chats', updated);
    };

    const getChats = (userId1, userId2) => {
        return chats.filter(c =>
            (c.senderId === userId1 && c.receiverId === userId2) ||
            (c.senderId === userId2 && c.receiverId === userId1)
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    };

    // 9. Theme
    const [darkMode, setDarkMode] = useState(false);
    const toggleTheme = () => {
        setDarkMode(prev => {
            const newVal = !prev;
            localStorage.setItem('darkMode', newVal);
            if (newVal) document.body.classList.add('dark-mode');
            else document.body.classList.remove('dark-mode');
            return newVal;
        });
    };

    // --- Getters / Selectors ---
    const getStudentsForCourse = (courseId) => {
        const studentIds = enrollments.filter(e => e.courseId === courseId).map(e => e.studentId);
        return users.filter(u => studentIds.includes(u.id));
    };

    const getCoursesForStudent = (studentId) => {
        const courseIds = enrollments.filter(e => e.studentId === studentId).map(e => e.courseId);
        return courses.filter(c => courseIds.includes(c.id));
    };

    const getCoursesForTeacher = (teacherId) => {
        const courseIds = courseAssignments.filter(ca => ca.teacherId === teacherId).map(ca => ca.courseId);
        return courses.filter(c => courseIds.includes(c.id));
    };

    const getBooksForCourse = (courseId) => {
        const bookIds = courseBooks.filter(cb => cb.courseId === courseId).map(cb => cb.bookId);
        return books.filter(b => bookIds.includes(b.id));
    };

    // Get all students associated with a teacher (through all their shared courses)
    const getStudentsForTeacher = (teacherId) => {
        const teacherCourseIds = courseAssignments.filter(ca => ca.teacherId === teacherId).map(ca => ca.courseId);
        const studentIds = enrollments
            .filter(e => teacherCourseIds.includes(e.courseId))
            .map(e => e.studentId);
        // unique students
        const uniqueStudentIds = [...new Set(studentIds)];
        return users.filter(u => uniqueStudentIds.includes(u.id));
    };

    // Get all teachers associated with a student (through all their shared courses)
    const getTeachersForStudent = (studentId) => {
        const studentCourseIds = enrollments.filter(e => e.studentId === studentId).map(e => e.courseId);
        const teacherIds = courseAssignments
            .filter(ca => studentCourseIds.includes(ca.courseId))
            .map(ca => ca.teacherId);
        // unique teachers
        const uniqueTeacherIds = [...new Set(teacherIds)];
        return users.filter(u => uniqueTeacherIds.includes(u.id));
    };

    return (
        <DataContext.Provider value={{
            users, courses, books, enrollments, courseAssignments, courseBooks, meetings, chats, darkMode, suggestedCourses,
            addUser, updateUser, deleteUser, markCourseComplete,
            addCourse, updateCourse, updateCourseAssignment, addBook, enrollStudent, assignTeacher, addBookToCourse, scheduleMeeting, sendMessage, toggleTheme,
            addSuggestedCourse, updateSuggestedProgress, awardBadge, checkStreaks,
            getStudentsForCourse, getCoursesForStudent, getCoursesForTeacher, getBooksForCourse, getStudentsForTeacher, getTeachersForStudent, getChats
        }}>
            {children}
        </DataContext.Provider>
    );
};

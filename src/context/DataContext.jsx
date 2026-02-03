import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';

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
    const [tickets, setTickets] = useState([]); // { id, userId, subject, description, status, date, type }
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null, type: 'info', confirmText: 'OK', cancelText: 'Cancel' });

    // --- Persistence Helper ---
    const API_BASE = '/api/data';

    const loadData = useCallback(async (key, setter, defaultVal = []) => {
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
    }, []);

    const saveData = useCallback(async (key, data) => {
        try {
            const res = await fetch(`${API_BASE}/${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(`Server responded with ${res.status}`);
            return true;
        } catch (err) {
            console.error(`[DataContext] Failed to save ${key}:`, err);
            throw err; // Re-throw to handle in UI
        }
    }, [API_BASE]);

    // --- Initialization ---
    useEffect(() => {
        const init = async () => {
            // Parallel loading for speed
            await Promise.all([
                loadData('users', setUsers),
                loadData('courses', setCourses),
                loadData('books', setBooks),
                loadData('enrollments', setEnrollments),
                loadData('courseAssignments', setCourseAssignments),
                loadData('courseBooks', setCourseBooks),
                loadData('meetings', setMeetings),
                loadData('chats', setChats),
                loadData('tickets', setTickets),
                loadData('suggestedCourses', setSuggestedCourses)
            ]);

            // Theme Init
            const isDark = localStorage.getItem('darkMode') === 'true';
            if (isDark) document.body.classList.add('dark-mode');
            setDarkMode(isDark);
        };
        init();
    }, [loadData]); // Stable loadData dependency

    // --- Actions (Memoized) ---
    // Note: In a real app with many updates, usage of callbacks ensures the context value
    // doesn't change on every render, preventing consumers from re-rendering unless necessary.

    // 1. Users
    const addUser = useCallback((userData, initialCourseId = null) => {
        // Generate Registration ID
        const year = new Date().getFullYear();
        const rolePrefix = userData.role === 'admin' ? 'ADM' : userData.role === 'teacher' ? 'FAC' : 'STD';

        let newUser = null;

        setUsers(prevUsers => {
            const count = prevUsers.filter(u => u.role === userData.role).length + 1;
            const regId = `${rolePrefix}-${year}-${String(count).padStart(3, '0')}`;

            newUser = {
                ...userData,
                id: regId,
                phone: '',
                photo: null,
                completedCourses: [],
                permissions: userData.permissions || 'standard'
            };

            const updatedUsers = [...prevUsers, newUser];
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            saveData('users', updatedUsers);
            return updatedUsers;
        });

        // We can't access state immediately after set, but logic requires ID.
        // The Functional update pattern above makes getting 'newUser' out tricky without ref.
        // For simplicity in this demo, we re-calculate or assume synchronous success for the purpose of the next call.
        // To fix correctly: We'll do the logic *inside* or after. 
        // actually, since we calculated 'newUser' locally inside the block, we can't return it easily from setUsers.
        // Let's optimize: Calculate new user based on 'users' dependency (which changes) or just use functional update carefully.
        // For this critical path step, standard state update is better. But to fix jitter, we want fewer dep changes.
        // We'll trust the Functional Update for state, but generating the User relies on *current* state.
        // Because 'users' is in dependency array, this function is recreated when users change. That's OK.

        // Wait, for jitter fix, we want `addUser` identity to remain stable? 
        // No, it's okay if `addUser` changes when `users` change. 
        // The main jitter usually comes from Context consuming components re-rendering because *everything* changes.

        // ...Actually, to properly fix jitter, we should use functional updates for setters 
        // and avoid `users` in dependency array if possible. But here we need `users.length`.
        // So `addUser` WILL change when `users` changes. That's acceptable.

        // Let's keep the logic imperative for readability, similar to before, but wrapped in useCallback.
        return newUser; // This return is technically broken in the async/setUsers pattern above. 
        // Reverting to direct read for simplicity, assuming 'users' is up to date.
    }, [users, saveData]);
    // ^ Wait, I can't actually fix the closure issue easily without refactoring. 
    // Let's Stick to the previous implementation logic but wrapped in useCallback.
    // The previous implementation was modifying state directly based on `users`. 

    // RE-IMPLEMENTING addUser to be safer and correct:
    const addUserSafe = useCallback((userData, initialCourseId = null) => {
        let createdUser = null;
        setUsers(currentUsers => {
            const year = new Date().getFullYear();
            const rolePrefix = userData.role === 'admin' ? 'ADM' : userData.role === 'teacher' ? 'FAC' : 'STD';
            const count = currentUsers.filter(u => u.role === userData.role).length + 1;
            const regId = `${rolePrefix}-${year}-${String(count).padStart(3, '0')}`;

            const newUser = {
                ...userData,
                id: regId,
                phone: '',
                photo: null,
                completedCourses: [],
                permissions: userData.permissions || 'standard'
            };
            createdUser = newUser; // Capture for return (won't work for return value of function, but works for side effects)

            const updated = [...currentUsers, newUser];
            localStorage.setItem('users', JSON.stringify(updated));
            saveData('users', updated);

            // Side Effects (Enrollment) - tricky inside setState so we do it after or use separate effects.
            // For now, we'll execute it "optimistically" or via a timeout, or just do it separately.
            if (initialCourseId) {
                // Determine functionality based on role
                // We'll call the specific functions outside the state update to avoid conflicts, 
                // but need the ID.
                setTimeout(() => {
                    if (newUser.role === 'student') enrollStudent(initialCourseId, newUser.id);
                    else if (newUser.role === 'teacher') assignTeacher(initialCourseId, newUser.id);
                }, 0);
            }
            return updated;
        });

        // We cannot return the new user object synchronously easily if we use functional updates 
        // without a ref hack. For the UI to show the 'Success' ID, we need to return it.
        // So I will maintain the dependency on 'users' for now as it makes the specific logic simpler,
        // but `useMemo` the context value so `users` changes don't re-render unrelated components (like Course list).
        return createdUser || { id: 'PENDING' }; // Fallback
    }, [saveData]); // Removed 'users' dep by using functional update? 
    // Implementation above for `addUserSafe` captures `createdUser` in closure but can't return it to caller `handleSubmit`.

    // BACKTRACK: To support `const new = addUser(...)`, we must read `users`. 
    // Optimizing `value` with `useMemo` is the most important part for jitter.

    const addUserImperative = useCallback((userData, initialCourseId = null) => {
        // Uses 'users' from closure
        const year = new Date().getFullYear();
        const rolePrefix = userData.role === 'admin' ? 'ADM' : userData.role === 'teacher' ? 'FAC' : 'STD';
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

        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        saveData('users', updatedUsers);

        if (initialCourseId && newUser.role === 'student') {
            enrollStudent(initialCourseId, newUser.id);
        } else if (initialCourseId && newUser.role === 'teacher') {
            assignTeacher(initialCourseId, newUser.id);
        }

        return newUser;
    }, [users, saveData]); // Dep: users. This is fine.


    const updateUser = useCallback((id, updates) => {
        setUsers(prev => {
            const updated = prev.map(u => u.id === id ? { ...u, ...updates } : u);
            localStorage.setItem('users', JSON.stringify(updated));
            saveData('users', updated);

            // Auth Sync
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (currentUser && currentUser.id === id) {
                const updatedUser = updated.find(u => u.id === id);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            return updated;
        });
    }, [saveData]);

    const deleteUser = useCallback((id) => {
        setUsers(prev => {
            const updated = prev.filter(u => u.id !== id);
            localStorage.setItem('users', JSON.stringify(updated));
            saveData('users', updated);
            return updated;
        });
    }, [saveData]);

    // 2. Courses
    const addCourse = useCallback((courseData) => {
        const newCourse = { ...courseData, id: Date.now().toString(), isAI: false };

        setCourses(prev => {
            const updated = [...prev, newCourse];
            saveData('courses', updated);
            return updated;
        });
        return newCourse;
    }, [saveData]);

    // AI Suggested Courses Management
    const [suggestedCourses, setSuggestedCourses] = useState([]);

    const addSuggestedCourse = useCallback((topic) => {
        setSuggestedCourses(prev => {
            if (prev.some(c => c.title === topic)) return prev;
            const newCourse = {
                id: `ai-${Date.now()}`,
                title: topic,
                description: 'AI Generated Adaptive Course',
                isAI: true,
                currentLevel: 1
            };
            const updated = [...prev, newCourse];
            saveData('suggestedCourses', updated);
            return updated;
        });
    }, [saveData]);

    const updateSuggestedProgress = useCallback((courseId, newLevel) => {
        setSuggestedCourses(prev => {
            const updated = prev.map(c =>
                c.id === courseId ? { ...c, currentLevel: newLevel } : c
            );
            saveData('suggestedCourses', updated);
            return updated;
        });
    }, [saveData]);

    const updateCourse = useCallback((id, updates) => {
        setCourses(prev => {
            const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c);
            saveData('courses', updated);
            return updated;
        });
    }, [saveData]);

    // 3. Books
    const addBook = useCallback((bookData, courseId = null) => {
        const newBook = { ...bookData, id: Date.now().toString() };
        setBooks(prev => {
            const updated = [...prev, newBook];
            saveData('books', updated);
            return updated;
        });

        if (courseId) {
            // We can't call 'addBookToCourse' directly if we want to avoid circular deps or closure staleness issues easily?
            // Actually, `addBookToCourse` is defined below. 
            // We can rely on hoisting for function declarations, but for const assignments we need order.
            // We'll define helpers first or just duplicate the logic briefly or use a ref.
            // For now, let's assume `addBookToCourse` is stable or we access it via a ref if needed. 
            // Or, simply implement logic:
            setCourseBooks(prev => {
                const newLink = { id: Date.now().toString(), courseId, bookId: newBook.id };
                const updated = [...prev, newLink];
                saveData('courseBooks', updated);
                return updated;
            });
        }
        return newBook;
    }, [saveData]);

    // 4. Relationships
    const enrollStudent = useCallback((courseId, studentId) => {
        setEnrollments(prev => {
            if (prev.some(e => e.courseId === courseId && e.studentId === studentId)) return prev;
            const newEnrollment = { id: Date.now().toString(), courseId, studentId };
            const updated = [...prev, newEnrollment];
            saveData('enrollments', updated);
            return updated;
        });
    }, [saveData]);

    const assignTeacher = useCallback((courseId, teacherId) => {
        setCourseAssignments(prev => {
            if (prev.some(ca => ca.courseId === courseId && ca.teacherId === teacherId)) return prev;
            const newAssignment = { id: Date.now().toString(), courseId, teacherId };
            const updated = [...prev, newAssignment];
            saveData('courseAssignments', updated);
            return updated;
        });
    }, [saveData]);

    const updateCourseAssignment = useCallback((courseId, teacherId) => {
        setCourseAssignments(prev => {
            let updated = prev.filter(ca => ca.courseId !== courseId);
            if (teacherId) {
                const newAssignment = { id: Date.now().toString(), courseId, teacherId };
                updated = [...updated, newAssignment];
            }
            saveData('courseAssignments', updated);
            return updated;
        });
    }, [saveData]);

    const addBookToCourse = useCallback((courseId, bookId) => {
        setCourseBooks(prev => {
            if (prev.some(cb => cb.courseId === courseId && cb.bookId === bookId)) return prev;
            const newLink = { id: Date.now().toString(), courseId, bookId };
            const updated = [...prev, newLink];
            saveData('courseBooks', updated);
            return updated;
        });
    }, [saveData]);

    // 5. Meetings
    const scheduleMeeting = useCallback((meetingData) => {
        const newMeeting = { ...meetingData, id: Date.now().toString() };
        setMeetings(prev => {
            const updated = [...prev, newMeeting];
            saveData('meetings', updated);
            return updated;
        });
    }, [saveData]);

    // 6. Chats
    const sendMessage = useCallback((msgData) => {
        const newMsg = { ...msgData, id: Date.now().toString(), timestamp: new Date().toISOString() };
        setChats(prev => {
            const updated = [...prev, newMsg];
            saveData('chats', updated);
            return updated;
        });
    }, [saveData]);

    const getChats = useCallback((userId1, userId2) => {
        // Note: Returns a filtered array. If we want this to be memoized, we'd need useMemo inside the component
        // calling it, or return specific selector.
        // Returning the function 'getChats' is fine, but the *result* is new every time it's called.
        // Components should rely on 'chats' state and filter themselves if they want reactivity, 
        // OR we just provide this helper.
        return chats.filter(c =>
            (c.senderId === userId1 && c.receiverId === userId2) ||
            (c.senderId === userId2 && c.receiverId === userId1)
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }, [chats]);

    // 7. Tickets (New Help System)
    const addTicket = useCallback((ticketData) => { // { userId, subject, description, type }
        const newTicket = {
            ...ticketData,
            id: `TKT-${Date.now()}`,
            status: 'Open',
            date: new Date().toISOString()
        };
        setTickets(prev => {
            const updated = [newTicket, ...prev]; // Newest first
            saveData('tickets', updated);
            return updated;
        });
        return newTicket;
    }, [saveData]);

    const resolveTicket = useCallback((ticketId) => {
        setTickets(prev => {
            const updated = prev.map(t =>
                t.id === ticketId ? { ...t, status: 'Solved' } : t
            );
            saveData('tickets', updated);
            return updated;
        });
    }, [saveData]);

    // 8. Badges & Game
    const awardBadge = useCallback((userId, badgeId, meta = {}) => {
        setUsers(prev => {
            const student = prev.find(u => u.id === userId);
            if (!student) return prev;

            const currentAchievements = student.achievements || [];
            if (currentAchievements.some(a => a.id === badgeId)) return prev;

            const newBadge = {
                id: badgeId,
                type: 'medal',
                title: meta.title || 'Achievement Unlocked',
                description: meta.description || 'You earned a new badge!',
                date: meta.date || new Date().toISOString(),
                icon: meta.icon || 'military_tech'
            };

            const updatedStudent = { ...student, achievements: [...currentAchievements, newBadge] };
            const updatedUsers = prev.map(u => u.id === userId ? updatedStudent : u);

            saveData('users', updatedUsers);
            return updatedUsers;
        });
    }, [saveData]);

    const markModuleComplete = useCallback(async (studentId, courseId, moduleTitle) => {
        const sId = String(studentId).trim().toLowerCase();
        const cId = String(courseId).trim().toLowerCase();

        console.log(`[DataContext] Requesting module complete: User=${sId}, Course=${cId}, Module=${moduleTitle}`);

        const studentIndex = users.findIndex(u => String(u.id).trim().toLowerCase() === sId);
        if (studentIndex === -1) {
            console.error(`[DataContext] User not found: ${sId}`);
            return false;
        }

        const student = users[studentIndex];
        const completedModules = { ...(student.completedModules || {}) };
        const courseKey = Object.keys(completedModules).find(k => k.trim().toLowerCase() === cId) || courseId;
        const courseCompleted = [...(completedModules[courseKey] || [])];

        if (courseCompleted.includes(moduleTitle)) {
            console.log(`[DataContext] Already completed.`);
            return true;
        }

        // Calculate NEW Users list
        courseCompleted.push(moduleTitle);
        completedModules[courseKey] = courseCompleted;
        const updatedStudent = { ...student, completedModules };
        const updatedUsersList = [...users];
        updatedUsersList[studentIndex] = updatedStudent;

        // 1. Immediate Local State Update
        setUsers(updatedUsersList);

        // 2. immediate LocalStorage Sync (for auth context)
        try {
            const currentAuth = JSON.parse(localStorage.getItem('user') || '{}');
            if (String(currentAuth.id).trim().toLowerCase() === sId) {
                localStorage.setItem('user', JSON.stringify(updatedStudent));
            }
        } catch (e) { }

        // 3. Backend Persistence
        try {
            await saveData('users', updatedUsersList);
            console.log(`[DataContext] Successfully saved progress to backend.`);
            return true;
        } catch (err) {
            console.error(`[DataContext] Persistence failure:`, err);
            // We keep the local state updated but return false so the UI can notify the user
            return false;
        }
    }, [users, saveData]);

    const markCourseComplete = useCallback(async (studentId, courseId) => {
        const sId = String(studentId).trim().toLowerCase();
        const cId = String(courseId).trim().toLowerCase();

        const studentIndex = users.findIndex(u => String(u.id).trim().toLowerCase() === sId);
        if (studentIndex === -1) return false;

        const student = users[studentIndex];
        const completedCourses = [...(student.completedCourses || [])];

        if (completedCourses.some(id => String(id).trim().toLowerCase() === cId)) return true;

        completedCourses.push(courseId);
        const updatedStudent = { ...student, completedCourses };
        const updatedUsersList = [...users];
        updatedUsersList[studentIndex] = updatedStudent;

        setUsers(updatedUsersList);

        try {
            const currentAuth = JSON.parse(localStorage.getItem('user') || '{}');
            if (String(currentAuth.id).trim().toLowerCase() === sId) {
                localStorage.setItem('user', JSON.stringify(updatedStudent));
            }
        } catch (e) { }

        try {
            await saveData('users', updatedUsersList);
            return true;
        } catch (err) {
            return false;
        }
    }, [users, saveData]);

    const checkStreaks = useCallback((userId) => {
        setUsers(prev => {
            const student = prev.find(u => u.id === userId);
            if (!student) return prev;

            const today = new Date().toDateString();
            const lastLogin = student.lastLoginDate ? new Date(student.lastLoginDate).toDateString() : null;

            if (lastLogin === today) return prev; // Already logged in today

            let newStreak = student.currentStreak || 0;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastLogin === yesterday.toDateString()) {
                newStreak += 1;
            } else {
                newStreak = 1;
            }

            const updatedStudent = { ...student, lastLoginDate: new Date().toISOString(), currentStreak: newStreak };
            const updatedUsers = prev.map(u => u.id === userId ? updatedStudent : u);
            saveData('users', updatedUsers);
            return updatedUsers;
        });
    }, [saveData]);

    // 9. Theme
    const [darkMode, setDarkMode] = useState(false);
    const toggleTheme = useCallback(() => {
        setDarkMode(prev => {
            const newVal = !prev;
            localStorage.setItem('darkMode', newVal);
            if (newVal) document.body.classList.add('dark-mode');
            else document.body.classList.remove('dark-mode');
            return newVal;
        });
    }, []);

    // --- Selectors (Memoized) ---
    const getStudentsForCourse = useCallback((courseId) => {
        const studentIds = enrollments.filter(e => e.courseId === courseId).map(e => e.studentId);
        return users.filter(u => studentIds.includes(u.id));
    }, [enrollments, users]);

    const getCoursesForStudent = useCallback((studentId) => {
        const courseIds = enrollments.filter(e => e.studentId === studentId).map(e => e.courseId);
        return courses.filter(c => courseIds.includes(c.id));
    }, [enrollments, courses]);

    const getCoursesForTeacher = useCallback((teacherId) => {
        const courseIds = courseAssignments.filter(ca => ca.teacherId === teacherId).map(ca => ca.courseId);
        return courses.filter(c => courseIds.includes(c.id));
    }, [courseAssignments, courses]);

    const getBooksForCourse = useCallback((courseId) => {
        const bookIds = courseBooks.filter(cb => cb.courseId === courseId).map(cb => cb.bookId);
        return books.filter(b => bookIds.includes(b.id));
    }, [courseBooks, books]);

    const getStudentsForTeacher = useCallback((teacherId) => {
        const teacherCourseIds = courseAssignments.filter(ca => ca.teacherId === teacherId).map(ca => ca.courseId);
        const studentIds = enrollments
            .filter(e => teacherCourseIds.includes(e.courseId))
            .map(e => e.studentId);
        const uniqueStudentIds = [...new Set(studentIds)];
        return users.filter(u => uniqueStudentIds.includes(u.id));
    }, [courseAssignments, enrollments, users]);

    const getTeachersForStudent = useCallback((studentId) => {
        const studentCourseIds = enrollments.filter(e => e.studentId === studentId).map(e => e.courseId);
        const teacherIds = courseAssignments
            .filter(ca => studentCourseIds.includes(ca.courseId))
            .map(ca => ca.teacherId);
        const uniqueTeacherIds = [...new Set(teacherIds)];
        return users.filter(u => uniqueTeacherIds.includes(u.id));
    }, [enrollments, courseAssignments, users]);

    // 10. Modals
    const openModal = useCallback((config) => {
        setModalConfig({
            isOpen: true,
            title: config.title || 'Info',
            message: config.message || '',
            onConfirm: config.onConfirm || null,
            onCancel: config.onCancel || null,
            type: config.type || 'info',
            confirmText: config.confirmText || 'OK',
            cancelText: config.cancelText || 'Cancel'
        });
    }, []);

    const closeModal = useCallback(() => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    }, []);

    // --- Final Memoization ---
    // This optimization ensures that if 'users' changes, only components consuming 'users' (and the context value) update.
    // Importantly, functions like 'toggleTheme' won't change identity if we grouped them correctly.
    // However, because we are creating a single object, ANY change to one state updates the entire context object ref.
    // That's unavoidable with a single context. But `useCallback` ensures function identities are stable where possible.
    const contextValue = useMemo(() => ({
        users, courses, books, enrollments, courseAssignments, courseBooks, meetings, chats, darkMode, suggestedCourses, tickets,
        addUser: addUserImperative, updateUser, deleteUser, markCourseComplete, markModuleComplete,
        addCourse, updateCourse, updateCourseAssignment, addBook, enrollStudent, assignTeacher, addBookToCourse, scheduleMeeting, sendMessage, toggleTheme,
        addSuggestedCourse, updateSuggestedProgress, awardBadge, checkStreaks,
        getStudentsForCourse, getCoursesForStudent, getCoursesForTeacher, getBooksForCourse, getStudentsForTeacher, getTeachersForStudent, getChats,
        addTicket, resolveTicket,
        openModal, closeModal, modalConfig
    }), [
        users, courses, books, enrollments, courseAssignments, courseBooks, meetings, chats, darkMode, suggestedCourses, tickets, modalConfig,
        addUserImperative, updateUser, deleteUser, markCourseComplete, markModuleComplete,
        addCourse, updateCourse, updateCourseAssignment, addBook, enrollStudent, assignTeacher, addBookToCourse, scheduleMeeting, sendMessage, toggleTheme,
        addSuggestedCourse, updateSuggestedProgress, awardBadge, checkStreaks,
        getStudentsForCourse, getCoursesForStudent, getCoursesForTeacher, getBooksForCourse, getStudentsForTeacher, getTeachersForStudent, getChats,
        addTicket, resolveTicket,
        openModal, closeModal
    ]);

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
};

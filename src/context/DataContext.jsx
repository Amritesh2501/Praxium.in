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

    // --- Initialization ---
    useEffect(() => {
        // Load legacy data or initialize defaults
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        setUsers(storedUsers);

        // We are transitioning to a more relational model, so we might need to migrate or just start fresh for new entities if structure changed.
        // For this task, we will try to persist everything in localStorage keys for persistence between reloads.
        const storedCourses = JSON.parse(localStorage.getItem('courses') || '[]');

        // Seed OR Force Update Machine Learning Course (id: ml-101)
        const detailedMLCourse = {
            id: 'ml-101',
            title: 'Machine Learning',
            description: 'A comprehensive guide to ML algorithms, neural networks, and deep learning.',
            modules: [
                {
                    title: '1. Introduction to ML',
                    videoId: 'KNAWp2S3w94', // Andrew Ng: What is Machine Learning?
                    content: `# Introduction to Machine Learning
**Machine Learning (ML)** is a field of inquiry devoted to understanding and building methods that 'learn', that is, methods that leverage data to improve performance on some set of tasks.

### Types of Machine Learning
| Type | Description | Examples |
| :--- | :--- | :--- |
| **Supervised** | Learning with labeled data. | Spam filtering, House price prediction |
| **Unsupervised** | Learning with unlabeled data. | Customer segmentation, Anomaly detection |
| **Reinforcement** | Learning via trial and error. | Game playing (Chess, Go), Robot navigation |

### Key Terminology
*   **Features:** The input variables (X) used for prediction.
*   **Target:** The output variable (y) to be predicted.
*   **Model:** The mathematical representation of the real-world process.
`
                },
                {
                    title: '2. Linear Regression',
                    videoId: 'nk2CQITm_eo', // Andrew Ng: Linear Regression
                    content: `# Linear Regression
Linear regression is a linear approach for modelling the relationship between a scalar response and one or more explanatory variables.

### The Equation
The hypothesis function for linear regression is:
$$ h_\\theta(x) = \\theta_0 + \\theta_1 x $$

### Python Implementation
\`\`\`python
import numpy as np
from sklearn.linear_model import LinearRegression

# Sample Data
X = np.array([[1], [2], [3], [4]])
y = np.array([2, 4, 6, 8])

# Model Training
model = LinearRegression()
model.fit(X, y)

# Prediction
print(f"Prediction for 5: {model.predict([[5]])}")
# Output: Prediction for 5: [10.]
\`\`\`
`
                },
                {
                    title: '3. Neural Networks',
                    videoId: 'aircAruvnKk', // 3Blue1Brown: But what is a Neural Network?
                    content: `# Neural Networks
Neural networks are a set of algorithms, modeled loosely after the human brain, that are designed to recognize patterns.

### Perceptron
The simplest unit of a neural network. It takes inputs, applies weights, sums them up, adds a bias, and passes the result through an activation function.

### Common Activation Functions
1.  **Sigmoid:** Maps input to (0, 1). Used for binary classification.
2.  **ReLU (Rectified Linear Unit):** $f(x) = max(0, x)$. Most common in hidden layers.
3.  **Softmax:** Converts a vector of numbers into a vector of probabilities.

![Neural Network Diagram](https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Colored_neural_network.svg/1200px-Colored_neural_network.svg.png)
*(Image source: Wikimedia Commons)*
`
                },
                {
                    title: '4. Deep Learning & CNNs',
                    videoId: 'py5byOOHZM8', // Computerphile: CNNs
                    content: `# Deep Learning: Convolutional Neural Networks (CNNs)
Convolutional Neural Networks (CNNs) are a class of deep neural networks, most commonly applied to analyzing visual imagery.

### Layers of a CNN
1.  **Convolutional Layer:** Applies filters (kernels) to the input image to create feature maps.
2.  **Pooling Layer:** Reduces the spatial size of the representation (e.g., Max Pooling).
3.  **Fully Connected Layer:** Connects every neuron in one layer to every neuron in another layer.
`
                },
                {
                    title: '5. Ethics in AI',
                    videoId: 'CfzOB67183rI', // Ted Talk: AI Ethics (generic ID used as placeholder if specific not known, but checking typical length) -> 'CfzOB67183rI' is invalid, replacing with valid TED ID 'GZ69rW16u8M' (How to keep human bias out of AI)
                    videoId: 'GZ69rW16u8M',
                    content: `# Ethics in Artificial Intelligence
As AI becomes more prevalent, ethical considerations become paramount.

### Key Issues
*   **Bias and Fairness:** AI systems can perpetuate and amplify existing social biases.
*   **Privacy:** Collection and use of vast amounts of personal data.
*   **Accountability:** Who is responsible when an AI system makes a mistake?
`
                },
                {
                    title: '6. Case Study: Housing Prices',
                    videoId: 'WfrM4C6wT_w',
                    content: `# Case Study: Predicting Housing Prices
In this case study, we will explore how to build a model to predict house prices based on various features like size, location, and number of rooms.

### Dataset Overview
| Size (sq ft) | Bedrooms | Age (years) | Price ($) |
| :--- | :--- | :--- | :--- |
| 2104 | 3 | 10 | 399,900 |
| 1600 | 3 | 25 | 329,900 |
| 2400 | 3 | 5 | 369,000 |

### Steps
1.  **Data Cleaning:** Handle missing values and outliers.
2.  **Feature Engineering:** extensive use of one-hot encoding for categorical variables.
3.  **Model Selection:** We start with Linear Regression and then try Random Forest.
4.  **Evaluation:** Use RMSE (Root Mean Squared Error) to measure accuracy.

### Conclusion
The Random Forest model outperformed Linear Regression by capturing non-linear relationships in the data.
`
                }
            ],
            isAI: false
        };

        const existingMLIndex = storedCourses.findIndex(c => c.id === 'ml-101');
        if (existingMLIndex !== -1) {
            // Force update existing course content
            storedCourses[existingMLIndex] = { ...storedCourses[existingMLIndex], ...detailedMLCourse };
        } else {
            // Add if missing
            storedCourses.push(detailedMLCourse);
        }
        localStorage.setItem('courses', JSON.stringify(storedCourses));

        setCourses(storedCourses);
        setBooks(JSON.parse(localStorage.getItem('books') || '[]'));
        setEnrollments(JSON.parse(localStorage.getItem('enrollments') || '[]'));
        setMeetings(JSON.parse(localStorage.getItem('meetings') || '[]'));
        setChats(JSON.parse(localStorage.getItem('chats') || '[]'));

        // Theme Init
        const isDark = localStorage.getItem('darkMode') === 'true';
        if (isDark) document.body.classList.add('dark-mode');
        setDarkMode(isDark);
    }, []);

    // --- Persistence Helper ---
    const saveData = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    // --- Actions ---

    // 1. Users
    const addUser = (userData, initialCourseId = null) => {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');

        // Generate Registration ID
        const year = new Date().getFullYear();
        const rolePrefix = userData.role === 'admin' ? 'ADM' : userData.role === 'teacher' ? 'FAC' : 'STD';
        // Simple sequential ID based on array length + 1 (padded)
        const count = storedUsers.filter(u => u.role === userData.role).length + 1;
        const regId = `${rolePrefix}-${year}-${String(count).padStart(3, '0')}`;

        const newUser = {
            ...userData,
            id: regId,
            phone: '',
            photo: null,
            completedCourses: [],
            permissions: userData.permissions || 'standard'
        };

        const updatedUsers = [...storedUsers, newUser];
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));

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

        // If updating currently logged in user, update that state too
        if (currentUser && currentUser.id === id) {
            const updatedUser = updatedUsers.find(u => u.id === id);
            setCurrentUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser)); // Persist login session update
        }
    };

    const markCourseComplete = (studentId, courseId) => {
        const student = users.find(u => u.id === studentId);
        if (student && !student.completedCourses?.includes(courseId)) {
            const updatedCompleted = [...(student.completedCourses || []), courseId];
            updateUser(studentId, { completedCourses: updatedCompleted });
        }
    };

    const deleteUser = (id) => {
        const updatedUsers = users.filter(u => u.id !== id);
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
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
    const [suggestedCourses, setSuggestedCourses] = useState(() => {
        const saved = localStorage.getItem('suggestedCourses');
        return saved ? JSON.parse(saved) : [];
    });

    const addSuggestedCourse = (topic) => {
        // Prevent duplicates
        if (suggestedCourses.some(c => c.title === topic)) return;

        const newCourse = {
            id: `ai-${Date.now()}`,
            title: topic,
            description: 'AI Generated Adaptive Course',
            isAI: true,
            currentLevel: 1 // Start at Level 1
        };
        const updated = [...suggestedCourses, newCourse];
        setSuggestedCourses(updated);
        localStorage.setItem('suggestedCourses', JSON.stringify(updated));
    };

    const updateSuggestedProgress = (courseId, newLevel) => {
        const updated = suggestedCourses.map(c =>
            c.id === courseId ? { ...c, currentLevel: newLevel } : c
        );
        setSuggestedCourses(updated);
        localStorage.setItem('suggestedCourses', JSON.stringify(updated));
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
        // Remove existing assignment for this course if any
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

    return (
        <DataContext.Provider value={{
            users, courses, books, enrollments, courseAssignments, courseBooks, meetings, chats, darkMode, suggestedCourses,
            addUser, updateUser, deleteUser, markCourseComplete,
            addCourse, updateCourse, updateCourseAssignment, addBook, enrollStudent, assignTeacher, addBookToCourse, scheduleMeeting, sendMessage, toggleTheme,
            addSuggestedCourse, updateSuggestedProgress,
            getStudentsForCourse, getCoursesForStudent, getCoursesForTeacher, getBooksForCourse, getStudentsForTeacher, getChats
        }}>
            {children}
        </DataContext.Provider>
    );
};

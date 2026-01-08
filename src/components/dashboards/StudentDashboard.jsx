import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import ChatInput from '../ChatInput';
import { generateAIResponse, generateQuiz, analyzeQuizResults, generateLevelContent } from '../../services/aiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Sub-Components (Views) ---

const OverviewPanel = ({ user, myCourses }) => {
    return (
        <div className="dashboard-grid fade-in">
            {/* 1. Welcome & Streak */}
            <div className="dash-card" style={{ gridColumn: '1 / -1', background: 'var(--primary)', color: 'black', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '5px' }}>Hello, {user.name.split(' ')[0]}!</h2>
                    <p style={{ opacity: 0.9, fontWeight: 'bold' }}>Value your time, learn something new today.</p>
                </div>
                <div style={{ textAlign: 'center', background: 'white', padding: '10px 20px', border: '2px solid black', boxShadow: '4px 4px 0 black' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>12</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>DAY STREAK</div>
                </div>
            </div>

            {/* 2. AI Learning Status */}
            <div className="dash-card">
                <h3>AI Insight</h3>
                <div style={{ marginTop: '15px', padding: '15px', background: '#fff', border: '2px solid black', boxShadow: '4px 4px 0 #ddd' }}>
                    <strong>Calculus Weakness Detected:</strong> You struggled with <em>Chain Rule</em> yesterday.
                    <button
                        onClick={() => alert("Starting Rapid Review Session for: Chain Rule")}
                        style={{ display: 'block', marginTop: '10px', background: 'black', color: 'white', border: 'none', padding: '8px 12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '2px 2px 0 var(--accent)' }}
                    >
                        Start Rapid Review
                    </button>
                </div>
            </div>

            {/* 3. Current Progress */}
            <div className="dash-card">
                <h3>Learning Progress</h3>
                {myCourses.length > 0 ? (
                    <div style={{ marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <strong>{myCourses[0].title}</strong>
                            <span>65%</span>
                        </div>
                        <div style={{ width: '100%', height: '16px', background: 'white', border: '2px solid black' }}>
                            <div style={{ width: '65%', height: '100%', background: 'var(--secondary)', borderRight: '2px solid black' }}></div>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'gray', marginTop: '8px' }}>Next: Module 4 - Advanced Concepts</p>
                    </div>
                ) : (
                    <p style={{ color: 'gray' }}>No active courses.</p>
                )}
            </div>

            {/* 4. Notifications */}
            <div className="dash-card" style={{ gridColumn: '1 / -1' }}>
                <h3>Notifications</h3>
                <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px', marginTop: '10px' }}>
                    <div style={{ minWidth: '250px', padding: '15px', border: '2px solid black', background: 'var(--bg-card)', boxShadow: '4px 4px 0 #eee' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold' }}>UPCOMING CLASS</div>
                        <div style={{ fontWeight: 'bold' }}>Physics Doubt Session</div>
                        <div style={{ fontSize: '0.9rem', color: 'gray' }}>Today, 4:00 PM</div>
                    </div>
                    <div style={{ minWidth: '250px', padding: '15px', border: '2px solid black', background: 'var(--bg-card)', boxShadow: '4px 4px 0 #eee' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 'bold' }}>NEW ASSIGNMENT</div>
                        <div style={{ fontWeight: 'bold' }}>Algebra Quiz 3</div>
                        <div style={{ fontSize: '0.9rem', color: 'gray' }}>Due Tomorrow</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GamifiedLearningView = ({ course, onExit }) => {
    const { updateSuggestedProgress } = useData();
    const [levelData, setLevelData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState('lesson'); // lesson, quiz, success
    const [quizAnswer, setQuizAnswer] = useState(null);

    useEffect(() => {
        loadLevel();
    }, [course.currentLevel]);

    const loadLevel = async () => {
        setLoading(true);
        try {
            const data = await generateLevelContent(course.title, course.currentLevel);
            setLevelData(data);
            setStep('lesson');
            setQuizAnswer(null);
        } catch (e) {
            console.error(e);
            alert("Failed to load level content");
        } finally {
            setLoading(false);
        }
    };

    const handleQuizSubmit = () => {
        if (!levelData?.quiz) return;
        if (quizAnswer === levelData.quiz.correctAnswer) {
            setStep('success');
            // Update progress in context
            updateSuggestedProgress(course.id, course.currentLevel + 1);
        } else {
            alert("Incorrect. Try reviewing the lesson!");
            setStep('lesson');
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '500px' }}>
            <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid #ccc', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <h2 style={{ marginTop: '20px' }}>Generating Level {course.currentLevel}...</h2>
            <p>AI is building your personalized lesson.</p>
        </div>
    );

    return (
        <div className="fade-in">
            <button onClick={onExit} style={{ marginBottom: '20px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                <span className="material-icons">arrow_back</span> Back to Courses
            </button>

            <div className="dash-card" style={{ border: '4px solid black', boxShadow: '8px 8px 0 black', padding: '0', overflow: 'hidden' }}>
                <div style={{ background: 'black', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ background: 'var(--accent)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', marginRight: '10px' }}>AI COURSE</span>
                        <h2 style={{ display: 'inline', fontSize: '1.5rem' }}>{course.title}</h2>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>CURRENT LEVEL</div>
                        <div style={{ fontSize: '2rem', fontWeight: '900', lineHeight: 1 }}>{course.currentLevel}</div>
                    </div>
                </div>

                <div style={{ padding: '30px' }}>
                    {step === 'lesson' && levelData && (
                        <div className="fade-in">
                            <h3 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>{levelData.lessonTitle}</h3>
                            <div className="markdown-content" style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '30px' }}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{levelData.lessonContent}</ReactMarkdown>
                            </div>
                            <button
                                onClick={() => setStep('quiz')}
                                style={{ width: '100%', padding: '15px', background: 'var(--primary)', border: '2px solid black', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '4px 4px 0 black' }}
                            >
                                READY FOR CHALLENGE?
                            </button>
                        </div>
                    )}

                    {step === 'quiz' && levelData?.quiz && (
                        <div className="fade-in">
                            <h3 style={{ textAlign: 'center', marginBottom: '30px' }}>Level {course.currentLevel} Challenge</h3>
                            <div style={{ background: '#f9f9f9', padding: '20px', border: '2px solid black', marginBottom: '20px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                {levelData.quiz.question}
                            </div>
                            <div style={{ display: 'grid', gap: '10px' }}>
                                {levelData.quiz.options.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setQuizAnswer(opt)}
                                        style={{
                                            padding: '15px',
                                            textAlign: 'left',
                                            border: quizAnswer === opt ? '3px solid var(--secondary)' : '1px solid #ccc',
                                            background: quizAnswer === opt ? '#eff6ff' : 'white',
                                            cursor: 'pointer',
                                            fontWeight: quizAnswer === opt ? 'bold' : 'normal'
                                        }}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleQuizSubmit}
                                disabled={!quizAnswer}
                                style={{ width: '100%', marginTop: '20px', padding: '15px', background: 'black', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', opacity: quizAnswer ? 1 : 0.5 }}
                            >
                                SUBMIT ANSWER
                            </button>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="fade-in" style={{ textAlign: 'center', padding: '40px 0' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
                            <h2 style={{ fontSize: '2rem' }}>Level Complete!</h2>
                            <p style={{ fontSize: '1.2rem', color: 'gray', marginBottom: '30px' }}>You've unlocked the next level.</p>
                            <button
                                onClick={() => {
                                    // This will trigger effect to load next level
                                    loadLevel();
                                }}
                                style={{ padding: '15px 40px', background: 'var(--secondary)', color: 'white', border: '2px solid black', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '4px 4px 0 black' }}
                            >
                                CONTINUE TO LEVEL {course.currentLevel}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StandardLessonView = ({ course, onExit }) => {
    const [activeModule, setActiveModule] = useState(course.modules?.[0] || null);

    return (
        <div className="fade-in">
            <button onClick={onExit} style={{ marginBottom: '20px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                <span className="material-icons">arrow_back</span> Back to Courses
            </button>

            <div className="dash-card" style={{ border: '4px solid black', boxShadow: '8px 8px 0 black', padding: '0', overflow: 'hidden', height: 'calc(100vh - 150px)', display: 'grid', gridTemplateColumns: '300px 1fr' }}>
                {/* Sidebar */}
                <div style={{ background: '#f8f9fa', borderRight: '2px solid black', overflowY: 'auto' }}>
                    <div style={{ padding: '20px', background: 'black', color: 'white' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{course.title}</h2>
                    </div>
                    {course.modules?.map((mod, idx) => (
                        <div
                            key={idx}
                            onClick={() => setActiveModule(mod)}
                            style={{
                                padding: '15px 20px',
                                borderBottom: '1px solid #ddd',
                                cursor: 'pointer',
                                background: activeModule === mod ? 'var(--primary)' : 'transparent',
                                fontWeight: activeModule === mod ? 'bold' : 'normal',
                                display: 'flex', alignItems: 'center', gap: '10px'
                            }}
                        >
                            <div style={{ width: '25px', height: '25px', background: activeModule === mod ? 'black' : '#ddd', color: activeModule === mod ? 'white' : '#666', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                {idx + 1}
                            </div>
                            {mod.title}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div style={{ padding: '40px', overflowY: 'auto' }}>
                    {activeModule ? (
                        <div className="fade-in">
                            <h2 style={{ fontSize: '2rem', marginBottom: '20px', borderBottom: '4px solid var(--secondary)', display: 'inline-block', paddingBottom: '5px' }}>{activeModule.title}</h2>

                            {activeModule.videoId && (
                                <div style={{ marginBottom: '30px', border: '2px solid black', boxShadow: '4px 4px 0 black' }}>
                                    <iframe
                                        width="100%"
                                        height="400"
                                        src={`https://www.youtube.com/embed/${activeModule.videoId}`}
                                        title={activeModule.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}

                            <div className="markdown-content" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {activeModule.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: 'gray', padding: '20px' }}>Select a module to begin learning.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const BauhausModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'info', confirmText = 'OK', cancelText = 'Cancel' }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(3px)'
        }}>
            <div className="fade-in" style={{
                background: 'white',
                border: '4px solid black',
                boxShadow: '10px 10px 0 black',
                width: '90%',
                maxWidth: '500px',
                padding: '0'
            }}>
                <div style={{
                    padding: '15px 20px',
                    background: type === 'confirm' ? 'var(--accent)' : 'black',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    borderBottom: '4px solid black',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <span>{title}</span>
                    <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>

                <div style={{ padding: '30px', fontSize: '1.1rem', lineHeight: '1.5' }}>
                    {message}
                </div>

                <div style={{ padding: '20px', borderTop: '2px solid black', background: '#f8f9fa', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            style={{
                                padding: '10px 25px',
                                background: 'white',
                                border: '2px solid black',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                boxShadow: '3px 3px 0 #999'
                            }}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '10px 25px',
                            background: 'var(--secondary)',
                            color: 'white',
                            border: '2px solid black',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '3px 3px 0 black'
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CourseView = ({ initialSubTab = 'my_courses', autoLaunchTopic = null, openModal }) => {
    const { user } = useAuth();
    const { courses, suggestedCourses, enrollStudent, getCoursesForStudent } = useData();
    const [subTab, setSubTab] = useState(initialSubTab); // my_courses, suggested, catalog
    const [viewingCourse, setViewingCourse] = useState(null); // Course object if viewing (AI or Standard)

    const myCourses = getCoursesForStudent(user.id);
    const enrolledIds = myCourses.map(c => c.id);

    // Effect for deep linking
    useEffect(() => {
        if (initialSubTab) setSubTab(initialSubTab);
        if (autoLaunchTopic) {
            // Find the course object for the topic
            const topicCourse = suggestedCourses.find(c => c.title === autoLaunchTopic) || courses.find(c => c.title === autoLaunchTopic);
            if (topicCourse) {
                setViewingCourse(topicCourse);
            }
        }
    }, [initialSubTab, autoLaunchTopic, suggestedCourses, courses]);

    if (viewingCourse) {
        if (viewingCourse.isAI) {
            return <GamifiedLearningView course={viewingCourse} onExit={() => setViewingCourse(null)} />;
        } else {
            return <StandardLessonView course={viewingCourse} onExit={() => setViewingCourse(null)} />;
        }
    }

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button onClick={() => setSubTab('my_courses')} style={{ padding: '10px 20px', border: '2px solid black', background: subTab === 'my_courses' ? 'black' : 'white', color: subTab === 'my_courses' ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer', boxShadow: subTab === 'my_courses' ? '3px 3px 0 var(--primary)' : '3px 3px 0 black' }}>My Courses</button>
                <button onClick={() => setSubTab('suggested')} style={{ padding: '10px 20px', border: '2px solid black', background: subTab === 'suggested' ? 'black' : 'white', color: subTab === 'suggested' ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer', boxShadow: subTab === 'suggested' ? '3px 3px 0 var(--primary)' : '3px 3px 0 black' }}>
                    AI Suggested {suggestedCourses.length > 0 && <span style={{ marginLeft: '5px', background: 'var(--accent)', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem' }}>{suggestedCourses.length}</span>}
                </button>
                <button onClick={() => setSubTab('catalog')} style={{ padding: '10px 20px', border: '2px solid black', background: subTab === 'catalog' ? 'black' : 'white', color: subTab === 'catalog' ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer', boxShadow: subTab === 'catalog' ? '3px 3px 0 var(--primary)' : '3px 3px 0 black' }}>Catalog</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {subTab === 'suggested' && suggestedCourses.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'gray' }}>
                        No AI suggestions yet. Take a test in the <strong>Assessments</strong> tab to find your weak spots!
                    </div>
                )}

                {(() => {
                    let list = [];
                    if (subTab === 'my_courses') list = myCourses;
                    else if (subTab === 'suggested') list = suggestedCourses;
                    else list = courses;

                    return list.map(c => {
                        const isEnrolled = enrolledIds.includes(c.id);
                        const isAI = c.isAI; // Check if it's an AI course

                        return (
                            <div key={c.id} className="dash-card hover-scale" style={{ border: '3px solid black', boxShadow: '6px 6px 0 black', position: 'relative' }}>
                                {isAI && <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--accent)', color: 'white', padding: '5px 10px', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '4px' }}>AI ADAPTIVE</div>}
                                <div style={{ height: '8px', background: isEnrolled || isAI ? 'var(--secondary)' : 'var(--primary)', marginBottom: '15px', border: '1px solid black' }}></div>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{c.title}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'gray', marginBottom: '15px' }}>{c.description || 'AI Personalized Learning Path'}</p>

                                {subTab === 'my_courses' && (
                                    <button
                                        onClick={() => openModal({
                                            title: `Resume ${c.title}`,
                                            message: "Ready to pick up where you left off?",
                                            type: 'confirm',
                                            confirmText: "Let's Go!",
                                            onConfirm: () => setViewingCourse(c)
                                        })}
                                        style={{ width: '100%', padding: '12px', background: 'black', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        CONTINUE LEARNING
                                    </button>
                                )}

                                {subTab === 'suggested' && (
                                    <button
                                        onClick={() => setViewingCourse(c)}
                                        style={{ width: '100%', padding: '12px', background: 'var(--primary)', color: 'black', border: '2px solid black', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        START LEVEL {c.currentLevel}
                                    </button>
                                )}

                                {subTab === 'catalog' && (
                                    isEnrolled ?
                                        <button disabled style={{ width: '100%', padding: '12px', background: '#ccc', color: '#666', border: '2px solid black', cursor: 'not-allowed' }}>ENROLLED</button> :
                                        <button onClick={() => {
                                            openModal({
                                                title: "Enroll in Course",
                                                message: `Do you want to enroll in "${c.title}"?`,
                                                type: 'confirm',
                                                confirmText: "Enroll Now",
                                                onConfirm: () => { enrollStudent(c.id, user.id); }
                                            });
                                        }} className="auth-button" style={{ marginTop: 0 }}>ENROLL NOW</button>
                                )}
                            </div>
                        );
                    });
                })()}
            </div>
        </div>
    );
};



const AIChatView = () => {
    // Session Management
    const [sessions, setSessions] = useState(() => {
        const saved = localStorage.getItem('ai_chat_sessions');
        return saved ? JSON.parse(saved) : [{ id: 1, title: 'New Chat', messages: [] }];
    });
    const [activeSessionId, setActiveSessionId] = useState(() => {
        const saved = localStorage.getItem('ai_chat_active_id');
        return saved ? parseInt(saved) : 1;
    });

    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
    const messagesEndRef = useRef(null);

    // Persistence Effects
    useEffect(() => {
        localStorage.setItem('ai_chat_sessions', JSON.stringify(sessions));
    }, [sessions]);

    useEffect(() => {
        localStorage.setItem('ai_chat_active_id', activeSessionId);
    }, [activeSessionId]);

    // Scroll to bottom on new messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeSession.messages]);

    const createNewChat = () => {
        const newId = Date.now();
        const newSession = { id: newId, title: 'New Chat', messages: [] };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newId);
    };

    const deleteChat = (e, id) => {
        e.stopPropagation();
        const remaining = sessions.filter(s => s.id !== id);
        if (remaining.length === 0) {
            // Always keep one session
            const newId = Date.now();
            setSessions([{ id: newId, title: 'New Chat', messages: [] }]);
            setActiveSessionId(newId);
        } else {
            setSessions(remaining);
            if (activeSessionId === id) {
                setActiveSessionId(remaining[0].id);
            }
        }
    };

    const handleSend = async (text, attachment) => {
        // Optimistic UI Update
        const newMsg = {
            id: Date.now(),
            sender: 'me',
            text: text,
            attachment,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Update Title if it's the first message
        const isFirstMessage = activeSession.messages.length === 0;

        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                return {
                    ...s,
                    title: isFirstMessage ? (text.slice(0, 30) + (text.length > 30 ? '...' : '')) : s.title,
                    messages: [...s.messages, newMsg]
                };
            }
            return s;
        }));

        // AI Typing Placeholder
        const placeholderId = Date.now() + 1;
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, { id: placeholderId, sender: 'ai', text: "Thinking...", time: 'Now', isThinking: true }] } : s));

        try {
            const aiResponse = await generateAIResponse(text, attachment?.file);

            // Update Placeholder with Real Response
            setSessions(prev => prev.map(s => {
                if (s.id === activeSessionId) {
                    return {
                        ...s,
                        messages: s.messages.map(msg =>
                            msg.id === placeholderId ? { ...msg, text: aiResponse, isThinking: false, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : msg
                        )
                    };
                }
                return s;
            }));
        } catch (error) {
            setSessions(prev => prev.map(s => {
                if (s.id === activeSessionId) {
                    return {
                        ...s,
                        messages: s.messages.map(msg =>
                            msg.id === placeholderId ? { ...msg, text: "Sorry, I encountered an error. Please try again.", isThinking: false } : msg
                        )
                    };
                }
                return s;
            }));
        }
    };

    return (
        <div className="dash-card fade-in" style={{ height: 'calc(100vh - 150px)', padding: 0, border: '3px solid black', boxShadow: '6px 6px 0 black', display: 'flex', overflow: 'hidden' }}>
            {/* Sidebar History */}
            <div style={{ width: '250px', borderRight: '2px solid black', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
                <button
                    onClick={createNewChat}
                    style={{ margin: '15px', padding: '12px', background: 'black', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <span className="material-icons" style={{ fontSize: '1.2rem' }}>add</span> NEW CHAT
                </button>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {sessions.map(s => (
                        <div
                            key={s.id}
                            onClick={() => setActiveSessionId(s.id)}
                            style={{
                                padding: '12px 15px',
                                borderBottom: '1px solid #eee',
                                cursor: 'pointer',
                                background: activeSessionId === s.id ? '#e5e7eb' : 'transparent',
                                fontWeight: activeSessionId === s.id ? 'bold' : 'normal',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                        >
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{s.title}</span>
                            <span
                                onClick={(e) => deleteChat(e, s.id)}
                                className="material-icons"
                                style={{ fontSize: '1rem', color: '#999', cursor: 'pointer', opacity: 0.6 }}
                            >
                                delete
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '15px', background: 'var(--primary)', borderBottom: '2px solid black', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>🤖 AI Tutor</h3>
                        <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Powered by Gemini 2.0 Flash</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{activeSession.messages.length} messages</div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {activeSession.messages.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'gray', marginTop: '50px' }}>
                            <span className="material-icons" style={{ fontSize: '3rem', opacity: 0.2 }}>smart_toy</span>
                            <p>Ask me anything! I can help with math, science, or just chat.</p>
                        </div>
                    )}
                    {activeSession.messages.map(msg => (
                        <div key={msg.id} style={{ alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                            <div style={{
                                padding: '15px 20px',
                                background: msg.sender === 'me' ? 'black' : '#fff',
                                color: msg.sender === 'me' ? 'white' : 'black',
                                border: '2px solid black',
                                boxShadow: '4px 4px 0 rgba(0,0,0,0.1)',
                                fontWeight: '500',
                                fontSize: '0.95rem'
                            }}>
                                {msg.attachment && (
                                    <div style={{ marginBottom: '10px' }}>
                                        {msg.attachment.type === 'image' && <img src={msg.attachment.url} style={{ maxWidth: '100%', borderRadius: '4px' }} alt="Sent" />}
                                        {msg.attachment.type === 'audio' && <div style={{ padding: '5px', background: '#333', color: 'white', borderRadius: '4px' }}>🔊 Audio Clip</div>}
                                    </div>
                                )}
                                {msg.sender === 'me' ? (
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                                ) : (
                                    <div className="markdown-content">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'gray', marginTop: '4px', textAlign: msg.sender === 'me' ? 'right' : 'left' }}>{msg.time}</div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <ChatInput onSend={handleSend} placeholder={activeSession.messages.length === 0 ? "Start a new conversation..." : "Ask a follow-up question..."} />
            </div>
        </div>
    );
};

const TeacherChatView = () => {
    const { user } = useAuth();
    const { users, sendMessage, getChats, courseAssignments } = useData();
    const [selectedTeacherId, setSelectedTeacherId] = useState(null);
    const messagesEndRef = useRef(null);

    // Get relevant teachers
    // 1. Find courses student is enrolled in (requires fetching enrollments, but for now we filter assignments)
    // For simplicity, we'll list ALL teachers, or just filter those assigned to courses.
    const teachers = users.filter(u => u.role === 'teacher');

    // Auto-select first teacher if available and none selected
    useEffect(() => {
        if (!selectedTeacherId && teachers.length > 0) {
            setSelectedTeacherId(teachers[0].id);
        }
    }, [teachers, selectedTeacherId]);

    const activeChatData = selectedTeacherId ? getChats(user.id, selectedTeacherId) : [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeChatData, selectedTeacherId]);

    const handleSend = (text, attachment) => {
        if (!selectedTeacherId) return;

        sendMessage({
            senderId: user.id,
            receiverId: selectedTeacherId,
            text: text,
            attachment // { type, url, file } - Note: file object won't persist in localStorage well, but url/type will.
        });
    };

    return (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '20px', height: 'calc(100vh - 140px)' }}>
            {/* Teacher List */}
            <div className="dash-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '15px', background: '#eee', borderBottom: '2px solid black', fontWeight: 'bold' }}>TEACHERS</div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {teachers.map(t => (
                        <div
                            key={t.id}
                            onClick={() => setSelectedTeacherId(t.id)}
                            style={{
                                padding: '15px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #eee',
                                background: selectedTeacherId === t.id ? 'var(--primary)' : 'white',
                                color: selectedTeacherId === t.id ? 'black' : 'inherit',
                                fontWeight: selectedTeacherId === t.id ? 'bold' : 'normal',
                                display: 'flex', alignItems: 'center', gap: '10px'
                            }}
                        >
                            <div style={{ width: '30px', height: '30px', background: 'black', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                {t.name.charAt(0)}
                            </div>
                            {t.name}
                        </div>
                    ))}
                    {teachers.length === 0 && <div style={{ padding: '20px', color: 'gray', textAlign: 'center' }}>No teachers found.</div>}
                </div>
            </div>

            {/* Chat Area */}
            <div className="dash-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {selectedTeacherId ? (
                    <>
                        <div style={{ padding: '15px', borderBottom: '2px solid black', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%' }}></div>
                            <span style={{ fontWeight: 'bold' }}>{teachers.find(t => t.id === selectedTeacherId)?.name || 'Teacher'}</span>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#f9f9f9' }}>
                            {activeChatData.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'gray', marginTop: '20px' }}>Start the conversation!</div>
                            ) : (
                                activeChatData.map(msg => (
                                    <div key={msg.id} style={{ alignSelf: msg.senderId === user.id ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                                        <div style={{
                                            padding: '10px 15px',
                                            background: msg.senderId === user.id ? 'black' : 'white',
                                            color: msg.senderId === user.id ? 'white' : 'black',
                                            border: '2px solid black',
                                            boxShadow: '3px 3px 0 rgba(0,0,0,0.1)'
                                        }}>
                                            {msg.attachment && (
                                                <div style={{ marginBottom: '5px' }}>
                                                    {msg.attachment.type === 'image' && <img src={msg.attachment.url} style={{ maxWidth: '100%', borderRadius: '4px' }} alt="Sent" />}
                                                    {msg.attachment.type === 'audio' && <div style={{ padding: '5px', background: '#333', color: 'white', borderRadius: '4px' }}>🔊 Audio Clip</div>}
                                                </div>
                                            )}
                                            {msg.text}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'gray', marginTop: '2px', textAlign: msg.senderId === user.id ? 'right' : 'left' }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        {/* Chat Input */}
                        <ChatInput onSend={handleSend} placeholder="Type a message to your teacher..." />
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'gray' }}>Select a teacher to chat.</div>
                )}
            </div>
        </div>
    );
};

const AssessmentView = ({ onNavigateToCourse }) => {
    const { user } = useAuth();
    const { getCoursesForStudent, addSuggestedCourse } = useData();
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [testState, setTestState] = useState('idle'); // idle, loading, taking, analyzing, complete
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);

    const myCourses = getCoursesForStudent(user.id);

    const startTest = async () => {
        if (!selectedCourseId) return;
        setTestState('loading');
        const course = myCourses.find(c => c.id === selectedCourseId);
        try {
            const data = await generateQuiz(course.title);
            if (data && data.questions) {
                setQuiz(data.questions);
                setTestState('taking');
                setAnswers({});
            } else {
                alert("Failed to generate quiz. AI might be busy.");
                setTestState('idle');
            }
        } catch (e) {
            console.error(e);
            setTestState('idle');
        }
    };

    const submitTest = async () => {
        setTestState('analyzing');
        try {
            const analysis = await analyzeQuizResults(quiz, answers);
            if (analysis) {
                setResult(analysis);
                setTestState('complete');
                // Automatically add suggested courses for weak topics
                if (analysis.weakTopics && analysis.weakTopics.length > 0) {
                    analysis.weakTopics.forEach(topic => addSuggestedCourse(topic));
                }
            }
        } catch (e) {
            alert("Analysis failed.");
            setTestState('taking');
        }
    };

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            {testState === 'idle' && (
                <div className="dash-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                    <h2>🤖 AI Knowledge Assessment</h2>
                    <p style={{ margin: '20px 0', color: 'gray' }}>Select a course to generate a personalized AI test. We'll find your weak spots and create a custom learning plan.</p>

                    <select
                        value={selectedCourseId}
                        onChange={e => setSelectedCourseId(e.target.value)}
                        style={{ width: '100%', padding: '15px', border: '2px solid black', marginBottom: '20px', fontSize: '1rem', fontWeight: 'bold' }}
                    >
                        <option value="">-- Select a Course --</option>
                        {myCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>

                    <button
                        onClick={startTest}
                        disabled={!selectedCourseId}
                        style={{ width: '100%', padding: '15px', background: selectedCourseId ? 'black' : '#ccc', color: 'white', border: 'none', fontWeight: 'bold', cursor: selectedCourseId ? 'pointer' : 'not-allowed' }}
                    >
                        START AI TEST
                    </button>
                </div>
            )}

            {testState === 'loading' || testState === 'analyzing' && (
                <div style={{ textAlign: 'center', marginTop: '100px' }}>
                    <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid #ccc', borderTopColor: 'black', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                    <h3>{testState === 'loading' ? 'AI is crafting your questions...' : 'AI is analyzing your performance...'}</h3>
                </div>
            )}

            {testState === 'taking' && quiz && (
                <div className="dash-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        <h3>Assessment in Progress</h3>
                        <span>{Object.keys(answers).length} / {quiz.length} Answered</span>
                    </div>
                    {quiz.map((q, idx) => (
                        <div key={q.id} style={{ marginBottom: '30px' }}>
                            <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '15px' }}>{idx + 1}. {q.text}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {q.options.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                        style={{
                                            padding: '15px',
                                            textAlign: 'left',
                                            border: answers[q.id] === opt ? '2px solid black' : '1px solid #ddd',
                                            background: answers[q.id] === opt ? 'var(--primary)' : 'white',
                                            fontWeight: answers[q.id] === opt ? 'bold' : 'normal',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={submitTest}
                        disabled={Object.keys(answers).length !== quiz.length}
                        style={{ width: '100%', padding: '15px', background: 'var(--secondary)', color: 'white', border: '2px solid black', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px', opacity: Object.keys(answers).length !== quiz.length ? 0.5 : 1 }}
                    >
                        SUBMIT TEST
                    </button>
                </div>
            )}

            {testState === 'complete' && result && (
                <div className="dash-card fade-in" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', fontWeight: '900', color: result.score > 70 ? 'var(--secondary)' : 'var(--accent)' }}>
                        {result.score}%
                    </div>
                    <h2>{result.score > 70 ? 'Great Job!' : 'Room for Improvement'}</h2>
                    <p style={{ maxWidth: '600px', margin: '20px auto', fontSize: '1.1rem', lineHeight: '1.6' }}>{result.feedback}</p>

                    {result.weakTopics && result.weakTopics.length > 0 && (
                        <div style={{ marginTop: '30px', padding: '20px', background: '#fffbeb', border: '2px solid black', textAlign: 'left' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="material-icons" style={{ color: 'var(--accent)' }}>warning</span>
                                Weak Areas Detected
                            </h3>
                            <p>We've automatically added these adaptive courses to your catalog:</p>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                                {result.weakTopics.map(topic => (
                                    <button
                                        key={topic}
                                        onClick={() => onNavigateToCourse(topic)}
                                        style={{
                                            background: 'white',
                                            padding: '10px 20px',
                                            border: '1px solid black',
                                            borderRadius: '20px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            transition: 'transform 0.1s',
                                        }}
                                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setTestState('idle')}
                        style={{ marginTop: '30px', padding: '12px 30px', background: 'black', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        TAKE ANOTHER TEST
                    </button>
                </div>
            )}
        </div>
    );
};

const SectionPlaceholder = ({ title }) => (
    <div className="dash-card animate-slide-up" style={{ textAlign: 'center', padding: '50px', color: 'gray' }}>
        <h2>{title}</h2>
        <p>Feature coming soon.</p>
    </div>
);

// --- Main Shell ---

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const { darkMode, toggleTheme, getCoursesForStudent } = useData();
    const [activeTab, setActiveTab] = useState('home');
    const [viewProps, setViewProps] = useState({}); // To pass navigating params like { initialSubTab, autoLaunchTopic }

    // Modal State
    const [modalConfig, setModalConfig] = useState({ isOpen: false });

    const openModal = (config) => {
        setModalConfig({ ...config, isOpen: true });
    };

    const closeModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };

    const handleConfirmModal = () => {
        if (modalConfig.onConfirm) modalConfig.onConfirm();
        closeModal();
    };

    const handleNavigateToCourse = (topic) => {
        setViewProps({ initialSubTab: 'suggested', autoLaunchTopic: topic });
        setActiveTab('courses');
    };

    // Override Styles
    // const currentTheme = darkMode ? darkStudentTheme : studentTheme;
    // const themeStyles = { ...currentTheme };

    const myCourses = getCoursesForStudent(user.id);

    const Menu = ({ id, label, icon }) => (
        <div
            onClick={() => {
                setActiveTab(id);
                // Clear view props when manually switching tabs
                if (id !== 'courses') setViewProps({});
            }}
            style={{
                padding: '12px 15px',
                marginBottom: '5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: activeTab === id ? '2px solid black' : '2px solid transparent',
                background: activeTab === id ? 'var(--primary)' : 'transparent',
                color: activeTab === id ? 'black' : 'inherit',
                fontWeight: activeTab === id ? 'bold' : 'normal',
                boxShadow: activeTab === id ? '3px 3px 0 white' : 'none',
                transition: 'all 0.1s'
            }}
        >
            <span className="material-icons" style={{ fontSize: '1.2rem' }}>{icon}</span>
            <span style={{ fontWeight: 500 }}>{label}</span>
        </div>
    );

    return (
        <div className="admin-container">
            {/* New Sidebar Layout */}
            <nav className="admin-sidebar" style={{ borderRight: '4px solid black', width: '280px' }}>
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', fontWeight: '900', fontSize: '1.2rem', borderBottom: '2px solid black' }}>
                    <span className="material-icons">school</span>
                    PRAXIUM.AI
                </div>

                <div className="admin-nav-menu" style={{ padding: '0 10px' }}>
                    <Menu id="home" label="Dashboard" icon="dashboard" />
                    <Menu id="courses" label="Courses" icon="library_books" />

                    <div style={{ margin: '15px 0 5px 15px', fontSize: '0.8rem', fontWeight: 'bold', color: 'gray', textTransform: 'uppercase', letterSpacing: '1px' }}>Communication</div>
                    <Menu id="teacher_chat" label="Chat with Teacher" icon="person_outline" />
                    <Menu id="ai_chat" label="Chat with AI" icon="smart_toy" />

                    <div style={{ margin: '15px 0 5px 15px', fontSize: '0.8rem', fontWeight: 'bold', color: 'gray', textTransform: 'uppercase', letterSpacing: '1px' }}>My Learning</div>
                    <Menu id="assessments" label="Assessments" icon="assignment" />
                    <Menu id="meetings" label="Live Classes" icon="videocam" />
                    <Menu id="achievements" label="Achievements" icon="emoji_events" />
                    <Menu id="profile" label="Profile" icon="person" />
                </div>

                <div style={{ marginTop: 'auto', padding: '20px' }}>
                    <button
                        onClick={toggleTheme}
                        style={{ width: '100%', padding: '10px', background: 'var(--bg-app)', border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginBottom: '10px', boxShadow: '4px 4px 0 black' }}
                    >
                        <span className="material-icons" style={{ fontSize: '1rem' }}>{darkMode ? 'light_mode' : 'dark_mode'}</span>
                        {darkMode ? 'Light' : 'Dark'}
                    </button>
                    <button onClick={logout} style={{ width: '100%', padding: '10px', background: 'var(--accent)', color: 'white', border: '2px solid black', fontWeight: 'bold', cursor: 'pointer', boxShadow: '4px 4px 0 black' }}>
                        LOGOUT
                    </button>
                </div>
            </nav>

            <main className="admin-main">
                {activeTab === 'home' && <OverviewPanel user={user} myCourses={myCourses} />}
                {activeTab === 'courses' && <CourseView {...viewProps} openModal={openModal} />}
                {activeTab === 'teacher_chat' && <TeacherChatView />}
                {activeTab === 'ai_chat' && <AIChatView />}
                {activeTab === 'assessments' && <AssessmentView onNavigateToCourse={handleNavigateToCourse} />}
                {activeTab === 'meetings' && <SectionPlaceholder title="Live Classes" />}
                {activeTab === 'achievements' && <SectionPlaceholder title="Achievements & Badges" />}
                {activeTab === 'profile' && <SectionPlaceholder title="Profile & Settings" />}
            </main>

            {/* Global Modal */}
            <BauhausModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
                onConfirm={handleConfirmModal}
                onCancel={closeModal}
            />
        </div>
    );
}

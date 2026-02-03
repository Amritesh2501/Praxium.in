import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import ChatInput from '../ChatInput';
import { generateAIResponse, generateQuiz, analyzeQuizResults, generateLevelContent } from '../../services/aiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChecklistLoader from '../ChecklistLoader';

// --- Sub-Components (Views) ---

const AILoadingScreen = ({ title, subtitle }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '500px' }}>
        <div className="ai-spinner"></div>
        <h2 className="ai-loading-text">{title}</h2>
        <p className="ai-subtext">{subtitle}</p>
    </div>
);

const HelpView = () => {
    const { user } = useAuth();
    const { addTicket, tickets, openModal } = useData();
    const [subTab, setSubTab] = useState('faq'); // faq, new, history
    const [newTicket, setNewTicket] = useState({ subject: '', description: '', type: 'General' });

    const myTickets = tickets.filter(t => t.userId === user.id);

    const handleSubmit = (e) => {
        e.preventDefault();
        addTicket({ ...newTicket, userId: user.id });
        setNewTicket({ subject: '', description: '', type: 'General' });
        openModal({
            title: "Ticket Submitted",
            message: "An admin will review it shortly.",
            type: 'info'
        });
        setSubTab('history');
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setSubTab('faq')} style={{ padding: '10px 20px', fontWeight: 'bold', border: '2px solid black', background: subTab === 'faq' ? 'black' : 'white', color: subTab === 'faq' ? 'white' : 'black', cursor: 'pointer' }}>FAQs</button>
                <button onClick={() => setSubTab('new')} style={{ padding: '10px 20px', fontWeight: 'bold', border: '2px solid black', background: subTab === 'new' ? 'black' : 'white', color: subTab === 'new' ? 'white' : 'black', cursor: 'pointer' }}>Open Ticket</button>
                <button onClick={() => setSubTab('history')} style={{ padding: '10px 20px', fontWeight: 'bold', border: '2px solid black', background: subTab === 'history' ? 'black' : 'white', color: subTab === 'history' ? 'white' : 'black', cursor: 'pointer' }}>My Tickets</button>
            </div>

            {subTab === 'faq' && (
                <div className="dash-card">
                    <h3>Frequently Asked Questions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>How do I reset my password?</div>
                            <div style={{ color: 'gray' }}>Contact your student administrator or submit a ticket to request a reset.</div>
                        </div>
                        <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>How does the AI Course work?</div>
                            <div style={{ color: 'gray' }}>Our AI analyzes your quiz results and automatically generates new learning modules tailored to your weak areas.</div>
                        </div>
                        <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Can I retake a quiz?</div>
                            <div style={{ color: 'gray' }}>Yes, you can revisit any module and retake the quiz to improve your score.</div>
                        </div>
                    </div>
                </div>
            )}

            {subTab === 'new' && (
                <div className="dash-card" style={{ maxWidth: '600px' }}>
                    <h3>Submit a Support Ticket</h3>
                    <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                        <div className="form-group">
                            <label>Issue Type</label>
                            <select
                                value={newTicket.type}
                                onChange={e => setNewTicket({ ...newTicket, type: e.target.value })}
                                style={{ width: '100%', padding: '12px', border: '2px solid black' }}
                            >
                                <option>General</option>
                                <option>Technical Issue</option>
                                <option>Course Content</option>
                                <option>Account Access</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Subject</label>
                            <input required placeholder="Brief summary of the issue" value={newTicket.subject} onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid black' }} />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea required rows="5" placeholder="Please describe your issue in detail..." value={newTicket.description} onChange={e => setNewTicket({ ...newTicket, description: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid black', fontFamily: 'inherit' }} />
                        </div>
                        <button className="auth-button" style={{ marginTop: '10px' }}>SUBMIT TICKET</button>
                    </form>
                </div>
            )}

            {subTab === 'history' && (
                <div className="dash-card">
                    <h3>My Support Tickets</h3>
                    <div style={{ marginTop: '20px' }}>
                        {myTickets.map(t => (
                            <div key={t.id} style={{ padding: '15px', border: '2px solid black', marginBottom: '15px', background: t.status === 'Solved' ? '#e8f5e9' : '#fff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                    <span style={{ fontWeight: 'bold' }}>{t.subject}</span>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                        background: t.status === 'Solved' ? 'green' : 'orange', color: 'white'
                                    }}>{t.status.toUpperCase()}</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'gray', marginBottom: '10px' }}>{new Date(t.date).toLocaleDateString()} • {t.type}</div>
                                <div>{t.description}</div>
                            </div>
                        ))}
                        {myTickets.length === 0 && <p>No tickets submit yet.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

const OverviewPanel = ({ user, myCourses, onNavigate }) => {
    const { courses, enrollStudent, openModal } = useData();

    // Discover New Courses Logic
    const enrolledIds = myCourses.map(c => c.id);
    const discoverableCourses = courses.filter(c => !enrolledIds.includes(c.id)).slice(0, 6); // Show top 6

    // Dynamic Suggestion
    const latestSuggestion = user.suggestedCourses && user.suggestedCourses.length > 0
        ? user.suggestedCourses[user.suggestedCourses.length - 1]
        : null;

    // Active Course for Progress
    const activeCourse = myCourses.length > 0 ? myCourses[0] : null;
    const progressLevel = activeCourse ? (activeCourse.currentLevel || 1) : 0;
    // Assuming max level 10 for progress bar visualization
    const progressPercent = Math.min((progressLevel / 10) * 100, 100);

    const handleEnroll = (course) => {
        enrollStudent(course.id, user.id);
        openModal({
            title: "Enrolled Successfully!",
            message: `You are now enrolled in "${course.title}". Start learning today!`,
            type: 'info'
        });
    };

    return (
        <div className="dashboard-grid fade-in">
            {/* 1. Welcome & Streak */}
            <div className="dash-card" style={{ gridColumn: '1 / -1', background: 'var(--primary)', color: 'black', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '5px' }}>Hello, {user.name.split(' ')[0]}!</h2>
                    <p style={{ opacity: 0.9, fontWeight: 'bold' }}>Value your time, learn something new today.</p>
                </div>
                <div style={{ textAlign: 'center', background: 'white', padding: '10px 20px', border: '2px solid black', boxShadow: '4px 4px 0 black' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{user.streak || 1}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>DAY STREAK</div>
                </div>
            </div>

            {/* 2. AI Learning Status */}
            <div className="dash-card">
                <h3>AI Insight</h3>
                <div style={{ marginTop: '15px', padding: '15px', background: '#fff', border: '2px solid black', boxShadow: '4px 4px 0 #ddd' }}>
                    {latestSuggestion ? (
                        <>
                            <strong>Focus Area Detected:</strong> You might benefit from reviewing <em>{latestSuggestion}</em>.
                            <button
                                style={{ display: 'block', marginTop: '10px', background: 'black', color: 'white', border: 'none', padding: '8px 12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '2px 2px 0 var(--accent)' }}
                            >
                                Start Recommended Course
                            </button>
                        </>
                    ) : (
                        <>
                            <strong>On Track:</strong> Your performance looks great! Keep challenging yourself with new topics.
                            <div style={{ marginTop: '10px', fontSize: '0.9rem', color: 'gray' }}>No immediate weak areas detected.</div>
                        </>
                    )}
                </div>
            </div>

            {/* 3. Current Progress */}
            <div className="dash-card">
                <h3>Learning Progress</h3>
                {activeCourse ? (
                    <div style={{ marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <strong>{activeCourse.title}</strong>
                            <span>{progressPercent}%</span>
                        </div>
                        <div style={{ width: '100%', height: '16px', background: 'white', border: '2px solid black' }}>
                            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--secondary)', borderRight: '2px solid black' }}></div>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'gray', marginTop: '8px' }}>Current Level: {progressLevel}</p>
                    </div>
                ) : (
                    <p style={{ color: 'gray' }}>No active courses. Enroll in one to track progress!</p>
                )}
            </div>

            {/* 4. Notifications */}
            <div className="dash-card" style={{ gridColumn: '1 / -1' }}>
                <h3>Notifications</h3>
                <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px', marginTop: '10px' }}>
                    <div style={{ minWidth: '250px', padding: '15px', border: '2px solid black', background: 'var(--bg-card)', boxShadow: '4px 4px 0 #eee' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 'bold' }}>SYSTEM</div>
                        <div style={{ fontWeight: 'bold' }}>Welcome to Praxium AI</div>
                        <div style={{ fontSize: '0.9rem', color: 'gray' }}>Start your learning journey today.</div>
                    </div>
                    {activeCourse && (
                        <div style={{ minWidth: '250px', padding: '15px', border: '2px solid black', background: 'var(--bg-card)', boxShadow: '4px 4px 0 #eee' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold' }}>REMINDER</div>
                            <div style={{ fontWeight: 'bold' }}>Continue {activeCourse.title}</div>
                            <div style={{ fontSize: '0.9rem', color: 'gray' }}>You're doing great!</div>
                        </div>
                    )}
                </div>
            </div>

            {/* 5. Discover New Courses */}
            <div className="dash-card" style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>Discover New Courses</h3>
                    <button onClick={() => onNavigate('courses', { initialSubTab: 'catalog' })} style={{ background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>VIEW ALL CATALOG</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {discoverableCourses.map((c, idx) => (
                        <div key={idx} className="hover-scale" style={{ padding: '20px', border: '2px solid black', background: 'white', boxShadow: '5px 5px 0 #eee' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '5px' }}>{c.title.toUpperCase()}</div>
                            <p style={{ fontSize: '0.9rem', color: 'gray', height: '40px', overflow: 'hidden' }}>{c.description}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{c.duration} WEEKS</span>
                                <button
                                    onClick={() => handleEnroll(c)}
                                    style={{ padding: '8px 15px', background: 'var(--secondary)', color: 'white', border: '2px solid black', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    ENROLL NOW
                                </button>
                            </div>
                        </div>
                    ))}
                    {discoverableCourses.length === 0 && <p style={{ color: 'gray' }}>You've enrolled in everything! Check back later for new content.</p>}
                </div>
            </div>
        </div>
    );
};

const GamifiedLearningView = ({ course, onExit, openModal }) => {
    const { updateSuggestedProgress } = useData();
    const [levelData, setLevelData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState('lesson'); // lesson, quiz, success
    const [quizAnswer, setQuizAnswer] = useState(null);

    useEffect(() => {
        loadLevel();
    }, []); // Only load on mount. Next levels loaded manually.

    const loadLevel = async () => {
        setLoading(true);
        try {
            const data = await generateLevelContent(course.title, course.currentLevel);
            setLevelData(data);
            setStep('lesson');
            setQuizAnswer(null);
        } catch (e) {
            console.error(e);
            openModal({
                title: "Error",
                message: "Failed to load level content. Please try again.",
                type: 'alert',
                confirmText: "Close"
            });
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
            openModal({
                title: "Incorrect Answer",
                message: "Incorrect. Try reviewing the lesson!",
                type: 'alert', // Or 'error' if supported styling differs
                confirmText: "OK"
            });
            setStep('lesson');
        }
    };

    if (loading) return (
        <AILoadingScreen
            title={`GENERATING LEVEL ${course.currentLevel}...`}
            subtitle="AI is building your personalized lesson."
        />
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

                            {/* Video Section for Gamified View */}
                            <SmartVideoPlayer
                                videoId={levelData.videoId}
                                title={levelData.lessonTitle}
                                query={levelData.youtubeQuery || levelData.lessonTitle + " tutorial"}
                            />

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


const getYouTubeVideoId = (urlOrId) => {
    if (!urlOrId) return null;
    const cleanId = urlOrId.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanId)) return cleanId;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = cleanId.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// --- Help Chat Modal ---
const HelpChatModal = ({ isOpen, onClose, courseTitle, moduleTitle, moduleContent }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Initial greeting
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: 'intro',
                sender: 'ai',
                text: `Hi ${user.name}! I'm your AI tutor for "${moduleTitle}". What part can I explain better?`
            }]);
        }
    }, [isOpen, moduleTitle, user.name]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Import askTutor dynamically to avoid circular deps if any, or just use global
            const { askTutor } = await import('../../services/aiService');
            const responseText = await askTutor(courseTitle, moduleTitle, moduleContent, userMsg.text);

            const aiMsg = { id: Date.now() + 1, sender: 'ai', text: responseText };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: "I'm having trouble connecting right now. Please try again." }]);
        }
        setIsTyping(false);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.5)', zIndex: 1100,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div className="dash-card" style={{ width: '90%', maxWidth: '500px', height: '600px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '4px solid black', boxShadow: '10px 10px 0 black' }}>
                {/* Header */}
                <div style={{ padding: '15px', background: 'var(--primary)', borderBottom: '2px solid black', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="material-icons">school</span>
                        AI Tutor: {moduleTitle}
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                </div>

                {/* Chat Area */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#fffbeb' }}>
                    {messages.map((msg, idx) => (
                        <div key={idx} style={{
                            marginBottom: '15px',
                            textAlign: msg.sender === 'user' ? 'right' : 'left'
                        }}>
                            <div style={{
                                display: 'inline-block',
                                padding: '10px 15px',
                                background: msg.sender === 'user' ? 'black' : 'white',
                                color: msg.sender === 'user' ? 'white' : 'black',
                                borderRadius: '8px',
                                border: '2px solid black',
                                maxWidth: '80%',
                                textAlign: 'left'
                            }}>
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isTyping && <div style={{ color: 'gray', fontStyle: 'italic' }}>AI is typing...</div>}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} style={{ padding: '15px', borderTop: '2px solid black', background: 'white', display: 'flex', gap: '10px' }}>
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        style={{ flex: 1, padding: '10px', border: '2px solid black' }}
                    />
                    <button type="submit" style={{ background: 'var(--secondary)', color: 'white', border: '2px solid black', fontWeight: 'bold', padding: '0 20px', cursor: 'pointer' }}>ASK</button>
                </form>
            </div>
        </div>
    );
};

// --- Smart Video Player Component ---
const SmartVideoPlayer = ({ videoId, title, query }) => {
    // Robust Logic: 
    // If we have a query, PREFER the search list because it's safer than pointing to a specific ID that might be dead.
    const searchUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query || title + " tutorial")}`;
    const directUrl = videoId && videoId.length === 11 ? `https://www.youtube.com/embed/${videoId}` : null;

    // Default to Search if query exists (safest for AI content), unless user specifically requested direct ID logic.
    // Given the user compliant "fix unavailable issue", we default to search for robustness.
    const [mode, setMode] = useState(query ? 'search' : 'direct');
    const finalSrc = mode === 'search' ? searchUrl : (directUrl || searchUrl);

    return (
        <div style={{ marginBottom: '30px' }}>
            <div style={{ border: '2px solid black', boxShadow: '8px 8px 0 black', position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', background: '#000' }}>
                <iframe
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    src={finalSrc}
                    title={title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
            <div style={{ padding: '10px', background: '#f5f5f5', border: '2px solid black', borderTop: 'none', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <div style={{ fontStyle: 'italic' }}>
                    {mode === 'search' ? "Playing related search results." : "Playing specific video."}
                </div>
                <div>
                    {directUrl && query && (
                        <button
                            onClick={() => setMode(mode === 'search' ? 'direct' : 'search')}
                            style={{ background: 'transparent', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer', marginRight: '15px' }}
                        >
                            {mode === 'search' ? "Try Specific Video" : "Switch to Search Results"}
                        </button>
                    )}
                    <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query || title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'blue', textDecoration: 'underline', fontWeight: 'bold' }}
                    >
                        Watch on YouTube ↗
                    </a>
                </div>
            </div>
        </div>
    );
};

const StandardLessonView = ({ course, onExit, openModal }) => {
    const { user } = useAuth();
    const { markCourseComplete, markModuleComplete, users } = useData();
    const student = users.find(u => String(u.id).trim().toLowerCase() === String(user.id).trim().toLowerCase());
    const courseIdKey = Object.keys(student?.completedModules || {}).find(k => k.trim().toLowerCase() === String(course.id).trim().toLowerCase()) || course.id;
    const completedModules = student?.completedModules?.[courseIdKey] || [];

    const storageKey = `last_active_module_${user.id}_${course.id}`;

    // Load last active module from storage or default to first
    const [activeModule, setActiveModule] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const found = course.modules?.find(m => m.title === saved);
            if (found) return found;
        }
        return course.modules?.[0] || null;
    });

    // Save active module whenever it changes
    useEffect(() => {
        if (activeModule) {
            localStorage.setItem(storageKey, activeModule.title);
        }
    }, [activeModule, storageKey]);

    const [activeTab, setActiveTab] = useState('lecture'); // lecture, video, notes, tips
    const [showHelp, setShowHelp] = useState(false);
    const [isMarking, setIsMarking] = useState(false);

    // Group modules by section
    const sections = useMemo(() => {
        const groups = {};
        course.modules?.forEach((m, index) => {
            const sectionName = m.section || "Introduction & Fundamentals";
            if (!groups[sectionName]) groups[sectionName] = [];
            groups[sectionName].push({ ...m, index });
        });
        return Object.entries(groups).map(([name, mods]) => ({ name, modules: mods }));
    }, [course.modules]);

    // Collapsed sections state
    const [collapsedSections, setCollapsedSections] = useState({});

    const toggleSection = (name) => {
        setCollapsedSections(prev => ({ ...prev, [name]: !prev[name] }));
    };

    // Auto-expand section containing active module
    useEffect(() => {
        if (activeModule) {
            const sectionName = activeModule.section || "Introduction & Fundamentals";
            if (collapsedSections[sectionName]) {
                setCollapsedSections(prev => ({ ...prev, [sectionName]: false }));
            }
        }
    }, [activeModule]);

    // Locking logic: Module is unlocked if it's first OR if previous is completed
    const isModuleUnlocked = (index) => {
        if (index === 0) return true;
        const prevModule = course.modules[index - 1];
        return completedModules.includes(prevModule.title);
    };

    const isLastModule = activeModule && course.modules?.[course.modules.length - 1]?.title === activeModule.title;

    // Helper to render content with markdown
    const RenderContent = ({ content }) => (
        <div className="markdown-content" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || "_No content available for this section._"}
            </ReactMarkdown>
        </div>
    );

    return (
        <div className="fade-in" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header Strip */}
            <div className="admin-header-strip" style={{ padding: '15px 40px', background: 'var(--primary)', color: 'black', marginBottom: 0, borderBottom: '3px solid black' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button
                            onClick={onExit}
                            style={{
                                background: 'white',
                                border: '2px solid black',
                                padding: '8px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                boxShadow: '2px 2px 0 black'
                            }}
                        >
                            <span className="material-icons">arrow_back</span>
                            BACK
                        </button>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.7 }}>Personalized Training</div>
                            <h1 style={{ fontSize: '1.3rem', margin: 0 }}>{course.title}</h1>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'rgba(0,0,0,0.5)' }}>PROGRESS</div>
                            <div style={{ fontWeight: '900', fontSize: '1.1rem' }}>{completedModules.length}/{course.modules?.length || 0}</div>
                        </div>
                        <div style={{ width: '100px', height: '12px', background: 'white', border: '2px solid black' }}>
                            <div style={{
                                width: `${(completedModules.length / (course.modules?.length || 1)) * 100}%`,
                                height: '100%',
                                background: 'var(--secondary)',
                                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="course-main-layout" style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '20px', gap: '20px' }}>
                {/* Module Sidebar */}
                <div style={{ width: '320px', background: '#f8f9fa', border: '3px solid black', boxShadow: '5px 5px 0 black', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', background: 'black', color: 'white', fontWeight: 'bold' }}>CURRICULUM</div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {sections.map((section, sIdx) => {
                            const isCollapsed = collapsedSections[section.name];
                            const completedInSection = section.modules.filter(m => completedModules.includes(m.title)).length;
                            const totalInSection = section.modules.length;

                            return (
                                <div key={sIdx} style={{ borderBottom: '1px solid black' }}>
                                    <div
                                        onClick={() => toggleSection(section.name)}
                                        style={{
                                            padding: '12px 20px',
                                            background: '#333',
                                            color: 'white',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <span>{section.name.toUpperCase()}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{completedInSection}/{totalInSection}</span>
                                            <span className="material-icons" style={{ fontSize: '1rem' }}>
                                                {isCollapsed ? 'expand_more' : 'expand_less'}
                                            </span>
                                        </div>
                                    </div>

                                    {!isCollapsed && (
                                        <div className="animate-slide-down">
                                            {section.modules.map((m) => {
                                                const isSelected = activeModule?.title === m.title;
                                                const isCompleted = completedModules.includes(m.title);
                                                const unlocked = isModuleUnlocked(m.index);

                                                return (
                                                    <div
                                                        key={m.title}
                                                        onClick={() => unlocked && setActiveModule(m)}
                                                        style={{
                                                            padding: '15px 20px',
                                                            cursor: unlocked ? 'pointer' : 'not-allowed',
                                                            borderBottom: '1px solid #ddd',
                                                            background: isSelected ? 'var(--primary)' : isCompleted ? '#e8f5e9' : 'transparent',
                                                            color: unlocked ? 'inherit' : '#999',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <span className="material-icons" style={{
                                                            fontSize: '1.2rem',
                                                            color: isCompleted ? 'green' : (isSelected ? 'black' : '#ccc')
                                                        }}>
                                                            {isCompleted ? 'check_circle' : (unlocked ? 'play_circle_outline' : 'lock')}
                                                        </span>
                                                        <span style={{ fontSize: '0.9rem', fontWeight: isSelected ? 'bold' : 'normal' }}>
                                                            {m.title}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', border: '3px solid black', boxShadow: '5px 5px 0 black', overflow: 'hidden' }}>
                    {activeModule ? (
                        <>
                            {/* Tabs Area */}
                            <div style={{ padding: '20px 40px', background: 'white', borderBottom: '2px solid black' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h2 style={{ fontSize: '1.8rem', marginBottom: '15px' }}>{activeModule.title}</h2>
                                    <button
                                        onClick={() => setShowHelp(true)}
                                        style={{ padding: '8px 16px', background: '#ffebee', color: '#c62828', border: '2px solid #c62828', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <span className="material-icons">help_outline</span>
                                        Ask AI Tutor
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {[
                                        { id: 'lecture', icon: 'description', label: 'Lecture' },
                                        { id: 'video', icon: 'play_circle', label: 'Video' },
                                        { id: 'notes', icon: 'edit_note', label: 'Notes' },
                                        { id: 'tips', icon: 'lightbulb', label: 'Tips' },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            style={{
                                                padding: '8px 16px',
                                                background: activeTab === tab.id ? 'black' : 'white',
                                                color: activeTab === tab.id ? 'white' : 'black',
                                                border: '2px solid black',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                boxShadow: activeTab === tab.id ? '3px 3px 0 var(--accent)' : '2px 2px 0 #999'
                                            }}
                                        >
                                            <span className="material-icons" style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Scrollable Area */}
                            <div id="module-content-scroll" style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                                <div className="fade-in">
                                    {activeTab === 'lecture' && <RenderContent content={activeModule.content} />}
                                    {activeTab === 'notes' && <RenderContent content={activeModule.notes} />}
                                    {activeTab === 'tips' && <RenderContent content={activeModule.tips} />}
                                    {activeTab === 'video' && (
                                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                            <SmartVideoPlayer
                                                videoId={activeModule.videoId}
                                                title={activeModule.title}
                                                query={activeModule.youtubeQuery || activeModule.title + " tutorial"}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Completion Bar */}
                            <div style={{ padding: '20px 40px', background: '#f8f9fa', borderTop: '2px solid black', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px' }}>
                                <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: 'bold' }}>
                                    {isLastModule ? "READY TO GRADUATE?" : "READY FOR THE NEXT STEP?"}
                                </div>
                                {!completedModules.includes(activeModule.title) ? (
                                    <button
                                        id="mark-finished-btn"
                                        disabled={isMarking}
                                        onClick={async () => {
                                            console.log("[UI] Mark finished clicked for:", activeModule.title);
                                            setIsMarking(true);
                                            try {
                                                // 1. Mark as complete
                                                const res = await markModuleComplete(user.id, course.id, activeModule.title);
                                                console.log("[UI] markModuleComplete result:", res);

                                                // 2. Immediate feedback modal
                                                const currentIndex = course.modules.findIndex(m => m.title === activeModule.title);
                                                if (currentIndex < course.modules.length - 1) {
                                                    const next = course.modules[currentIndex + 1];

                                                    openModal({
                                                        title: "Great Job!",
                                                        message: `"${activeModule.title}" is complete. Ready to continue to "${next.title}"?`,
                                                        type: 'info',
                                                        confirmText: "Yes, Next Lesson",
                                                        onConfirm: () => {
                                                            setActiveModule(next);
                                                            const scrollContainer = document.getElementById('module-content-scroll');
                                                            if (scrollContainer) scrollContainer.scrollTop = 0;
                                                        }
                                                    });
                                                } else {
                                                    openModal({
                                                        title: "Course Completed!",
                                                        message: "You've finished all modules in this course. You can now claim your certificate.",
                                                        type: 'info',
                                                        confirmText: "Awesome"
                                                    });
                                                }
                                            } catch (err) {
                                                console.error("[UI] Error marking module complete:", err);
                                                openModal({
                                                    title: "Saving Failed",
                                                    message: "Failed to save progress. Please try again.",
                                                    type: 'error'
                                                });
                                            } finally {
                                                setIsMarking(false);
                                            }
                                        }}
                                        style={{
                                            padding: '12px 30px',
                                            background: isMarking ? '#666' : '#0047AB',
                                            color: 'white',
                                            border: '3px solid black',
                                            fontWeight: 'bold',
                                            cursor: isMarking ? 'not-allowed' : 'pointer',
                                            boxShadow: isMarking ? 'none' : '4px 4px 0 black',
                                            textTransform: 'uppercase',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}
                                    >
                                        {isMarking && <span className="material-icons animate-spin">sync</span>}
                                        {isMarking ? "SAVING..." : "Mark as Finished & Next"}
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'green', fontWeight: 'bold', background: '#e8f5e9', padding: '10px 20px', border: '2px solid green' }}>
                                        <span className="material-icons">check_circle</span>
                                        LESSON COMPLETED
                                    </div>
                                )}

                                {isLastModule && (
                                    <button
                                        onClick={() => {
                                            openModal({
                                                title: "Finish Course",
                                                message: `Congratulations! You have finished all ${course.modules.length} modules. Want to claim your diploma?`,
                                                type: 'confirm',
                                                confirmText: "Yes, Finish Course",
                                                onConfirm: () => {
                                                    markCourseComplete(user.id, course.id);
                                                    onExit();
                                                }
                                            });
                                        }}
                                        style={{
                                            padding: '12px 30px',
                                            background: 'var(--accent)',
                                            color: 'white',
                                            border: '3px solid black',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            boxShadow: '4px 4px 0 black'
                                        }}
                                    >
                                        FINISH ENTIRE COURSE
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'gray' }}>
                            <div>Select a module from the sidebar to begin.</div>
                        </div>
                    )}
                </div>
            </div>

            {activeModule && (
                <HelpChatModal
                    isOpen={showHelp}
                    onClose={() => setShowHelp(false)}
                    courseTitle={course.title}
                    moduleTitle={activeModule.title}
                    moduleContent={activeModule.content}
                />
            )}
        </div>
    );
};

// BauhausModal is now a shared component

const CourseView = ({ initialSubTab = 'my_courses', autoLaunchTopic = null, openModal }) => {
    const { user } = useAuth();
    const { courses, suggestedCourses, enrollStudent, getCoursesForStudent } = useData();
    const [subTab, setSubTab] = useState(initialSubTab); // my_courses, suggested, catalog
    const [viewingCourseId, setViewingCourseId] = useState(null); // Store ID only

    const myCourses = getCoursesForStudent(user.id);
    const enrolledIds = myCourses.map(c => c.id);

    // Effect for deep linking
    useEffect(() => {
        if (initialSubTab) setSubTab(initialSubTab);
        if (autoLaunchTopic) {
            // Find the course object for the topic
            const topicCourse = suggestedCourses.find(c => c.title === autoLaunchTopic) || courses.find(c => c.title === autoLaunchTopic);
            if (topicCourse) {
                setViewingCourseId(topicCourse.id);
            }
        }
    }, [initialSubTab, autoLaunchTopic, suggestedCourses, courses]);

    // Derived State: Get the actual course object from the latest data
    const viewingCourse = viewingCourseId
        ? (suggestedCourses.find(c => c.id === viewingCourseId) || courses.find(c => c.id === viewingCourseId))
        : null;

    if (viewingCourse) {
        if (viewingCourse.isAI) {
            return <GamifiedLearningView course={viewingCourse} onExit={() => setViewingCourseId(null)} openModal={openModal} />;
        } else {
            return <StandardLessonView course={viewingCourse} onExit={() => setViewingCourseId(null)} openModal={openModal} />;
        }
    }

    return (
        <div className="fade-in">
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button onClick={() => setSubTab('my_courses')} style={{ padding: '10px 20px', border: '2px solid black', background: subTab === 'my_courses' ? 'black' : 'white', color: subTab === 'my_courses' ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer', boxShadow: subTab === 'my_courses' ? '3px 3px 0 var(--primary)' : '3px 3px 0 black' }}>My Courses</button>
                <button onClick={() => setSubTab('suggested')} style={{ padding: '10px 20px', border: '2px solid black', background: subTab === 'suggested' ? 'black' : 'white', color: subTab === 'suggested' ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer', boxShadow: subTab === 'suggested' ? '3px 3px 0 var(--primary)' : '3px 3px 0 black' }}>
                    AI Suggested {suggestedCourses.length > 0 && <span style={{ marginLeft: '5px', background: 'var(--accent)', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem' }}>{suggestedCourses.length}</span>}
                </button>
                <button onClick={() => setSubTab('catalog')} style={{ padding: '10px 20px', border: '2px solid black', background: subTab === 'catalog' ? 'black' : 'white', color: subTab === 'catalog' ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer', boxShadow: subTab === 'catalog' ? '3px 3px 0 var(--primary)' : '3px 3px 0 black' }}>Catalog</button>
            </div>

            {/* Course Grid */}
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
                                            onConfirm: () => setViewingCourseId(c.id)
                                        })}
                                        style={{ width: '100%', padding: '12px', background: 'black', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        CONTINUE LEARNING
                                    </button>
                                )}

                                {subTab === 'suggested' && (
                                    <button
                                        onClick={() => setViewingCourseId(c.id)}
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
    const { users, sendMessage, getChats, getTeachersForStudent } = useData();
    const [selectedTeacherId, setSelectedTeacherId] = useState(null);
    const messagesEndRef = useRef(null);

    // Get relevant teachers
    const teachers = getTeachersForStudent(user.id);

    // Auto-select first teacher if available and none selected
    useEffect(() => {
        if (!selectedTeacherId && teachers.length > 0) {
            setSelectedTeacherId(teachers[0].id);
        }
    }, [teachers, selectedTeacherId]);

    const activeChatData = useMemo(() => {
        if (!selectedTeacherId) return [];
        return getChats(user.id, selectedTeacherId);
    }, [selectedTeacherId, user.id, getChats]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeChatData]);

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

const AssessmentView = ({ onNavigateToCourse, openModal }) => {
    const { user, refreshUser } = useAuth();
    const {
        users, getCoursesForStudent, addSuggestedCourse, updateSuggestedProgress, awardBadge, refreshData
    } = useData();

    // -- STATE --
    const [viewMode, setViewMode] = useState('hub'); // 'hub', 'course_detail', 'history'

    // SYNC: Ensure Medals from History are in User Profile
    useEffect(() => {
        const performSync = async () => {
            // 1. Refresh Data Context to be sure we have latest user from LocalStorage
            // This is crucial because DataContext might have initialized empty if API failed
            if (refreshData) await refreshData();

            // 2. Scan History for missing medals
            const savedHistory = JSON.parse(localStorage.getItem('assessment_history') || '[]');

            if (savedHistory.length > 0 && user) {
                let restoredCount = 0;

                // We need to look up the user again in the freshly loaded 'users' array 
                // to be absolutely sure we're checking against the persisted state, not just Auth state
                // However, we can use the 'user' from AuthContext as a proxy for ID.

                // Note: The 'user' from useAuth might be stale if DataContext just refreshed.
                // We rely on 'users' from useData mostly for awardBadge.

                // Let's use the 'awardBadge' function's internal check, but we need to know IF we should call it.
                // We'll check against 'user.achievements' assuming Auth is reasonably up to date, 
                // OR we can trigger blindly if we are paranoid (awardBadge handles dupes).
                // Let's trigger blindly for known medals in history to be safe.

                savedHistory.forEach(record => {
                    if (record.earnedMedal) {
                        // Check if we already have it in current view
                        const hasIt = user.achievements?.some(a => a.id === record.earnedMedal.id);
                        if (!hasIt) {
                            console.log("Restoring missing medal:", record.earnedMedal.title);
                            awardBadge(user.id, record.earnedMedal.id, {
                                title: record.earnedMedal.title,
                                description: record.earnedMedal.description,
                                icon: record.earnedMedal.icon,
                                date: record.earnedMedal.date // Preserve original date
                            });
                            restoredCount++;
                        }
                    }
                });

                if (restoredCount > 0) {
                    console.log(`Restored ${restoredCount} medals.`);
                    // Small delay to allow backend save, then refresh auth to update UI
                    setTimeout(() => refreshUser(), 500);
                }
            }
        };

        performSync();
    }, [user?.id, viewMode]); // Run on mount and when view changes
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showPerfOptions, setShowPerfOptions] = useState(false); // Toggle for Recent Performance options
    const [showPerfSuggested, setShowPerfSuggested] = useState(false); // Toggle for "See Suggested Topics" list inside Perf Options
    const [revExpanded, setRevExpanded] = useState({}); // Track expanded states for Needs Revision modules { "TopicName": true }

    // Test State
    const [testState, setTestState] = useState('idle'); // idle, loading, taking, analyzing, complete
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [activeTopic, setActiveTopic] = useState(null); // The specific topic (module) being tested

    // Data State
    const [history, setHistory] = useState(() => {
        const saved = localStorage.getItem('assessment_history');
        if (saved) return JSON.parse(saved);

        // Seed Mock Data for Demonstration
        const mockHistory = [
            {
                id: 1,
                date: new Date().toLocaleDateString(),
                score: 65,
                course: 'Machine Learning',
                topic: 'Introduction to ML',
                feedback: 'Good effort, but review the core definitions of Supervised vs Unsupervised learning.'
            }
        ];
        // Also seed Topic Scores to match
        const mockScores = { 'ml-101': { 0: 65 } };
        localStorage.setItem('topic_scores', JSON.stringify(mockScores));

        return mockHistory;
    });

    // Persist history changes
    useEffect(() => {
        localStorage.setItem('assessment_history', JSON.stringify(history));
    }, [history]);

    const [topicScores, setTopicScores] = useState(() => {
        const saved = localStorage.getItem('topic_scores');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('topic_scores', JSON.stringify(topicScores));
    }, [topicScores]);

    const myCourses = getCoursesForStudent(user.id);

    // Helpers
    const getUnlockStatus = (course, index) => {
        if (index === 0) return true; // First topic always unlocked
        const prevScore = topicScores[course.id]?.[index - 1];
        return prevScore >= 80;
    };

    const startTopicTest = async (course, module, index) => {
        if (!getUnlockStatus(course, index)) {
            openModal({ title: "Locked", message: "Complete the previous topic with 80% to unlock.", type: 'alert' });
            return;
        }

        setTestState('loading');
        setActiveTopic({ ...module, index });

        try {
            // Updated Prompt to be Topic Specific
            const promptTitle = `${module.title} of course ${course.title}`;
            const data = await generateQuiz(promptTitle);

            if (data && data.questions) {
                setQuiz(data.questions);
                setTestState('taking');
                setAnswers({});
            } else {
                openModal({ title: "AI Busy", message: "Failed to generate quiz.", type: 'alert' });
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
            const analysis = await analyzeQuizResults(quiz, answers, selectedCourse.title);
            if (analysis) {
                setResult(analysis);

                // Auto-suggest weak topics
                if (analysis.weakTopics && analysis.weakTopics.length > 0) {
                    analysis.weakTopics.forEach(topic => {
                        if (typeof addSuggestedCourse === 'function') {
                            addSuggestedCourse(topic);
                        }
                    });
                }

                setTestState('complete');

                let earnedMedal = null;

                // --- Gamification: Award Medals ---
                if (analysis.score >= 100) {
                    earnedMedal = {
                        title: 'Perfect Score!',
                        description: `Aced the ${activeTopic.title} test!`,
                        icon: 'star'
                    };
                    awardBadge(user.id, `perfect_score_${selectedCourse.id}_${activeTopic.index}`, earnedMedal);
                } else if (analysis.score >= 80) {
                    earnedMedal = {
                        title: 'Topic Mastered',
                        description: `Mastered ${activeTopic.title}.`,
                        icon: 'verified'
                    };
                    awardBadge(user.id, `passed_${selectedCourse.id}_${activeTopic.index}`, earnedMedal);
                }

                if (earnedMedal) {
                    setResult(prev => ({ ...prev, earnedMedal }));
                    // Refresh Auth User State to reflect new badges immediately
                    setTimeout(() => refreshUser(), 100);
                }

                // AI Suggested Progress
                if (selectedCourse?.isAI && analysis.score >= 70) {
                    updateSuggestedProgress(selectedCourse.id, selectedCourse.currentLevel + 1);
                }

                // Save Topic Score
                setTopicScores(prev => ({
                    ...prev,
                    [selectedCourse.id]: {
                        ...(prev[selectedCourse.id] || {}),
                        [activeTopic.index]: analysis.score
                    }
                }));

                // History
                const newRecord = {
                    id: Date.now(),
                    date: new Date().toLocaleDateString(),
                    score: analysis.score,
                    course: selectedCourse.title,
                    topic: activeTopic.title,
                    feedback: analysis.feedback,
                    weakTopics: analysis.weakTopics || [],
                    fullResult: analysis,
                    earnedMedal: earnedMedal, // Save the medal explicitly
                    quizSnapshot: quiz,
                    answersSnapshot: answers
                };
                setHistory(prev => [newRecord, ...prev]);
            }
        } catch (e) {
            console.error(e);
            openModal({ title: "Error", message: "Analysis failed.", type: 'alert' });
            setTestState('taking');
        }
    };

    // --- Loading Views (Checklist) ---
    if (testState === 'loading') return <ChecklistLoader mode="curating" />;
    if (testState === 'analyzing') return <ChecklistLoader mode="evaluating" />;

    // --- Taking Test View ---
    if (testState === 'taking' && quiz) {
        return (
            <div className="fade-in" style={{ padding: '20px' }}>
                <div className="dash-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        <div>
                            <h3>{activeTopic?.title}</h3>
                            <span style={{ fontSize: '0.9rem', color: 'gray' }}>{selectedCourse?.title}</span>
                        </div>
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
            </div>
        );
    }

    // --- Result View ---
    if (testState === 'complete' && result) {
        return (
            <div className="dash-card fade-in" style={{ textAlign: 'center', margin: '20px', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
                <div style={{ fontSize: '5rem', fontWeight: '900', color: result.score >= 80 ? 'var(--secondary)' : 'var(--accent)', lineHeight: 1 }}>
                    {result.score}%
                </div>
                <h2 style={{ fontSize: '2rem', margin: '10px 0' }}>{result.score >= 80 ? 'Topic Mastered! 🔓' : 'Keep Practicing'}</h2>

                {/* Visual Reward: Medal */}
                {result.earnedMedal && (
                    <div className="animate-slide-up" style={{ margin: '20px auto', padding: '20px', background: 'linear-gradient(135deg, #fff, #f0f4c3)', border: '2px solid #FFD700', borderRadius: '15px', maxWidth: '300px', boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)' }}>
                        <div style={{ width: '80px', height: '80px', background: '#FFD700', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto', boxShadow: '0 4px 0 #daa520' }}>
                            <span className="material-icons" style={{ fontSize: '3rem', color: 'white' }}>{result.earnedMedal.icon}</span>
                        </div>
                        <h3 style={{ margin: '5px 0', color: '#daa520' }}>{result.earnedMedal.title}</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>{result.earnedMedal.description}</p>
                    </div>
                )}

                <p style={{ fontSize: '1.2rem', color: '#555', marginBottom: '30px' }}>{result.feedback}</p>

                {result.score < 80 && (
                    <div style={{ background: '#fff5f5', color: 'red', padding: '10px', borderRadius: '4px', fontWeight: 'bold', marginBottom: '20px', border: '1px solid red' }}>
                        Score 80% to unlock the next topic.
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px', textAlign: 'left' }}>
                    {/* Option 1: Study Weak Areas */}
                    <div className="dash-card" style={{ border: '2px solid black', background: '#fffbeb' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                            <span className="material-icons" style={{ color: '#d97706' }}>lightbulb</span>
                            Focus Areas
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '15px' }}>Based on your mistakes, we recommend reviewing:</p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {result.weakTopics && result.weakTopics.length > 0 ? result.weakTopics.map((topic, i) => (
                                <button
                                    key={i}
                                    onClick={() => onNavigateToCourse(topic)}
                                    style={{
                                        background: 'white', padding: '8px 12px', border: '1px solid #d97706', borderRadius: '20px',
                                        color: '#d97706', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px'
                                    }}
                                >
                                    {topic} <span className="material-icons" style={{ fontSize: '1rem' }}>arrow_forward</span>
                                </button>
                            )) : (
                                <div style={{ fontSize: '0.9rem', color: 'green', fontStyle: 'italic' }}>No specific weak areas found! Great job.</div>
                            )}
                        </div>
                    </div>

                    {/* Option 2: Review Answers */}
                    <div className="dash-card" style={{ border: '2px solid black', cursor: 'pointer' }} onClick={() => document.getElementById('review-area').classList.toggle('hidden')}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                            <span className="material-icons" style={{ color: 'var(--primary)' }}>fact_check</span>
                            Review Answers
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#555' }}>Check your specific answers to see what you got wrong.</p>
                        <div style={{ marginTop: '15px', fontWeight: 'bold', textDecoration: 'underline' }}>Show Details</div>
                    </div>
                </div>

                {/* Detailed Review Section (Hidden by default) */}
                <div id="review-area" className="fade-in hidden" style={{ textAlign: 'left', borderTop: '2px solid #eee', paddingTop: '20px' }}>
                    <h3>Detailed Breakdown (Incorrect Answers)</h3>
                    {!quiz ? (
                        <p style={{ color: 'gray', fontStyle: 'italic' }}>Question details not available for this result.</p>
                    ) : quiz.filter(q => answers[q.id] !== q.correctAnswer).length === 0 ? (
                        <p style={{ color: 'green', fontStyle: 'italic' }}>Perfect score! No mistakes to review.</p>
                    ) : (
                        quiz.filter(q => answers[q.id] !== q.correctAnswer).map((q, i) => {
                            const userAns = answers[q.id];
                            const isCorrect = userAns === q.correctAnswer;
                            return (
                                <div key={q.id} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', background: isCorrect ? '#f0fff4' : '#fff5f5' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>{q.text}</div>
                                    <div style={{ fontSize: '0.9rem' }}>
                                        <div style={{ color: isCorrect ? 'green' : 'red', fontWeight: 'bold' }}>
                                            Your Answer: {userAns || '(Skipped)'} {isCorrect ? '✅' : '❌'}
                                        </div>
                                        {!isCorrect && <div style={{ color: 'green', marginTop: '5px' }}>Correct: {q.correctAnswer}</div>}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div style={{ marginTop: '30px' }}>
                    <button
                        onClick={() => setTestState('idle')}
                        style={{ padding: '15px 40px', background: 'black', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem', borderRadius: '4px' }}
                    >
                        COMPLETE & RETURN
                    </button>
                </div>
            </div>
        );
    }

    // --- Test History View ---
    if (viewMode === 'history') {
        return (
            <div className="fade-in" style={{ padding: '20px' }}>
                <button onClick={() => setViewMode('hub')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px', fontWeight: 'bold' }}>
                    <span className="material-icons">arrow_back</span> Back to Hub
                </button>

                <h2 style={{ fontSize: '2rem', marginBottom: '20px', borderBottom: '2px solid black' }}>Test History</h2>

                <div style={{ display: 'grid', gap: '15px' }}>
                    {history.length > 0 ? history.map((record, index) => (
                        <div key={index} className="dash-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                            <div style={{ flex: 2 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{record.topic}</div>
                                <div style={{ fontSize: '0.9rem', color: 'gray' }}>{record.course} • {record.date}</div>

                                {record.earnedMedal && (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '5px', padding: '4px 8px', background: '#fff9c4', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid #ffd54f' }}>
                                        <span className="material-icons" style={{ fontSize: '1rem', color: '#fbc02d' }}>emoji_events</span>
                                        <strong>{record.earnedMedal.title}</strong>
                                    </div>
                                )}
                            </div>

                            <div style={{ flex: 1, textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: record.score >= 80 ? 'green' : record.score >= 50 ? 'orange' : 'red' }}>
                                    {record.score}%
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'gray' }}>Score</div>
                            </div>

                            <div style={{ flex: 2 }}>
                                {record.weakTopics && record.weakTopics.length > 0 ? (
                                    <div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px' }}>Suggested Review:</div>
                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                            {record.weakTopics.map((t, i) => (
                                                <span key={i} style={{ fontSize: '0.75rem', padding: '2px 8px', border: '1px solid #ddd', borderRadius: '10px', background: '#f5f5f5' }}>{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.8rem', color: 'green', fontStyle: 'italic' }}>Great job! No weak areas.</div>
                                )}
                            </div>

                            <div style={{ flex: 1, textAlign: 'right' }}>
                                <button
                                    onClick={() => {
                                        if (record.fullResult) {
                                            // Reconstruct result state
                                            setResult({
                                                ...record.fullResult,
                                                earnedMedal: record.earnedMedal
                                            });
                                            if (record.quizSnapshot) setQuiz(record.quizSnapshot);
                                            else setQuiz(null);
                                            if (record.answersSnapshot) setAnswers(record.answersSnapshot);
                                            else setAnswers({});
                                            setTestState('complete');
                                        } else {
                                            openModal({ title: "Not Available", message: "Details not available.", type: 'alert' });
                                        }
                                    }}
                                    style={{ padding: '8px 12px', background: 'black', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    View Result
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div style={{ fontStyle: 'italic', color: 'gray' }}>No tests attempted yet.</div>
                    )}
                </div>
            </div>
        );
    }

    // --- Course Detail View (Topic List + Stats) ---
    if (viewMode === 'course_detail' && selectedCourse) {
        // Fallback for courses without defined modules
        const modules = selectedCourse.modules || [{ title: 'General Assessment' }, { title: 'Advanced Concepts' }];

        // Calculate Stats for Selected Course
        const courseHistory = history.filter(h => h.course === selectedCourse.title);
        const lastAttempt = courseHistory.length > 0 ? courseHistory[0] : null;

        // Weak Topics
        const cScores = topicScores[selectedCourse.id] || {};
        const weakTopicIndices = Object.keys(cScores).filter(idx => cScores[idx] < 80);
        const weakTopics = weakTopicIndices.map(idx => {
            const mod = selectedCourse.modules ? selectedCourse.modules[idx] : null;
            return mod ? mod.title : `Topic ${parseInt(idx) + 1}`;
        });

        return (
            <div className="fade-in" style={{ padding: '20px' }}>
                <button onClick={() => setViewMode('hub')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px', fontWeight: 'bold' }}>
                    <span className="material-icons">arrow_back</span> Back
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>

                    {/* Left Column: Topic List */}
                    <div className="dash-card">
                        <h2 style={{ marginBottom: '20px', borderBottom: '2px solid black', paddingBottom: '10px' }}>{selectedCourse.title} Topics</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {modules.map((mod, i) => {
                                const unlocked = getUnlockStatus(selectedCourse, i);
                                const score = topicScores[selectedCourse.id]?.[i];
                                const passed = score >= 80;

                                return (
                                    <div key={i} style={{
                                        padding: '20px',
                                        border: '2px solid #ddd',
                                        borderRadius: '8px',
                                        background: unlocked ? 'white' : '#f5f5f5',
                                        opacity: unlocked ? 1 : 0.6,
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{
                                                width: '30px', height: '30px', borderRadius: '50%',
                                                background: passed ? 'var(--secondary)' : unlocked ? 'black' : '#ccc',
                                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                            }}>
                                                {passed ? <span className="material-icons" style={{ fontSize: '1rem' }}>check</span> : i + 1}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{mod.title}</div>
                                                {score !== undefined && <div style={{ fontSize: '0.8rem', color: passed ? 'green' : 'red' }}>Best Score: {score}%</div>}
                                            </div>
                                        </div>

                                        {unlocked ? (
                                            <button
                                                onClick={() => startTopicTest(selectedCourse, mod, i)}
                                                style={{ padding: '8px 16px', background: 'black', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                {score ? 'RETAKE' : 'START'}
                                            </button>
                                        ) : (
                                            <span className="material-icons" style={{ color: 'gray' }}>lock</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: Performance & Revision */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Recent Performance Card */}
                        <div className="dash-card" style={{ background: '#fdfdfd' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{ margin: 0 }}>Recent Performance</h3>
                                <button
                                    onClick={() => setViewMode('history')}
                                    style={{ padding: '6px 12px', border: '1px solid #ccc', background: 'white', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', borderRadius: '4px', fontWeight: 'bold' }}
                                >
                                    <span className="material-icons" style={{ fontSize: '1rem', color: 'gray' }}>history</span> History
                                </button>
                            </div>
                            {lastAttempt ? (
                                <div style={{ marginTop: '10px' }}>

                                    {/* Clickable Header Area */}
                                    <div
                                        onClick={() => setShowPerfOptions(!showPerfOptions)}
                                        style={{
                                            cursor: 'pointer', border: showPerfOptions ? '2px solid black' : '1px solid #eee',
                                            padding: '10px', borderRadius: '4px', background: showPerfOptions ? '#f0f0f0' : 'transparent',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: 'gray', textTransform: 'uppercase' }}>TOPIC</div>
                                                <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{lastAttempt.topic}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'gray' }}>SCORE</div>
                                                <span style={{ fontWeight: '900', color: lastAttempt.score >= 80 ? 'green' : 'red', fontSize: '1.4rem' }}>{lastAttempt.score}%</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <span className="material-icons" style={{ fontSize: '1.2rem', color: 'gray', transform: showPerfOptions ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>expand_more</span>
                                        </div>
                                    </div>

                                    {/* Expandable Options */}
                                    {showPerfOptions && (
                                        <div className="fade-in" style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                                            {/* Score Illustration */}
                                            <div style={{ padding: '10px', background: '#eee', borderRadius: '4px' }}>
                                                <div style={{ fontSize: '0.8rem', marginBottom: '5px', fontWeight: 'bold' }}>Performance Metric</div>
                                                <div style={{ height: '10px', width: '100%', background: '#ccc', borderRadius: '5px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${lastAttempt.score}%`, background: lastAttempt.score >= 80 ? 'green' : lastAttempt.score >= 50 ? '#d97706' : 'red' }}></div>
                                                </div>
                                            </div>

                                            {/* Suggested Topics Button */}
                                            <button
                                                onClick={() => {
                                                    const topics = lastAttempt.weakTopics || [];
                                                    if (topics.length > 0) {
                                                        setShowPerfSuggested(!showPerfSuggested);
                                                    } else {
                                                        openModal({ title: "Great Job!", message: "No specific weak topics identified for this session.", type: 'info' });
                                                    }
                                                }}
                                                style={{ padding: '10px', background: 'white', border: '1px solid black', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '4px' }}
                                            >
                                                <span className="material-icons" style={{ color: '#d97706' }}>lightbulb</span>
                                                {showPerfSuggested ? 'Hide Suggested Topics' : 'See Suggested Topics'}
                                            </button>

                                            {/* Collapsible Suggested Topics List */}
                                            {showPerfSuggested && lastAttempt.weakTopics && (
                                                <div className="fade-in" style={{ paddingLeft: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    {lastAttempt.weakTopics.map((t, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => {
                                                                if (typeof addSuggestedCourse === 'function') addSuggestedCourse(t);
                                                                onNavigateToCourse(t);
                                                            }}
                                                            style={{
                                                                textAlign: 'left', padding: '8px', background: '#fffbeb', border: '1px solid #d97706',
                                                                color: '#d97706', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem',
                                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                            }}
                                                        >
                                                            <span>{t}</span>
                                                            <span className="material-icons" style={{ fontSize: '1rem' }}>arrow_forward</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Full Result Button */}
                                            <button
                                                onClick={() => {
                                                    if (lastAttempt.fullResult) {
                                                        // Inject the earnedMedal from history into the result state
                                                        setResult({
                                                            ...lastAttempt.fullResult,
                                                            earnedMedal: lastAttempt.earnedMedal
                                                        });

                                                        if (lastAttempt.quizSnapshot) setQuiz(lastAttempt.quizSnapshot);
                                                        else setQuiz(null);
                                                        if (lastAttempt.answersSnapshot) setAnswers(lastAttempt.answersSnapshot);
                                                        else setAnswers({});
                                                        setTestState('complete');
                                                    } else {
                                                        openModal({ title: "Not Available", message: "Detailed results not available for this legacy record.", type: 'alert' });
                                                    }
                                                }}
                                                style={{ padding: '10px', background: 'black', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '4px' }}
                                            >
                                                <span className="material-icons">visibility</span>
                                                View Full result
                                            </button>
                                        </div>
                                    )}

                                    <div style={{ fontSize: '0.8rem', color: 'gray', textAlign: 'right', marginTop: '10px' }}>{lastAttempt.date}</div>
                                </div>
                            ) : (
                                <p style={{ color: 'gray', fontStyle: 'italic' }}>No attempts yet.</p>
                            )}
                        </div>

                        {/* Needs Revision Card */}
                        <div className="dash-card" style={{ background: '#fff0f0', border: '2px solid #ffcccc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <span className="material-icons" style={{ color: 'red' }}>priority_high</span>
                                <h3 style={{ margin: 0, color: '#d32f2f' }}>Needs Revision</h3>
                            </div>

                            {weakTopics.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <p style={{ fontSize: '0.9rem', marginBottom: '5px' }}>Select a module to see formatted practice topics:</p>
                                    {weakTopics.map((topicModuleTitle, i) => {
                                        // Find history for this module to get sub-topics
                                        const relevantHistory = history.find(h => h.course === selectedCourse.title && h.topic === topicModuleTitle);
                                        const subTopics = relevantHistory?.weakTopics || [];
                                        const isExpanded = revExpanded[topicModuleTitle];

                                        return (
                                            <div key={i} style={{ border: '1px solid #ffcccc', borderRadius: '4px', background: 'white', overflow: 'hidden' }}>
                                                {/* Module Header */}
                                                <div
                                                    onClick={() => setRevExpanded(prev => ({ ...prev, [topicModuleTitle]: !prev[topicModuleTitle] }))}
                                                    style={{
                                                        padding: '12px', cursor: 'pointer', fontWeight: 'bold', color: '#d32f2f',
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        background: isExpanded ? '#fff5f5' : 'white'
                                                    }}
                                                >
                                                    <span>{topicModuleTitle}</span>
                                                    <span className="material-icons" style={{ fontSize: '1.2rem', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>expand_more</span>
                                                </div>

                                                {/* Expanded Sub-Topics */}
                                                {isExpanded && (
                                                    <div className="fade-in" style={{ padding: '10px', borderTop: '1px solid #eee', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                        {subTopics.length > 0 ? subTopics.map((st, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => {
                                                                    if (typeof addSuggestedCourse === 'function') addSuggestedCourse(st);
                                                                    onNavigateToCourse(st);
                                                                }}
                                                                style={{
                                                                    padding: '8px', textAlign: 'left', background: 'white', border: '1px solid #ddd', borderRadius: '4px',
                                                                    color: 'black', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                                }}
                                                            >
                                                                <span>{st}</span>
                                                                <span className="material-icons" style={{ fontSize: '1rem', color: 'var(--primary)' }}>add_circle</span>
                                                            </button>
                                                        )) : (
                                                            <button
                                                                onClick={() => {
                                                                    if (typeof addSuggestedCourse === 'function') addSuggestedCourse(topicModuleTitle);
                                                                    onNavigateToCourse(topicModuleTitle);
                                                                }}
                                                                style={{
                                                                    padding: '8px', textAlign: 'left', background: 'white', border: '1px solid #ddd', borderRadius: '4px',
                                                                    color: 'black', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                                }}
                                                            >
                                                                <span>Review Whole Module</span>
                                                                <span className="material-icons" style={{ fontSize: '1rem', color: 'var(--primary)' }}>play_arrow</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p style={{ color: 'green', fontWeight: 'bold', fontSize: '0.9rem' }}>All clear! You're doing great.</p>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    // --- Hub View (Simple Card List) ---
    return (
        <div className="fade-in" style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) 1fr', gap: '20px' }}>

            {/* Left Column: Tests Available */}
            <div>
                <div className="dash-card" style={{ marginBottom: '20px', background: 'white' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span className="material-icons" style={{ fontSize: '2rem', color: '#FFD700' }}>assignment</span>
                        <h2 style={{ margin: 0 }}>TESTS AVAILABLE</h2>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {myCourses.map(c => (
                        <div key={c.id} className="dash-card hover-scale" style={{ padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '180px' }}>
                            <div>
                                <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'gray', marginBottom: '5px', letterSpacing: '1px' }}>Topic Wise Assessment</div>
                                <h3 style={{ fontSize: '1.4rem', margin: '0 0 10px 0' }}>{c.title}</h3>
                            </div>

                            <button
                                onClick={() => { setSelectedCourse(c); setViewMode('course_detail'); }}
                                style={{
                                    width: '100%', padding: '15px', background: 'black', color: 'white', border: 'none',
                                    fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontSize: '1rem',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                }}
                            >
                                VIEW TEST
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Stats & History */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="dash-card" style={{ background: 'var(--primary)' }}>
                    <h3>Global Performance</h3>
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ fontSize: '3rem', fontWeight: '900' }}>
                            {history.length > 0 ? Math.round(history.reduce((a, b) => a + b.score, 0) / history.length) : 0}%
                        </div>
                        <p style={{ margin: 0 }}>Average Score</p>
                    </div>
                </div>

                <div className="dash-card">
                    <h3>Recent Activity</h3>
                    {history.length === 0 ? <p style={{ color: 'gray' }}>No history yet.</p> : (
                        <div style={{ marginTop: '10px' }}>
                            {history.slice(0, 5).map((h, idx) => (
                                <div key={idx} style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                                    <div
                                        onClick={() => {
                                            const courseToView = myCourses.find(c => c.title === h.course);
                                            if (courseToView) {
                                                setSelectedCourse(courseToView);
                                                setViewMode('course_detail');
                                            } else {
                                                openModal({ title: "Course Not Found", message: "Could not find the course details for this history item.", type: 'alert' });
                                            }
                                        }}
                                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{h.course}</div>
                                            <div style={{ fontSize: '0.9rem' }}>{h.topic}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 'bold', color: h.score >= 80 ? 'green' : 'red', fontSize: '1rem' }}>{h.score}%</div>
                                            <div style={{ fontSize: '0.7rem', color: 'gray' }}>{h.date}</div>
                                        </div>
                                        <span className="material-icons" style={{ fontSize: '1.2rem', color: 'gray', marginLeft: '10px' }}>
                                            arrow_forward
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

const SectionPlaceholder = ({ title }) => (
    <div className="dash-card animate-slide-up" style={{ textAlign: 'center', padding: '50px', color: 'gray' }}>
        <h2>{title}</h2>
        <p>Feature coming soon.</p>
    </div>
);

// --- Achievements View ---

const AchievementsView = () => {
    const { user, refreshUser } = useAuth();
    const { awardBadge, refreshData } = useData();

    // Refresh user data on mount to ensure new medals appear
    useEffect(() => {
        refreshUser();
    }, []);

    const achievements = user.achievements || [];

    // Separate by type
    const medals = achievements.filter(a => a.type === 'medal');
    const certificates = achievements.filter(a => a.type === 'certificate');

    const handleForceSync = async () => {
        const savedHistory = JSON.parse(localStorage.getItem('assessment_history') || '[]');
        let restoredCount = 0;

        if (savedHistory.length > 0) {
            savedHistory.forEach(record => {
                if (record.earnedMedal) {
                    // Check against current user achievements
                    const hasIt = user.achievements?.some(a => a.id === record.earnedMedal.id);
                    if (!hasIt) {
                        console.log("Force restoring:", record.earnedMedal.title);
                        awardBadge(user.id, record.earnedMedal.id, {
                            title: record.earnedMedal.title,
                            description: record.earnedMedal.description,
                            icon: record.earnedMedal.icon,
                            date: record.earnedMedal.date
                        });
                        restoredCount++;
                    }
                }
            });

            if (restoredCount > 0) {
                // Force a data refresh sequence
                if (refreshData) await refreshData();
                setTimeout(() => {
                    refreshUser();
                    alert(`Successfully restored ${restoredCount} missing medals!`);
                }, 500);
            } else {
                alert("No missing medals found. Everything is in sync!");
            }
        } else {
            alert("No test history found.");
        }
    };

    return (
        <div className="fade-in" style={{ padding: '20px', height: '100%' }}>
            {/* Header */}
            <div className="dash-card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: 'black', border: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <span className="material-icons" style={{ fontSize: '3rem' }}>emoji_events</span>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '2rem' }}>Hall of Fame</h1>
                            <p style={{ margin: '5px 0 0 0', opacity: 0.8, fontWeight: 'bold' }}>Your hard-earned medals and certificates.</p>
                        </div>
                    </div>
                    <button onClick={handleForceSync} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', fontWeight: 'bold', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span className="material-icons" style={{ fontSize: '1rem' }}>sync</span> Check Missing
                    </button>
                </div>
            </div>

            {/* Medals Section */}
            <h3 style={{ borderBottom: '2px solid black', paddingBottom: '10px', marginTop: '30px' }}>MEDALS ({medals.length})</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {medals.length > 0 ? medals.map((m, idx) => (
                    <div key={idx} className="dash-card hover-scale animate-slide-up" style={{
                        textAlign: 'center', padding: '30px', background: '#fff',
                        border: '2px solid #FFD700', borderRadius: '12px',
                        boxShadow: '0 8px 20px rgba(255, 215, 0, 0.15)',
                        animationDelay: `${idx * 0.15}s`,
                        position: 'relative', overflow: 'hidden'
                    }}>
                        {/* Shimmer Effect */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '5px',
                            background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
                            opacity: 0.5
                        }}></div>

                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #FFD700, #FDB931)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 15px auto',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)', border: '4px solid #fff'
                        }}>
                            <span className="material-icons" style={{ fontSize: '3.5rem', color: '#fff' }}>{m.icon || 'military_tech'}</span>
                        </div>

                        <div style={{ fontWeight: '900', fontSize: '1.2rem', color: '#333', marginBottom: '5px' }}>{m.title}</div>
                        <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: '15px' }}>{m.description}</div>

                        <div style={{
                            fontSize: '0.75rem', color: '#888', background: '#f5f5f5',
                            padding: '5px 10px', borderRadius: '15px', display: 'inline-block'
                        }}>
                            Earned on {new Date(m.date).toLocaleDateString()}
                        </div>
                    </div>
                )) : (
                    <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px', border: '2px dashed #ccc' }}>
                        <span className="material-icons" style={{ fontSize: '3rem', color: '#ccc', marginBottom: '10px' }}>emoji_events</span>
                        <p style={{ margin: 0, color: 'gray', fontSize: '1.1rem' }}>No medals earned yet.</p>
                        <p style={{ fontSize: '0.9rem', color: '#999' }}>Complete tests with high scores to fill your trophy cabinet!</p>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {medals.length === 0 && <div style={{ color: 'gray', fontStyle: 'italic' }}>No medals earned yet. Keep learning!</div>}


            {/* Certificates Section */}
            < h3 style={{ borderBottom: '2px solid black', paddingBottom: '10px', marginTop: '40px' }}> CERTIFICATIONS({certificates.length})</h3 >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {certificates.map((c, idx) => (
                    <div key={idx} className="dash-card hover-scale" style={{ padding: '0', overflow: 'hidden', border: '4px double #DAA520' }}>
                        <div style={{ background: '#f9f9f9', padding: '20px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                            <span className="material-icons" style={{ fontSize: '3rem', color: '#DAA520' }}>workspace_premium</span>
                            <h2 style={{ fontFamily: 'Georgia, serif', margin: '10px 0', color: '#333' }}>Certificate of Completion</h2>
                        </div>
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                            <p>This certifies that</p>
                            <h3 style={{ fontSize: '1.4rem', borderBottom: '1px solid #ccc', display: 'inline-block', paddingBottom: '5px' }}>{user.name}</h3>
                            <p>has successfully completed</p>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', margin: '10px 0', color: 'var(--primary)' }}>{c.title.replace('Certified in ', '')}</div>
                            <p style={{ fontSize: '0.8rem', color: 'gray' }}>on {new Date(c.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
                {certificates.length === 0 && <div style={{ color: 'gray', fontStyle: 'italic' }}>No certifications yet. Complete a course to earn one!</div>}
            </div>
        </div >
    );
};

// --- Live Classes View ---

const LiveClassView = () => {
    const { user } = useAuth();
    const { getCoursesForStudent, meetings, courseAssignments, users } = useData();
    const [selectedCourse, setSelectedCourse] = useState(null);

    const myCourses = getCoursesForStudent(user.id);

    // Filter meetings for the selected course
    // 1. Find teacher for this course
    const teacherAssignment = selectedCourse ? courseAssignments.find(ca => ca.courseId === selectedCourse.id) : null;
    const teacherId = teacherAssignment?.teacherId;
    const teacher = users.find(u => u.id === teacherId);

    // 2. Find meetings where:
    //    - Teacher matches course teacher
    //    - Student is ME
    const liveSessions = selectedCourse && teacherId
        ? meetings.filter(m => m.teacherId === teacherId && m.studentId === user.id)
        : [];

    // Sort by date/time
    liveSessions.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

    // Mock YouTube Data (In a real app, this would query the YouTube Data API)
    const getYouTubeLinks = (courseTitle) => {
        const query = encodeURIComponent(`${courseTitle} live class tutorial`);
        return [
            { id: 1, title: `Live: ${courseTitle} - Key Concepts`, thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`, link: `https://www.youtube.com/results?search_query=${query}` },
            { id: 2, title: `${courseTitle} Full Course Stream`, thumbnail: `https://img.youtube.com/vi/M7lc1UVf-VE/mqdefault.jpg`, link: `https://www.youtube.com/results?search_query=${query}` },
            { id: 3, title: `Advanced ${courseTitle} Workshop`, thumbnail: `https://img.youtube.com/vi/jNQXAC9IVRw/mqdefault.jpg`, link: `https://www.youtube.com/results?search_query=${query}` }
        ];
    };

    const youtubeResources = selectedCourse ? getYouTubeLinks(selectedCourse.title) : [];

    return (
        <div className="fade-in" style={{ padding: '20px', height: '100%' }}>
            {/* Header */}
            <div className="dash-card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #1a237e, #283593)', color: 'white', border: 'none' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <span className="material-icons" style={{ fontSize: '3rem', textShadow: '0 0 10px rgba(0,255,255,0.5)' }}>live_tv</span>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2rem' }}>Live Classroom</h1>
                        <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>Connect with your instructors or watch curated live streams.</p>
                    </div>
                </div>
            </div>

            {!selectedCourse ? (
                // Step 1: Select Course
                <div>
                    <h3 style={{ borderBottom: '2px solid black', paddingBottom: '10px' }}>SELECT A COURSE TO BEGIN</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
                        {myCourses.map(c => (
                            <div
                                key={c.id}
                                onClick={() => setSelectedCourse(c)}
                                className="dash-card hover-scale"
                                style={{ cursor: 'pointer', background: 'white', display: 'flex', flexDirection: 'column', height: '100%' }}
                            >
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ marginTop: 0 }}>{c.title}</h3>
                                    <p style={{ color: 'gray', fontSize: '0.9rem' }}>{c.description.substring(0, 50)}...</p>
                                </div>
                                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee', fontWeight: 'bold', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    ENTER CLASSROOM <span className="material-icons">arrow_forward</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // Step 2: Live Options
                <div className="animate-slide-up">
                    <button
                        onClick={() => setSelectedCourse(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px', fontWeight: 'bold' }}
                    >
                        <span className="material-icons">arrow_back</span> BACK TO COURSES
                    </button>

                    <h2 style={{ marginBottom: '30px' }}>{selectedCourse.title}: Live Hub</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>

                        {/* Option 1: Teacher Sessions */}
                        <div className="dash-card" style={{ borderTop: '5px solid var(--secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <span className="material-icons" style={{ fontSize: '2rem', color: 'var(--secondary)' }}>video_call</span>
                                <h3 style={{ margin: 0 }}>Instructor Sessions</h3>
                            </div>

                            {teacher ? (
                                <div>
                                    <p><strong>Instructor:</strong> {teacher.name}</p>

                                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {liveSessions.length > 0 ? liveSessions.map(session => (
                                            <div key={session.id} style={{ padding: '15px', background: '#f0f4c3', border: '2px solid black', borderRadius: '8px' }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Upcoming Session</div>
                                                <div style={{ margin: '5px 0' }}>{new Date(session.date).toLocaleDateString()} at {session.time}</div>
                                                <a
                                                    href={session.link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{
                                                        display: 'inline-block', marginTop: '10px', padding: '8px 16px',
                                                        background: 'black', color: 'white', textDecoration: 'none', fontWeight: 'bold', borderRadius: '4px'
                                                    }}
                                                >
                                                    JOIN MEETING
                                                </a>
                                            </div>
                                        )) : (
                                            <div style={{ padding: '20px', background: '#eee', textAlign: 'center', borderRadius: '8px' }}>
                                                No scheduled live sessions with {teacher.name}.
                                                <br />
                                                <span style={{ fontSize: '0.8rem', color: 'gray' }}>Check back later or request a meeting.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p style={{ color: 'red' }}>No instructor assigned to this course yet.</p>
                            )}
                        </div>

                        {/* Option 2: YouTube Resources */}
                        <div className="dash-card" style={{ borderTop: '5px solid #FF0000' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <span className="material-icons" style={{ fontSize: '2rem', color: '#FF0000' }}>play_circle_filled</span>
                                <h3 style={{ margin: 0 }}>Public Live Streams & Resources</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {youtubeResources.map(yt => (
                                    <a
                                        key={yt.id}
                                        href={yt.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ textDecoration: 'none', color: 'inherit' }}
                                        className="hover-scale"
                                    >
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '10px', background: 'white', border: '1px solid #ddd', borderRadius: '8px' }}>
                                            <div style={{ width: '120px', height: '68px', background: '#000', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                                                <img src={yt.thumbnail} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '5px' }}>{yt.title}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#FF0000', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <span className="material-icons" style={{ fontSize: '1rem' }}>live_tv</span> WATCH ON YOUTUBE
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Shell ---

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const { darkMode, toggleTheme, getCoursesForStudent, checkStreaks, openModal, closeModal, modalConfig } = useData();
    const [activeTab, setActiveTab] = useState('home');
    const [viewProps, setViewProps] = useState({}); // To pass navigating params like {initialSubTab, autoLaunchTopic}

    // Check streaks on mount
    useEffect(() => {
        if (user && user.id) {
            checkStreaks(user.id);
        }
    }, [user, checkStreaks]);

    // Modal State is now managed globally in DataContext

    const handleNavigateToCourse = (topic) => {
        setViewProps({ initialSubTab: 'suggested', autoLaunchTopic: topic });
        setActiveTab('courses');
    };

    // Override Styles
    // const currentTheme = darkMode ? darkStudentTheme : studentTheme;
    // const themeStyles = {...currentTheme};

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
                    <Menu id="courses" label="COURSES" icon="library_books" />
                    <Menu id="live" label="LIVE CLASSES" icon="live_tv" />
                    <Menu id="chat" label="CHAT" icon="chat" />
                    <div style={{ margin: '15px 0 5px 15px', fontSize: '0.8rem', fontWeight: 'bold', color: 'gray', textTransform: 'uppercase', letterSpacing: '1px' }}>Communication</div>
                    <Menu id="ai_chat" label="Chat with AI" icon="smart_toy" />

                    <div style={{ margin: '15px 0 5px 15px', fontSize: '0.8rem', fontWeight: 'bold', color: 'gray', textTransform: 'uppercase', letterSpacing: '1px' }}>My Learning</div>
                    <Menu id="assessments" label="Assessments" icon="assignment" />
                    <Menu id="achievements" label="Achievements" icon="emoji_events" />
                    <Menu id="profile" label="Profile" icon="person" />
                    <Menu id="help" label="Help & Support" icon="help" />
                </div>

                <div style={{ marginTop: 'auto', padding: '20px' }}>

                    <button onClick={logout} style={{ width: '100%', padding: '10px', background: 'var(--accent)', color: 'white', border: '2px solid black', fontWeight: 'bold', cursor: 'pointer', boxShadow: '4px 4px 0 black' }}>
                        LOGOUT
                    </button>
                </div>
            </nav>

            <main className="admin-main">
                {activeTab === 'home' && <OverviewPanel user={user} myCourses={myCourses} onNavigate={(tab, props) => { setActiveTab(tab); setViewProps(props); }} />}
                {activeTab === 'courses' && <CourseView {...viewProps} openModal={openModal} />}
                {activeTab === 'live' && <LiveClassView />}
                {activeTab === 'chat' && <TeacherChatView />}
                {activeTab === 'ai_chat' && <AIChatView />}
                {activeTab === 'assessments' && <AssessmentView onNavigateToCourse={handleNavigateToCourse} openModal={openModal} />}
                {activeTab === 'meetings' && <SectionPlaceholder title="Live Classes" />}
                {activeTab === 'achievements' && <AchievementsView />}
                {activeTab === 'profile' && <SectionPlaceholder title="Profile & Settings" />}
                {activeTab === 'help' && <HelpView />}
            </main>
        </div>
    );
}

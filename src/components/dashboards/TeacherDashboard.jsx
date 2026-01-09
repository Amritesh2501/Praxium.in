import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

// --- Sub-Components (Utilities) ---

const DetailModal = ({ title, onClose, children }) => (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} className="animate-fade-in">
        <div className="animate-scale" style={{ background: 'var(--bg-card)', padding: '30px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', border: '3px solid black', boxShadow: '10px 10px 0 black' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid black', paddingBottom: '10px' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{title}</h2>
                <button onClick={onClose} style={{ background: 'black', color: 'white', border: 'none', padding: '5px 10px', fontWeight: 'bold' }}>CLOSE</button>
            </div>
            {children}
        </div>
    </div>
);

// --- Sub-Components (Views) ---

const ReportModal = ({ student, onClose }) => {
    // Mock Data Calculation
    const attendance = 85;
    const quizAverage = 92;
    const assignmentsSubmitted = 12;
    const assignmentsTotal = 15;

    return (
        <DetailModal title={`Student Report: ${student.name.toUpperCase()}`} onClose={onClose}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                {/* Left: Stats & Info */}
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontWeight: 'bold' }}>Contact Information</div>
                        <div style={{ fontSize: '0.9rem' }}>Email: {student.email}</div>
                        <div style={{ fontSize: '0.9rem' }}>ID: {student.id}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                        <div style={{ flex: 1, border: '2px solid black', padding: '15px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{quizAverage}%</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>AVG SCORE</div>
                        </div>
                        <div style={{ flex: 1, border: '2px solid black', padding: '15px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{attendance}%</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>ATTENDANCE</div>
                        </div>
                    </div>
                </div>

                {/* Right: Visuals */}
                <div>
                    <h4 style={{ marginTop: 0 }}>Performance Overview</h4>
                    {/* Attendance Bar */}
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                            <span>Attendance Reliability</span>
                            <span>{attendance}%</span>
                        </div>
                        <div style={{ width: '100%', height: '20px', background: '#eee', border: '2px solid black' }}>
                            <div style={{ width: `${attendance}%`, height: '100%', background: 'var(--secondary)' }}></div>
                        </div>
                    </div>

                    {/* Assignment Progress */}
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                            <span>Assignments ({assignmentsSubmitted}/{assignmentsTotal})</span>
                            <span>{Math.round((assignmentsSubmitted / assignmentsTotal) * 100)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '20px', background: '#eee', border: '2px solid black' }}>
                            <div style={{ width: `${(assignmentsSubmitted / assignmentsTotal) * 100}%`, height: '100%', background: 'var(--primary)' }}></div>
                        </div>
                    </div>

                    <div style={{ padding: '15px', background: '#f9f9f9', border: '2px dashed black', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        "Demonstrates strong understanding of core concepts. Needs to improve punctuality with assignment submissions."
                    </div>
                </div>
            </div>
        </DetailModal>
    );
}

const TeacherDashboardView = ({ setActiveTab }) => {
    const { user } = useAuth();
    const { getStudentsForTeacher, getCoursesForTeacher } = useData();
    const myStudents = getStudentsForTeacher(user.id);
    const myCourses = getCoursesForTeacher(user.id);

    return (
        <div className="dashboard-grid">
            {/* My Courses Summary */}
            <div
                className="dash-card animate-slide-up delay-1 hover-scale"
                style={{ borderTop: '10px solid var(--primary)', cursor: 'pointer', background: 'var(--bg-card)' }}
                onClick={() => setActiveTab('courses')}
            >
                <h3>Teaching Load</h3>
                <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{myCourses.length}</div>
                <div style={{ fontWeight: '700' }}>ACTIVE COURSES</div>
                <div style={{ marginTop: '10px', fontSize: '0.8rem', textDecoration: 'underline' }}>Manage Courses &rarr;</div>
            </div>

            {/* Students Summary */}
            <div
                className="dash-card animate-slide-up delay-2 hover-scale"
                style={{ borderTop: '10px solid var(--secondary)', cursor: 'pointer', background: 'var(--bg-card)' }}
                onClick={() => setActiveTab('students')}
            >
                <h3>Total Students</h3>
                <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{myStudents.length}</div>
                <div style={{ fontWeight: '700' }}>ENROLLED ACROSS ALL COURSES</div>
                <div style={{ marginTop: '10px', fontSize: '0.8rem', textDecoration: 'underline' }}>View Roster &rarr;</div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="dash-card animate-slide-up delay-3" style={{ background: 'var(--bg-card)' }}>
                <h3>Quick Actions</h3>
                <div style={{ display: 'grid', gap: '10px', marginTop: '15px' }}>
                    <button onClick={() => setActiveTab('meetings')} style={{ padding: '12px', background: 'var(--bg-card)', border: '2px solid black', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }} className="hover-scale">
                        <span className="material-icons">calendar_today</span> SCHEDULE MEETING
                    </button>
                    <button onClick={() => setActiveTab('chat')} style={{ padding: '12px', background: 'var(--bg-card)', border: '2px solid black', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }} className="hover-scale">
                        <span className="material-icons">chat</span> OPEN CHAT CONSOLE
                    </button>
                </div>
            </div>
        </div>
    );
};

const MyStudentsView = () => {
    const { user } = useAuth();
    const { getStudentsForTeacher } = useData();
    const myStudents = getStudentsForTeacher(user.id);
    const [selectedStudent, setSelectedStudent] = useState(null);

    return (
        <div className="animate-slide-up">
            <div className="admin-header-strip">
                <h2>Student Roster</h2>
            </div>
            <div className="dash-card">
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {myStudents.map((s, idx) => (
                        <div key={s.id} className="animate-slide-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '2px solid black', background: 'var(--bg-card)', animationDelay: `${idx * 0.05}s` }}>
                            <div>
                                <div style={{ fontWeight: '700' }}>{s.name}</div>
                                <div style={{ fontSize: '0.9rem', color: 'gray' }}>{s.email}</div>
                                <div style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>ID: {s.id}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <button onClick={() => setSelectedStudent(s)} style={{ fontSize: '0.7rem', padding: '6px 12px', background: 'black', color: 'white', marginTop: '4px', border: 'none' }}>VIEW REPORT</button>
                            </div>
                        </div>
                    ))}
                    {myStudents.length === 0 && <p>No students enrolled in your courses.</p>}
                </div>
            </div>
            {selectedStudent && <ReportModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
        </div>
    );
};

const ManageCoursesView = () => {
    const { user } = useAuth();
    const { addCourse, assignTeacher, getCoursesForTeacher } = useData();
    const [viewMode, setViewMode] = useState('list'); // 'add' or 'list'
    const [course, setCourse] = useState({ title: '', description: '', duration: '' });

    const myCourses = getCoursesForTeacher(user.id);

    const handleSubmit = (e) => {
        e.preventDefault();
        const newCourse = addCourse(course);
        assignTeacher(newCourse.id, user.id);

        setCourse({ title: '', description: '', duration: '' });
        alert("Course created and assigned to you!");
        setViewMode('list');
    };

    return (
        <div className="animate-slide-up">
            <div className="admin-header-strip">
                <h2>Course Management</h2>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setViewMode('list')} style={{ padding: '10px 20px', fontWeight: 'bold', border: '2px solid black', background: viewMode === 'list' ? 'black' : 'white', color: viewMode === 'list' ? 'white' : 'black', cursor: 'pointer' }}>MY COURSES</button>
                <button onClick={() => setViewMode('add')} style={{ padding: '10px 20px', fontWeight: 'bold', border: '2px solid black', background: viewMode === 'add' ? 'black' : 'white', color: viewMode === 'add' ? 'white' : 'black', cursor: 'pointer' }}>+ CREATE NEW</button>
            </div>

            {viewMode === 'add' ? (
                <div className="dash-card animate-scale" style={{ maxWidth: '800px' }}>
                    <h3>Create New Course</h3>
                    <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                        <div className="form-group">
                            <label>Course Name</label>
                            <input required placeholder="e.g. Advanced Botany" value={course.title} onChange={e => setCourse({ ...course, title: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea rows="4" style={{ width: '100%', padding: '16px', border: '3px solid black', fontFamily: 'inherit' }} placeholder="Course objectives and summary..." value={course.description} onChange={e => setCourse({ ...course, description: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Duration (Weeks)</label>
                            <input type="number" placeholder="12" value={course.duration} onChange={e => setCourse({ ...course, duration: e.target.value })} />
                        </div>
                        <button className="auth-button" style={{ background: 'var(--accent)' }}>Publish Course</button>
                    </form>
                </div>
            ) : (
                <div className="dash-card">
                    <h3>My Course Catalog</h3>
                    <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {myCourses.map((c, index) => (
                            <div key={c.id} className="animate-scale hover-scale" style={{ padding: '20px', border: '2px solid black', background: 'var(--bg-card)', animationDelay: `${index * 0.1}s` }}>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '8px' }}>{c.title.toUpperCase()}</div>
                                <div style={{ fontSize: '0.9rem', color: 'gray', marginBottom: '15px' }}>{c.description}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{c.duration} Weeks</div>
                                    <button style={{ fontSize: '0.7rem', textDecoration: 'underline', background: 'none', border: 'none', color: 'var(--text-main)' }}>Edit Details</button>
                                </div>
                            </div>
                        ))}
                        {myCourses.length === 0 && <p>You haven't created any courses yet.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

const MeetingView = () => {
    const { user } = useAuth();
    const { getStudentsForTeacher, scheduleMeeting, meetings } = useData();
    const myStudents = getStudentsForTeacher(user.id);
    const [meeting, setMeeting] = useState({ studentId: '', date: '', time: '', link: '' });
    const [activeSubTab, setActiveSubTab] = useState('schedule'); // 'schedule' or 'view'

    // Filter meetings created by this teacher
    const myScheduledMeetings = meetings.filter(m => m.teacherId === user.id);

    const handleScheduleMeeting = (e) => {
        e.preventDefault();
        scheduleMeeting({ ...meeting, teacherId: user.id });
        setMeeting({ studentId: '', date: '', time: '', link: '' });
        alert('Meeting Scheduled!');
        setActiveSubTab('view');
    };

    return (
        <div className="animate-slide-up">
            <div className="admin-header-strip">
                <h2>Schedule Manager</h2>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setActiveSubTab('schedule')} style={{ padding: '10px 20px', fontWeight: 'bold', border: '2px solid black', background: activeSubTab === 'schedule' ? 'black' : 'white', color: activeSubTab === 'schedule' ? 'white' : 'black', cursor: 'pointer' }}>SCHEDULE NEW</button>
                <button onClick={() => setActiveSubTab('view')} style={{ padding: '10px 20px', fontWeight: 'bold', border: '2px solid black', background: activeSubTab === 'view' ? 'black' : 'white', color: activeSubTab === 'view' ? 'white' : 'black', cursor: 'pointer' }}>VIEW SCHEDULED</button>
            </div>

            {activeSubTab === 'schedule' ? (
                <div className="dash-card animate-scale" style={{ maxWidth: '600px' }}>
                    <h3>Schedule a New Meeting</h3>
                    <p style={{ marginBottom: '20px', color: 'gray' }}>Set up doubt sessions or 1:1 reviews with your students.</p>

                    <form onSubmit={handleScheduleMeeting}>
                        <div className="form-group">
                            <label>Select Student</label>
                            <select
                                value={meeting.studentId}
                                onChange={e => setMeeting({ ...meeting, studentId: e.target.value })}
                                style={{ width: '100%', padding: '12px', border: '3px solid black', marginBottom: '10px' }}
                                required
                            >
                                <option value="">-- Choose Student --</option>
                                {myStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Virtual Meeting Link</label>
                            <input type="text" placeholder="https://zoom.us/j/..." required value={meeting.link} onChange={e => setMeeting({ ...meeting, link: e.target.value })} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" required value={meeting.date} onChange={e => setMeeting({ ...meeting, date: e.target.value })} style={{ padding: '12px', border: '3px solid black' }} />
                            </div>
                            <div className="form-group">
                                <label>Time</label>
                                <input type="time" required value={meeting.time} onChange={e => setMeeting({ ...meeting, time: e.target.value })} style={{ padding: '12px', border: '3px solid black' }} />
                            </div>
                        </div>
                        <button type="submit" className="auth-button" style={{ background: 'var(--primary)', color: 'black' }}>Send Meeting Invite</button>
                    </form>
                </div>
            ) : (
                <div className="dash-card animate-scale">
                    <h3>Upcoming Meetings</h3>
                    <div style={{ marginTop: '20px' }}>
                        {myScheduledMeetings.map((m, idx) => {
                            const student = myStudents.find(s => s.id === m.studentId);
                            return (
                                <div key={m.id} className="animate-slide-up hover-scale" style={{ padding: '15px', border: '2px solid black', marginBottom: '15px', background: '#e3f2fd', animationDelay: `${idx * 0.05}s` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>Meeting with {student ? student.name : `Student ${m.studentId}`}</div>
                                            <div style={{ fontSize: '0.9rem' }}>{m.date} at {m.time}</div>
                                            <a href={m.link} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'blue' }}>{m.link}</a>
                                        </div>
                                        <button style={{ background: 'black', color: 'white', border: 'none', padding: '5px 10px' }}>CANCEL</button>
                                    </div>
                                </div>
                            )
                        })}
                        {myScheduledMeetings.length === 0 && <p>No meetings scheduled.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

const ChatView = () => {
    const { user } = useAuth();
    const { getStudentsForTeacher, sendMessage, getChats } = useData();
    const myStudents = getStudentsForTeacher(user.id);

    // State
    const [selectedStudentId, setSelectedStudentId] = useState(myStudents[0]?.id || '');
    const [newMessage, setNewMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const chatEndRef = useRef(null);

    // Load Chats when student changes or on mount
    useEffect(() => {
        if (selectedStudentId) {
            const history = getChats(user.id, selectedStudentId);
            setChatHistory(history);
        }
    }, [selectedStudentId, user.id, getChats]); // Dependencies need to include getChats to re-run if new msg sent? Actually getChats is constant, we need to trigger re-fetch.

    // Polling or listener for new messages would be better, but for now we rely on explicit updates
    const refreshChats = () => {
        if (selectedStudentId) {
            const history = getChats(user.id, selectedStudentId);
            setChatHistory(history);
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        sendMessage({
            senderId: user.id,
            receiverId: selectedStudentId,
            text: newMessage,
            read: false
        });

        setNewMessage('');
        refreshChats(); // Refresh UI
    };

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    return (
        <div className="animate-slide-up" style={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
            <div className="admin-header-strip" style={{ marginBottom: '20px' }}>
                <h2>Classroom Messenger</h2>
            </div>

            <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
                {/* Left: Contact List */}
                <div className="dash-card" style={{ width: '300px', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '15px', background: 'var(--primary)', borderBottom: '2px solid black', fontWeight: 'bold' }}>
                        CONTACTS
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {myStudents.map(s => (
                            <div
                                key={s.id}
                                onClick={() => setSelectedStudentId(s.id)}
                                style={{
                                    padding: '15px',
                                    borderBottom: '1px solid #eee',
                                    cursor: 'pointer',
                                    background: selectedStudentId === s.id ? '#e3f2fd' : 'white',
                                    fontWeight: selectedStudentId === s.id ? 'bold' : 'normal'
                                }}
                            >
                                {s.name}
                                <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'normal' }}>ID: {s.id}</div>
                            </div>
                        ))}
                        {myStudents.length === 0 && <div style={{ padding: '15px', color: 'gray' }}>No students found.</div>}
                    </div>
                </div>

                {/* Right: Chat Window */}
                <div className="dash-card" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {selectedStudentId ? (
                        <>
                            <div style={{ padding: '15px', borderBottom: '2px solid black', background: '#f9f9f9', fontWeight: 'bold' }}>
                                Chatting with: {myStudents.find(s => s.id === selectedStudentId)?.name || selectedStudentId}
                            </div>

                            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {chatHistory.map(msg => {
                                    const isMe = msg.senderId === user.id;
                                    return (
                                        <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                                            <div style={{ fontSize: '0.7rem', marginBottom: '4px', color: '#666', textAlign: isMe ? 'right' : 'left' }}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div style={{
                                                background: isMe ? 'var(--secondary)' : 'white',
                                                color: isMe ? 'white' : 'black',
                                                padding: '12px 16px',
                                                border: '2px solid black',
                                                boxShadow: '4px 4px 0 rgba(0,0,0,0.1)'
                                            }}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    );
                                })}
                                {chatHistory.length === 0 && <div style={{ textAlign: 'center', color: 'gray', marginTop: '20px' }}>No messages yet. Start the conversation!</div>}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={handleSend} style={{ padding: '20px', background: 'var(--bg-card)', borderTop: '2px solid black', display: 'flex', gap: '10px' }}>
                                <input
                                    placeholder="Type your message..."
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    style={{ flex: 1, border: '2px solid black', padding: '12px' }}
                                />
                                <button className="auth-button" style={{ width: 'auto', marginTop: 0, padding: '0 30px' }}>SEND</button>
                            </form>
                        </>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'gray' }}>Select a student to start chatting.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Container ---

export default function TeacherDashboard() {
    const { user, logout } = useAuth();
    const { darkMode, toggleTheme } = useData();
    const [activeTab, setActiveTab] = useState('dashboard');

    const Menu = ({ id, label }) => (
        <div
            className={`admin-nav-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
            style={{
                borderColor: activeTab === id ? 'white' : 'rgba(255,255,255,0.3)',
                color: activeTab === id ? 'black' : 'white',
                background: activeTab === id ? 'white' : 'transparent',
                boxShadow: activeTab === id ? '4px 4px 0 rgba(0,0,0,0.2)' : 'none'
            }}
        >
            {label}
        </div>
    );

    return (
        <div className="admin-container">
            {/* Sidebar Navigation - Updated Color */}
            <nav className="admin-sidebar" style={{ background: 'var(--secondary)', borderRight: '4px solid black' }}>
                <div className="admin-brand" style={{ background: 'var(--primary)', color: 'black', borderColor: 'white' }}>PRAXIUM FACULTY</div>

                <div className="admin-nav-menu">
                    <Menu id="dashboard" label="DASHBOARD" />
                    <Menu id="students" label="STUDENTS" />
                    <Menu id="courses" label="COURSES" />
                    <Menu id="meetings" label="MEETING" />
                    <Menu id="chat" label="CHAT" />
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <div
                        className="admin-nav-item"
                        style={{ border: '2px solid white', color: 'white', background: 'var(--accent)' }}
                        onClick={logout}
                    >
                        LOGOUT
                    </div>
                </div>
            </nav >

            <main className="admin-main">
                <header style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>FACULTY PORTAL</h2>
                    <span style={{ fontWeight: 'bold' }}>HELLO, {(user?.name || 'TEACHER').toUpperCase()}</span>
                </header>

                {activeTab === 'dashboard' && <TeacherDashboardView setActiveTab={setActiveTab} />}
                {activeTab === 'students' && <MyStudentsView />}
                {activeTab === 'courses' && <ManageCoursesView />}
                {activeTab === 'meetings' && <MeetingView />}
                {activeTab === 'chat' && <ChatView />}
            </main>
        </div >
    );
}

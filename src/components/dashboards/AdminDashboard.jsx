import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { generateCourseSyllabus } from '../../services/aiService';

// --- Helper Components ---

const DetailModal = ({ title, onClose, children }) => (
    <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
        <div className="dash-card" style={{ width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', border: '4px solid black', boxShadow: '10px 10px 0 black' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, textTransform: 'uppercase' }}>{title}</h2>
                <button onClick={onClose} style={{ background: 'red', color: 'white', border: '2px solid black', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px' }}>
                    <span className="material-icons" style={{ fontSize: '1.2rem' }}>close</span>
                </button>
            </div>
            {children}
        </div>
    </div>
);

const UserProfileView = ({ user, onClose }) => {
    const { updateUser, enrollments, courses, courseAssignments } = useData();
    const { user: currentUser } = useAuth(); // Logged in admin
    const [permissions, setPermissions] = useState(user.permissions || 'standard');
    const [isEditing, setIsEditing] = useState(false);

    const handleSavePermissions = () => {
        updateUser(user.id, { permissions });
        setIsEditing(false);
        // alert(`Permissions updated for ${user.name}`);
    };

    const getAdditionalInfo = () => {
        if (user.role === 'student') {
            const studentEnrollments = enrollments.filter(e => e.studentId === user.id);
            const studentCourses = courses.filter(c => studentEnrollments.some(e => e.courseId === c.id));
            const completed = user.completedCourses || [];
            return (
                <div>
                    <h3>Academic Record</h3>
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                        <div style={{ padding: '10px', border: '2px solid black', background: 'var(--bg-card)', flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{studentCourses.length}</div>
                            <div style={{ fontSize: '0.8rem' }}>Enrolled</div>
                        </div>
                        <div style={{ padding: '10px', border: '2px solid black', background: 'var(--bg-card)', flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{completed.length}</div>
                            <div style={{ fontSize: '0.8rem' }}>Completed</div>
                        </div>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {studentCourses.map(c => (
                            <li key={c.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{c.title}</span>
                                {completed.includes(c.id) ?
                                    <span style={{ color: 'green', fontWeight: 'bold' }}>COMPLETED</span> :
                                    <span style={{ color: 'orange', fontWeight: 'bold' }}>IN PROGRESS</span>
                                }
                            </li>
                        ))}
                        {studentCourses.length === 0 && <li style={{ fontStyle: 'italic', color: 'gray' }}>Not enrolled in any courses.</li>}
                    </ul>
                </div>
            );
        } else if (user.role === 'teacher') {
            const teacherAssignments = courseAssignments.filter(ca => ca.teacherId === user.id);
            const teachingCourses = courses.filter(c => teacherAssignments.some(ca => ca.courseId === c.id));
            return (
                <div>
                    <h3>Teaching Assignments ({teachingCourses.length})</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {teachingCourses.map(c => (
                            <li key={c.id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}><strong>{c.title}</strong></li>
                        ))}
                        {teachingCourses.length === 0 && <li style={{ fontStyle: 'italic', color: 'gray' }}>No active courses assigned.</li>}
                    </ul>
                </div>
            );
        }
        return null;
    };

    return (
        <DetailModal title="User Profile" onClose={onClose}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                {/* Left Col: Identity */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '120px', height: '120px', background: '#ddd', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', border: '4px solid black' }}>
                        {user.photo ? <img src={user.photo} alt="profile" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : user.name.charAt(0)}
                    </div>
                    <h3 style={{ margin: 0 }}>{user.name}</h3>
                    <div style={{ background: 'var(--text-main)', color: 'var(--bg-app)', display: 'inline-block', padding: '4px 12px', marginTop: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}>{user.role.toUpperCase()}</div>

                    <div style={{ marginTop: '20px', textAlign: 'left', fontSize: '0.9rem' }}>
                        <div style={{ marginBottom: '8px' }}><strong>ID:</strong> {user.id}</div>
                        <div style={{ marginBottom: '8px' }}><strong>Email:</strong> {user.email}</div>
                        <div style={{ marginBottom: '8px' }}><strong>Phone:</strong> {user.phone || 'N/A'}</div>
                        <div style={{ marginBottom: '8px' }}><strong>Joined:</strong> {new Date().toLocaleDateString()}</div>
                    </div>
                </div>

                {/* Right Col: Details & Permissions */}
                <div>
                    {/* Permission Editor (Only for Admins viewing Teachers/Admins) */}
                    {(user.role === 'teacher' || user.role === 'admin') && (
                        <div style={{ padding: '15px', border: '2px dashed black', background: 'var(--bg-app)', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h4 style={{ margin: 0 }}>Access Level / Permissions</h4>
                                {!isEditing ? (
                                    <button onClick={() => setIsEditing(true)} style={{ fontSize: '0.7rem', textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer' }}>EDIT</button>
                                ) : (
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button onClick={handleSavePermissions} style={{ background: 'green', color: 'white', border: '1px solid black', padding: '2px 6px', fontSize: '0.7rem' }}>SAVE</button>
                                        <button onClick={() => setIsEditing(false)} style={{ background: '#ddd', border: '1px solid black', padding: '2px 6px', fontSize: '0.7rem' }}>CANCEL</button>
                                    </div>
                                )}
                            </div>

                            {!isEditing ? (
                                <div><strong>Current Role:</strong> {permissions.toUpperCase().replace('_', ' ')}</div>
                            ) : (
                                <select
                                    value={permissions}
                                    onChange={e => setPermissions(e.target.value)}
                                    style={{ width: '100%', padding: '8px', border: '1px solid black' }}
                                >
                                    <option value="standard">Standard</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="full_access">Full Access</option>
                                </select>
                            )}
                        </div>
                    )}

                    {/* Dynamic Details based on Role */}
                    {getAdditionalInfo()}
                </div>
            </div>
        </DetailModal>
    );
};

// --- Sub-Components (Views) ---

const DashboardView = () => {
    const { users, courses } = useData();
    const activeUsers = users.length;
    const studentCount = users.filter(u => u.role === 'student').length;
    const teacherCount = users.filter(u => u.role === 'teacher').length;

    // Simple bar chart calc
    const maxVal = Math.max(studentCount, teacherCount, courses.length, 10);
    const getHeight = (val) => `${(val / maxVal) * 100}%`;

    return (
        <div>
            <div className="admin-header-strip">
                <h2>System Analytics</h2>
                <button className="auth-button" style={{ width: 'auto', padding: '10px 20px', fontSize: '1rem', marginTop: 0 }}>Refresh Data</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div className="dash-card" style={{ padding: '20px', textAlign: 'center', background: 'var(--primary)' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{activeUsers}</div>
                    <div style={{ fontWeight: '700' }}>TOTAL USERS</div>
                </div>
                <div className="dash-card" style={{ padding: '20px', textAlign: 'center', background: 'var(--secondary)', color: 'white' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{courses.length}</div>
                    <div style={{ fontWeight: '700' }}>ACTIVE COURSES</div>
                </div>
                <div className="dash-card" style={{ padding: '20px', textAlign: 'center', background: 'var(--accent)', color: 'white' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>99%</div>
                    <div style={{ fontWeight: '700' }}>SYSTEM UPTIME</div>
                </div>
            </div>

            {/* Visual Analytics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div className="dash-card">
                    <h3>User Distribution</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '30px', padding: '20px 0', borderBottom: '2px solid black' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '100%', background: 'var(--text-main)', height: getHeight(studentCount), transition: 'height 0.5s' }}></div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>STUDENTS ({studentCount})</div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '100%', background: 'var(--secondary)', height: getHeight(teacherCount), transition: 'height 0.5s' }}></div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>TEACHERS ({teacherCount})</div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '100%', background: 'var(--accent)', height: '20%', transition: 'height 0.5s' }}></div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>ADMINS</div>
                        </div>
                    </div>
                </div>

                <div className="dash-card">
                    <h3>Course Engagement</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column' }}>
                        <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: `conic-gradient(var(--primary) 0% 70%, var(--secondary) 70% 100%)`, border: '4px solid black' }}></div>
                        <div style={{ marginTop: '15px', display: 'flex', gap: '20px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', background: 'var(--primary)' }}></div> Active</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '10px', height: '10px', background: 'var(--secondary)' }}></div> Completed</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const UserListView = () => {
    const { users, deleteUser } = useData();
    const [filter, setFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);

    const filteredUsers = filter === 'all' ? users : users.filter(u => u.role === filter);

    const handleDelete = (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this user?')) {
            deleteUser(id);
        }
    };

    return (
        <div>
            <div className="admin-header-strip">
                <h2>User Directory</h2>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {['all', 'student', 'teacher', 'admin'].map(role => (
                    <button
                        key={role}
                        onClick={() => setFilter(role)}
                        style={{
                            padding: '10px 20px',
                            fontWeight: 'bold',
                            border: '2px solid black',
                            background: filter === role ? 'black' : 'white',
                            color: filter === role ? 'white' : 'black',
                            cursor: 'pointer',
                            textTransform: 'uppercase'
                        }}
                    >
                        {role === 'all' ? 'All Users' : role + 's'}
                    </button>
                ))}
            </div>

            <div className="dash-card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid black', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>ID</th>
                            <th style={{ padding: '12px' }}>ROLE</th>
                            <th style={{ padding: '12px' }}>NAME</th>
                            <th style={{ padding: '12px' }}>CONTACT</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #eee', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => setSelectedUser(u)} className="user-row">
                                <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>{u.id}</td>
                                <td style={{ padding: '12px', fontWeight: 'bold' }}>
                                    <span style={{
                                        background: u.role === 'admin' ? 'var(--accent)' : u.role === 'teacher' ? 'var(--secondary)' : '#eee',
                                        color: u.role === 'student' ? 'black' : 'white',
                                        padding: '4px 8px', fontSize: '0.8rem', border: '1px solid black'
                                    }}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <div style={{ fontWeight: 'bold' }}>{u.name || 'N/A'}</div>
                                </td>
                                <td style={{ padding: '12px', fontSize: '0.9rem', color: 'gray' }}>
                                    {u.email}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                    <button onClick={(e) => handleDelete(u.id, e)} style={{ background: 'red', color: 'white', padding: '6px 12px', fontSize: '0.8rem', border: '1px solid black' }}>DELETE</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedUser && (
                <UserProfileView user={selectedUser} onClose={() => setSelectedUser(null)} />
            )}
        </div>
    );
};

const AddUserView = ({ onComplete }) => {
    const { addUser, courses } = useData();
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student', permissions: 'standard', phone: '' });
    const [selectedCourse, setSelectedCourse] = useState('');
    const [createdId, setCreatedId] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const createdUser = addUser(newUser, selectedCourse);
        setCreatedId(createdUser.id);
        setNewUser({ name: '', email: '', password: '', role: 'student', permissions: 'standard', phone: '' });
        setSelectedCourse('');
    };

    return (
        <div>
            <div className="admin-header-strip">
                <h2>Register New User</h2>
            </div>

            {createdId && (
                <div className="auth-error" style={{ background: '#4CAF50', color: 'white', marginBottom: '20px' }}>
                    SUCCESS! User Created with REGISTRATION ID: <span style={{ fontSize: '1.2rem', textDecoration: 'underline' }}>{createdId}</span>
                    <br /><span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>Please share this ID with the user for login.</span>
                </div>
            )}

            <div className="dash-card" style={{ maxWidth: '600px' }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Role</label>
                        <select
                            value={newUser.role}
                            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                            style={{ width: '100%', padding: '16px', border: '3px solid black', fontWeight: 'bold', fontFamily: 'inherit' }}
                        >
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {(newUser.role === 'teacher' || newUser.role === 'admin') && (
                        <div className="form-group" style={{ border: '2px dashed black', padding: '10px', background: 'var(--bg-app)' }}>
                            <label>Access Level / Permissions</label>
                            <select
                                value={newUser.permissions}
                                onChange={e => setNewUser({ ...newUser, permissions: e.target.value })}
                                style={{ width: '100%', padding: '12px', border: '1px solid black' }}
                            >
                                <option value="standard">Standard (Can View/Edit Own Data)</option>
                                <option value="moderator">Moderator (Can Manage Students)</option>
                                <option value="full_access">Full Access (Super Admin)</option>
                            </select>
                        </div>
                    )}

                    {(newUser.role === 'student') && (
                        <div className="form-group">
                            <label>Initial Course Enrollment (Optional)</label>
                            <select
                                value={selectedCourse}
                                onChange={e => setSelectedCourse(e.target.value)}
                                style={{ width: '100%', padding: '16px', border: '3px solid black', fontFamily: 'inherit' }}
                            >
                                <option value="">Select Course...</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Full Name</label>
                        <input required placeholder="John Doe" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Phone Number</label>
                        <input placeholder="+1 (555) 000-0000" type="tel" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input required placeholder="john@example.com" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input required placeholder="Minimum 8 characters" type="text" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                    </div>
                    <button type="submit" className="auth-button">Create Account</button>
                </form>
            </div>
        </div>
    );
};

const AddBookView = () => {
    const { addBook, courses, books, courseBooks, enrollments, users } = useData();
    const [viewMode, setViewMode] = useState('add');
    const [book, setBook] = useState({ title: '', author: '', category: 'Computer Science', file: null });
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedBookDetail, setSelectedBookDetail] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        const bookData = {
            title: book.title,
            author: book.author,
            category: book.category,
            fileName: book.file ? book.file.name : null
        };
        addBook(bookData, selectedCourse);
        setBook({ title: '', author: '', category: 'Computer Science', file: null });
        setSelectedCourse('');
        alert("Book uploaded and linked successfully");
    };

    const getBookDetails = (book) => {
        const linkedCourseIds = courseBooks.filter(cb => cb.bookId === book.id).map(cb => cb.courseId);
        const linkedCourses = courses.filter(c => linkedCourseIds.includes(c.id));

        const allStudentIdsWithAccess = [];
        linkedCourseIds.forEach(cid => {
            const studentIds = enrollments.filter(e => e.courseId === cid).map(e => e.studentId);
            allStudentIdsWithAccess.push(...studentIds);
        });
        const uniqueStudentIds = [...new Set(allStudentIdsWithAccess)];
        const studentsWithAccess = users.filter(u => uniqueStudentIds.includes(u.id));

        return (
            <div>
                <h3>Usage Summary</h3>
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: 'bold' }}>Linked Courses:</div>
                    {linkedCourses.length > 0 ? (
                        <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                            {linkedCourses.map(c => <li key={c.id}>{c.title}</li>)}
                        </ul>
                    ) : <p style={{ fontStyle: 'italic', color: 'gray' }}>Not linked to any courses.</p>}
                </div>

                <div>
                    <div style={{ fontWeight: 'bold' }}>Students with Access ({studentsWithAccess.length}):</div>
                    {studentsWithAccess.length > 0 ? (
                        <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', marginTop: '5px' }}>
                            {studentsWithAccess.map(s => <div key={s.id}>{s.name} <span style={{ color: 'gray', fontSize: '0.8rem' }}>({s.id})</span></div>)}
                        </div>
                    ) : <p style={{ fontStyle: 'italic', color: 'gray' }}>No students currently have access.</p>}
                </div>
            </div>
        );
    };

    return (
        <div>
            <div className="admin-header-strip">
                <h2>Library Management</h2>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setViewMode('add')} style={{ padding: '10px 20px', fontWeight: 'bold', border: '2px solid black', background: viewMode === 'add' ? 'black' : 'white', color: viewMode === 'add' ? 'white' : 'black', cursor: 'pointer' }}>ADD NEW BOOK</button>
                <button onClick={() => setViewMode('list')} style={{ padding: '10px 20px', fontWeight: 'bold', border: '2px solid black', background: viewMode === 'list' ? 'black' : 'white', color: viewMode === 'list' ? 'white' : 'black', cursor: 'pointer' }}>ALL BOOKS</button>
            </div>

            {viewMode === 'add' ? (
                <div className="dash-card" style={{ maxWidth: '600px' }}>
                    <h3>Upload New Book</h3>
                    <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                        <div className="form-group">
                            <label>Book Title</label>
                            <input required placeholder="e.g. Advanced AI Patterns" value={book.title} onChange={e => setBook({ ...book, title: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Author</label>
                            <input required placeholder="Author Name" value={book.author} onChange={e => setBook({ ...book, author: e.target.value })} />
                        </div>

                        <div className="form-group">
                            <label>Upload File (PDF/EPUB)</label>
                            <input
                                type="file"
                                style={{ padding: '12px', border: '3px dashed black', width: '100%', background: 'var(--bg-app)' }}
                                onChange={e => setBook({ ...book, file: e.target.files[0] })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Link to Course (Optional)</label>
                            <select
                                value={selectedCourse}
                                onChange={e => setSelectedCourse(e.target.value)}
                                style={{ width: '100%', padding: '16px', border: '3px solid black', fontFamily: 'inherit' }}
                            >
                                <option value="">Select Course...</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Subject / Category</label>
                            <select
                                style={{ width: '100%', padding: '16px', border: '3px solid black' }}
                                value={book.category}
                                onChange={e => setBook({ ...book, category: e.target.value })}
                            >
                                <option>Computer Science</option>
                                <option>Mathematics</option>
                                <option>Physics</option>
                                <option>Literature</option>
                                <option>Art</option>
                            </select>
                        </div>
                        <button className="auth-button" style={{ background: 'var(--secondary)' }}>Upload Book</button>
                    </form>
                </div>
            ) : (
                <div className="dash-card">
                    <h3>Library Catalog</h3>
                    <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                        {books.map((b, index) => (
                            <div key={b.id} onClick={() => setSelectedBookDetail(b)} className="animate-scale" style={{ padding: '15px', border: '2px solid black', background: 'var(--bg-card)', position: 'relative', cursor: 'pointer', transition: 'transform 0.2s', animationDelay: `${index * 0.05}s` }}>
                                <div style={{ fontWeight: 'bold' }}>{b.title}</div>
                                <div style={{ fontSize: '0.9rem', color: 'gray' }}>by {b.author}</div>
                                <div style={{ marginTop: '10px', fontSize: '0.8rem', background: '#eee', display: 'inline-block', padding: '2px 6px' }}>{b.category}</div>
                                <div style={{ fontSize: '0.7rem', color: 'blue', marginTop: '5px', textDecoration: 'underline' }}>View Access & Links</div>
                            </div>
                        ))}
                        {books.length === 0 && <p>Library is empty.</p>}
                    </div>
                </div>
            )}

            {selectedBookDetail && (
                <DetailModal title={selectedBookDetail.title} onClose={() => setSelectedBookDetail(null)}>
                    {getBookDetails(selectedBookDetail)}
                </DetailModal>
            )}
        </div>
    );
};

const AddCourseView = ({ onComplete }) => {
    const { addCourse, updateCourse, assignTeacher, updateCourseAssignment, users, courses, courseAssignments, enrollments } = useData();
    const [viewMode, setViewMode] = useState('add');
    const [course, setCourse] = useState({ title: '', description: '', duration: '' });
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [selectedCourseDetail, setSelectedCourseDetail] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editCourseData, setEditCourseData] = useState({});
    const [editTeacherId, setEditTeacherId] = useState('');

    const teachers = users.filter(u => u.role === 'teacher');

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsGenerating(true);
        let modules = [];
        try {
            const syllabus = await generateCourseSyllabus(course.title);
            if (syllabus && syllabus.modules) {
                modules = syllabus.modules;
            }
        } catch (error) {
            console.error("Failed to generate content", error);
        }
        setIsGenerating(false);

        const newCourse = addCourse({ ...course, modules });
        if (selectedTeacherId) {
            assignTeacher(newCourse.id, selectedTeacherId);
        }
        setCourse({ title: '', description: '', duration: '' });
        setSelectedTeacherId('');
        alert("Course created with AI content!");
        if (onComplete) onComplete();
    };

    const handleEditSave = () => {
        if (!editCourseData.title || !editCourseData.description) return alert("Title and Description are required");
        updateCourse(editCourseData.id, {
            title: editCourseData.title,
            description: editCourseData.description,
            duration: editCourseData.duration
        });
        updateCourseAssignment(editCourseData.id, editTeacherId);
        setIsEditing(false);
        setSelectedCourseDetail(null); // Close modal
        alert("Course updated successfully!");
    };

    const openEditMode = (course) => {
        const assignment = courseAssignments.find(ca => ca.courseId === course.id);
        const currentTeacherId = assignment ? assignment.teacherId : '';
        setEditCourseData({ ...course });
        setEditTeacherId(currentTeacherId);
        setIsEditing(true);
    };

    const getCourseDetails = (course) => {
        const assignment = courseAssignments.find(ca => ca.courseId === course.id);
        const teacher = assignment ? users.find(u => u.id === assignment.teacherId) : null;

        const enrollmentList = enrollments.filter(e => e.courseId === course.id);
        const students = users.filter(u => enrollmentList.some(e => e.studentId === u.id));

        if (isEditing) {
            return (
                <div>
                    <div className="form-group">
                        <label>Course Title</label>
                        <input
                            value={editCourseData.title}
                            onChange={e => setEditCourseData({ ...editCourseData, title: e.target.value })}
                            style={{ width: '100%', padding: '10px', border: '2px solid black' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            rows="4"
                            value={editCourseData.description}
                            onChange={e => setEditCourseData({ ...editCourseData, description: e.target.value })}
                            style={{ width: '100%', padding: '10px', border: '2px solid black', fontFamily: 'inherit' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Duration (Weeks)</label>
                        <input
                            type="number"
                            value={editCourseData.duration}
                            onChange={e => setEditCourseData({ ...editCourseData, duration: e.target.value })}
                            style={{ width: '100%', padding: '10px', border: '2px solid black' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Instructor</label>
                        <select
                            value={editTeacherId}
                            onChange={e => setEditTeacherId(e.target.value)}
                            style={{ width: '100%', padding: '10px', border: '2px solid black' }}
                        >
                            <option value="">Unassigned</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button onClick={handleEditSave} className="auth-button" style={{ marginTop: 0, background: 'var(--secondary)' }}>SAVE CHANGES</button>
                        <button onClick={() => setIsEditing(false)} className="auth-button" style={{ marginTop: 0, background: 'gray' }}>CANCEL</button>
                    </div>
                </div>
            );
        }

        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                    <button onClick={() => openEditMode(course)} style={{ background: 'var(--primary)', border: '2px solid black', fontWeight: 'bold', padding: '5px 10px', cursor: 'pointer' }}>EDIT COURSE</button>
                </div>

                <div style={{ padding: '15px', background: 'var(--bg-app)', border: '1px solid black', marginBottom: '20px' }}>
                    <strong>Instructor:</strong> {teacher ? teacher.name : <span style={{ color: 'red' }}>Unassigned</span>}
                </div>

                <h3>Enrolled Students ({students.length})</h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            {students.map(s => (
                                <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '8px' }}>{s.name}</td>
                                    <td style={{ padding: '8px', fontSize: '0.8rem' }}>{s.email}</td>
                                    <td style={{ padding: '8px', fontSize: '0.8rem', fontFamily: 'monospace' }}>{s.id}</td>
                                </tr>
                            ))}
                            {students.length === 0 && <tr><td style={{ padding: '10px', color: 'gray' }}>No students enrolled.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div>
            <div className="admin-header-strip">
                <h2>Course Management</h2>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setViewMode('add')} style={{ padding: '10px 20px', fontWeight: 'bold', border: '2px solid black', background: viewMode === 'add' ? 'black' : 'white', color: viewMode === 'add' ? 'white' : 'black', cursor: 'pointer' }}>ADD NEW COURSE</button>
                <button onClick={() => setViewMode('list')} style={{ padding: '10px 20px', fontWeight: 'bold', border: '2px solid black', background: viewMode === 'list' ? 'black' : 'white', color: viewMode === 'list' ? 'white' : 'black', cursor: 'pointer' }}>ALL COURSES</button>
            </div>

            {viewMode === 'add' ? (
                <div className="dash-card" style={{ maxWidth: '800px' }}>
                    <h3>Create New Course</h3>
                    <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                        <div className="form-group">
                            <label>Course Name</label>
                            <input required placeholder="e.g. Intro to Machine Learning" value={course.title} onChange={e => setCourse({ ...course, title: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea rows="4" style={{ width: '100%', padding: '16px', border: '3px solid black', fontFamily: 'inherit' }} placeholder="Course objectives and summary..." value={course.description} onChange={e => setCourse({ ...course, description: e.target.value })} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label>Assigned Teacher</label>
                                <select
                                    style={{ width: '100%', padding: '16px', border: '3px solid black' }}
                                    value={selectedTeacherId}
                                    onChange={e => setSelectedTeacherId(e.target.value)}
                                >
                                    <option value="">Select Teacher...</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Duration (Weeks)</label>
                                <input type="number" placeholder="12" value={course.duration} onChange={e => setCourse({ ...course, duration: e.target.value })} />
                            </div>
                        </div>
                        <button className="auth-button" style={{ background: 'var(--accent)' }}>Publish Course</button>
                    </form>
                </div>
            ) : (
                <div className="dash-card">
                    <h3>Course Catalog</h3>
                    <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                        {courses.map((c, index) => (
                            <div key={c.id} onClick={() => setSelectedCourseDetail(c)} className="animate-scale" style={{ padding: '15px', border: '2px solid black', background: 'var(--bg-card)', cursor: 'pointer', animationDelay: `${index * 0.05}s` }}>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{c.title}</div>
                                <div style={{ fontSize: '0.9rem', color: 'gray', margin: '5px 0' }}>{c.description.substring(0, 60)}...</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{c.duration} Weeks</span>
                                    <span style={{ fontSize: '0.8rem', color: 'blue', textDecoration: 'underline' }}>View Details</span>
                                </div>
                            </div>
                        ))}
                        {courses.length === 0 && <p>No courses published.</p>}
                    </div>
                </div>
            )}

            {selectedCourseDetail && (
                <DetailModal title={isEditing ? "Edit Course" : selectedCourseDetail.title} onClose={() => { setSelectedCourseDetail(null); setIsEditing(false); }}>
                    {getCourseDetails(selectedCourseDetail)}
                </DetailModal>
            )}
        </div>
    );
};

const ManageCoursesView = () => {
    const { courses, users, books, enrollStudent, addBookToCourse, courseAssignments, enrollments, courseBooks } = useData();
    const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
    const [studentToEnroll, setStudentToEnroll] = useState('');
    const [bookToAdd, setBookToAdd] = useState('');

    const handleEnroll = (e) => {
        e.preventDefault();
        if (!studentToEnroll) return;
        enrollStudent(selectedCourseId, studentToEnroll);
    };

    const handleAddBook = (e) => {
        e.preventDefault();
        if (!bookToAdd) return;
        addBookToCourse(selectedCourseId, bookToAdd);
    };

    if (courses.length === 0) return <div>No courses available. Create one first!</div>;

    const currentCourse = courses.find(c => c.id === selectedCourseId);

    const currentTeacherId = courseAssignments.find(ca => ca.courseId === selectedCourseId)?.teacherId;
    const currentTeacher = users.find(u => u.id === currentTeacherId);

    const enrolledStudentIds = enrollments.filter(e => e.courseId === selectedCourseId).map(e => e.studentId);
    const enrolledStudents = users.filter(u => enrolledStudentIds.includes(u.id));
    const availableStudents = users.filter(u => u.role === 'student' && !enrolledStudentIds.includes(u.id));

    const linkedBookIds = courseBooks.filter(cb => cb.courseId === selectedCourseId).map(cb => cb.bookId);
    const linkedBooks = books.filter(b => linkedBookIds.includes(b.id));
    const availableBooks = books.filter(b => !linkedBookIds.includes(b.id));


    return (
        <div>
            <div className="admin-header-strip">
                <div style={{ flex: 1 }}>
                    <h2>Course Nexus</h2>
                    <p>Manage relationships and resources</p>
                </div>
                <div style={{ flex: 2 }}>
                    <select
                        style={{ width: '100%', padding: '16px', border: '3px solid black', fontWeight: 'bold', fontSize: '1.2rem', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                        value={selectedCourseId}
                        onChange={e => setSelectedCourseId(e.target.value)}
                    >
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title.toUpperCase()}</option>)}
                    </select>
                </div>
            </div>

            {currentCourse && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>

                    {/* Left Column: People */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Teacher Card */}
                        <div className="dash-card" style={{ borderLeft: '10px solid var(--primary)' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'gray' }}>Instructor</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{currentTeacher ? currentTeacher.name : 'Unassigned'}</div>
                        </div>

                        {/* Students List */}
                        <div className="dash-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3>Roster ({enrolledStudents.length})</h3>
                            </div>

                            <div style={{ background: 'var(--bg-app)', border: '2px solid black', maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
                                {enrolledStudents.map((s, idx) => (
                                    <div key={s.id} className="animate-slide-up" style={{ padding: '10px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', animationDelay: `${idx * 0.05}s` }}>
                                        <span style={{ fontWeight: '500' }}>{s.name}</span>
                                        <span style={{ fontSize: '0.8rem', background: '#ddd', padding: '2px 6px' }}>{s.id}</span>
                                    </div>
                                ))}
                                {enrolledStudents.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'gray' }}>No students enrolled.</div>}
                            </div>

                            <form onSubmit={handleEnroll} style={{ display: 'flex' }}>
                                <select
                                    style={{ flex: 1, padding: '10px', border: '2px solid black', borderRight: 'none' }}
                                    value={studentToEnroll}
                                    onChange={e => setStudentToEnroll(e.target.value)}
                                >
                                    <option value="">+ Add Student</option>
                                    {availableStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <button className="auth-button" style={{ width: 'auto', marginTop: 0, padding: '10px 15px', background: 'var(--text-main)', color: 'var(--bg-app)' }}>ADD</button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Course Info */}
                        <div className="dash-card" style={{ background: 'var(--bg-card)' }}>
                            <h3>Course Details</h3>
                            <p style={{ marginTop: '10px' }}>{currentCourse.description}</p>
                            <div style={{ marginTop: '10px', fontStyle: 'italic' }}>Duration: {currentCourse.duration} Weeks</div>
                        </div>

                        {/* Resources */}
                        <div className="dash-card" style={{ borderTop: '10px solid var(--secondary)' }}>
                            <h3>Digital Library</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', margin: '20px 0' }}>
                                {linkedBooks.map(b => (
                                    <div key={b.id} style={{ padding: '15px', border: '2px solid black', background: 'var(--bg-card)', boxShadow: '4px 4px 0 rgba(0,0,0,0.1)' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{b.title}</div>
                                        <div style={{ fontSize: '0.8rem' }}>by {b.author}</div>
                                        {b.fileName && <div style={{ marginTop: '8px', fontSize: '0.7rem', color: 'blue', textDecoration: 'underline' }}>{b.fileName}</div>}
                                    </div>
                                ))}
                            </div>
                            {linkedBooks.length === 0 && <p style={{ color: 'gray', fontStyle: 'italic' }}>No books assigned to this course.</p>}

                            <form onSubmit={handleAddBook} style={{ display: 'flex', marginTop: '20px', borderTop: '2px dashed #ddd', paddingTop: '20px' }}>
                                <select
                                    style={{ flex: 1, padding: '12px', border: '2px solid black', marginRight: '10px' }}
                                    value={bookToAdd}
                                    onChange={e => setBookToAdd(e.target.value)}
                                >
                                    <option value="">Select Resource from Library...</option>
                                    {availableBooks.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                                </select>
                                <button className="auth-button" style={{ width: 'auto', marginTop: 0, padding: '10px 20px', background: 'var(--secondary)' }}>Attach</button>
                            </form>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

// --- Main Container ---

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const { darkMode, toggleTheme } = useData();
    const [activeTab, setActiveTab] = useState('dashboard');

    const Menu = ({ id, icon, label }) => (
        <div
            className={`admin-nav-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
        >
            {label}
        </div>
    );

    return (
        <div className="admin-container">
            {/* Sidebar Navigation */}
            <nav className="admin-sidebar">
                <div className="admin-brand">PRAXIUM.AI</div>

                <div className="admin-nav-menu">
                    <Menu id="dashboard" label="DASHBOARD" />
                    <Menu id="users" label="ALL USERS" />
                    <Menu id="add-user" label="ADD NEW USER" />
                    <Menu id="add-books" label="ADD BOOKS" />
                    <Menu id="add-courses" label="ADD COURSES" />
                    <Menu id="manage-courses" label="MANAGE LINKS" />
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <div
                        className="admin-nav-item"
                        style={{ marginBottom: '10px', border: '2px solid black', background: darkMode ? 'white' : 'black', color: darkMode ? 'black' : 'white', cursor: 'pointer', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                        onClick={toggleTheme}
                    >
                        <span className="material-icons" style={{ fontSize: '1.2rem' }}>{darkMode ? 'light_mode' : 'dark_mode'}</span>
                        {darkMode ? 'LIGHT MODE' : 'DARK MODE'}
                    </div>
                    <div className="admin-nav-item" style={{ border: '2px solid red', color: 'red' }} onClick={logout}>
                        LOGOUT
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="admin-main">
                <header style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>LOGGED IN AS: {(user?.name || 'ADMIN').toUpperCase()}</span>
                </header>
                {activeTab === 'dashboard' && <DashboardView />}
                {activeTab === 'users' && <UserListView />}
                {activeTab === 'add-user' && <AddUserView onComplete={() => setActiveTab('users')} />}
                {activeTab === 'add-books' && <AddBookView />}
                {activeTab === 'add-courses' && <AddCourseView onComplete={() => setActiveTab('manage-courses')} />}
                {activeTab === 'manage-courses' && <ManageCoursesView />}
            </main>
        </div>
    );
}

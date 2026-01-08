import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial Data Seeding
  useEffect(() => {
    const initAuth = () => {
      console.log('Auth: Starting Init...');
      try {
        const rawUsers = localStorage.getItem('users');
        let users = [];

        if (rawUsers) {
          try {
            users = JSON.parse(rawUsers);
          } catch (e) {
            console.error('Auth: JSON Parse Error, resetting.', e);
            localStorage.clear();
          }
        }

        // Default Users
        const defaultUsers = [
          { id: 'admin1', role: 'admin', name: 'Admin User', email: 'Aadmin@praxium.ai', password: 'Admin@123' },
          { id: 'teacher1', role: 'teacher', name: 'Teacher Dave', email: 'teacher@praxium.ai', password: 'password' },
          { id: 'student1', role: 'student', name: 'Student John', email: 'student@praxium.ai', password: 'password' }
        ];

        defaultUsers.forEach(defUser => {
          const idx = users.findIndex(u => u.email === defUser.email);
          if (idx === -1) {
            users.push(defUser);
            console.log('Auth: Seeded ' + defUser.role);
          } else if (users[idx].password !== defUser.password) {
            // updates password if mismatch/corrupted
            users[idx] = defUser;
            console.log('Auth: Updated ' + defUser.role);
          }
        });

        localStorage.setItem('users', JSON.stringify(users));

        // Load Session
        const session = localStorage.getItem('user');
        if (session) {
          setUser(JSON.parse(session));
        }

      } catch (e) {
        console.error('Auth: Critical Init Error', e);
      } finally {
        console.log('Auth: Init Complete.');
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (identifier, password) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      // Allow login with Email OR ID
      let found = users.find(u => (u.email === identifier || u.id === identifier) && u.password === password);

      if (!found) {
        // --- Smart Login Logic ---
        // If user not found, check if email contains role keywords and auto-create
        const lowerEmail = identifier.toLowerCase();
        let detectedRole = null;

        if (lowerEmail.includes('admin')) detectedRole = 'admin';
        else if (lowerEmail.includes('teacher')) detectedRole = 'teacher';
        else if (lowerEmail.includes('student')) detectedRole = 'student';

        if (detectedRole) {
          console.log(`Auth: Smart Login detected role '${detectedRole}' for ${identifier}. Auto-creating user.`);

          // Generate consistent ID format (similar to DataContext)
          const year = new Date().getFullYear();
          const rolePrefix = detectedRole === 'admin' ? 'ADM' : detectedRole === 'teacher' ? 'FAC' : 'STD';
          const count = users.filter(u => u.role === detectedRole).length + 1;
          const newId = `${rolePrefix}-${year}-${String(count).padStart(3, '0')}`;

          const newUser = {
            id: newId,
            role: detectedRole,
            name: identifier.split('@')[0], // Default name from email
            email: identifier,
            password: password, // Use key provided
            permissions: 'standard',
            completedCourses: []
          };

          users.push(newUser);
          localStorage.setItem('users', JSON.stringify(users));
          found = newUser;
        }
      }

      if (found) {
        const { password, ...safeUser } = found;
        setUser(safeUser);
        localStorage.setItem('user', JSON.stringify(safeUser));
        return { success: true };
      }
      return { success: false, message: 'Invalid Credentials' };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Login Error' };
    }
  };

  const signup = (name, email, password, role = 'student') => {
    // Simplistic Signup
    return { success: false, message: 'Signup disabled in debug mode' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const resetData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, resetData, loading }}>
      {/* Prevent flash of login screen by waiting for init */}
      {loading ? null : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

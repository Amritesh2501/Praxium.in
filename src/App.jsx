import React, { useState, useEffect } from 'react';
// IMPORT TEST: Checking if this file causes a crash just by being imported
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import AuthPage from './components/AuthPage';
import AdminDashboard from './components/dashboards/AdminDashboard';
import TeacherDashboard from './components/dashboards/TeacherDashboard';
import StudentDashboard from './components/dashboards/StudentDashboard';
import LoadingScreen from './components/LoadingScreen';
import BauhausModal from './components/common/BauhausModal';

function AppContent() {
  const { user } = useAuth();
  const { modalConfig, closeModal } = useData();
  const [debugReset, setDebugReset] = useState(false);

  if (!user) return <AuthPage />;

  return (
    <>
      {user.role === 'admin' && <AdminDashboard />}
      {user.role === 'teacher' && <TeacherDashboard />}
      {user.role === 'student' && <StudentDashboard />}
      {!user.role && <StudentDashboard />} {/* Fallback */}

      <BauhausModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={() => {
          if (modalConfig.onConfirm) modalConfig.onConfirm();
          closeModal();
        }}
        onCancel={() => {
          if (modalConfig.onCancel) modalConfig.onCancel();
          closeModal();
        }}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
      />
    </>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 50, background: 'var(--bg-app)', color: 'var(--text-main)', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h1 style={{ color: 'var(--accent)', fontSize: '3rem', marginBottom: '20px' }}>SOMETHING WENT WRONG.</h1>
          <div style={{ padding: '20px', border: '2px dashed var(--accent)', background: 'var(--bg-card)', marginBottom: '30px', maxWidth: '80%' }}>
            <pre style={{ overflowX: 'auto' }}>{this.state.error.toString()}</pre>
          </div>
          <button className="auth-button" onClick={() => window.location.reload()} style={{ width: 'auto', background: 'var(--accent)', color: 'white' }}>RELOAD APPLICATION</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <LoadingScreen onComplete={() => setLoading(false)} />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

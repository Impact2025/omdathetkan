import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/ui/Toast';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Invite from './pages/Invite';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <ToastContainer />
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route
            path="/invite"
            element={
              <PrivateRoute>
                <Invite />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

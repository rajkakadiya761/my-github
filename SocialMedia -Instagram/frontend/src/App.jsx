import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './components/auth/Login';
import SignUp from './components/auth/SignUp';
import AdminLogin from './components/auth/AdminLogin';
import AdminPortal from './pages/AdminPortal';
import MainPage from './pages/MainPage';

// PrivateRoute component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    // Clear any potentially invalid tokens
    localStorage.removeItem('token');
    return <Navigate to="/" replace />;
  }
  return children;
};

// AdminRoute component
const AdminRoute = ({ children }) => {
  const isAdmin = localStorage.getItem('adminSession');
  if (!isAdmin) {
    return <Navigate to="/admin-login" replace />;
  }
  return children;
};

// PublicRoute component - redirects to /main if already authenticated
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/main/feed" replace />;
  }
  return children;
};

function App() {
  // Check token validity on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Clear any potentially invalid tokens or leftover data
      localStorage.clear();
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          }
        />
        <Route
          path="/admin-login"
          element={
            <AdminLogin />
          }
        />

        {/* Protected routes */}
        <Route
          path="/main/*"
          element={
            <PrivateRoute>
              <MainPage />
            </PrivateRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin-portal"
          element={
            <AdminRoute>
              <AdminPortal />
            </AdminRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

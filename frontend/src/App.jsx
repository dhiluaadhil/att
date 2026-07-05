import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import DashboardHome from './pages/DashboardHome';
import SubmissionsTable from './pages/SubmissionsTable';
import CalculationsTable from './pages/CalculationsTable';
import ReportsPage from './pages/ReportsPage';
import FlowTimeline from './pages/FlowTimeline';

// Router guard to redirect unauthenticated requests to login
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Layout for dashboard pages (includes Navbar)
const DashboardLayout = ({ children }) => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 pb-16">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/"
          element={
            <DashboardLayout>
              <DashboardHome />
            </DashboardLayout>
          }
        />
        <Route
          path="/submissions"
          element={
            <DashboardLayout>
              <SubmissionsTable />
            </DashboardLayout>
          }
        />
        <Route
          path="/calculations"
          element={
            <DashboardLayout>
              <CalculationsTable />
            </DashboardLayout>
          }
        />
        <Route
          path="/reports"
          element={
            <DashboardLayout>
              <ReportsPage />
            </DashboardLayout>
          }
        />
        <Route
          path="/timeline"
          element={
            <DashboardLayout>
              <FlowTimeline />
            </DashboardLayout>
          }
        />

        {/* Wildcard Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

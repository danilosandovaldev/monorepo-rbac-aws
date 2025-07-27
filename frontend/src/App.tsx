import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { ConfirmSignUp } from './pages/ConfirmSignUp';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Callback } from './pages/Callback';
import { ExternalAuth } from './pages/ExternalAuth';
import { UserManagement } from './pages/UserManagement';
import { ProtectedRoute } from './components/ProtectedRoute';
import './config/amplify';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/external-auth" replace />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/confirm-signup" element={<ConfirmSignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/external-auth" element={<ExternalAuth />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-management"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
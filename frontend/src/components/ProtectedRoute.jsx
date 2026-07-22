import React from 'react';
import { Navigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import useAuthStore from '../contexts/authStore';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, token } = useAuthStore();

  // If management access is required but the user is not logged in
  if (requireAdmin && !token) {
    return (
      <Result
        status="403"
        title="Management Access Required"
        subTitle="Please log in as a Head of Department or Deputy Head of Department to access this page."
        extra={
          <Button type="primary" href="/admin/login">
            Go to Login
          </Button>
        }
      />
    );
  }

  // If management access is required but the user holds neither the HoD nor DHoD role
  if (requireAdmin && token && user?.role !== 'hod' && user?.role !== 'dhod') {
    return (
      <Result
        status="403"
        title="Insufficient Permissions"
        subTitle="You do not have permission to access this page. HoD or DHoD access is required."
        extra={
          <Button type="primary" href="/dashboard">
            Go to Dashboard
          </Button>
        }
      />
    );
  }

  // Render the protected component
  return children;
};

export default ProtectedRoute;

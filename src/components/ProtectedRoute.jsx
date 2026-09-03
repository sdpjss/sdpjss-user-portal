// src/components/ProtectedRoute.js

import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AppContext } from "../context/AppContext"; // Adjust the import path as needed

const ProtectedRoute = () => {
  const { utoken, loading } = useContext(AppContext);

  // While the context is checking for the token (e.g., on page refresh),
  // show a loading state. This prevents a flicker to the login page.
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // If loading is finished and there's no token, redirect to the login page.
  if (!utoken) {
    return <Navigate to="/login" replace />;
  }

  // If the token exists, render the child component (the UserPortal).
  // The <Outlet /> component from react-router-dom renders the nested route.
  return <Outlet />;
};

export default ProtectedRoute;

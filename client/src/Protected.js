import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

import useUserStore from "./store/useUserStore";
import { checkUserAuth } from "./services/user.service";
import Loader from "./utils/Loader";

export const ProtectedRoute = () => {
  const location = useLocation();
  const { isAuthenticated, setUser, clearUser, user } = useUserStore();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    console.log("ProtectedRoute: isAuthenticated=", isAuthenticated, "user=", user);
    
    // Check if token exists
    const token = localStorage.getItem('token');
    console.log("ProtectedRoute: token=", token);
    
    // If authenticated but no user data, force re-check (don't require token since cookies might work)
    if (isAuthenticated && !user) {
      console.log("ProtectedRoute: Authenticated but no user data, forcing check");
    } else if (isAuthenticated && user) {
      console.log("ProtectedRoute: Already authenticated with user data, skipping check");
      return; // 🔑 STOP RECHECK
    }

    const verifyAuth = async () => {
      console.log("ProtectedRoute: Starting auth verification...");
      setIsChecking(true);
      try {
        const result = await checkUserAuth();
        console.log("ProtectedRoute: checkUserAuth result=", result);
        if (result?.authenticated) {
          console.log("ProtectedRoute: Setting user=", result.user);
          setUser(result.user);
        } else {
          console.log("ProtectedRoute: Not authenticated, clearing user");
          clearUser();
        }
      } catch (error) {
        console.error("ProtectedRoute: Error during auth check=", error);
        clearUser();
      } finally {
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, [isAuthenticated, setUser, clearUser]);

  if (isChecking) return <Loader />;

  if (!isAuthenticated) {
    return <Navigate to="/user-login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};


export const PublicRoute = () => {
    const isAuthenticated = useUserStore(state => state.isAuthenticated);

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

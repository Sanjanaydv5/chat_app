import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

import useUserStore from "./store/useUserStore";
import { checkUserAuth } from "./services/user.service";
import Loader from "./utils/Loader";

export const ProtectedRoute = () => {
  const location = useLocation();
  const { isAuthenticated, setUser, clearUser } = useUserStore();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (isAuthenticated) return; // 🔑 STOP RECHECK

    const verifyAuth = async () => {
      setIsChecking(true);
      try {
        const result = await checkUserAuth();
        if (result?.authenticated) {
          setUser(result.user);
        } else {
          clearUser();
        }
      } catch {
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

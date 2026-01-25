import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

import useUserStore from "./store/useUserStore";
import { checkUserAuth } from "./pages/services/user.service";
import Loader from "./utils/Loader";


export const ProtectedRoute = () => {
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);
    const {isAuthenticated, setUser, clearUser} = useUserStore();

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const result = await checkUserAuth();
                if (result?.authenticated) {
                    setUser(result.user);
                } else {
                    clearUser();
                }
            } catch (error) {
                console.error("Error verifying authentication:", error);
                clearUser();
            } finally {
                setIsChecking(false);
            }
        };
        verifyAuth();
    }, [setUser, clearUser]);
    if (isChecking) {
        return <Loader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/user-login" state={{ from: location }} replace />;
    }

    //user is authenticated, render the protected content
    return <Outlet />;
}


export const PublicRoute = () => {
    const {isAuthenticated} = useUserStore(state => state.isAuthenticated);
    if (isAuthenticated) {
        return <Navigate to="/"  replace />;
    }
    return <Outlet />;
}
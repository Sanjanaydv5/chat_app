import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/user-login/login';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import { ProtectedRoute, PublicRoute } from './Protected';
import HomePage from './components/HomePage';
import UserDetails from './components/UserDetails';
import Setting from './pages/SettingSection/Setting';
import Status from './pages/StatusSection/Status';
import useUserStore from "./store/useUserStore";
import { initializeSocket, disconnectSocket } from './services/chat.service';
import { useChatStore } from "./store/chatStore"

function App() {
  const { user } = useUserStore();
  const { setCurrentUser, initSocketListeners, cleanup } = useChatStore();

  useEffect(() => {
    if (user?._id) {
      const socket = initializeSocket();
      if (socket) {
        setCurrentUser(user);
        initSocketListeners();
      }
    }

    // Cleanup function to run when component unmounts
    return () => {
      cleanup();
      disconnectSocket();
    };
    // Corrected dependency array from () to []
  }, [user, setCurrentUser, initSocketListeners, cleanup]);

  return (
    <>
      <ToastContainer position='top-right' autoClose={3000} />
      <BrowserRouter
        future={{
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/user-login" element={<Login />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/user-profile" element={<UserDetails />} />
            <Route path="/status" element={<Status />} />
            <Route path="/setting" element={<Setting />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
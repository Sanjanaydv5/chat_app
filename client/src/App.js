import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/user-login/login';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'

function App() {
  return (
    <>
    <ToastContainer position='top-right' autoClose={3000}/>
    <BrowserRouter>
      <Routes>
        <Route path="/user-login" element={<Login />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;

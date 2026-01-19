import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/user-login/login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/user-login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

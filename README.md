# Chat App

A full-stack real-time chat web application built with **Node.js**, **React.js**, and **Socket.IO**. This app allows users to communicate instantly, with features like user authentication, real-time messaging, and more.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Screenshots](#screenshots)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [License](#license)
- [Additional Information](#additional-information)
- [Future Improvements](#future-improvements)

---

## Overview

This is a real-time chat application where users can sign up, log in, send messages instantly, and manage their profiles. Built using **Socket.IO** for real-time communication, it supports both private and group conversations. 

---

## Technology Stack

- **Frontend:**
  - JavaScript (React.js)
  - Zustand (for state management)
  - Tailwind CSS (Responsive Design)
  - Socket.IO (Real-time communication)

- **Backend:**
  - Node.js & Express.js
  - MongoDB (Database)
  - Socket.IO (Real-time communication)
  - JWT (JSON Web Tokens) for authentication
  - Mongoose (MongoDB ORM)

- **Real-time Communication:**
  - WebSocket support via **Socket.IO** for instant messaging and updates.

---

## Features

### Backend Features:
- **Full backend from scratch**: Implemented a complete backend for the chat app using Node.js and Express.js.
- **User authentication**: Secure login and registration via OTP (Phone & Email).
- **JWT token-based authentication**: Ensures secure login sessions and user validation.
- **Socket.IO setup**: Provides real-time communication between clients and servers.
- **User presence**: Track users' online/offline status and basic "last seen" feature.
- **Message history**: Messages are stored in MongoDB and can be retrieved as per user needs.
- **Profile update & story upload logic**: Users can update their profile and share stories.
- **Protected routes**: Certain routes are protected using JWT-based authentication.

### Frontend Features:
- **Real-time chat**: Powered by **Socket.IO**, users can send and receive messages instantly.
- **Zustand store**: A central state management tool to manage user and chat states.
- **Responsive chat UI**: The chat window is user-friendly and adapts to different screen sizes.
- **Settings page UI**: Manage settings, like dark mode, user preferences, etc.
- **Message syncing**: Chat messages are synced between frontend and backend in real-time.
- **Profile and story upload**: Users can upload their profile pictures and stories from the frontend.

---

## Screenshots

Here are some screenshots showcasing the application features:

### Screenshot 1
![Chat App Screenshot 1](Screenshot%202026-03-21%20171423.png)

### Screenshot 2
![Chat App Screenshot 2](Screenshot%202026-03-21%20171456.png)

### Screenshot 3
![Chat App Screenshot 3](Screenshot%202026-03-21%20171514.png)

### Screenshot 4
![Chat App Screenshot 4](Screenshot%202026-03-21%20171529.png)

### Screenshot 5
![Chat App Screenshot 5](Screenshot%202026-03-21%20171547.png)

### Screenshot 6
![Chat App Screenshot 6](Screenshot%202026-03-21%20171704.png)

### Screenshot 7
![Chat App Screenshot 7](Screenshot%202026-03-21%20171733.png)

### Screenshot 8
![Chat App Screenshot 8](Screenshot%202026-03-21%20171808.png)

### Screenshot 9
![Chat App Screenshot 9](Screenshot%202026-03-21%20171821.png)

### Screenshot 10
![Chat App Screenshot 10](Screenshot%202026-03-21%20171835.png)

### Screenshot 11
![Chat App Screenshot 11](Screenshot%202026-03-21%20171845.png)

## Project Structure

- `/client` - Frontend React application
- `/server` - Backend server application

## Getting Started

### Prerequisites

- Node.js installed on your system
- npm package manager

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Navigate to the client directory and install dependencies:
   ```bash
   cd client
   npm install
   ```

### Running the Application

1. Start the server:
   ```bash
   npm start
   ```
2. In a separate terminal, start the client:
   ```bash
   cd client
   npm start
   ```

The application will open at `http://localhost:3000`

## Development

This project is actively being developed. Feel free to contribute by submitting pull requests or opening issues.

## License

This project is open source and available under the MIT License.

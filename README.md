# React.js Chat App 💬

A modern real-time **chat application** built with **React.js** and **Tailwind CSS**.  
It allows users to log in, send and receive messages instantly, and log out.  

---

## 🚀 Features
- 🔐 User registration & login
- 💬 Real-time chat with WebSocket/Socket.IO
- 👥 Multiple users chatting in different tabs
- 🎨 Tailwind CSS-based chat UI
- 🚪 Logout functionality
- 📱 Fully responsive design

---

## 🛠 Tech Stack
- **Frontend:** React.js (Vite or CRA), Tailwind CSS  
- **Backend:** Node.js, Express, Socket.IO (separate repo)  
- **State Management:** React Hooks / Context API  
- **Authentication:** JWT / LocalStorage  

---

## 📂 Project Structure
├── .gitignore
├── LICENSE
├── README.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── public
|    └── vite.svg
├── src
|   ├── App.css
|   ├── App.jsx
|   ├── api.js
|   ├── index.css
|   ├── main.jsx
|   └── pages
|   │   ├── Chat.jsx
|   │   ├── Login.jsx
|   │   └── Register.jsx
└── vite.config.js
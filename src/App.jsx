import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login.jsx";
import ChatList from "./pages/Chat";
import ChatRoom from "./pages/call.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/chat" element={<ChatList />}>
          <Route path=":receiverId" element={<ChatRoom />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

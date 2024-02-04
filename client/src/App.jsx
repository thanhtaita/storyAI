import "./App.css";
import Canvas from "./Page/Canvas";
import Prompt from "./Page/Prompt";
import Story from "./Page/Story";
import Main from "./Page/Main";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/canvas" element={<Canvas />} />
        <Route path="/prompt" element={<Prompt />} />
        <Route path="/story" element={<Story />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

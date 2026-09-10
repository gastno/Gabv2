import "./App.css";
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Staff from "./pages/Staff";

import Gabbablu from "./pages/studios/Gabbablu";
import AmorTattoo from "./pages/studios/AmorTattoo";

function App() {
  const [language, setLanguage] = useState("en");

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Home language={language} setLanguage={setLanguage} />}
        />
        <Route path="/staff" element={<Staff />} />
        <Route path="/studios/gabbablu" element={<Gabbablu />} />
        <Route path="/studios/amortattoo" element={<AmorTattoo />} />
      </Routes>
    </Router>
  );
}

export default App;
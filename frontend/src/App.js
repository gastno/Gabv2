import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Admin from "./pages/Admin/Admin";
import Staff from "./pages/Staff/Staff";
import Gabbablu from "./pages/Gabbablu/Gabbablu";


function App() {
  const [language, setLanguage] = useState("en");

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Home language={language} setLanguage={setLanguage} />}
        />

        <Route
          path="/admin"
          element={<Admin />}
        />

        <Route
          path="/staff"
          element={<Staff />}
        />
    
        <Route 
        path="/studios/gabbablu" 
        element={<Gabbablu />} 
        />
  
      </Routes>
    </Router>
  );
}

export default App;
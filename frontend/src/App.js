import './App.css';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Staff from './pages/Staff';

function App() {
  const [language, setLanguage] = useState('en');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage language={language} setLanguage={setLanguage} />} />
        <Route path="/staff" element={<Staff />} />
      </Routes>
    </Router>
  );
}

function HomePage({ language, setLanguage }) {
  return (
    <div className="app-container">
      {/* Top Bar */}
      <div className="top-bar">
        {/* Logo Space */}
        <div className="logo-space" />

        {/* Center Spacer */}
        <div className="spacer" />

        {/* Language Dropdown & Login */}
        <div className="controls">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="language-dropdown"
          >
            <option value="en">English</option>
            <option value="is">Íslenska</option>
          </select>

          <button className="login-button">
            Log in
          </button>
        </div>
      </div>

      {/* Gradient Space */}
      <div className="gradient-space" />

      {/* Interactive Dual Button */}
      <div className="interactive-container">
        {/* Beauty Side */}
        <div className="interactive-side beauty-side">
          Beauty
          <div className="diagonal-separator" />
        </div>

        {/* Tattoo Side */}
        <div className="interactive-side tattoo-side">
          Tattoo
        </div>
      </div>

      <footer className="footer">
        <div className="footer-content">
          {/* Logo and Top Buttons */}
          <div className="footer-top">
            {/* Logo */}
            <div className="footer-logo">
              <div className="footer-logo-placeholder" />
            </div>

            {/* Right Buttons */}
            <div className="footer-top-buttons">
              <button className="footer-top-button" />
              <button className="footer-top-button" />
            </div>
          </div>

          {/* Horizontal Bar */}
          <div className="footer-divider" />

          {/* Main Sections */}
          <div className="footer-sections">
            {/* Our Mission */}
            <div className="footer-section">
              <h3 className="footer-title">Our Mission</h3>
              <p className="footer-text">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>

            {/* Contact & Legal */}
            <div className="footer-columns">
              {/* Contact Us */}
              <div className="footer-section">
                <h3 className="footer-title">Contact us</h3>
                <button className="footer-button">Contact</button>
              </div>

              {/* Legal */}
              <div className="footer-section">
                <h3 className="footer-title">Legal</h3>
                <button className="footer-button">Privacy policy</button>
                <button className="footer-button">Cookie settings</button>
              </div>

              {/* Find us on */}
              <div className="footer-section">
                <h3 className="footer-title">Find us on</h3>
                <button className="footer-button">Facebook</button>
                <button className="footer-button">Instagram</button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
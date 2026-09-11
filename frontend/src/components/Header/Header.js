import React from "react";
import "./Header.css";

function Header({ language, onLanguageChange, onLoginClick }) {
  return (
    <header className="main-header">
      <div className="logo-space">LOGO</div>

      <div className="spacer" />

      <div className="controls">

        <button className="login-button" onClick={onLoginClick}>
          Log in
        </button>

        <select
          value={language}
          onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
          className="language-dropdown"
        >
          <option value="en">English</option>
          <option value="is">Íslenska</option>
        </select>

        
      </div>
    </header>
  );
}

export default Header;
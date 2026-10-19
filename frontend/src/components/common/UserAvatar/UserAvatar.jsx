import React, { useState } from "react";
import "./UserAvatar.css";

function UserAvatar({ src, alt, className = "", style }) {
  const [failedSource, setFailedSource] = useState(null);

  if (!src || failedSource === src) {
    return (
      <span
        className={`user-avatar-placeholder ${className}`.trim()}
        role="img"
        aria-label={alt || "User"}
        style={style}
      >
        👤
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ""}
      className={className}
      style={style}
      onError={() => setFailedSource(src)}
    />
  );
}

export default UserAvatar;
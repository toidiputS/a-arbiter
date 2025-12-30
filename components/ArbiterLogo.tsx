import React from "react";

interface ArbiterLogoProps {
  size?: "small" | "medium" | "large";
  animated?: boolean;
  showGlow?: boolean;
  className?: string;
}

export const ArbiterLogo: React.FC<ArbiterLogoProps> = ({
  size = "medium",
  animated = true,
  showGlow = true,
  className = "",
}) => {
  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24",
    large: "w-32 h-32",
  };

  const animationClasses = [
    animated && "logo-float",
    showGlow && "logo-glow",
    "arbiter-logo",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`logo-container ${className}`}>
      <img
        src="/logo.svg"
        alt="Arbiter Logo"
        className={`${sizeClasses[size]} ${animationClasses} ${
          showGlow ? "arbiter-logo--with-glow" : "arbiter-logo--no-glow"
        }`}
      />
    </div>
  );
};

export default ArbiterLogo;

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const AuthVerify = () => {
  const [isExpired, setIsExpired] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  // Memoized logout function to prevent unnecessary re-renders
  const handleLogout = useCallback(() => {
    console.log("Logging out...");

    // Clear the token from storage
    localStorage.removeItem("utoken");

    // Clear any other user-related data if needed
    // localStorage.removeItem("userData");
    // sessionStorage.clear();

    // Reset expired state
    setIsExpired(false);
    setCountdown(5);

    // Redirect to the login page
    navigate("/login", { replace: true }); // replace: true prevents going back
  }, [navigate]);

  // Check token validity
  const checkTokenValidity = useCallback(() => {
    const token = localStorage.getItem("utoken");

    if (!token) {
      return; // No token, user is not logged in
    }

    try {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      // Check if token is expired
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        setIsExpired(true);
      }
    } catch (error) {
      console.error("Invalid token:", error);
      handleLogout(); // If token is malformed, log out immediately
    }
  }, [handleLogout]);

  // Initial token check
  useEffect(() => {
    checkTokenValidity();
  }, [checkTokenValidity]);

  // Periodic token check (optional - check every minute)
  useEffect(() => {
    const interval = setInterval(checkTokenValidity, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkTokenValidity]);

  // Countdown effect when session expires
  useEffect(() => {
    let timer;

    if (isExpired && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isExpired && countdown === 0) {
      handleLogout();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isExpired, countdown, handleLogout]);

  // Manual logout handler for the button
  const handleManualLogout = () => {
    handleLogout();
  };

  // Render the expiration overlay message
  if (isExpired) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          color: "white",
          textAlign: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            color: "black",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            maxWidth: "400px",
            width: "90%",
          }}
        >
          <h2 style={{ marginBottom: "15px", color: "#d32f2f" }}>
            🔐 Session Expired
          </h2>
          <p style={{ marginBottom: "10px" }}>
            Your login session has expired for security reasons.
          </p>
          <p
            style={{
              marginBottom: "20px",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            Redirecting in {countdown} seconds...
          </p>
          <button
            onClick={handleManualLogout}
            style={{
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#1565c0")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#1976d2")}
          >
            Login Now
          </button>
        </div>
      </div>
    );
  }

  return null; // Don't render anything if the session is valid
};

export default AuthVerify;

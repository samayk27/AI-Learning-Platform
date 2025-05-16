import { SignIn, SignUp, UserButton, useUser } from "@clerk/clerk-react";
import React from "react";

export function AuthWrapper({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return (
      <div style={{ 
        maxWidth: "800px", 
        margin: "40px auto",
        padding: "20px",
        textAlign: "center" 
      }}>
        <h1>Welcome to AI Learning Platform</h1>
        <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
          <div style={{ flex: 1, maxWidth: "400px" }}>
            <h2>Sign In</h2>
            <SignIn routing="path" path="/sign-in" />
          </div>
          <div style={{ flex: 1, maxWidth: "400px" }}>
            <h2>Sign Up</h2>
            <SignUp routing="path" path="/sign-up" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ 
        padding: "10px 20px",
        background: "#f5f5f5",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <h2>Welcome, {user.firstName || user.username}!</h2>
        <UserButton />
      </div>
      {children}
    </div>
  );
} 
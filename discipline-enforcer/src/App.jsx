import React, { useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import Dashboard from "./dashboard/Dashboard";

function AppInner() {
  const { user } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  if (!user) {
    return showSignup
      ? <Signup  onSwitch={() => setShowSignup(false)} />
      : <Login   onSwitch={() => setShowSignup(true)}  />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

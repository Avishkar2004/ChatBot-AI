import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppRoutes from "./routes/Routes.jsx";
import { Background, ToastProvider } from "./components/ui";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Background />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

import React from "react";
import { Routes, Route, useLocation, matchPath } from "react-router-dom";

import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

import Home from "../pages/Home.jsx";
import Signup from "../pages/Signup.jsx";
import Login from "../pages/Login.jsx";
import Features from "../components/Features.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Projects from "../pages/Projects.jsx";
import ProjectDetail from "../pages/ProjectDetail.jsx";
import ProjectChat from "../pages/ProjectChat.jsx";

const AppRoutes = () => {
  const location = useLocation();

  const hideFooter =
    !!matchPath("/projects/:projectId/chat", location.pathname) ||
    (!!matchPath("/projects/:projectId", location.pathname) &&
      !matchPath("/projects/:projectId/*", location.pathname));

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/features" element={<Features />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/chat"
          element={
            <ProtectedRoute>
              <ProjectChat />
            </ProtectedRoute>
          }
        />
      </Routes>
      {!hideFooter && <Footer />}
    </>
  );
};

export default AppRoutes;

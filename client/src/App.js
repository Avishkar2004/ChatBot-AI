import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Projects from "./pages/Projects.jsx";
import ProjectDetail from "./pages/ProjectDetail.jsx";
import ProjectChat from "./pages/ProjectChat.jsx";
import Container from "./components/ui/Container.jsx";
import Footer from "./components/Footer.jsx";

function Home() {
  return (
    <section className="relative overflow-hidden flex items-center">
      <Container className="pt-20 pb-24">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Build and chat with your AI agents
            </h1>
            <p className="mt-4 text-gray-300 max-w-prose">
              Create projects, craft prompts, and converse with your agents in
              real time. A modern chatbot platform UI built with React and
              Tailwind.
            </p>
            <div className="mt-8 flex gap-3">
              <a href="/signup" className="btn-primary">
                Get Started
              </a>
              <a
                href="/projects"
                className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-200 hover:text-white hover:bg-white/5 border border-white/10"
              >
                View Projects
              </a>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="glass rounded-xl p-6">
              <div className="h-64 bg-black/30 border border-white/10 rounded-lg flex items-center justify-center text-gray-400">
                Agent preview
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
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
      </BrowserRouter>
      <Footer />
    </AuthProvider>
  );
}

export default App;

import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import Container from "../components/ui/Container.jsx";
import Features from "../components/Features.jsx";

function Home() {
    const { isAuthenticated, user, loading } = useAuth();

    // Show loading state
    if (loading) {
        return (
            <motion.div
                className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div
                    className="text-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <motion.div
                        className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.p
                        className="text-gray-600 dark:text-gray-300"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        Loading...
                    </motion.p>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
        >
            {/* Animated Hero Section */}
            <motion.section
                className="relative overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-600/10"
                    animate={{
                        background: [
                            "linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)",
                            "linear-gradient(90deg, rgba(37, 99, 235, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)",
                            "linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)"
                        ]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <Container className="pt-20 pb-24 relative">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            className="space-y-8"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <motion.div
                                className="space-y-4"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                            >
                                <motion.div
                                    className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 0.6 }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <motion.div
                                        className="w-2 h-2 bg-emerald-500 rounded-full"
                                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                    {isAuthenticated ? 'Welcome Back!' : 'AI-Powered Platform'}
                                </motion.div>

                                <motion.h1
                                    className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.8 }}
                                >
                                    {isAuthenticated ? (
                                        <>
                                            Welcome back, <motion.span
                                                className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent"
                                                animate={{
                                                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                                                }}
                                                transition={{
                                                    duration: 3,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                                style={{
                                                    backgroundSize: "200% 200%"
                                                }}
                                            >{user?.username || user?.email}</motion.span>!
                                        </>
                                    ) : (
                                        <>
                                            Build Intelligent
                                            <motion.span
                                                className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent"
                                                animate={{
                                                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                                                }}
                                                transition={{
                                                    duration: 3,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                                style={{
                                                    backgroundSize: "200% 200%"
                                                }}
                                            > AI Agents</motion.span>
                                        </>
                                    )}
                                </motion.h1>

                                <motion.p
                                    className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 1.0 }}
                                >
                                    {isAuthenticated ? (
                                        "Ready to create your next AI project? Start building intelligent chatbots and automate your workflows."
                                    ) : (
                                        "Create, customize, and deploy AI chatbots with advanced conversational capabilities. Build the future of human-AI interaction."
                                    )}
                                </motion.p>
                            </motion.div>

                            <motion.div
                                className="flex flex-col sm:flex-row gap-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 1.2 }}
                            >
                                {isAuthenticated ? (
                                    <>
                                        <motion.a
                                            href="/projects"
                                            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg"
                                            whileHover={{
                                                scale: 1.05,
                                                y: -2,
                                                boxShadow: "0 20px 40px rgba(16, 185, 129, 0.3)"
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                        >
                                            Go to Projects
                                            <motion.svg
                                                className="ml-2 w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                whileHover={{ x: 2 }}
                                                transition={{ type: "spring", stiffness: 400 }}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </motion.svg>
                                        </motion.a>
                                        <motion.a
                                            href="/dashboard"
                                            className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl border border-gray-200 dark:border-gray-700"
                                            whileHover={{
                                                scale: 1.05,
                                                y: -2,
                                                backgroundColor: "rgba(16, 185, 129, 0.1)"
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                        >
                                            Dashboard
                                        </motion.a>
                                    </>
                                ) : (
                                    <>
                                        <motion.a
                                            href="/signup"
                                            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg"
                                            whileHover={{
                                                scale: 1.05,
                                                y: -2,
                                                boxShadow: "0 20px 40px rgba(16, 185, 129, 0.3)"
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                        >
                                            Start Building Free
                                            <motion.svg
                                                className="ml-2 w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                whileHover={{ x: 2 }}
                                                transition={{ type: "spring", stiffness: 400 }}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </motion.svg>
                                        </motion.a>
                                        <motion.a
                                            href="/login"
                                            className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl border border-gray-200 dark:border-gray-700"
                                            whileHover={{
                                                scale: 1.05,
                                                y: -2,
                                                backgroundColor: "rgba(16, 185, 129, 0.1)"
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                        >
                                            Sign In
                                        </motion.a>
                                    </>
                                )}
                            </motion.div>

                            {!isAuthenticated && (
                                <motion.div
                                    className="flex items-center gap-8 text-sm text-gray-500 dark:text-gray-400"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 1.4 }}
                                >
                                    {[
                                        "No Credit Card Required",
                                        "Free Forever Plan"
                                    ].map((text, index) => (
                                        <motion.div
                                            key={text}
                                            className="flex items-center gap-2"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.6, delay: 1.6 + (index * 0.1) }}
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <motion.svg
                                                className="w-5 h-5 text-emerald-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                whileHover={{ scale: 1.2, rotate: 5 }}
                                                transition={{ type: "spring", stiffness: 400 }}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </motion.svg>
                                            {text}
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </motion.div>

                        <motion.div
                            className="relative"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur-3xl opacity-20"
                                animate={{
                                    scale: [1, 1.05, 1],
                                    opacity: [0.2, 0.3, 0.2]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                            <motion.div
                                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700"
                                whileHover={{ scale: 1.02, y: -5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <motion.div
                                    className="space-y-6"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.8, delay: 0.8 }}
                                >
                                    <motion.div
                                        className="flex items-center gap-3"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 1.0 }}
                                    >
                                        <motion.div
                                            className="w-3 h-3 bg-red-500 rounded-full"
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                                        />
                                        <motion.div
                                            className="w-3 h-3 bg-yellow-500 rounded-full"
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                                        />
                                        <motion.div
                                            className="w-3 h-3 bg-green-500 rounded-full"
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                                        />
                                        <div className="ml-4 text-sm text-gray-500 dark:text-gray-400">AI Chat Interface</div>
                                    </motion.div>

                                    <motion.div
                                        className="space-y-4"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.8, delay: 1.2 }}
                                    >
                                        <motion.div
                                            className="flex gap-3"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.6, delay: 1.4 }}
                                        >
                                            <motion.div
                                                className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0"
                                                animate={{ rotate: [0, 5, 0] }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                            >
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                            </motion.div>
                                            <motion.div
                                                className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 max-w-[80%]"
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ duration: 0.5, delay: 1.6 }}
                                            >
                                                <p className="text-sm text-gray-700 dark:text-gray-300">Hello! I'm your AI assistant. How can I help you today?</p>
                                            </motion.div>
                                        </motion.div>

                                        <motion.div
                                            className="flex gap-3 justify-end"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.6, delay: 1.8 }}
                                        >
                                            <motion.div
                                                className="bg-emerald-600 text-white rounded-2xl px-4 py-3 max-w-[80%]"
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ duration: 0.5, delay: 2.0 }}
                                            >
                                                <p className="text-sm">Can you help me write a professional email?</p>
                                            </motion.div>
                                            <motion.div
                                                className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0"
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ duration: 2, repeat: Infinity, delay: 2.2 }}
                                            >
                                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </motion.div>
                                        </motion.div>

                                        <motion.div
                                            className="flex gap-3"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.6, delay: 2.4 }}
                                        >
                                            <motion.div
                                                className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0"
                                                animate={{ rotate: [0, 5, 0] }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2.6 }}
                                            >
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                            </motion.div>
                                            <motion.div
                                                className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 max-w-[80%]"
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ duration: 0.5, delay: 2.8 }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-1">
                                                        <motion.div
                                                            className="w-2 h-2 bg-gray-400 rounded-full"
                                                            animate={{ y: [0, -4, 0] }}
                                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                                        />
                                                        <motion.div
                                                            className="w-2 h-2 bg-gray-400 rounded-full"
                                                            animate={{ y: [0, -4, 0] }}
                                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                                                        />
                                                        <motion.div
                                                            className="w-2 h-2 bg-gray-400 rounded-full"
                                                            animate={{ y: [0, -4, 0] }}
                                                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">AI is typing...</span>
                                                </div>
                                            </motion.div>
                                        </motion.div>
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </div>
                </Container>
            </motion.section>

            {/* Features Section */}
            <Features />

            {/* Animated CTA Section */}
            {!isAuthenticated && (
                <motion.section
                    className="py-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <motion.div className="relative">
                        {/* Subtle animated background orbs */}
                        <motion.div
                            className="absolute -top-20 -left-10 w-56 h-56 bg-emerald-400/20 dark:bg-emerald-500/15 rounded-full blur-3xl"
                            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.45, 0.3] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                            className="absolute -bottom-24 -right-10 w-72 h-72 bg-blue-400/20 dark:bg-blue-500/15 rounded-full blur-3xl"
                            animate={{ scale: [1.05, 1, 1.05], opacity: [0.35, 0.25, 0.35] }}
                            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <Container>
                            <motion.div
                                className="relative text-center text-gray-900 dark:text-white bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-3xl px-6 py-12 sm:px-10 shadow-xl"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            >
                                {/* Badge matching hero */}
                                <motion.div
                                    className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium mb-3"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.3 }}
                                >
                                    <motion.div
                                        className="w-2 h-2 bg-emerald-500 rounded-full"
                                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                    AI-Powered Platform
                                </motion.div>

                                {/* Heading matching hero */}
                                <motion.h2
                                    className="text-4xl font-bold mb-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                >
                                    Build Intelligent
                                    <span className="bg-gradient-to-r from-green-900 to-emerald-800 bg-clip-text text-transparent"> AI Agents</span>
                                </motion.h2>

                                {/* Paragraph matching hero */}
                                <motion.p
                                    className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.6 }}
                                >
                                    Create, customize, and deploy AI chatbots with advanced conversational capabilities. Build the future of human-AI interaction.
                                </motion.p>
                                <motion.div
                                    className="flex flex-col sm:flex-row gap-4 justify-center"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.8 }}
                                >
                                    <motion.a
                                        href="/signup"
                                        className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg"
                                        whileHover={{
                                            scale: 1.05,
                                            y: -2,
                                            boxShadow: "0 20px 40px rgba(16, 185, 129, 0.35)"
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        Get Started Free
                                        <motion.svg
                                            className="ml-2 w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            whileHover={{ x: 2 }}
                                            transition={{ type: "spring", stiffness: 400 }}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </motion.svg>
                                    </motion.a>
                                    <motion.a
                                        href="/login"
                                        className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl border border-gray-200 dark:border-gray-700"
                                        whileHover={{
                                            scale: 1.05,
                                            y: -2,
                                            backgroundColor: "rgba(16, 185, 129, 0.1)"
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        Sign In
                                    </motion.a>
                                </motion.div>

                                {/* Trust indicators */}
                                <motion.div
                                    className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400"
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 1.0 }}
                                >
                                    {[
                                        'No Credit Card Required',
                                        'Free Forever Plan',
                                        'Cancel Anytime'
                                    ].map((text) => (
                                        <div key={text} className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>{text}</span>
                                        </div>
                                    ))}
                                </motion.div>
                            </motion.div>
                        </Container>
                    </motion.div>
                </motion.section>
            )}
        </motion.div>
    );
}

export default Home;

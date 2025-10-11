import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAuth } from "../context/AuthContext.jsx";
import Container from "../components/ui/Container.jsx";
import Features from "../components/Features.jsx";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

function Home() {
    const { isAuthenticated, user, loading } = useAuth();

    // Refs for GSAP animations
    const heroRef = useRef(null);
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const buttonsRef = useRef(null);
    const chatRef = useRef(null);
    const ctaRef = useRef(null);
    const loadingRef = useRef(null);

    // GSAP animations
    useEffect(() => {
        if (loading) {
            // Loading animation
            const tl = gsap.timeline();
            tl.fromTo(loadingRef.current,
                { opacity: 0, scale: 0.8 },
                { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }
            )
                .fromTo(loadingRef.current.querySelector('.spinner'),
                    { rotation: 0 },
                    { rotation: 360, duration: 1, repeat: -1, ease: "none" },
                    "-=0.3"
                )
                .fromTo(loadingRef.current.querySelector('.loading-text'),
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, duration: 0.6 },
                    "-=0.4"
                );
        } else {
            // Hero animations
            const tl = gsap.timeline();

            // Hero section entrance
            tl.fromTo(heroRef.current,
                { opacity: 0, y: 50 },
                { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
            )
                .fromTo(titleRef.current,
                    { opacity: 0, y: 30, scale: 0.95 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power2.out" },
                    "-=0.6"
                )
                .fromTo(subtitleRef.current,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
                    "-=0.4"
                )
                .fromTo(buttonsRef.current,
                    { opacity: 0, y: 20, scale: 0.95 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power2.out" },
                    "-=0.3"
                )
                .fromTo(chatRef.current,
                    { opacity: 0, x: 50, scale: 0.95 },
                    { opacity: 1, x: 0, scale: 1, duration: 0.8, ease: "power2.out" },
                    "-=0.8"
                );

            // Chat messages animation
            const chatMessages = chatRef.current?.querySelectorAll('.chat-message');
            if (chatMessages) {
                chatMessages.forEach((message, index) => {
                    gsap.fromTo(message,
                        { opacity: 0, y: 20, scale: 0.9 },
                        {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.5,
                            delay: 1.5 + (index * 0.3),
                            ease: "power2.out"
                        }
                    );
                });
            }

            // CTA section scroll trigger
            if (ctaRef.current) {
                gsap.fromTo(ctaRef.current,
                    { opacity: 0, y: 50 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: ctaRef.current,
                            start: "top 80%",
                            end: "bottom 20%",
                            toggleActions: "play none none reverse"
                        }
                    }
                );
            }

            // Floating background elements
            gsap.to(".floating-bg", {
                y: -20,
                duration: 3,
                repeat: -1,
                yoyo: true,
                ease: "power2.inOut"
            });

            // Gradient text animation
            gsap.to(".gradient-text", {
                backgroundPosition: "200% 50%",
                duration: 3,
                repeat: -1,
                ease: "none"
            });

            // GSAP hover effects for buttons
            const hoverElements = document.querySelectorAll('.gsap-hover');
            hoverElements.forEach(element => {
                element.addEventListener('mouseenter', () => {
                    gsap.to(element, {
                        scale: 1.05,
                        y: -2,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                });

                element.addEventListener('mouseleave', () => {
                    gsap.to(element, {
                        scale: 1,
                        y: 0,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                });
            });
        }

        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, [loading]);

    // Show loading state
    if (loading) {
        return (
            <div
                ref={loadingRef}
                className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"
            >
                <div className="text-center">
                    <div className="spinner w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="loading-text text-gray-600 dark:text-gray-300">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            {/* Animated Hero Section */}
            <section ref={heroRef} className="relative overflow-hidden">
                <div className="floating-bg absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-600/10"></div>
                <Container className="pt-20 pb-24 relative">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    {isAuthenticated ? 'Welcome Back!' : 'AI-Powered Platform'}
                                </div>

                                <h1 ref={titleRef} className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                                    {isAuthenticated ? (
                                        <>
                                            Welcome back, <span className="gradient-text bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent" style={{ backgroundSize: "200% 200%" }}>{user?.username || user?.email}</span>!
                                        </>
                                    ) : (
                                        <>
                                            Build Intelligent
                                            <span className="gradient-text bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent" style={{ backgroundSize: "200% 200%" }}> AI Agents</span>
                                        </>
                                    )}
                                </h1>

                                <p ref={subtitleRef} className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                                    {isAuthenticated ? (
                                        "Ready to create your next AI project? Start building intelligent chatbots and automate your workflows."
                                    ) : (
                                        "Create, customize, and deploy AI chatbots with advanced conversational capabilities. Build the future of human-AI interaction."
                                    )}
                                </p>
                            </div>

                            <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-4">
                                {isAuthenticated ? (
                                    <>
                                        <a
                                            href="/projects"
                                            className="gsap-hover inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/25"
                                        >
                                            Go to Projects
                                            <svg className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </a>
                                        <a
                                            href="/dashboard"
                                            className="gsap-hover inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                                        >
                                            Dashboard
                                        </a>
                                    </>
                                ) : (
                                    <>
                                        <a
                                            href="/signup"
                                            className="gsap-hover inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/25"
                                        >
                                            Start Building Free
                                            <svg className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </a>
                                        <a
                                            href="/login"
                                            className="gsap-hover inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                                        >
                                            Sign In
                                        </a>
                                    </>
                                )}
                            </div>

                            {!isAuthenticated && (
                                <div className="flex items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
                                    {[
                                        "No Credit Card Required",
                                        "Free Forever Plan"
                                    ].map((text, index) => (
                                        <div key={text} className="flex items-center gap-2 transition-transform duration-300 hover:scale-105">
                                            <svg className="w-5 h-5 text-emerald-500 transition-transform duration-300 hover:scale-125 hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            {text}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div ref={chatRef} className="relative">
                            <div className="floating-bg absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl blur-3xl opacity-20"></div>
                            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-102 hover:-translate-y-1">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                        <div className="ml-4 text-sm text-gray-500 dark:text-gray-400">AI Chat Interface</div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex gap-3 chat-message">
                                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                            </div>
                                            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 max-w-[80%]">
                                                <p className="text-sm text-gray-700 dark:text-gray-300">Hello! I'm your AI assistant. How can I help you today?</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 justify-end chat-message">
                                            <div className="bg-emerald-600 text-white rounded-2xl px-4 py-3 max-w-[80%]">
                                                <p className="text-sm">Can you help me write a professional email?</p>
                                            </div>
                                            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 chat-message">
                                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                            </div>
                                            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 max-w-[80%]">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-1">
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                    </div>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">AI is typing...</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Container>
            </section>

            {/* Features Section */}
            <Features />

            {/* Animated CTA Section */}
            {!isAuthenticated && (
                <section ref={ctaRef} className="py-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                    <div className="relative">
                        {/* Subtle animated background orbs */}
                        <div className="floating-bg absolute -top-20 -left-10 w-56 h-56 bg-emerald-400/20 dark:bg-emerald-500/15 rounded-full blur-3xl"></div>
                        <div className="floating-bg absolute -bottom-24 -right-10 w-72 h-72 bg-blue-400/20 dark:bg-blue-500/15 rounded-full blur-3xl"></div>
                        <Container>
                            <div className="relative text-center text-gray-900 dark:text-white bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-3xl px-6 py-12 sm:px-10 shadow-xl">
                                {/* Badge matching hero */}
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium mb-3">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    AI-Powered Platform
                                </div>

                                {/* Heading matching hero */}
                                <h2 className="text-4xl font-bold mb-4">
                                    Build Intelligent
                                    <span className="gradient-text bg-gradient-to-r from-green-900 to-emerald-800 bg-clip-text text-transparent" style={{ backgroundSize: "200% 200%" }}> AI Agents</span>
                                </h2>

                                {/* Paragraph matching hero */}
                                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                                    Create, customize, and deploy AI chatbots with advanced conversational capabilities. Build the future of human-AI interaction.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <a
                                        href="/signup"
                                        className="gsap-hover inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/25"
                                    >
                                        Get Started Free
                                        <svg className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </a>
                                    <a
                                        href="/login"
                                        className="gsap-hover inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                                    >
                                        Sign In
                                    </a>
                                </div>

                                {/* Trust indicators */}
                                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                                    {[
                                        'No Credit Card Required',
                                        'Free Forever Plan',
                                        'Cancel Anytime'
                                    ].map((text) => (
                                        <div key={text} className="flex items-center gap-2 transition-transform duration-300 hover:scale-105">
                                            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 hover:scale-125 hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>{text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Container>
                    </div>
                </section>
            )}
        </div>
    );
}

export default Home;

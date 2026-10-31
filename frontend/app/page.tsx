"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  GraduationCap,
  Brain,
  BookOpen,
  Github,
  Twitter,
  Play,
  Pause,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  MessageCircle,
  BarChart3,
  Code2,
  Users,
  Calendar,
  Eye,
  Check,
  ChevronDown,
  Zap,
  Shield,
  Globe
} from "lucide-react";

// Import new components
import HeroSection from "@/components/HeroSection";
import FeaturesGrid from "@/components/FeaturesGrid";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!bgRef.current) return;
      requestAnimationFrame(() => {
        if (!bgRef.current) return;
        bgRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
        bgRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  if (!mounted) return null;

  const navItems: { label: string; href: string; external?: boolean }[] = [
    { label: "Features", href: "#features" },
    { label: "Demo", href: "#demo" },
    { label: "Docs", href: "#docs" },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white overflow-hidden">
      {/* Interactive mouse-following background effect */}
      <div 
        ref={bgRef}
        className="pointer-events-none fixed inset-0 z-[1] transition-opacity duration-300"
        style={{
          background: "radial-gradient(circle at var(--mouse-x, 50vw) var(--mouse-y, 50vh), rgba(34,197,94,0.08), transparent 60%)",
        }}
      />

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-[#0D0D0D] border-b border-[rgba(255,255,255,0.06)]' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 sm:h-20 flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => router.push('/')}
            >
              <span className="font-bold text-xl text-white hidden sm:block">
                GuruCortex
              </span>
            </motion.div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  className="text-sm text-[#A1A1AA] hover:text-white transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* CTA + Mobile Menu */}
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 text-sm font-semibold hidden sm:flex items-center gap-2 bg-[#22C55E] text-black rounded-xl hover:bg-[#16A34A] transition-all duration-200"
                >
                  Launch App
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-300 hover:text-white"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#111111] border-t border-[rgba(255,255,255,0.06)]"
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="block px-4 py-3 text-[#A1A1AA] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <Link href="/dashboard" className="block">
                  <button className="w-full px-4 py-3 text-sm font-semibold mt-2 bg-[#22C55E] text-black rounded-xl">
                    Launch App
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <HeroSection />

      {/* Features Grid */}
      <div id="features">
        <FeaturesGrid />
      </div>

      {/* Video Demo Section */}
      <section id="demo" className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[#0D0D0D]" />
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-6">
              <div className="px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.06)] rounded-full">
                <span className="text-xs font-semibold text-[#A1A1AA] tracking-widest">LIVE DEMO</span>
              </div>
            </div>
            <h2 className="text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-white">
              See it in action
            </h2>
            <p className="text-lg text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed">
              Watch how GuruCortex transforms your study materials into an interactive learning experience.
            </p>
          </motion.div>

          {/* Video Player */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.06)] bg-[#1A1A1A]"
          >
            <div className="aspect-video bg-[#1A1A1A] relative">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onEnded={() => setIsVideoPlaying(false)}
              >
                <source src="/0405.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Play/Pause Overlay */}
              {!isVideoPlaying && (
                <div 
                  className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                  onClick={handleVideoPlay}
                >
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative z-10 w-20 h-20 rounded-full bg-[#22C55E] flex items-center justify-center"
                  >
                    <Play className="w-8 h-8 text-black ml-1" />
                  </motion.div>
                </div>
              )}
              
              {/* Pause button when playing */}
              {isVideoPlaying && (
                <button
                  onClick={handleVideoPlay}
                  className="absolute bottom-4 right-4 p-3 bg-black/40 backdrop-blur rounded-lg border border-white/10 hover:bg-black/60 transition-colors"
                >
                  <Pause className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats/Social Proof */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[#0D0D0D]" />
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "100%", label: "Local & Private", icon: Shield },
              { value: "7+", label: "AI Models Supported", icon: Brain },
              { value: "Real-time", label: "Focus Tracking", icon: Eye },
              { value: "Open", label: "Source Forever", icon: Github },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-8 rounded-xl bg-[#111111] border border-[rgba(255,255,255,0.06)]"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 mb-6">
                  <stat.icon className="w-6 h-6 text-[#22C55E]" />
                </div>
                <div className="font-extrabold text-3xl text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-[#A1A1AA]">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[#0D0D0D]" />
        
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 text-white">
              Ready to transform<br />your learning?
            </h2>
            <p className="text-lg text-[#A1A1AA] mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of students who are already studying smarter with GuruCortex.
              Get started in under 2 minutes—completely free.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 bg-[#22C55E] text-black rounded-xl font-semibold text-base flex items-center justify-center gap-2 hover:bg-[#16A34A] transition-all duration-200"
                >
                  <Zap className="w-5 h-5" />
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <motion.button
                  whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.12)' }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 text-white rounded-xl font-semibold text-base border border-[rgba(255,255,255,0.06)] flex items-center justify-center gap-2 hover:bg-white/5 transition-all duration-200"
                >
                  <Github className="w-5 h-5" />
                  Star on GitHub
                </motion.button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-[rgba(255,255,255,0.06)] pt-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[#0D0D0D]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#22C55E]/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg text-white">
                  GuruCortex
                </span>
              </div>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                Your personal AI learning companion powered by advanced cognitive science.
              </p>
              <div className="flex items-center gap-2 pt-4">
                <span className="text-xs text-[#71717A]">Follow us</span>
                <div className="flex gap-2">
                  <motion.a
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-[#71717A] hover:text-[#22C55E] bg-white/5 rounded-lg transition-all"
                  >
                    <Github className="w-4 h-4" />
                  </motion.a>
                  <motion.a
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-[#71717A] hover:text-[#22C55E] bg-white/5 rounded-lg transition-all"
                  >
                    <Twitter className="w-4 h-4" />
                  </motion.a>
                </div>
              </div>
            </motion.div>

            {/* Product Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h3 className="text-sm font-semibold text-white">Product</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <motion.a
                    whileHover={{ x: 4 }}
                    href="#features"
                    className="text-[#A1A1AA] hover:text-white hover:text-[#22C55E] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Features
                  </motion.a>
                </li>
                <li>
                  <motion.a
                    whileHover={{ x: 4 }}
                    href="#demo"
                    className="text-[#A1A1AA] hover:text-white hover:text-[#22C55E] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Demo
                  </motion.a>
                </li>
                <li>
                  <motion.a
                    whileHover={{ x: 4 }}
                    href="/dashboard"
                    className="text-[#A1A1AA] hover:text-white hover:text-[#22C55E] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Dashboard
                  </motion.a>
                </li>
                <li>
                  <motion.a
                    whileHover={{ x: 4 }}
                    href="#"
                    className="text-[#A1A1AA] hover:text-white hover:text-[#22C55E] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Pricing
                  </motion.a>
                </li>
              </ul>
            </motion.div>

            {/* Resources */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h3 className="text-sm font-semibold text-white">Resources</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <motion.a
                    whileHover={{ x: 4 }}
                    href="#"
                    className="text-[#A1A1AA] hover:text-white hover:text-[#22C55E] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Documentation
                  </motion.a>
                </li>
                <li>
                  <motion.a
                    whileHover={{ x: 4 }}
                    href="#"
                    className="text-[#A1A1AA] hover:text-white hover:text-[#22C55E] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Blog
                  </motion.a>
                </li>
                <li>
                  <motion.a
                    whileHover={{ x: 4 }}
                    href="#"
                    className="text-[#A1A1AA] hover:text-white hover:text-[#22C55E] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Community
                  </motion.a>
                </li>
                <li>
                  <motion.a
                    whileHover={{ x: 4 }}
                    href="#"
                    className="text-[#A1A1AA] hover:text-white hover:text-[#22C55E] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Support
                  </motion.a>
                </li>
              </ul>
            </motion.div>

            {/* Legal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h3 className="text-sm font-semibold text-white">Legal</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <motion.a
                    whileHover={{ x: 4 }}
                    href="#"
                    className="text-[#A1A1AA] hover:text-white hover:text-[#22C55E] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Privacy Policy
                  </motion.a>
                </li>
                <li>
                  <motion.a
                    whileHover={{ x: 4 }}
                    href="#"
                    className="text-[#A1A1AA] hover:text-white hover:text-[#22C55E] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Terms of Service
                  </motion.a>
                </li>
                <li>
                  <motion.a
                    whileHover={{ x: 4 }}
                    href="#"
                    className="text-[#A1A1AA] hover:text-white hover:text-[#22C55E] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Cookie Policy
                  </motion.a>
                </li>
                <li>
                  <motion.a
                    whileHover={{ x: 4 }}
                    href="#"
                    className="text-[#A1A1AA] hover:text-white hover:text-[#22C55E] transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    License
                  </motion.a>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="border-t border-[rgba(255,255,255,0.06)] mb-12" />

          {/* Bottom Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-center gap-8 pb-12"
          >
            <div className="text-center md:text-left">
              <p className="text-sm text-[#A1A1AA]">
                © 2025 GuruCortex Team. All rights reserved.
              </p>
              <p className="text-xs text-[#71717A] mt-2">
                Built with <span className="text-[#22C55E]">❤️</span> for learners everywhere.
              </p>
            </div>


          </motion.div>
        </div>
      </footer>
    </div>
  );
}

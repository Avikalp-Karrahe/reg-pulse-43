import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Play, 
  Shield, 
  Zap, 
  BarChart3, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Globe,
  Star,
  CheckCircle,
  Activity,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeroDashboard } from "./HeroDashboard";

/* --- Motion variants defined outside to avoid re-allocations --- */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
} as const;

const stats = [
  { label: "Enterprise Clients", value: "500+", icon: Users },
  { label: "Compliance Rate", value: "99.7%", icon: CheckCircle },
  { label: "Risk Reduction", value: "85%", icon: TrendingUp },
  { label: "Global Coverage", value: "24/7", icon: Globe },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Compliance Director",
    company: "Goldman Sachs",
    content: "RegCompliance has transformed our risk management. We catch violations in real-time.",
    rating: 5
  },
  {
    name: "Michael Rodriguez",
    role: "Risk Manager", 
    company: "JPMorgan Chase",
    content: "The AI-powered analysis is incredibly accurate. It's like having a compliance expert on every call.",
    rating: 5
  },
  {
    name: "Emma Thompson",
    role: "Head of Operations",
    company: "Morgan Stanley",
    content: "Implementation was seamless. ROI was evident within the first month.",
    rating: 5
  }
];

export const LandingPage = () => {
  const prefersReducedMotion = useReducedMotion();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showDashboard, setShowDashboard] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true, margin: "-100px" });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastTsRef.current < 40) return;
      lastTsRef.current = now;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() =>
        setMousePosition({ x: e.clientX, y: e.clientY })
      );
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        leftPct: Math.random() * 100,
        topPct: Math.random() * 100,
        dur: 8 + Math.random() * 12,
        delay: Math.random() * 5,
        key: i,
      })),
    []
  );

  if (showDashboard) {
    return <HeroDashboard />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Skip link for a11y */}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-4 focus:left-4 focus:px-3 focus:py-2 focus:rounded-md focus:bg-background focus:text-foreground">
        Skip to content
      </a>

      {/* Animated mesh background (decorative) */}
      <div className="mesh-background" aria-hidden="true" />

      {/* Interactive gradient spotlight */}
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background: `
              radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, 
                hsla(var(--emerald-500), 0.08) 0%, 
                hsla(var(--cyan-500), 0.04) 25%, 
                transparent 50%
              )
            `,
          }}
        />
      )}

      {/* Floating particles */}
      {!prefersReducedMotion && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
          {particles.map((particle) => (
            <motion.div
              key={particle.key}
              className="absolute w-1 h-1 bg-emerald-400/30 rounded-full"
              style={{
                left: `${particle.leftPct}%`,
                top: `${particle.topPct}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: particle.dur,
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <motion.header
          className="flex items-center justify-between p-6 lg:p-8 backdrop-blur-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          role="banner"
          aria-label="RegCompliance header"
        >
          <div className="flex items-center space-x-4">
            <motion.div
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-indigo-500 flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-hidden="true"
            >
              <Shield className="w-7 h-7 text-white" aria-hidden="true" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                RegCompliance
              </h1>
              <p className="text-sm text-muted-foreground font-medium">AI Risk Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowDashboard(true)}
            >
              <Activity className="w-4 h-4 mr-2" />
              Live Demo
            </Button>
            <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0 px-4 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </div>
        </motion.header>

        {/* Hero Section */}
        <motion.main
          ref={heroRef}
          id="main"
          className="container mx-auto px-6 lg:px-8 pt-20 lg:pt-32"
          variants={containerVariants}
          initial="hidden"
          animate={isHeroInView ? "visible" : "hidden"}
          role="main"
          aria-label="Landing content"
        >
          <div className="text-center max-w-6xl mx-auto mb-20">
            <motion.div variants={itemVariants} className="mb-8">
              <Badge
                variant="outline"
                className="mb-6 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-6 py-2 text-sm font-medium"
                aria-label="Powered by advanced AI technology"
              >
                <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                Powered by Advanced AI • Real-time Analysis
              </Badge>
            </motion.div>

            <motion.h2
              className="text-6xl lg:text-8xl font-bold mb-8 leading-none"
              variants={itemVariants}
            >
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                Live Risk
              </span>
              <br />
              <span className="text-slate-100">Intelligence</span>
            </motion.h2>

            <motion.p
              className="text-2xl text-muted-foreground mb-12 leading-relaxed max-w-4xl mx-auto"
              variants={itemVariants}
            >
              Transform your compliance monitoring with AI that <span className="text-emerald-400 font-semibold">detects violations in real-time</span>,
              provides instant evidence, and ensures regulatory compliance across all sales communications.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
              variants={itemVariants}
            >
              <Button
                size="lg"
                className="button-premium h-16 px-12 text-lg font-semibold"
                onClick={() => setShowDashboard(true)}
                aria-label="Experience live demo"
              >
                <Play className="w-6 h-6 mr-3" aria-hidden="true" />
                Experience Live Demo
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-16 px-12 text-lg border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                aria-label="View detailed analytics"
              >
                <Link to="/analytics">
                  <BarChart3 className="w-6 h-6 mr-3" aria-hidden="true" />
                  View Analytics
                </Link>
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center">
                    <Icon className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Hero Visual Dashboard Preview */}
          <motion.div className="relative max-w-7xl mx-auto" variants={itemVariants}>
            <Card className="card-premium p-12 mb-16 overflow-hidden">
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-12">
                {/* Enhanced Risk Visualization */}
                <div className="xl:col-span-2">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-semibold text-emerald-400 mb-2">Live Risk Monitor</h3>
                    <p className="text-muted-foreground">Real-time compliance scoring</p>
                  </div>
                  
                  <div
                    className="relative w-64 h-64 mx-auto"
                    role="img"
                    aria-label="Risk dial showing score 67 out of 100"
                  >
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                      {/* Background ring */}
                      <circle cx="50" cy="50" r="40" stroke="hsl(var(--border))" strokeWidth="6" fill="none" opacity="0.3" />
                      
                      {/* Animated progress ring */}
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="url(#riskGradient)"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray="251.2"
                        initial={{ strokeDashoffset: 251.2 }}
                        animate={{ strokeDashoffset: 82.9 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 2.5, delay: prefersReducedMotion ? 0 : 1, ease: "easeOut" }}
                        className="drop-shadow-lg"
                      />
                      
                      {/* Gradient definition */}
                      <defs>
                        <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="hsl(var(--emerald-500))" />
                          <stop offset="50%" stopColor="hsl(var(--amber-500))" />
                          <stop offset="100%" stopColor="hsl(var(--orange-500))" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Animated background effects */}
                      {!prefersReducedMotion && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `conic-gradient(from 0deg,
                              hsla(var(--emerald-500), 0.2),
                              hsla(var(--amber-500), 0.15),
                              hsla(var(--orange-500), 0.1),
                              hsla(var(--emerald-500), 0.2))`,
                            filter: "blur(20px)",
                          }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          aria-hidden="true"
                        />
                      )}

                      {/* Central display */}
                      <div className="text-center z-10">
                        <motion.div
                          className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: prefersReducedMotion ? 0.2 : 0.8, delay: prefersReducedMotion ? 0 : 2 }}
                        >
                          67
                        </motion.div>
                        <div className="text-lg text-muted-foreground font-medium">Risk Score</div>
                        <Badge className="mt-2 bg-orange-500/10 text-orange-400 border-orange-500/30">
                          Medium Risk
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Analysis Dashboard */}
                <div className="xl:col-span-3 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold text-emerald-400">Live Analysis Stream</h3>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1">
                      <Activity className="w-3 h-3 mr-1" />
                      Processing
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Transcript */}
                    <div className="space-y-4">
                      <motion.div
                        className="p-6 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: prefersReducedMotion ? 0 : 2.5 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-muted-foreground">Financial Advisor</span>
                          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Live • 2:22</span>
                        </div>
                        <div className="text-lg leading-relaxed">
                          You'll make <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded font-medium border border-red-500/30">20% monthly, guaranteed</span>. 
                          I've never had a client lose money with this strategy.
                        </div>
                      </motion.div>

                      {/* Compliance Alert */}
                      <motion.div
                        className="p-6 rounded-xl bg-red-500/5 border border-red-500/20 backdrop-blur-sm"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: prefersReducedMotion ? 0 : 3 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                            <span className="font-semibold text-red-400">Performance Guarantee Violation</span>
                          </div>
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            CRITICAL
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">SEC Rule 10b-5 • Investment Advisers Act</div>
                        <div className="text-sm">
                          Statements guaranteeing specific returns are prohibited and constitute material misrepresentation.
                        </div>
                      </motion.div>
                    </div>

                    {/* Real-time Metrics */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                          <div className="text-2xl font-bold text-emerald-400">94%</div>
                          <div className="text-xs text-muted-foreground">Accuracy</div>
                        </div>
                        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                          <div className="text-2xl font-bold text-amber-400">3</div>
                          <div className="text-xs text-muted-foreground">Violations</div>
                        </div>
                      </div>
                      
                      <div className="p-6 rounded-xl bg-card/30 border border-border/30">
                        <h4 className="font-semibold mb-3">Rule Categories</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Performance Claims</span>
                            <span className="text-red-400 font-medium">2 violations</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Disclosure Requirements</span>
                            <span className="text-amber-400 font-medium">1 warning</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Suitability Standards</span>
                            <span className="text-emerald-400 font-medium">Compliant</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Enhanced Feature Showcase */}
          <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20" variants={itemVariants}>
            <Card className="card-glass p-8 h-full group hover:scale-105 transition-all duration-500" role="region" aria-label="Real-time Detection feature">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-emerald-400" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-emerald-400">Lightning Detection</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                Advanced AI analyzes speech patterns in real-time, detecting compliance violations the moment they occur with 99.7% accuracy.
              </p>
              <div className="flex items-center text-sm text-emerald-400 font-medium">
                <CheckCircle className="w-4 h-4 mr-2" />
                Sub-second response time
              </div>
            </Card>

            <Card className="card-glass p-8 h-full group hover:scale-105 transition-all duration-500" role="region" aria-label="Evidence Capture feature">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-cyan-400" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-cyan-400">Smart Evidence</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                Automatically captures and highlights violations with precise timestamps, regulatory citations, and contextual analysis for bulletproof audit trails.
              </p>
              <div className="flex items-center text-sm text-cyan-400 font-medium">
                <CheckCircle className="w-4 h-4 mr-2" />
                Regulatory compliance ready
              </div>
            </Card>

            <Card className="card-glass p-8 h-full group hover:scale-105 transition-all duration-500" role="region" aria-label="Analytics Dashboard feature">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8 text-indigo-400" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-indigo-400">Predictive Analytics</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                Advanced reporting with risk trends, pattern analysis, and predictive insights to prevent violations before they occur.
              </p>
              <div className="flex items-center text-sm text-indigo-400 font-medium">
                <CheckCircle className="w-4 h-4 mr-2" />
                Predictive risk modeling
              </div>
            </Card>
          </motion.div>

          {/* Final CTA */}
          <motion.div className="text-center py-20" variants={itemVariants}>
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Compliance?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Experience AI-powered risk detection with our live demo.
            </p>
            <Button 
              size="lg" 
              className="button-premium h-16 px-12 text-lg" 
              onClick={() => setShowDashboard(true)}
            >
              <Play className="w-5 h-5 mr-2" />
              Start Live Demo
            </Button>
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
};

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
  AlertTriangle,
  History,
  Settings
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
  { label: "Neural Networks", value: "12M+", icon: Shield, detail: "Parameters trained" },
  { label: "Accuracy Rate", value: "99.94%", icon: CheckCircle, detail: "Validated on 10M+ samples" },
  { label: "Latency Reduction", value: "94%", icon: TrendingUp, detail: "vs. Traditional systems" },
  { label: "Model Inference", value: "<15ms", icon: Globe, detail: "Edge deployment" },
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
  const [isHoveringLaunchButton, setIsHoveringLaunchButton] = useState(false);
  const [isHoveringBottomCTA, setIsHoveringBottomCTA] = useState(false);
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
      Array.from({ length: 125 }).map((_, i) => ({
        leftPct: Math.random() * 100,
        topPct: Math.random() * 100,
        dur: 4 + Math.random() * 8, // Faster (reduced from 6-21)
        delay: Math.random() * 8,
        key: i,
        size: 1.5 + Math.random() * 3, // Bigger (increased from 0.5-2.5)
        opacity: 0.1 + Math.random() * 0.3,
      })),
    []
  );

  if (showDashboard) {
    return <HeroDashboard />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Skip link for a11y */}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-4 focus:left-4 focus:px-3 focus:py-2 focus:rounded-md focus:bg-background focus:text-foreground">
        Skip to content
      </a>

      {/* Animated mesh background (decorative) */}
      <div className="mesh-background opacity-40" aria-hidden="true" />

      {/* Interactive gradient spotlight */}
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background: `
              radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, 
                hsla(var(--emerald-500), 0.12) 0%, 
                hsla(var(--cyan-500), 0.08) 25%, 
                hsla(var(--primary), 0.04) 50%,
                transparent 70%
              )
            `,
          }}
        />
      )}

      {/* Subtle ambient lighting */}
      <div 
        className="fixed inset-0 bg-gradient-to-t from-emerald-500/3 via-transparent to-cyan-500/3 pointer-events-none z-0" 
        aria-hidden="true" 
      />

      {/* Smooth floating particles with color-changing cursor interaction */}
      {!prefersReducedMotion && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
          {particles.map((particle) => {
            // Calculate distance from cursor to particle for color change
            const particleX = (particle.leftPct / 100) * (typeof window !== 'undefined' ? window.innerWidth : 1000);
            const particleY = (particle.topPct / 100) * (typeof window !== 'undefined' ? window.innerHeight : 1000);
            const distanceX = mousePosition.x - particleX;
            const distanceY = mousePosition.y - particleY;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            
            // Color priority: Green when hovering launch button, super bright red when near cursor, bright white by default
            const isNearCursor = distance < 100;
            const particleColor = (isHoveringLaunchButton || isHoveringBottomCTA) ? 'bg-emerald-400' : 
                                 isNearCursor ? 'bg-red-600' : 'bg-red-500';

            return (
              <motion.div
                key={particle.key}
                data-particle
                className={`absolute rounded-full transition-all duration-500 ease-out ${particleColor}`}
                style={{
                  left: `${particle.leftPct}%`,
                  top: `${particle.topPct}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  opacity: particle.opacity,
                  boxShadow: (isHoveringLaunchButton || isHoveringBottomCTA) ? '0 0 80px hsla(var(--emerald-500), 1), 0 0 150px hsla(var(--emerald-400), 0.9), 0 0 250px hsla(var(--emerald-300), 0.7)' : 
                            isNearCursor ? '0 0 16px hsla(var(--red-600), 1), 0 0 32px hsla(var(--red-500), 0.7)' : 
                            '0 0 8px hsla(var(--red-500), 0.8), 0 0 16px hsla(var(--red-400), 0.6)',
                }}
                animate={(isHoveringLaunchButton || isHoveringBottomCTA) ? {
                  y: [0, -80, 0],
                  x: [0, Math.sin(particle.key) * 60, 0],
                  opacity: [particle.opacity, particle.opacity * 3, particle.opacity],
                  scale: [1, 1.5, 1],
                  transition: {
                    duration: particle.dur * 0.25, // 4x faster
                    repeat: Infinity,
                    delay: particle.delay,
                    ease: "easeInOut"
                  }
                } : {
                  y: [0, -80, 0],
                  x: [0, Math.sin(particle.key) * 60, 0],
                  opacity: [particle.opacity, particle.opacity * 2, particle.opacity],
                  scale: [0.8, 1.2, 0.8],
                  transition: {
                    duration: particle.dur, // Normal speed
                    repeat: Infinity,
                    delay: particle.delay,
                    ease: "easeInOut"
                  }
                }}
              />
            );
          })}
        </div>
      )}

      {/* Elegant green orbs */}
      {!prefersReducedMotion && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`orb-${i}`}
              className="absolute w-32 h-32 rounded-full"
              style={{
                left: `${10 + i * 12}%`,
                top: `${20 + (i % 3) * 25}%`,
                background: `radial-gradient(circle, hsla(var(--emerald-500), ${0.1 + i * 0.05}) 0%, transparent 70%)`,
                filter: "blur(40px)",
              }}
              animate={{
                y: [0, -80, 0],
                x: [0, Math.cos(i) * 60, 0],
                scale: [0.8, 1.2, 0.8],
                rotate: [0, 360],
              }}
              transition={{
                duration: 12 + i * 2,
                repeat: Infinity,
                delay: i * 1.5,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10">

        {/* Hero Section */}
        <motion.main
          ref={heroRef}
          id="main"
          className="container mx-auto px-6 lg:px-8 pt-16 lg:pt-24"
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
                className="mb-6 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 text-emerald-400 border border-emerald-500/30 px-6 py-2 text-sm font-medium backdrop-blur-sm"
                aria-label="Research-grade AI technology stack"
              >
                <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                Research-Grade AI • ToolHouse × Vapi × OpenAI GPT-4o
              </Badge>
            </motion.div>

            <motion.h2
              className="text-5xl lg:text-7xl xl:text-8xl font-bold mb-8 leading-[0.9] tracking-tight"
              variants={itemVariants}
            >
              <span className="text-foreground drop-shadow-sm">
                Deploy Research-Grade{" "}
              </span>
              <span className="text-emerald-400 drop-shadow-sm">Intelligence</span>
            </motion.h2>

            <motion.p
              className="text-lg lg:text-xl xl:text-2xl text-muted-foreground mb-6 leading-relaxed max-w-4xl mx-auto font-medium"
              variants={itemVariants}
            >
              Advanced multi-modal AI system leveraging <span className="text-emerald-400 font-semibold">transformer architectures</span> and 
              <span className="text-cyan-400 font-semibold"> real-time speech processing</span> to achieve 
              <span className="text-indigo-400 font-semibold">99.7% accuracy</span> in regulatory compliance detection.
            </motion.p>

            <motion.div 
              className="flex flex-wrap justify-center gap-4 mb-8 text-sm text-muted-foreground font-mono"
              variants={itemVariants}
            >
              <span className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Sub-millisecond latency
              </span>
              <span className="bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                Multi-head attention
              </span>
              <span className="bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Federated learning
              </span>
              <span className="bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                Edge deployment
              </span>
            </motion.div>

            {/* Elegant Scroll Indicator */}
            <motion.div 
              className="flex flex-col items-center mb-6"
              variants={itemVariants}
            >
              <div className="text-xs text-muted-foreground/60 font-mono mb-2 tracking-wider">
                EXPLORE ADVANCED FEATURES
              </div>
              <motion.div
                className="flex flex-col items-center cursor-pointer group"
                animate={{
                  y: [0, 6, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                onClick={() => {
                  window.scrollTo({
                    top: window.innerHeight,
                    behavior: 'smooth'
                  });
                }}
              >
                <div className="w-5 h-8 border-2 border-emerald-500/30 rounded-full flex justify-center p-1 group-hover:border-emerald-400/50 transition-colors">
                  <motion.div
                    className="w-1 h-2 bg-emerald-400 rounded-full"
                    animate={{
                      y: [0, 8, 0],
                      opacity: [1, 0.3, 1]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </div>
                <motion.div
                  className="mt-1 text-emerald-400/70 group-hover:text-emerald-400 transition-colors"
                  animate={{
                    y: [0, 2, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="7 13 12 18 17 13"></polyline>
                    <polyline points="7 6 12 11 17 6"></polyline>
                  </svg>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Quick Navigation Cards */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12"
            >
              <Button asChild variant="ghost" className="h-auto p-4 flex-col text-center hover:bg-emerald-500/10 border border-border/50 hover:border-emerald-500/30 transition-colors">
                <Link to="/history">
                  <History className="w-6 h-6 mb-2 text-emerald-400" />
                  <span className="text-sm text-foreground">Call History</span>
                </Link>
              </Button>
              
              <Button asChild variant="ghost" className="h-auto p-4 flex-col text-center hover:bg-emerald-500/10 border border-border/50 hover:border-emerald-500/30 transition-colors">
                <Link to="/settings">
                  <Settings className="w-6 h-6 mb-2 text-emerald-400" />
                  <span className="text-sm text-foreground">Settings</span>
                </Link>
              </Button>
              
              <Button 
                variant="ghost" 
                className="h-auto p-4 flex-col text-center hover:bg-emerald-500/10 md:col-span-1 col-span-2 border border-border/50 hover:border-emerald-500/30 transition-colors"
                onClick={() => setShowDashboard(true)}
              >
                <Activity className="w-6 h-6 mb-2 text-emerald-400" />
                <span className="text-sm text-foreground">Preview</span>
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center group p-6 rounded-2xl backdrop-blur-sm bg-card/30 hover:bg-card/50 border border-border/20 hover:border-emerald-500/30 transition-all duration-300">
                    <Icon className="w-10 h-10 text-emerald-400 mx-auto mb-4 group-hover:scale-110 group-hover:text-emerald-300 transition-all duration-300" />
                    <div className="text-2xl lg:text-3xl font-bold text-foreground mb-2 group-hover:text-emerald-400 transition-colors font-mono">{stat.value}</div>
                    <div className="text-sm text-muted-foreground font-medium mb-1">{stat.label}</div>
                    <div className="text-xs text-muted-foreground/70 font-mono">{stat.detail}</div>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Hero Visual Dashboard Preview */}
          <motion.div className="relative max-w-7xl mx-auto mt-16" variants={itemVariants}>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 rounded-3xl blur-3xl" aria-hidden="true" />
            <Card className="card-premium p-8 lg:p-12 mb-16 overflow-hidden relative backdrop-blur-xl border border-border/50">
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 lg:gap-12">
                {/* Enhanced Risk Visualization */}
                <div className="xl:col-span-2">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-semibold text-emerald-400 mb-2">Neural Risk Assessment</h3>
                    <p className="text-white font-medium">Real-time compliance inference engine</p>
                    <div className="text-sm text-white/90 font-mono mt-1">Transformer architecture • Multi-head attention</div>
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
                            <span className="text-sm text-muted-foreground font-mono">Financial Advisor • Session ID: FA-2024-0157</span>
                            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded font-mono">Live • 2:22:14.847ms</span>
                          </div>
                          <div className="text-lg leading-relaxed font-mono text-sm">
                            "Our proprietary algorithm generates <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded font-medium border border-red-500/30">guaranteed 20% monthly returns</span> with zero downside risk through advanced quantitative modeling."
                          I've never had a client lose money with this strategy.
                        </div>
                      </motion.div>

                        {/* Enhanced Compliance Alert */}
                        <motion.div
                          className="p-6 rounded-xl bg-red-500/5 border border-red-500/20 backdrop-blur-sm"
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: prefersReducedMotion ? 0 : 3 }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                              <span className="font-semibold text-red-400">SEC Rule 10b-5 Violation Detected</span>
                            </div>
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-mono text-xs">
                              CRITICAL • P(v)=0.97
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2 font-mono">
                            Regulatory Framework: SEC Rule 10b-5 § 240.10b-5 • Investment Advisers Act § 206(4)
                          </div>
                          <div className="text-sm mb-3">
                            Neural classifier detected material misrepresentation with 97% confidence. 
                            Performance guarantee statements violate federal securities regulations.
                          </div>
                          <div className="text-xs text-muted-foreground/70 font-mono">
                            Model: RoBERTa-SEC-v2.1 • Inference time: 14.2ms • Context window: 2048 tokens
                          </div>
                        </motion.div>
                    </div>

                    {/* Advanced Real-time Metrics */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                          <div className="text-2xl font-bold text-emerald-400 font-mono">99.94%</div>
                          <div className="text-xs text-muted-foreground">Model Accuracy</div>
                          <div className="text-xs text-muted-foreground/70 font-mono">F1: 0.9987</div>
                        </div>
                        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                          <div className="text-2xl font-bold text-amber-400 font-mono">3</div>
                          <div className="text-xs text-muted-foreground">Violations</div>
                          <div className="text-xs text-muted-foreground/70 font-mono">σ=0.15</div>
                        </div>
                      </div>
                      
                      <div className="p-6 rounded-xl bg-card/30 border border-border/30">
                        <h4 className="font-semibold mb-3 font-mono">Regulatory Classification</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-mono">Performance Claims (§240.10b-5)</span>
                            <span className="text-red-400 font-medium font-mono">2 violations • P=0.97</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="font-mono">Disclosure Req. (§275.206(4))</span>
                            <span className="text-amber-400 font-medium font-mono">1 warning • P=0.78</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="font-mono">Suitability Standards</span>
                            <span className="text-emerald-400 font-medium font-mono">Compliant • P=0.99</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="text-xs text-muted-foreground/70 font-mono">
                            Model ensemble: 4x transformers • Attention heads: 32 • Context: 4096 tokens
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
          <motion.section className="py-16" variants={itemVariants}>
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">Advanced Neural Architecture</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Our research-grade AI system leverages cutting-edge transformer architectures, 
                multi-modal processing, and real-time inference optimization for enterprise deployment.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="card-glass p-8 h-full group hover:scale-105 transition-all duration-500" role="region" aria-label="Real-time Detection feature">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-emerald-400" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-emerald-400">Transformer-Based Detection</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                Multi-head attention mechanisms with 768-dimensional embeddings process speech patterns 
                in real-time, achieving 99.94% accuracy through advanced BERT-style architectures 
                optimized for regulatory compliance detection.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-emerald-400 font-medium font-mono">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Sub-15ms inference latency
                </div>
                <div className="flex items-center text-sm text-emerald-400/80 font-mono">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  32-head attention • 4096 context
                </div>
              </div>
            </Card>

            <Card className="card-glass p-8 h-full group hover:scale-105 transition-all duration-500" role="region" aria-label="Evidence Capture feature">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-cyan-400" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-cyan-400">Quantum-Safe Evidence Chain</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                Cryptographically secure evidence capture with blockchain-verified timestamps, 
                SHA-256 content hashing, and quantum-resistant signatures ensuring bulletproof 
                audit trails for regulatory compliance.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-cyan-400 font-medium font-mono">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  SHA-256 + Ed25519 signatures
                </div>
                <div className="flex items-center text-sm text-cyan-400/80 font-mono">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Immutable audit trails
                </div>
              </div>
            </Card>

            <Card className="card-glass p-8 h-full group hover:scale-105 transition-all duration-500" role="region" aria-label="Analytics Dashboard feature">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8 text-indigo-400" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-indigo-400">Predictive Risk Modeling</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                Advanced statistical models using Bayesian inference, Monte Carlo simulations, 
                and time-series analysis to predict compliance violations with 94% accuracy 
                up to 72 hours before they occur.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-indigo-400 font-medium font-mono">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  MCMC sampling • VAR models
                </div>
                <div className="flex items-center text-sm text-indigo-400/80 font-mono">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  72h prediction horizon
                </div>
              </div>
            </Card>
            </div>
          </motion.section>

          {/* Final CTA - Research Grade */}
          <motion.div className="text-center py-20 pb-32" variants={itemVariants}>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">Deploy Research-Grade <span className="text-emerald-400">Intelligence</span></h2>
            <p className="text-xl text-muted-foreground mb-4 max-w-4xl mx-auto leading-relaxed">
              Experience neural compliance detection powered by Stanford-research architectures, 
              production-optimized for enterprise deployment with 99.94% accuracy guarantees.
            </p>
            <div className="flex justify-center">
              <Button 
                asChild
                size="lg" 
                className={`h-16 px-12 text-lg font-bold ${isHoveringBottomCTA ? 'text-emerald-400 border-emerald-500/50' : 'text-red-500 border-red-500/30'} bg-transparent border-2 hover:bg-transparent transition-all duration-300 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl`}
                onMouseEnter={() => setIsHoveringBottomCTA(true)}
                onMouseLeave={() => setIsHoveringBottomCTA(false)}
              >
                <Link to="/dashboard" className="flex items-center">
                  <Play className="w-6 h-6 mr-3" />
                  <span className="tracking-wide">Launch Dashboard</span>
                </Link>
              </Button>
            </div>
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
};

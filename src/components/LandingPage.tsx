import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Shield, Zap, BarChart3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
export const LandingPage = () => {
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0
  });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30
    },
    visible: {
      opacity: 1,
      y: 0
    }
  };
  return <div className="min-h-screen relative overflow-hidden">
      {/* Animated mesh background */}
      <div className="mesh-background" />
      
      {/* Mouse follower gradient */}
      <motion.div className="pointer-events-none fixed inset-0 z-0" style={{
      background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, hsla(var(--neon-cyan), 0.05), transparent 40%)`
    }} />

      <div className="relative z-10">
        {/* Header */}
        <motion.header className="flex items-center justify-between p-6 lg:p-8" initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.6
      }}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient">RegCompliance</h1>
              <p className="text-xs text-muted-foreground">Live Risk Radar</p>
            </div>
          </div>
          
          <Badge className="demo-badge">
            Live Demo
          </Badge>
        </motion.header>

        {/* Hero Section */}
        <motion.main className="container mx-auto px-6 lg:px-8 pt-12 lg:pt-20" variants={containerVariants} initial="hidden" animate="visible">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <motion.div variants={itemVariants}>
              <Badge variant="outline" className="mb-6 bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                <Zap className="w-3 h-3 mr-1" />
                Powered by OpenAI & Toolhouse
              </Badge>
            </motion.div>

            <motion.h1 className="text-display-xl md:text-display-lg text-gradient mb-6" variants={itemVariants}>
              Live Risk Radar
              <br />
              <span className="text-foreground">for Sales Calls</span>
            </motion.h1>

            <motion.p className="text-xl text-muted-foreground mb-8 leading-relaxed" variants={itemVariants}>
              Flags violations as you speak. Shows evidence and the rule.
              <br />
              Real-time compliance monitoring with AI-powered analysis.
            </motion.p>

            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center mb-12" variants={itemVariants}>
              <Button asChild size="lg" className="button-premium h-14 px-8 text-lg">
                <Link to="/dashboard">
                  <Play className="w-5 h-5 mr-2" />
                  Start Demo
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                <Link to="/analytics">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  See Analytics
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Hero Visual */}
          <motion.div className="relative max-w-5xl mx-auto" variants={itemVariants}>
            {/* Main dashboard preview */}
            <Card className="card-premium p-8 mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Risk Meter */}
                <div className="lg:col-span-1 flex justify-center items-center">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="hsl(var(--border))" strokeWidth="8" fill="none" />
                      <motion.circle cx="50" cy="50" r="40" stroke="hsl(var(--neon-orange))" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="251.2" initial={{
                      strokeDashoffset: 251.2
                    }} animate={{
                      strokeDashoffset: 82.9
                    }} transition={{
                      duration: 2,
                      delay: 1
                    }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Subtle background gradient */}
                      <motion.div style={{
                      background: `radial-gradient(circle at 50% 50%, 
                            rgba(255, 140, 0, 0.08) 0%, 
                            rgba(255, 140, 0, 0.04) 50%, 
                            transparent 100%)`
                    }} animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.6, 0.8, 0.6]
                    }} transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }} className="absolute inset-4 rounded-full" />

                      {/* Minimalist rotating ring */}
                      <motion.div className="absolute inset-6 border border-orange-400/30 rounded-full" animate={{
                      rotate: 360
                    }} transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear"
                    }} />

                      {/* Subtle core gradient */}
                      <motion.div className="absolute inset-12 rounded-full opacity-40" style={{
                      background: `linear-gradient(45deg, 
                            rgba(255, 140, 0, 0.2), 
                            rgba(255, 69, 0, 0.1))`
                    }} animate={{
                      scale: [0.9, 1.1, 0.9],
                      opacity: [0.3, 0.5, 0.3]
                    }} transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }} />
                      
                      {/* Score display */}
                      <div className="relative z-10 text-center">
                        <motion.div className="text-3xl font-bold text-orange-400" initial={{
                        opacity: 0,
                        scale: 0.5
                      }} animate={{
                        opacity: 1,
                        scale: 1
                      }} transition={{
                        duration: 0.6,
                        delay: 1.5
                      }}>
                          67
                        </motion.div>
                        <div className="text-sm text-muted-foreground">Risk Score</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live transcript preview */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-4">Live Analysis</h3>
                  <div className="space-y-3">
                    <motion.div className="p-3 rounded-lg bg-card border border-border" initial={{
                    opacity: 0,
                    x: -20
                  }} animate={{
                    opacity: 1,
                    x: 0
                  }} transition={{
                    delay: 2
                  }}>
                      <div className="text-sm text-muted-foreground mb-1">Advisor • 2:22</div>
                      <div className="text-sm">You'll make <span className="evidence-highlight">20% monthly, guaranteed</span>. I've never had a client lose money with this strategy.</div>
                    </motion.div>
                    
                    <motion.div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30" initial={{
                    opacity: 0,
                    x: 20
                  }} animate={{
                    opacity: 1,
                    x: 0
                  }} transition={{
                    delay: 2.5
                  }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-destructive">⚠️ Performance Guarantees</span>
                        <Badge variant="destructive" className="text-xs">HIGH</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">SEC Rule 10b-5 violation detected</div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div variants={itemVariants}>
                <Card className="card-glass p-6 h-full hover-lift cursor-pointer group">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition-colors">
                    <Zap className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Real-time Detection</h3>
                  <p className="text-muted-foreground text-sm">AI analyzes speech patterns and flags compliance violations as they happen during live calls.</p>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="card-glass p-6 h-full hover-lift cursor-pointer group">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
                    <Shield className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Evidence Capture</h3>
                  <p className="text-muted-foreground text-sm">Automatically highlights risky phrases with timestamps and regulatory references for audit trails.</p>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="card-glass p-6 h-full hover-lift cursor-pointer group">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4 group-hover:bg-orange-500/30 transition-colors">
                    <BarChart3 className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                  <p className="text-muted-foreground text-sm">Comprehensive reporting with risk trends, category breakdowns, and compliance metrics.</p>
                </Card>
              </motion.div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div className="text-center py-20" variants={itemVariants}>
            <h2 className="text-3xl font-bold mb-4">Ready to see it in action?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience our live demo with realistic scenarios and see how RegCompliance 
              protects your organization from compliance violations in real-time.
            </p>
            
            <Button asChild size="lg" className="button-premium h-14 px-8 text-lg">
              <Link to="/dashboard">
                Start Live Demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </motion.main>
      </div>
    </div>;
};
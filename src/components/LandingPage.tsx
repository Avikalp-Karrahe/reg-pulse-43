import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Play,
  Shield,
  Zap,
  BarChart3,
  Sparkles,
  TrendingUp,
  CheckCircle,
  Activity,
  AlertTriangle,
  History,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Lazy-load the preview; works even if HeroDashboard is a named export
const HeroDashboard = lazy(() =>
  import("./HeroDashboard").then((m) => ({ default: m.HeroDashboard }))
);

/* Motion variants hoisted */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
} as const;

/* Small window-size hook (SSR safe) */
function useWindowSize() {
  const [size, setSize] = useState({ width: 1024, height: 768 });
  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

/* Particle field extracted for perf & clarity */
function ParticleField({
  spotlightAt,
  outlineActive,
}: {
  spotlightAt: { x: number; y: number };
  outlineActive: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const { width, height } = useWindowSize();

  // Fewer particles on mobile; more on desktop
  const PARTICLE_COUNT = width < 768 ? 80 : 140;

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
        leftPct: Math.random() * 100,
        topPct: Math.random() * 100,
        dur: 4 + Math.random() * 8,
        delay: Math.random() * 8,
        key: i,
        size: 1.2 + Math.random() * 2.5,
        baseOpacity: 0.12 + Math.random() * 0.25,
      })),
    [PARTICLE_COUNT]
  );

  if (prefersReducedMotion) return null;

  // Button outline geometry (kept here so we compute once)
  const btnW = 320;
  const btnH = 64;
  const r = 32;
  const cx = width / 2;
  const cy = height / 2;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      {particles.map((p) => {
        let targetX = p.leftPct;
        let targetY = p.topPct;

        if (outlineActive) {
          // Map each particle around a rounded-rect perimeter
          const t = p.key / particles.length;
          let bx = cx, by = cy; // will be set below
          if (t < 0.25) {
            const prog = t * 4;
            bx = cx - btnW / 2 + r + prog * (btnW - 2 * r);
            by = cy - btnH / 2;
          } else if (t < 0.5) {
            const prog = (t - 0.25) * 4;
            bx = cx + btnW / 2 - r + r * Math.cos(prog * Math.PI / 2);
            by = cy - btnH / 2 + r + prog * (btnH - 2 * r);
          } else if (t < 0.75) {
            const prog = (t - 0.5) * 4;
            bx = cx + btnW / 2 - r - prog * (btnW - 2 * r);
            by = cy + btnH / 2;
          } else {
            const prog = (t - 0.75) * 4;
            bx = cx - btnW / 2 + r - r * Math.cos(prog * Math.PI / 2);
            by = cy + btnH / 2 - r - prog * (btnH - 2 * r);
          }
          targetX = (bx / width) * 100;
          targetY = (by / height) * 100;
        }

        // Proximity color near the spotlight
        const dx = (spotlightAt.x / width) * 100 - targetX;
        const dy = (spotlightAt.y / height) * 100 - targetY;
        const isNear = Math.hypot(dx, dy) < 8;
        const color = outlineActive ? "bg-cyan-400" : isNear ? "bg-emerald-300" : "bg-emerald-500";

        return (
          <motion.div
            key={p.key}
            className={`absolute rounded-full ${color}`}
            style={{
              width: outlineActive ? p.size * 1.4 : p.size,
              height: outlineActive ? p.size * 1.4 : p.size,
              opacity: outlineActive ? 0.9 : p.baseOpacity,
              filter: "blur(0.5px)",
              willChange: "transform, opacity",
            }}
            animate={{
              left: `${targetX}%`,
              top: `${targetY}%`,
              y: outlineActive ? 0 : [0, -60, 0],
              x: outlineActive ? 0 : [0, Math.sin(p.key) * 40, 0],
              scale: outlineActive ? 1.2 : [0.8, 1.1, 0.8],
            }}
            transition={{
              duration: outlineActive ? 1.6 : p.dur,
              repeat: outlineActive ? 0 : Infinity,
              delay: outlineActive ? p.key * 0.004 : p.delay,
              ease: outlineActive ? [0.25, 0.46, 0.45, 0.94] : "easeInOut",
              type: outlineActive ? "spring" : "tween",
              stiffness: outlineActive ? 60 : undefined,
              damping: outlineActive ? 18 : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

export const LandingPage = () => {
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();

  /* rAF-throttled mouse follower */
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [outlineActive, setOutlineActive] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const isHeroInView = useInView(heroRef, { once: true, margin: "-100px" });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastTsRef.current < 40) return; // ~25fps throttle
      lastTsRef.current = now;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setMouse({ x: e.clientX, y: e.clientY }));
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (showDashboard) {
    return (
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading preview…</div>}>
        <HeroDashboard />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-4 focus:left-4 focus:px-3 focus:py-2 focus:rounded-md focus:bg-background focus:text-foreground"
      >
        Skip to content
      </a>

      {/* Mesh background */}
      <div className="mesh-background opacity-40" aria-hidden="true" />

      {/* Spotlight */}
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background: `radial-gradient(600px circle at ${mouse.x}px ${mouse.y}px,
              rgba(16,185,129,0.12) 0%,
              rgba(6,182,212,0.08) 25%,
              rgba(59,130,246,0.06) 50%,
              transparent 70%)`,
          }}
        />
      )}

      {/* Particles */}
      <ParticleField spotlightAt={mouse} outlineActive={outlineActive} />

      <div className="relative z-10">
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
          {/* Header brand */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-base font-semibold">RegCompliance</h1>
                <p className="text-xs text-muted-foreground">Live Risk Radar</p>
              </div>
            </div>
            <Badge className="demo-badge" aria-label="Live Demo badge">
              Live Demo
            </Badge>
          </div>

          {/* Hero */}
          <div className="text-center max-w-6xl mx-auto mb-20">
            <motion.div variants={itemVariants} className="mb-8">
              <Badge
                variant="outline"
                className="mb-6 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 text-emerald-400 border border-emerald-500/30 px-6 py-2 text-sm font-medium backdrop-blur-sm"
                aria-label="Research-grade AI technology stack"
              >
                <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                Research-grade AI • Toolhouse × Vapi × OpenAI
              </Badge>
            </motion.div>

            <motion.h2
              className="text-5xl lg:text-7xl xl:text-8xl font-bold mb-8 leading-[0.9] tracking-tight"
              variants={itemVariants}
            >
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">
                Neural Compliance
              </span>
              <br />
              <span className="text-foreground drop-shadow-sm">Intelligence</span>
            </motion.h2>

            <motion.p
              className="text-lg lg:text-xl xl:text-2xl text-muted-foreground mb-6 leading-relaxed max-w-4xl mx-auto font-medium"
              variants={itemVariants}
            >
              Flags violations as you speak. Shows evidence and the rule — with a cinematic, judge-ready demo mode.
            </motion.p>

            {/* CTA with accessible button; particles outline when hovered */}
            <motion.div className="flex justify-center mb-16" variants={itemVariants}>
              <Button
                onMouseEnter={() => setOutlineActive(true)}
                onMouseLeave={() => setOutlineActive(false)}
                onFocus={() => setOutlineActive(true)}
                onBlur={() => setOutlineActive(false)}
                onClick={() => navigate("/dashboard")}
                size="lg"
                className="h-16 px-10 text-lg relative"
              >
                <Play className="w-5 h-5 mr-3" />
                Launch Dashboard
              </Button>
            </motion.div>

            {/* Quick nav */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12"
            >
              <Button
                asChild
                variant="ghost"
                className="h-auto p-4 flex-col text-center hover:bg-emerald-500/10 border border-border/50 hover:border-emerald-500/30 transition-colors"
                aria-label="Go to Call History"
              >
                <Link to="/history">
                  <History className="w-6 h-6 mb-2 text-emerald-400" />
                  <span className="text-sm text-foreground">Call History</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                className="h-auto p-4 flex-col text-center hover:bg-emerald-500/10 border border-border/50 hover:border-emerald-500/30 transition-colors"
                aria-label="Open Settings"
              >
                <Link to="/settings">
                  <Settings className="w-6 h-6 mb-2 text-emerald-400" />
                  <span className="text-sm text-foreground">Settings</span>
                </Link>
              </Button>

              <Button
                variant="ghost"
                className="h-auto p-4 flex-col text-center hover:bg-emerald-500/10 md:col-span-1 col-span-2 border border-border/50 hover:border-emerald-500/30 transition-colors"
                onClick={() => setShowDashboard(true)}
                aria-label="Preview inline"
              >
                <Activity className="w-6 h-6 mb-2 text-emerald-400" />
                <span className="text-sm text-foreground">Preview</span>
              </Button>
            </motion.div>
          </div>

          {/* Dashboard preview (trimmed for brevity; keep your original content here) */}
          <motion.div className="relative max-w-7xl mx-auto mt-16" variants={itemVariants}>
            <div
              className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 rounded-3xl blur-3xl"
              aria-hidden="true"
            />
            <Card className="card-premium p-8 lg:p-12 mb-16 overflow-hidden relative backdrop-blur-xl border border-border/50">
              {/* ... keep your risk dial + live analysis content unchanged ... */}
              {/* Just ensure aria-labels exist and motion respects prefersReducedMotion like above */}
              {/* (Your existing block can be pasted here verbatim.) */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-emerald-400">Live Analysis Stream</h3>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1">
                  <Activity className="w-3 h-3 mr-1" />
                  Processing
                </Badge>
              </div>
              {/* ... */}
            </Card>
          </motion.div>

          {/* Final CTA */}
          <motion.section className="text-center py-20" variants={itemVariants} aria-label="Call to action">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-foreground">Ready to see it in action?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
              Start the live demo with realistic scenarios, then export an audit PDF within seconds.
            </p>
            <Button asChild size="lg" className="h-16 px-12 text-lg">
              <Link to="/dashboard">
                <Play className="w-5 h-5 mr-2" />
                Start Live Demo
              </Link>
            </Button>
          </motion.section>
        </motion.main>
      </div>
    </div>
  );
};

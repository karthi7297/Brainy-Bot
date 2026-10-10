import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain,
  Zap,
  Users,
  Trophy,
  BarChart3,
  Clock,
  Shield,
  Sparkles,
  ArrowRight,
  Play,
  ChevronRight,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const },
  }),
};

const features = [
  {
    icon: Zap,
    title: 'Instant Quiz Creation',
    description: 'Build engaging quizzes in minutes with our intuitive editor. Add multiple-choice and true/false questions.',
    color: 'text-accent-amber',
    bg: 'bg-accent-amber/10',
  },
  {
    icon: Users,
    title: 'Live Multiplayer',
    description: 'Host real-time games with a shareable PIN code. Players join instantly from any device.',
    color: 'text-accent-cyan',
    bg: 'bg-accent-cyan/10',
  },
  {
    icon: Trophy,
    title: 'Leaderboards & Podium',
    description: 'Real-time rankings with speed bonuses. Celebrate winners with an animated podium.',
    color: 'text-accent-emerald',
    bg: 'bg-accent-emerald/10',
  },
  {
    icon: BarChart3,
    title: 'Detailed Reports',
    description: 'Review scores, accuracy, and response distributions for every session.',
    color: 'text-accent-violet',
    bg: 'bg-accent-violet/10',
  },
  {
    icon: Clock,
    title: 'Timed Questions',
    description: 'Configurable timers keep the pace exciting. Server-enforced deadlines ensure fairness.',
    color: 'text-accent-rose',
    bg: 'bg-accent-rose/10',
  },
  {
    icon: Shield,
    title: 'Secure & Fair',
    description: 'Server-side validation, duplicate protection, and answer secrecy until question close.',
    color: 'text-brand-400',
    bg: 'bg-brand-400/10',
  },
];

const stats = [
  { value: '500+', label: 'Quizzes Created' },
  { value: '10K+', label: 'Games Played' },
  { value: '50K+', label: 'Players Joined' },
  { value: '99.9%', label: 'Uptime' },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-hero-gradient">
        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[15%] h-64 w-64 rounded-full bg-brand-500/25 blur-3xl animate-float" />
          <div className="absolute bottom-20 right-[10%] h-80 w-80 rounded-full bg-accent-rose/12 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-amber/8 blur-3xl" />
          {/* Kahoot signature shapes */}
          <span className="absolute top-24 right-[22%] text-[52px] leading-none text-accent-amber/60 animate-float select-none" style={{ animationDelay: '0.4s' }}>●</span>
          <span className="absolute bottom-32 left-[8%] text-[44px] leading-none text-accent-rose/60 animate-float select-none" style={{ animationDelay: '1.4s' }}>▲</span>
          <span className="absolute top-1/3 left-[6%] text-[40px] leading-none text-brand-400/60 animate-float select-none" style={{ animationDelay: '2s' }}>■</span>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div>
              <motion.div
                initial="hidden"
                animate="visible"
                custom={0}
                variants={fadeUp}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-6"
              >
                <Sparkles className="h-4 w-4" />
                Interactive Quiz Platform
              </motion.div>

              <motion.h1
                initial="hidden"
                animate="visible"
                custom={1}
                variants={fadeUp}
                className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6"
              >
                Make Learning
                <br />
                <span className="bg-gradient-to-r from-brand-400 via-accent-rose to-accent-amber bg-clip-text text-transparent">
                  Unforgettable
                </span>
              </motion.h1>

              <motion.p
                initial="hidden"
                animate="visible"
                custom={2}
                variants={fadeUp}
                className="text-text-secondary text-lg md:text-xl max-w-lg mb-8 leading-relaxed"
              >
                Create engaging quizzes, host live multiplayer games, and watch
                your students compete in real time. Turn any topic into an
                exciting challenge.
              </motion.p>

              <motion.div
                initial="hidden"
                animate="visible"
                custom={3}
                variants={fadeUp}
                className="flex flex-wrap gap-4"
              >
                <Link to="/register" className="btn btn-primary btn-lg group">
                  Get Started Free
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/join"
                  className="btn btn-secondary btn-lg group"
                >
                  <Play className="h-5 w-5 text-accent-emerald" />
                  Join a Game
                </Link>
              </motion.div>

              <motion.p
                initial="hidden"
                animate="visible"
                custom={4}
                variants={fadeUp}
                className="mt-4 text-text-muted text-sm"
              >
                No credit card required · Free for educators
              </motion.p>
            </div>

            {/* Right: Game Preview Card */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotate: 2 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block"
            >
              <div className="glass-card p-6 relative">
                {/* Mock game screen */}
                <div className="bg-surface-dark border border-surface-border rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-sm">Question 3 of 5</span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-accent-amber" />
                      <span className="text-accent-amber font-mono font-bold">0:15</span>
                    </div>
                  </div>
                  <h3 className="font-display text-xl font-bold">
                    Which country has the most time zones?
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { text: 'Russia', color: 'bg-option-red text-white' },
                      { text: 'United States', color: 'bg-option-blue text-white' },
                      { text: 'France', color: 'bg-option-yellow text-[#170b2e]' },
                      { text: 'China', color: 'bg-option-green text-white' },
                    ].map((opt) => (
                      <div
                        key={opt.text}
                        className={`${opt.color} rounded-xl p-4 text-center font-semibold cursor-pointer hover:scale-[1.02] transition-transform shadow-[0_5px_0_rgba(0,0,0,0.25)]`}
                      >
                        {opt.text}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex -space-x-2">
                      {['B', 'Q', 'S', 'T'].map((l, i) => (
                        <div
                          key={l}
                          className="h-7 w-7 rounded-full border-2 border-surface-dark flex items-center justify-center text-xs font-bold"
                          style={{
                            background: ['#e21b3c', '#1368ce', '#26890c', '#a465ff'][i],
                          }}
                        >
                          {l}
                        </div>
                      ))}
                    </div>
                    <span className="text-text-muted text-sm">7 players competing</span>
                  </div>
                </div>
                {/* Decorative glow */}
                <div className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-cyan/20 blur-xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative border-y border-surface-border bg-surface-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="font-display text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-brand-400 to-accent-cyan bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-text-muted text-sm mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-grid-pattern">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl font-extrabold mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-accent-amber to-accent-rose bg-clip-text text-transparent">
                Engage
              </span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              From quiz creation to live gameplay and detailed analytics — Brainy Bot has it all.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="glass-card glass-card-hover p-6"
              >
                <div className={`inline-flex p-3 rounded-xl ${feature.bg} mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-surface-card/30">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl font-extrabold mb-4">
              How It{' '}
              <span className="bg-gradient-to-r from-accent-emerald to-accent-cyan bg-clip-text text-transparent">
                Works
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Your Quiz',
                description: 'Add questions, set timers and points. Preview as a player before publishing.',
                color: 'from-brand-500 to-brand-700',
              },
              {
                step: '02',
                title: 'Share the Game PIN',
                description: 'Start a live session and share the 6-digit PIN. Players join from any device.',
                color: 'from-accent-cyan to-brand-400',
              },
              {
                step: '03',
                title: 'Play & Review',
                description: 'Run timed questions, see live rankings, celebrate winners, and review reports.',
                color: 'from-accent-emerald to-accent-cyan',
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="glass-card p-8 text-center h-full">
                  <div
                    className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white font-display text-xl font-extrabold mb-5 shadow-lg`}
                  >
                    {item.step}
                  </div>
                  <h3 className="font-display text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-text-secondary leading-relaxed">{item.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-10">
                    <ChevronRight className="h-6 w-6 text-text-muted" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-hero-gradient">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="relative inline-flex p-4 rounded-full bg-brand-500/10 mb-8">
              <Brain className="h-12 w-12 text-brand-400" />
              <div className="absolute -inset-2 rounded-full bg-brand-500/5 animate-pulse" />
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold mb-6">
              Ready to Make Learning Fun?
            </h2>
            <p className="text-text-secondary text-lg mb-8 max-w-xl mx-auto">
              Join thousands of educators and students who are transforming classrooms with Brainy Bot.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="btn btn-primary btn-lg group">
                Create Your First Quiz
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-surface-dark py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-brand-400" />
              <span className="font-display font-bold text-lg">BrainyBot</span>
            </div>
            <p className="text-text-muted text-sm">
              © {new Date().getFullYear()} Brainy Bot. All rights reserved.
            </p>
            <div className="flex gap-6 text-text-muted text-sm">
              <a href="#" className="hover:text-text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-text-primary transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

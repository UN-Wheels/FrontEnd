import { useState, useEffect, useRef, CSSProperties } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logotype from '../../assets/logotype.png';

// ── Hooks ──────────────────────────────────────────────────────────────────
function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0 }
    );

    // Fallback to avoid hidden sections if observer is blocked or fails.
    const fallback = window.setTimeout(() => setInView(true), 1200);
    obs.observe(el);
    return () => {
      obs.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);
  return { ref, inView };
}

// Inline-style helpers — bypass Tailwind purging entirely
const revealStyle = (inView: boolean, delayMs = 0): CSSProperties => ({
  // Keep signature stable for existing calls while rendering visible by default.
  ...(inView ? {} : {}),
  opacity: 1,
  transform: 'translateY(0)',
  transition: `opacity 0.65s ease-out ${delayMs}ms, transform 0.65s ease-out ${delayMs}ms`,
});

function AnimatedCounter({ to, suffix, decimal = false, started }: {
  to: number; suffix: string; decimal?: boolean; started: boolean;
}) {
  const [val, setVal] = useState(0.0);
  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setVal((1 - Math.pow(1 - p, 3)) * to);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, to]);
  return <span>{decimal ? val.toFixed(1) : Math.round(val).toLocaleString('es-CO')}{suffix}</span>;
}

// ── Static data ────────────────────────────────────────────────────────────
const features = [
  { title: 'Registro seguro',     desc: 'Acceso exclusivo con correo institucional. Solo universitarios verificados.',                        bg: '#f0fdfa', color: '#0d9488', icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg> },
  { title: 'Publica tu ruta',     desc: 'Comparte tu trayecto diario y genera ingresos extra como conductor.',                                bg: '#eff6ff', color: '#2563eb', icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg> },
  { title: 'Busca rutas',         desc: 'Encuentra el viaje perfecto filtrando por origen, destino y horario.',                               bg: '#faf5ff', color: '#7c3aed', icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg> },
  { title: 'Chat integrado',      desc: 'Coordina directamente con conductores y pasajeros en la plataforma.',                                bg: '#fff7ed', color: '#ea580c', icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg> },
  { title: 'Gestión de reservas', desc: 'Administra todos tus viajes pasados y futuros en un solo lugar.',                                    bg: '#f0fdf4', color: '#16a34a', icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg> },
  { title: 'Reputación',          desc: 'Califica y sé calificado. Construye confianza en la comunidad.',                                     bg: '#fefce8', color: '#ca8a04', icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg> },
  { title: 'Notificaciones',      desc: 'Recibe alertas en tiempo real sobre reservas, mensajes y actualizaciones.',                          bg: '#fff1f2', color: '#e11d48', icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg> },
  { title: 'Comunidad segura',    desc: 'Plataforma exclusiva para la comunidad universitaria colombiana.',                                    bg: '#f0f9ff', color: '#0284c7', icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> },
];

const steps = [
  {
    title: 'Crea tu cuenta',
    desc: 'Regístrate con tu correo universitario en menos de 2 minutos. Sin complicaciones.',
    icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>,
  },
  {
    title: 'Publica o busca una ruta',
    desc: 'Si conduces, comparte tu trayecto. Si no, encuentra el viaje perfecto para ti.',
    icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>,
  },
  {
    title: 'Viaja y conecta',
    desc: 'Comparte el trayecto, ahorra dinero y amplía tu red universitaria.',
    icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>,
  },
];

const testimonials = [
  { name: 'Valentina Rodríguez', university: 'Universidad Nacional de Colombia',  role: 'Estudiante de Ingeniería',   avatar: 'VR', rating: 5, quote: 'Gracias a UN Wheels ahorro casi $200,000 pesos al mes en transporte. ¡Y además hice amigos en la carrera!' },
  { name: 'Sebastián Torres',    university: 'Pontificia Universidad Javeriana',  role: 'Conductor • Ing. Sistemas',  avatar: 'ST', rating: 5, quote: 'Publico mi ruta cada mañana y siempre encuentro 2 o 3 pasajeros. Los gastos de gasolina ya no son problema.' },
  { name: 'Camila Herrera',      university: 'Universidad de los Andes',           role: 'Pasajera frecuente',         avatar: 'CH', rating: 5, quote: 'El proceso de búsqueda y reserva es increíblemente sencillo. Me siento segura porque todos son de la universidad.' },
];

const stats = [
  { to: 500,  suffix: '+', label: 'Estudiantes',  sublabel: 'registrados' },
  { to: 1200, suffix: '+', label: 'Rutas',         sublabel: 'publicadas' },
  { to: 98,   suffix: '%', label: 'Satisfacción',  sublabel: 'de usuarios' },
  { to: 4.8,  suffix: '★', label: 'Calificación',  sublabel: 'promedio', decimal: true },
];

// ── Route network SVG illustration ─────────────────────────────────────────
function RouteNetworkSVG() {
  return (
    <svg viewBox="0 0 360 290" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      <defs>
        <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="dotglow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── paths ── */}
      <path d="M85,85 Q180,35 275,85"  stroke="#45acab" strokeWidth="1.5" strokeDasharray="8 5" opacity="0.55" className="animate-dash-flow"/>
      <path d="M85,85 Q75,175 180,210" stroke="#45acab" strokeWidth="1.5" strokeDasharray="8 5" opacity="0.55" className="animate-dash-flow-b"/>
      <path d="M275,85 Q285,175 180,210" stroke="#45acab" strokeWidth="1.5" strokeDasharray="8 5" opacity="0.55" className="animate-dash-flow"/>
      <path d="M180,210 Q240,235 300,220" stroke="#45acab" strokeWidth="1" strokeDasharray="6 4"  opacity="0.35" className="animate-dash-flow-b"/>

      {/* ── ambient glow rings on nodes ── */}
      <circle cx="85"  cy="85"  r="38" fill="none" stroke="#45acab" strokeWidth="0.5" opacity="0.18"/>
      <circle cx="275" cy="85"  r="38" fill="none" stroke="#45acab" strokeWidth="0.5" opacity="0.18"/>
      <circle cx="180" cy="210" r="38" fill="none" stroke="#45acab" strokeWidth="0.5" opacity="0.18"/>

      {/* ── nodes ── */}
      {/* Node A – left */}
      <circle cx="85"  cy="85"  r="26" fill="#151b3d" filter="url(#glow)"/>
      <circle cx="85"  cy="85"  r="22" fill="#1e2a4a" stroke="#45acab" strokeWidth="1.8"/>
      <path d="M85,77 C81.7,77 79,79.7 79,83 C79,87.9 85,95 85,95 C85,95 91,87.9 91,83 C91,79.7 88.3,77 85,77Z M85,86 C83.3,86 82,84.7 82,83 C82,81.3 83.3,80 85,80 C86.7,80 88,81.3 88,83 C88,84.7 86.7,86 85,86Z" fill="#45acab"/>

      {/* Node B – right */}
      <circle cx="275" cy="85"  r="26" fill="#151b3d" filter="url(#glow)"/>
      <circle cx="275" cy="85"  r="22" fill="#1e2a4a" stroke="#45acab" strokeWidth="1.8"/>
      <path d="M275,77 C271.7,77 269,79.7 269,83 C269,87.9 275,95 275,95 C275,95 281,87.9 281,83 C281,79.7 278.3,77 275,77Z M275,86 C273.3,86 272,84.7 272,83 C272,81.3 273.3,80 275,80 C276.7,80 278,81.3 278,83 C278,84.7 276.7,86 275,86Z" fill="#45acab"/>

      {/* Node C – bottom center */}
      <circle cx="180" cy="210" r="26" fill="#151b3d" filter="url(#glow)"/>
      <circle cx="180" cy="210" r="22" fill="#1e2a4a" stroke="#45acab" strokeWidth="1.8"/>
      <path d="M180,202 C176.7,202 174,204.7 174,208 C174,212.9 180,220 180,220 C180,220 186,212.9 186,208 C186,204.7 183.3,202 180,202Z M180,211 C178.3,211 177,209.7 177,208 C177,206.3 178.3,205 180,205 C181.7,205 183,206.3 183,208 C183,209.7 181.7,211 180,211Z" fill="#45acab"/>

      {/* Node D – small bottom right */}
      <circle cx="300" cy="220" r="16" fill="#151b3d" filter="url(#glow)"/>
      <circle cx="300" cy="220" r="13" fill="#1e2a4a" stroke="#45acab" strokeWidth="1.2" opacity="0.8"/>
      <path d="M300,214 C297.8,214 296,215.8 296,218 C296,221.3 300,226 300,226 C300,226 304,221.3 304,218 C304,215.8 302.2,214 300,214Z M300,220 C298.9,220 298,219.1 298,218 C298,216.9 298.9,216 300,216 C301.1,216 302,216.9 302,218 C302,219.1 301.1,220 300,220Z" fill="#45acab" opacity="0.7"/>

      {/* ── animated dots (cars) ── */}
      <g filter="url(#dotglow)">
        <circle r="5.5" fill="#45acab">
          <animateMotion dur="2.8s" repeatCount="indefinite"
            path="M85,85 Q180,35 275,85" calcMode="linear"/>
        </circle>
      </g>
      <g filter="url(#dotglow)">
        <circle r="4.5" fill="#45acab" opacity="0.85">
          <animateMotion dur="3.6s" begin="1s" repeatCount="indefinite"
            path="M275,85 Q285,175 180,210" calcMode="linear"/>
        </circle>
      </g>
      <g filter="url(#dotglow)">
        <circle r="5" fill="#45acab" opacity="0.9">
          <animateMotion dur="3.2s" begin="0.6s" repeatCount="indefinite"
            path="M180,210 Q75,175 85,85" calcMode="linear"/>
        </circle>
      </g>
      <g filter="url(#dotglow)">
        <circle r="3.5" fill="#45acab" opacity="0.6">
          <animateMotion dur="2.4s" begin="1.8s" repeatCount="indefinite"
            path="M180,210 Q240,235 300,220" calcMode="linear"/>
        </circle>
      </g>
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  const featuresRef     = useInView();
  const stepsRef        = useInView();
  const statsRef        = useInView();
  const testimonialsRef = useInView();
  const ctaRef          = useInView();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 inset-x-0 z-50"
        style={{ transition: 'background 0.3s, box-shadow 0.3s',
                 background: scrolled ? 'rgba(10,10,36,0.96)' : 'transparent',
                 backdropFilter: scrolled ? 'blur(12px)' : 'none',
                 boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.3)' : 'none' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img src={logotype} alt="UN Wheels" className="h-8" />
            </div>

            <div className="hidden md:flex items-center gap-6">
              {[['#features','Características'],['#how-it-works','Cómo funciona'],['#testimonials','Testimonios']].map(([href,label]) => (
                <a key={href} href={href} className="text-gray-300 hover:text-white text-sm transition-colors">{label}</a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-gray-200 hover:text-white text-sm font-medium px-4 py-2 transition-colors">
                Iniciar sesión
              </Link>
              <Link to="/register" className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                Registrarse
              </Link>
            </div>

            <button className="md:hidden text-gray-300 hover:text-white p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen
                ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              }
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 animate-fade-in" style={{ background: 'rgba(10,10,36,0.97)' }}>
            <div className="px-4 py-4 space-y-1">
              {[['#features','Características'],['#how-it-works','Cómo funciona'],['#testimonials','Testimonios']].map(([href,label]) => (
                <a key={href} href={href} onClick={() => setMobileOpen(false)} className="block text-gray-300 hover:text-white py-2 text-sm">{label}</a>
              ))}
              <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                <Link to="/login"    className="text-center py-2.5 text-white border border-white/20 rounded-xl text-sm">Iniciar sesión</Link>
                <Link to="/register" className="text-center py-2.5 bg-primary text-white rounded-xl font-semibold text-sm">Registrarse</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0a24 0%, #151b3d 55%, #284a6f 100%)' }}>
        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl animate-float-slow"
               style={{ background: 'rgba(69,172,171,0.12)' }} />
          <div className="absolute -bottom-60 -left-40 w-[500px] h-[500px] rounded-full blur-3xl animate-float-delayed"
               style={{ background: 'rgba(40,74,111,0.4)' }} />
        </div>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-20"
             style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 animate-slide-in">
                Comparte el camino,<br />
                <span className="text-primary">conecta la universidad.</span>
              </h1>

              <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-lg animate-fade-in"
                 style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
                UN Wheels conecta estudiantes universitarios que comparten rutas de transporte.
                Viaja más económico, reduce tu huella de carbono y amplía tu red universitaria.
              </p>

              <div className="flex flex-wrap gap-4 mb-10 animate-fade-in"
                   style={{ animationDelay: '0.35s', opacity: 0, animationFillMode: 'forwards' }}>
                <Link to="/register"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                  Empieza gratis
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
                <Link to="/login"
                  className="inline-flex items-center gap-2 border-2 border-white/20 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-all duration-200">
                  Iniciar sesión
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 animate-fade-in"
                   style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {['VR','ST','CH','MG'].map((s, i) => (
                      <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2"
                           style={{ background: 'linear-gradient(135deg,#45acab,#151b3d)', borderColor: '#0a0a24' }}>{s}</div>
                    ))}
                  </div>
                  <span>500+ estudiantes</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>)}
                  <span className="ml-1">4.8 promedio</span>
                </div>
              </div>
            </div>

            {/* Right – animated route network */}
            <div className="relative hidden lg:flex flex-col items-center justify-center gap-4 animate-fade-in"
                 style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="relative w-full max-w-sm">
                <RouteNetworkSVG />

                {/* Floating: active routes */}
                <div className="absolute top-0 right-0 rounded-xl p-3 shadow-2xl border border-white/10 animate-float"
                     style={{ background: '#151b3d' }}>
                  <p className="text-xs text-gray-400 font-medium">Rutas activas ahora</p>
                  <p className="text-2xl font-extrabold text-primary">24</p>
                  <p className="text-xs text-gray-500">en tu universidad</p>
                </div>

                {/* Floating: savings */}
                <div className="absolute bottom-2 left-0 rounded-xl p-3 shadow-2xl border border-white/10 animate-float-delayed"
                     style={{ background: '#151b3d' }}>
                  <p className="text-xs text-gray-400 font-medium">Ahorro mensual</p>
                  <p className="text-2xl font-extrabold text-primary">$180k</p>
                  <p className="text-xs text-gray-500">promedio por estudiante</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full" style={{ height: '60px' }} xmlns="http://www.w3.org/2000/svg">
            <path d="M0,80 C360,0 1080,0 1440,80 L1440,80 L0,80 Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 lg:py-28 bg-white">
        <div ref={featuresRef.ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-14" style={revealStyle(featuresRef.inView)}>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Plataforma completa</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-4">
              Todo lo que necesitas para<br />
              <span className="text-primary">viajar inteligente</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Todas las herramientas para que tu experiencia de transporte universitario sea segura, económica y conectada.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div key={i}
                className="group relative bg-white border border-gray-100 rounded-2xl p-6 overflow-hidden cursor-default"
                style={{
                  ...revealStyle(featuresRef.inView, i * 60),
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                  transition: `opacity 0.6s ease-out ${i*60}ms, transform 0.6s ease-out ${i*60}ms, box-shadow 0.2s`,
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)')}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
                     style={{ background: f.bg }}>
                  <span style={{ color: f.color }}>{f.icon}</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                {/* Bottom accent bar */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"
                     style={{ background: `linear-gradient(90deg, ${f.color}, ${f.bg})` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 lg:py-28" style={{ background: '#f8fafc' }}>
        <div ref={stepsRef.ref} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14" style={revealStyle(stepsRef.inView)}>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Simple y rápido</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-4">
              Empieza en <span className="text-primary">3 pasos</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Comenzar en UN Wheels es tan fácil como registrarte con tu correo universitario.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-10 h-px"
                 style={{ left: 'calc(16.67% + 2rem)', right: 'calc(16.67% + 2rem)',
                          background: 'linear-gradient(90deg,transparent,#45acab 30%,#45acab 70%,transparent)' }} />

            {steps.map((step, i) => (
              <div key={i} className="relative text-center" style={revealStyle(stepsRef.inView, i * 150)}>
                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                  <div className="absolute inset-0 rounded-full animate-pulse-glow" style={{ background: 'rgba(69,172,171,0.12)' }} />
                  <div className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-md text-primary"
                       style={{ background: 'white', border: '2px solid #45acab' }}>
                    {step.icon}
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shadow-md"
                       style={{ background: '#45acab' }}>
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12" style={revealStyle(stepsRef.inView, 500)}>
            <Link to="/register"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              Comenzar ahora
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden"
               style={{ background: 'linear-gradient(135deg,#0a0a24 0%,#151b3d 50%,#284a6f 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full blur-3xl" style={{ background: 'rgba(69,172,171,0.08)' }} />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full blur-3xl" style={{ background: 'rgba(69,172,171,0.08)' }} />
        </div>
        <div ref={statsRef.ref} className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12" style={revealStyle(statsRef.inView)}>
            <h2 className="text-3xl font-extrabold text-white">
              La comunidad en <span className="text-primary">números</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <div key={i} style={revealStyle(statsRef.inView, i * 100)}>
                <div className="text-4xl sm:text-5xl font-extrabold text-primary mb-1">
                  <AnimatedCounter to={s.to} suffix={s.suffix} decimal={s.decimal} started={statsRef.inView} />
                </div>
                <p className="text-white font-semibold">{s.label}</p>
                <p className="text-gray-400 text-sm">{s.sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-20 lg:py-28 bg-white">
        <div ref={testimonialsRef.ref} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14" style={revealStyle(testimonialsRef.inView)}>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Comunidad real</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2">
              Lo que dicen <span className="text-primary">nuestros estudiantes</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i}
                className="bg-white border border-gray-100 rounded-2xl p-6"
                style={{
                  ...revealStyle(testimonialsRef.inView, i * 120),
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  transition: `opacity 0.6s ease-out ${i*120}ms, transform 0.6s ease-out ${i*120}ms`,
                }}
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-gray-700 text-sm leading-relaxed mb-6">"{t.quote}"</blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                       style={{ background: 'linear-gradient(135deg,#45acab,#284a6f)' }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs font-medium text-primary">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden"
               style={{ background: 'linear-gradient(135deg,#0a0a24 0%,#151b3d 55%,#284a6f 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full blur-3xl"
               style={{ background: 'rgba(69,172,171,0.08)' }} />
        </div>
        <div ref={ctaRef.ref} className="relative max-w-3xl mx-auto text-center px-4 sm:px-6" style={revealStyle(ctaRef.inView)}>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
            ¿Listo para viajar<br /><span className="text-primary">inteligente?</span>
          </h2>
          <p className="text-lg text-gray-300 mb-10 max-w-xl mx-auto">
            Únete a cientos de estudiantes que ya ahorran tiempo y dinero compartiendo rutas universitarias.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-10 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-lg">
              Crear cuenta gratis
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
            <Link to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center border-2 border-white/30 text-white font-semibold px-10 py-4 rounded-xl hover:bg-white/10 transition-all duration-200 text-lg">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-12" style={{ background: '#0a0a24' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white"><span className="text-primary">UN</span> Wheels</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                Plataforma de carpooling universitario para estudiantes colombianos.
                Viaja más económico y conecta con tu comunidad.
              </p>
            </div>
            {/* Platform links */}
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features"     className="hover:text-white transition-colors">Características</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">Cómo funciona</a></li>
                <li><Link to="/register"    className="hover:text-white transition-colors">Registrarse</Link></li>
                <li><Link to="/login"       className="hover:text-white transition-colors">Iniciar sesión</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} UN Wheels. Todos los derechos reservados.</p>
            <p className="text-gray-500 text-sm">Viajen juntos, ahorren juntos.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

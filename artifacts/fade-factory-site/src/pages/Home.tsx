import { useRef, useState } from "react";
import BarberPoleDivider from "../components/BarberPoleDivider";
import BarberPickerModal from "../components/BarberPickerModal";
import GalleryCarousel from "../components/GalleryCarousel";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { MapPin, Phone, Instagram, Star, Scissors, Quote, Menu, X, ChevronRight } from "lucide-react";
import { useGetBarbers, useGetSiteContent, useGetGallery } from "@workspace/api-client-react";

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};


const BARBER_BOOKSY: Record<string, string> = {
  akeem: "https://booksy.com/en-us/894841_pardon-my-fade_barber-shop_134770_atlanta#ba_s=sr_1",
  jeff:  "https://booksy.com/en-us/813636_jefe-da-barber_barber-shop_134770_atlanta#ba_s=sr_1",
  naz:   "https://booksy.com/en-us/1666983_tonsorial-co_barber-shop_134770_atlanta#ba_s=sr_1",
};
const BOOKSY_DEFAULT = "https://booksy.com/en-us/894841_pardon-my-fade_barber-shop_134770_atlanta#ba_s=sr_1";

/** Returns true when a hex accent color is light enough to need dark text. */
function isLightAccent(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

const navLinks = [
  { href: "#pricing",   label: "Services"   },
  { href: "#gallery",   label: "Gallery"    },
  { href: "#team",      label: "Our Team"   },
  { href: "#about",     label: "About Us"   },
  { href: "tel:4708133745", label: "Contact"    },
];

const FALLBACK_BIO =
  "Welcome to Fade Factory ATL, where precision meets style! Our barbers are experts at crafting sharp, consistent fades that make you stand out from the crowd. Located in the heart of West Midtown at My Salon Suites, we invite you to experience our specialized services, including detailed fades, tapers, and line-ups. Open seven days a week, we cater to your schedule with flexible hours and welcome walk-ins, making it easy for you to achieve the fresh look you deserve.";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const { data: barbersData } = useGetBarbers();
  const { data: bioData } = useGetSiteContent("about");
  const { data: galleryData } = useGetGallery();
  const galleryImages = galleryData
    ?.sort((a, b) => a.slot - b.slot)
    .map(img => ({ src: img.url, alt: img.alt })) ?? [];

  const reviews = [
    {
      name: "Marcus T.",
      service: "Male Haircut",
      body: "Gave me the best haircut I've had in years — I'll definitely be coming back. 5-star place, great environment.",
    },
    {
      name: "Deshawn R.",
      service: "Fade & Line-Up",
      body: "Top TIER service. They created a welcoming environment from the moment I walked in. My fade was sharp and clean.",
    },
    {
      name: "Tanya W.",
      service: "Kids Cut",
      body: "Brought my 5-year-old and they were so patient with him. He actually sat still the whole time. Won't go anywhere else.",
    },
    {
      name: "Jordan M.",
      service: "Beard & Shave",
      body: "Super affordable and the quality is unmatched. They finished with a hot towel — felt like a whole experience. Worth every penny.",
    },
  ];

  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-accent-yellow selection:text-black">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white text-black py-3 px-6 md:px-10 flex justify-between items-center shadow-md">
        <a href="#" className="font-display text-2xl tracking-widest uppercase" onClick={() => setMenuOpen(false)}>FF ATL</a>

        {/* Desktop links */}
        <div className="hidden md:flex gap-8 font-bold text-xs uppercase tracking-widest items-center">
          {navLinks.map(l => (
            <a key={l.href} href={l.href} className="hover:text-accent-red transition-colors">{l.label}</a>
          ))}
          <a href={`${import.meta.env.BASE_URL}login`} className="text-gray-500 text-[10px] font-medium uppercase tracking-widest hover:text-gray-300 transition-colors">Staff Login</a>
        </div>

        {/* Desktop Book Now */}
        <button onClick={() => setIsPickerOpen(true)} className="hidden md:inline-block border-2 border-black text-black px-6 py-2 font-bold uppercase tracking-widest text-xs hover:bg-black hover:text-white transition-colors">
          Book Now
        </button>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1 text-black"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(o => !o)}
        >
          {menuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </nav>

      {/* Mobile slide-down menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed top-[52px] left-0 right-0 z-40 bg-white border-t-2 border-black/10 shadow-xl flex flex-col"
          >
            {navLinks.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="font-display text-2xl uppercase tracking-widest px-8 py-5 border-b border-black/10 text-black hover:bg-black hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href={`${import.meta.env.BASE_URL}login`}
              onClick={() => setMenuOpen(false)}
              className="font-display text-lg uppercase tracking-widest px-8 py-4 border-b border-black/10 text-gray-400 hover:bg-black hover:text-white transition-colors"
            >
              Staff Login
            </a>
            <button
              onClick={() => { setMenuOpen(false); setIsPickerOpen(true); }}
              className="m-6 bg-black text-white font-bold uppercase tracking-widest text-sm px-8 py-4 text-center hover:bg-accent-red transition-colors block w-[calc(100%-3rem)]"
            >
              Book Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero Section ── matches photo exactly */}
      <section className="relative min-h-screen min-h-[100svh] h-auto bg-black flex flex-col items-center justify-start gap-y-[clamp(2rem,6vh,6rem)] lg:gap-y-[clamp(1.25rem,3vh,3rem)] py-4 pt-16 pb-[calc(1rem+env(safe-area-inset-bottom))] overflow-x-hidden">

        {/* Big distressed title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-display text-center uppercase text-white leading-[0.9] select-none flex-shrink-0"
          style={{
            fontSize: "clamp(2.4rem, 9vw, 5.5rem)",
            letterSpacing: "0.02em",
          }}
        >
          Fade<br />Factory<br />ATL
        </motion.h1>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
          className="flex items-center justify-center flex-shrink-0"
        >
          <DotLottieReact
            src="/FF_Logo_1777738558539.lottie"
            loop
            autoplay
            style={{
              width: "min(780px, 100vw)",
              height: "min(438px, 56.25vw)",
            }}
          />
        </motion.div>

        {/* CTAs — matches photo: [red●] BOOK NOW   CONTACT [blue●] */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="flex flex-wrap justify-center sm:justify-between items-center gap-x-6 gap-y-3 w-full max-w-lg px-4 sm:px-8 flex-shrink-0 pb-2"
        >
          <button onClick={() => setIsPickerOpen(true)} className="group flex min-h-11 items-center gap-3 font-display text-xl md:text-2xl uppercase tracking-widest hover:scale-105 transition-transform">
            <span className="w-6 h-6 rounded-full bg-accent-red flex-shrink-0 group-hover:scale-125 transition-transform shadow-[0_0_12px_rgba(219,33,0,0.7)]" />
            Book Now
          </button>
          <a
            href="tel:4708133745"
            className="group flex min-h-11 items-center gap-3 font-display text-xl md:text-2xl uppercase tracking-widest hover:scale-105 transition-transform"
          >
            Contact
            <span className="w-6 h-6 rounded-full bg-accent-blue flex-shrink-0 group-hover:scale-125 transition-transform shadow-[0_0_12px_rgba(0,0,238,0.7)]" />
          </a>
        </motion.div>
      </section>

      {/* The Factory — intro */}
      <section id="about" className="py-24 bg-black text-white">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <FadeIn>
            <h2 className="font-display uppercase leading-none mb-10" style={{ fontSize: "clamp(3.5rem, 14vw, 8rem)" }}>
              The Factory
            </h2>
            <p className="text-lg md:text-xl leading-relaxed text-gray-200">
              {bioData?.value ?? FALLBACK_BIO}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Meet the Barbers */}
      <section id="team" className="py-24 bg-black text-white relative overflow-hidden">
        {/* subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 70%)" }} />

        <div className="container mx-auto px-6 relative z-10">
          <FadeIn className="text-center mb-16">
            <h2 className="font-display uppercase leading-none mb-3" style={{ fontSize: "clamp(3rem, 10vw, 7rem)", background: "linear-gradient(180deg, #ffffff 40%, #888 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Meet the Barbers
            </h2>
            <p className="text-gray-400 uppercase tracking-[0.3em] text-sm font-bold">
              The Hands Behind Every Cut
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {barbersData === undefined
              ? [0, 1].map(i => (
                  <div key={i} className="rounded-2xl overflow-hidden bg-black border border-white/10 animate-pulse">
                    <div className="h-72 bg-white/10" />
                    <div className="p-6 flex flex-col gap-3">
                      <div className="h-10 bg-white/10 rounded w-3/4" />
                      <div className="h-4 bg-white/10 rounded w-full" />
                      <div className="h-4 bg-white/10 rounded w-5/6" />
                      <div className="h-12 bg-white/10 rounded mt-4" />
                    </div>
                  </div>
                ))
              : barbersData.map((barber, idx) => (
              <FadeIn key={barber.id} delay={0.1 + idx * 0.1}>
                <div className="rounded-2xl overflow-hidden bg-black border border-white/10 flex flex-col">
                  <div className="relative h-72 overflow-hidden">
                    {barber.photoUrl && (
                      <img
                        src={barber.photoUrl}
                        alt={`${barber.name} — ${barber.title}`}
                        className="w-full h-full object-cover object-top"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span
                        className="inline-block text-xs font-black uppercase tracking-widest px-4 py-2 w-full text-center"
                        style={{ background: barber.accentColor, color: isLightAccent(barber.accentColor) ? "#000000" : "#FFFFFF" }}
                      >
                        {barber.title}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-display text-5xl uppercase text-white mb-4 leading-none">{barber.name}</h3>
                    {barber.bio && (
                      <p className="text-gray-300 text-sm leading-relaxed mb-6">{barber.bio}</p>
                    )}
                    {barber.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {barber.specialties.map((tag) => (
                          <span key={tag} className="text-xs font-bold uppercase tracking-widest border border-white/30 px-3 py-1.5 rounded-full text-gray-300">{tag}</span>
                        ))}
                      </div>
                    )}
                    <a
                      href={BARBER_BOOKSY[barber.name.toLowerCase()] ?? BOOKSY_DEFAULT}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto block w-full font-black uppercase tracking-widest text-sm py-4 text-center hover:brightness-110 transition-all"
                      style={{ background: barber.accentColor, color: isLightAccent(barber.accentColor) ? "#000000" : "#FFFFFF" }}
                    >
                      Book with {barber.name}
                    </a>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-black text-white relative overflow-hidden">
        {/* faint background text */}
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        >
          <span
            className="font-display uppercase text-white/[0.03] leading-none"
            style={{ fontSize: "clamp(8rem, 30vw, 22rem)", whiteSpace: "nowrap" }}
          >
            Prices
          </span>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <FadeIn>
            <h2 className="font-display text-6xl md:text-8xl uppercase mb-4 text-center text-accent-red">
              Services
            </h2>
            <p className="text-center text-gray-400 font-medium mb-16 uppercase tracking-widest text-sm">
              Book now — walk-ins welcome
            </p>
          </FadeIn>

          <div className="max-w-2xl mx-auto">
            {[
              { service: "Male Haircut",              note: "40 min" },
              { service: "Line Up",                   note: "30 min" },
              { service: "Beard Shaping",             note: "30 min" },
              { service: "Dreadlock Line Up & Taper", note: "30 min" },
              { service: "Head Shave & Beard Groom",  note: "30 min" },
              { service: "Head Shave",                note: "30 min" },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.07}>
                <button onClick={() => setIsPickerOpen(true)} className="w-full text-left">
                  <div className="flex items-center justify-between py-5 border-b border-white/10 group hover:border-accent-red/60 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <ChevronRight size={16} className="text-accent-red opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      <div>
                        <span className="font-bold text-lg md:text-xl uppercase tracking-wide group-hover:text-accent-red transition-colors">
                          {item.service}
                        </span>
                        <span className="block text-xs text-gray-500 mt-0.5 uppercase tracking-widest">
                          {item.note} — tap to book
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.5} className="mt-14 text-center">
            <button onClick={() => setIsPickerOpen(true)} className="inline-flex items-center gap-3 bg-accent-yellow text-black font-bold uppercase tracking-widest text-sm px-10 py-4 hover:bg-white transition-colors">
              <span className="w-4 h-4 rounded-full bg-accent-red flex-shrink-0" />
              Book Now
            </button>
          </FadeIn>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <FadeIn>
            <h2 className="font-display text-6xl md:text-8xl uppercase mb-4 text-center text-accent-yellow">
              Gallery
            </h2>
            <p className="text-center text-gray-500 text-xs uppercase tracking-[0.25em] mb-12 font-bold">
              Follow us{" "}
              <a
                href="https://www.instagram.com/fadefactory_atl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-accent-yellow transition-colors underline underline-offset-2"
              >
                @fadefactory_atl
              </a>{" "}
              for the latest work
            </p>
          </FadeIn>

          <FadeIn>
            <GalleryCarousel images={galleryImages} />
          </FadeIn>

          <FadeIn delay={0.4} className="mt-10 flex justify-center">
            <a
              href="https://www.instagram.com/fadefactory_atl"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-white/20 px-8 py-3 text-xs font-black uppercase tracking-widest text-white hover:border-accent-yellow hover:text-accent-yellow transition-colors rounded-full"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              See More on Instagram
            </a>
          </FadeIn>
        </div>
      </section>

      {/* Barber Pole Divider */}
      <BarberPoleDivider />

      {/* Reviews Section */}
      <section className="py-24 bg-black text-white relative overflow-hidden">
        <div className="container mx-auto px-6">
          {/* Header row */}
          <FadeIn className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <h2
              className="font-display uppercase leading-none"
              style={{
                fontSize: "clamp(2.5rem, 8vw, 6rem)",
                color: "#DB2100",
                textShadow: "0 0 30px rgba(219,33,0,0.4)",
              }}
            >
              What Clients Say
            </h2>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="font-display text-4xl text-accent-yellow">5.0</span>
              <div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent-red text-accent-red" />
                  ))}
                </div>
                <p className="text-gray-400 text-xs uppercase tracking-widest mt-1">249 Google Reviews</p>
              </div>
            </div>
          </FadeIn>

          {/* 2×2 card grid */}
          <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
            {reviews.map((review, index) => (
              <FadeIn key={index} delay={index * 0.12}>
                <div className="bg-[#111827] rounded-2xl p-6 flex flex-col gap-4 border border-white/5 h-full">
                  {/* Stars */}
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-accent-red text-accent-red" />
                    ))}
                  </div>
                  {/* Quote */}
                  <p className="text-white/90 text-base leading-relaxed flex-1">
                    "{review.body}"
                  </p>
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="font-black text-sm uppercase tracking-widest text-white">
                      {review.name}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-gray-500">
                      {review.service}
                    </span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* CTA pill */}
          <FadeIn delay={0.5} className="mt-12 flex justify-center">
            <a
              href="https://www.google.com/maps/place/Fade+Factory+ATL/@33.7820,-84.4043,17z"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/30 rounded-full px-8 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-colors"
            >
              Read All Reviews on Google
              <span>→</span>
            </a>
          </FadeIn>
        </div>
      </section>

      {/* Contact & Footer */}
      <footer id="contact" className="bg-black pt-24 pb-12 border-t-4 border-white/10">
        <div className="container mx-auto px-6">
          {/* Map — full width above the columns */}
          <FadeIn className="mb-12">
            <h3 className="font-display text-4xl text-accent-yellow uppercase mb-6">Find Us</h3>
            <div className="w-full rounded-none overflow-hidden border-2 border-white/20" style={{ height: 280 }}>
              <iframe
                title="Fade Factory ATL location"
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://maps.google.com/maps?q=1000+Northside+Dr+NW+%23206,+Atlanta,+GA+30318&output=embed&zoom=16"
                style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) brightness(0.85) contrast(1.1)" }}
                allowFullScreen
              />
            </div>
            <a
              href="https://maps.google.com/?q=1000+Northside+Dr+NW+%23206+Atlanta+GA+30318"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 font-bold text-sm uppercase tracking-widest text-gray-400 hover:text-accent-yellow transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Get Directions
            </a>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <FadeIn>
              <h3 className="font-display text-4xl text-accent-yellow uppercase mb-6">Location</h3>
              <a
                href="https://maps.google.com/?q=1000+Northside+Dr+NW+%23206,+Atlanta,+GA+30318"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 group"
              >
                <MapPin className="w-6 h-6 text-white shrink-0 mt-1 group-hover:text-accent-yellow transition-colors" />
                <p className="font-medium text-lg text-gray-300 group-hover:text-white transition-colors">
                  1000 Northside Dr NW #206<br />
                  Atlanta, GA 30318<br />
                  <span className="text-sm text-gray-500 group-hover:text-gray-400 block mt-2 transition-colors">(Inside My Salon Suites)</span>
                </p>
              </a>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h3 className="font-display text-4xl text-accent-yellow uppercase mb-6">Contact</h3>
              <div className="space-y-4">
                <a href="tel:4708133745" className="flex items-center gap-4 group">
                  <Phone className="w-6 h-6 text-white group-hover:text-accent-red transition-colors" />
                  <span className="font-medium text-lg text-gray-300 group-hover:text-white transition-colors">(470) 813-3745</span>
                </a>
                <a href="https://www.instagram.com/fadefactory_atl/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                  <Instagram className="w-6 h-6 text-white group-hover:text-accent-red transition-colors" />
                  <span className="font-medium text-lg text-gray-300 group-hover:text-white transition-colors">@fadefactory_atl</span>
                </a>
              </div>
            </FadeIn>

            <FadeIn delay={0.2} className="lg:col-span-2">
              <h3 className="font-display text-4xl text-accent-yellow uppercase mb-6">Hours</h3>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 font-medium text-gray-300">
                <div className="flex justify-between border-b border-white/10 pb-2"><span>Sunday</span> <span>9 AM – 7 PM</span></div>
                <div className="flex justify-between border-b border-white/10 pb-2"><span>Monday</span> <span className="text-white/60 italic">Appointment Only</span></div>
                <div className="flex justify-between border-b border-white/10 pb-2"><span>Tuesday</span> <span className="text-white/60 italic">Appointment Only</span></div>
                <div className="flex justify-between border-b border-white/10 pb-2"><span>Wednesday</span> <span>9 AM – 7 PM</span></div>
                <div className="flex justify-between border-b border-white/10 pb-2"><span>Thursday</span> <span>9 AM – 7 PM</span></div>
                <div className="flex justify-between border-b border-white/10 pb-2"><span>Friday</span> <span>9 AM – 7 PM</span></div>
                <div className="flex justify-between border-b border-white/10 pb-2"><span>Saturday</span> <span>9 AM – 7 PM</span></div>
              </div>
            </FadeIn>
          </div>

          <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <p className="font-bold text-gray-500 uppercase tracking-widest text-sm">
                &copy; {new Date().getFullYear()} Fade Factory ATL. All Rights Reserved.
              </p>
              <a href={`${import.meta.env.BASE_URL}login`} className="text-gray-600 text-xs uppercase tracking-widest hover:text-gray-400 transition-colors">
                Staff Login
              </a>
            </div>
            <button onClick={() => setIsPickerOpen(true)} className="bg-accent-red text-white font-bold uppercase tracking-widest text-sm px-8 py-3 hover:bg-white hover:text-black transition-colors">
              Book Now
            </button>
          </div>
        </div>
      </footer>
      <BarberPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        barbers={barbersData}
      />
    </div>
  );
}

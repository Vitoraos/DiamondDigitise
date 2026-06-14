"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  animate,
  stagger,
} from "framer-motion";

// ─── DESIGN TOKENS ───────────────────────────────────────────────
const C = {
  void: "#0A0F1E",
  depth: "#0F1E3A",
  surface: "#111827",
  gold: "#C9A84C",
  goldDim: "rgba(201,168,76,0.15)",
  white: "#F5F3EE",
  dim: "rgba(245,243,238,0.5)",
  ghost: "rgba(245,243,238,0.08)",
};

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://your-render-url.com/api";

// ─── FONT INJECTION ──────────────────────────────────────────────
const FontStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html { scroll-behavior: smooth; }

    body {
      background: ${C.void};
      color: ${C.white};
      font-family: 'Plus Jakarta Sans', sans-serif;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    ::selection { background: ${C.gold}; color: ${C.void}; }

    ::-webkit-scrollbar { width: 2px; }
    ::-webkit-scrollbar-track { background: ${C.void}; }
    ::-webkit-scrollbar-thumb { background: ${C.gold}; }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `}</style>
);

// ─── GOLD LINE DIVIDER ───────────────────────────────────────────
const GoldLine = ({ delay = 0 }) => (
  <motion.div
    initial={{ scaleX: 0, originX: 0 }}
    whileInView={{ scaleX: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
    style={{
      height: "1px",
      background: `linear-gradient(90deg, ${C.gold}, transparent)`,
      marginBottom: "2rem",
    }}
  />
);

// ─── HERO SECTION ────────────────────────────────────────────────
const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const words = ["Diamond", "Residence."];
  const subWords = ["Nothing", "more.", "Nothing", "less."];

  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        height: "100svh",
        minHeight: "600px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(160deg, ${C.void} 0%, ${C.depth} 60%, #0A1628 100%)`,
      }} />

      {/* Desktop hero image placeholder */}
      <div
        className="hero-desktop-img"
        style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('/images/hero-desktop.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.18,
        }}
      />

      {/* Mobile hero image placeholder */}
      <div
        className="hero-mobile-img"
        style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('/images/hero-mobile.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.18,
        }}
      />

      {/* Gold corner accent */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: "1px", height: "40vh",
        background: `linear-gradient(180deg, transparent, ${C.gold}, transparent)`,
        opacity: 0.4,
      }} />

      {/* Scrolling content */}
      <motion.div
        style={{ y, opacity, position: "relative", zIndex: 2, textAlign: "center", padding: "0 1.5rem" }}
      >
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.4em" }}
          animate={{ opacity: 0.5, letterSpacing: "0.35em" }}
          transition={{ duration: 1.4, delay: 0.2 }}
          style={{
            fontSize: "0.65rem",
            fontWeight: 500,
            color: C.gold,
            textTransform: "uppercase",
            marginBottom: "2rem",
          }}
        >
          Orhuwhorun · Delta State
        </motion.p>

        {/* Headline — word by word */}
        <h1 style={{
          fontSize: "clamp(2.8rem, 8vw, 7rem)",
          fontWeight: 800,
          lineHeight: 1.0,
          letterSpacing: "-0.03em",
          color: C.white,
          marginBottom: "0.3rem",
        }}>
          {words.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.5 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "inline-block", marginRight: "0.25em" }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Sub-headline */}
        <div style={{
          fontSize: "clamp(2rem, 5.5vw, 4.8rem)",
          fontWeight: 800,
          lineHeight: 1.0,
          letterSpacing: "-0.03em",
          color: C.gold,
          marginBottom: "2rem",
        }}>
          {subWords.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.8 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "inline-block", marginRight: "0.25em" }}
            >
              {word}
            </motion.span>
          ))}
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1.2, delay: 1.4 }}
          style={{
            fontSize: "clamp(0.85rem, 2vw, 1.05rem)",
            fontWeight: 300,
            color: C.white,
            letterSpacing: "0.08em",
            marginBottom: "3rem",
          }}
        >
          Where calm meets amenity.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}
        >
          <BookNowButton href="/rooms" />
          <AdminButton href="/admin" />
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        style={{
          position: "absolute", bottom: "2rem", left: "50%",
          transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
        }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{ width: "1px", height: "40px", background: `linear-gradient(180deg, ${C.gold}, transparent)` }}
        />
        <span style={{ fontSize: "0.55rem", letterSpacing: "0.2em", color: C.dim, textTransform: "uppercase" }}>
          Scroll
        </span>
      </motion.div>

      <style>{`
        .hero-desktop-img { display: none; }
        .hero-mobile-img { display: block; }
        @media (min-width: 768px) {
          .hero-desktop-img { display: block; }
          .hero-mobile-img { display: none; }
        }
      `}</style>
    </section>
  );
};

// ─── PRIMARY CTA BUTTON ──────────────────────────────────────────
const BookNowButton = ({ href }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-block",
        padding: "0.9rem 2.5rem",
        background: hovered ? C.white : C.gold,
        color: C.void,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: "0.8rem",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        textDecoration: "none",
        transition: "background 0.3s ease, transform 0.2s ease",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
    >
      Book Now
    </a>
  );
};

// ─── GHOST BUTTON ────────────────────────────────────────────────
const AdminButton = ({ href }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-block",
        padding: "0.9rem 2.5rem",
        border: `1px solid rgba(245,243,238,${hovered ? 0.5 : 0.2})`,
        color: hovered ? C.white : C.dim,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: "0.8rem",
        fontWeight: 500,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        textDecoration: "none",
        transition: "all 0.3s ease",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
    >
      Admin Login
    </a>
  );
};

// ─── SECTION 2 — THE EXPERIENCE ──────────────────────────────────
const lines = [
  "Some places host you.",
  "Diamond Residence receives you.",
  "Leave the noise in the rearview.",
  "Orhuwhorun doesn't rush.",
  "Neither do we.",
];

const Experience = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      style={{
        minHeight: "100svh",
        display: "flex",
        alignItems: "center",
        padding: "6rem 1.5rem",
        position: "relative",
        overflow: "hidden",
        background: C.void,
      }}
    >
      <div style={{
        maxWidth: "1200px", margin: "0 auto", width: "100%",
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "3rem",
      }}
        className="experience-grid"
      >
        {/* Left — Text */}
        <div>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            style={{
              fontSize: "0.65rem",
              fontWeight: 500,
              color: C.gold,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: "2rem",
            }}
          >
            The Experience
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.1 }}
            style={{
              fontSize: "clamp(2rem, 5vw, 3.8rem)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: C.white,
              marginBottom: "3rem",
            }}
          >
            Step out of<br />
            <span style={{ color: C.gold }}>everything.</span>
          </motion.h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {lines.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.3 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
                  fontWeight: i === 0 || i === 3 ? 300 : 400,
                  color: i === 1 || i === 4 ? C.white : C.dim,
                  lineHeight: 1.5,
                  borderLeft: i === 1 ? `2px solid ${C.gold}` : "2px solid transparent",
                  paddingLeft: "1rem",
                }}
              >
                {line}
              </motion.p>
            ))}
          </div>
        </div>

        {/* Right — Image with gold wipe */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "relative", overflow: "hidden" }}
        >
          {/* Image — 3:4 ratio */}
          <div style={{
            aspectRatio: "3/4",
            background: `linear-gradient(135deg, ${C.depth} 0%, #0A1628 100%)`,
            backgroundImage: "url('/images/experience.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
          }}>
            {/* Gold wipe overlay */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={inView ? { scaleX: 0 } : {}}
              transition={{ duration: 1.4, delay: 0.6, ease: [0.76, 0, 0.24, 1] }}
              style={{
                position: "absolute", inset: 0,
                background: C.gold,
                transformOrigin: "right",
              }}
            />
          </div>
        </motion.div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .experience-grid {
            grid-template-columns: 1fr 1fr !important;
            align-items: center;
          }
        }
      `}</style>
    </section>
  );
};

// ─── SECTION 3 — THE CALM ────────────────────────────────────────
const Calm = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1.0, 1.05]);
  const textY = useTransform(scrollYProgress, [0.2, 0.6], ["20px", "0px"]);
  const textOpacity = useTransform(scrollYProgress, [0.2, 0.45, 0.75, 0.9], [0, 1, 1, 0]);

  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        overflow: "hidden",
        height: "70vw",
        maxHeight: "700px",
        minHeight: "320px",
      }}
    >
      {/* Cinematic image 21:9 */}
      <motion.div
        style={{
          scale,
          position: "absolute", inset: "-10%",
          backgroundImage: "url('/images/calm.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          background: `linear-gradient(135deg, ${C.depth}, #061020)`,
        }}
      />

      {/* Dark overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(10,15,30,0.5) 0%, rgba(10,15,30,0.3) 50%, rgba(10,15,30,0.7) 100%)",
      }} />

      {/* Centered text */}
      <motion.div
        style={{
          y: textY,
          opacity: textOpacity,
          position: "absolute", inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <p style={{
          fontSize: "clamp(1.4rem, 4vw, 3rem)",
          fontWeight: 300,
          color: C.white,
          letterSpacing: "-0.01em",
          lineHeight: 1.3,
          maxWidth: "700px",
        }}>
          You'll remember what rest<br />
          <span style={{ fontWeight: 700, color: C.white }}>actually feels like.</span>
        </p>
      </motion.div>
    </section>
  );
};

// ─── SECTION 4 — ROOM CARDS ──────────────────────────────────────
const RoomCard = ({ category, index }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [hovered, setHovered] = useState(false);

  const imageUrl = category.image_urls?.[0] || null;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.surface,
        border: `1px solid ${hovered ? C.gold : "rgba(245,243,238,0.06)"}`,
        overflow: "hidden",
        transition: "border-color 0.4s ease",
        cursor: "pointer",
      }}
    >
      {/* Image — 4:3 */}
      <div style={{
        aspectRatio: "4/3",
        background: `linear-gradient(135deg, ${C.depth}, #061020)`,
        backgroundImage: imageUrl ? `url('${imageUrl}')` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        overflow: "hidden",
        position: "relative",
      }}>
        <motion.div
          animate={{ scale: hovered ? 1.04 : 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "absolute", inset: 0,
            backgroundImage: imageUrl ? `url('${imageUrl}')` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            background: !imageUrl ? `linear-gradient(135deg, ${C.depth} 0%, #061020 100%)` : undefined,
          }}
        />

        {/* Category badge */}
        <div style={{
          position: "absolute", top: "1rem", left: "1rem",
          background: "rgba(10,15,30,0.8)",
          border: `1px solid ${C.gold}`,
          padding: "0.25rem 0.75rem",
          fontSize: "0.6rem",
          fontWeight: 600,
          color: C.gold,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}>
          {index === 0 ? "Signature" : index === 1 ? "Premium" : "Classic"}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "1.5rem" }}>
        <h3 style={{
          fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)",
          fontWeight: 700,
          color: C.white,
          marginBottom: "0.5rem",
          letterSpacing: "-0.01em",
        }}>
          {category.name}
        </h3>

        <p style={{
          fontSize: "0.82rem",
          fontWeight: 300,
          color: C.dim,
          lineHeight: 1.6,
          marginBottom: "1.5rem",
          minHeight: "2.5rem",
        }}>
          {category.description || "A carefully considered space designed for genuine rest."}
        </p>

        {/* Price with gold underline sweep */}
        <div style={{ position: "relative", display: "inline-block" }}>
          <p style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: C.white,
            marginBottom: "0.25rem",
          }}>
            ₦{category.price_per_night?.toLocaleString()} <span style={{ fontWeight: 300, fontSize: "0.8rem", color: C.dim }}>/night</span>
          </p>
          <motion.div
            animate={{ scaleX: hovered ? 1 : 0 }}
            initial={{ scaleX: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              height: "1px",
              background: C.gold,
              transformOrigin: "left",
            }}
          />
        </div>

        {/* Book CTA — appears on hover */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 8 }}
          transition={{ duration: 0.3 }}
          style={{ marginTop: "1.25rem" }}
        >
          <a
            href="/rooms"
            style={{
              display: "inline-block",
              padding: "0.6rem 1.5rem",
              border: `1px solid ${C.gold}`,
              color: C.gold,
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textDecoration: "none",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Book Now
          </a>
        </motion.div>
      </div>
    </motion.div>
  );
};

const Rooms = ({ categories }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section style={{ padding: "8rem 1.5rem", background: C.void }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <GoldLine delay={0} />

        <div ref={ref} style={{ marginBottom: "4rem" }}>
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8 }}
            style={{
              fontSize: "0.65rem",
              fontWeight: 500,
              color: C.gold,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            The Space
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.1 }}
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: C.white,
            }}
          >
            Choose your room.
          </motion.h2>
        </div>

        {/* Cards grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "1.5rem",
        }} className="rooms-grid">
          {categories.map((cat, i) => (
            <RoomCard key={cat.id} category={cat} index={i} />
          ))}
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) {
          .rooms-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 1024px) {
          .rooms-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </section>
  );
};

// ─── SECTION 5 — CTA ─────────────────────────────────────────────
const CtaSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      style={{
        padding: "10rem 1.5rem",
        background: `linear-gradient(180deg, ${C.void} 0%, ${C.depth} 100%)`,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "600px", height: "400px",
        background: `radial-gradient(ellipse, ${C.goldDim} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 0.5 } : {}}
          transition={{ duration: 0.8 }}
          style={{
            fontSize: "0.65rem",
            fontWeight: 500,
            color: C.gold,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginBottom: "2rem",
          }}
        >
          Ready
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: "clamp(2.4rem, 7vw, 6rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.0,
            color: C.white,
            marginBottom: "3.5rem",
          }}
        >
          Rest is one<br />
          <span style={{ color: C.gold }}>step away.</span>
        </motion.h2>

        {/* Self-drawing border button */}
        <DrawingBorderButton href="/rooms" />

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 0.3 } : {}}
          transition={{ duration: 1, delay: 0.8 }}
          style={{
            marginTop: "2.5rem",
            fontSize: "0.7rem",
            fontWeight: 400,
            color: C.white,
            letterSpacing: "0.1em",
          }}
        >
          Diamond Residence · Orhuwhorun, Delta State
        </motion.p>
      </div>
    </section>
  );
};

// Self-drawing border button
const DrawingBorderButton = ({ href }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [hovered, setHovered] = useState(false);

  return (
    <div ref={ref} style={{ display: "inline-block", position: "relative" }}>
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
      >
        <motion.rect
          x="0.5%" y="0.5%" width="99%" height="99%"
          fill="none"
          stroke={C.gold}
          strokeWidth="0.02"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <motion.a
        href={href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        animate={{ background: hovered ? C.gold : "transparent", color: hovered ? C.void : C.gold }}
        transition={{ duration: 0.3 }}
        style={{
          display: "inline-block",
          padding: "1.1rem 3.5rem",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: "0.8rem",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          textDecoration: "none",
          color: C.gold,
        }}
      >
        Book Your Stay
      </motion.a>
    </div>
  );
};

// ─── FOOTER ──────────────────────────────────────────────────────
const Footer = () => (
  <footer style={{
    background: "#070C17",
    padding: "4rem 1.5rem 3rem",
    borderTop: `1px solid rgba(201,168,76,0.12)`,
  }}>
    <div style={{
      maxWidth: "1200px", margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: "2.5rem",
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }} className="footer-grid">
        {/* Brand */}
        <div>
          <p style={{
            fontSize: "1.1rem",
            fontWeight: 800,
            color: C.white,
            letterSpacing: "-0.02em",
            marginBottom: "0.5rem",
          }}>
            Diamond Residence
          </p>
          <p style={{ fontSize: "0.75rem", color: C.dim, fontWeight: 300 }}>
            Where calm meets amenity.
          </p>
        </div>

        {/* Location */}
        <div>
          <p style={{ fontSize: "0.6rem", color: C.gold, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Find Us
          </p>
          <p style={{ fontSize: "0.8rem", color: C.dim, lineHeight: 1.8, fontWeight: 300 }}>
            Orhuwhorun<br />
            Delta State, Nigeria
          </p>
        </div>

        {/* Links */}
        <div>
          <p style={{ fontSize: "0.6rem", color: C.gold, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Access
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <a href="/rooms" style={{ fontSize: "0.8rem", color: C.dim, textDecoration: "none", fontWeight: 300 }}>
              Book a Room
            </a>
            <a href="/admin" style={{ fontSize: "0.8rem", color: C.dim, textDecoration: "none", fontWeight: 300, opacity: 0.6 }}>
              Staff Login
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        paddingTop: "2rem",
        borderTop: "1px solid rgba(245,243,238,0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
      }}>
        <p style={{ fontSize: "0.65rem", color: C.dim, opacity: 0.4, fontWeight: 300 }}>
          © {new Date().getFullYear()} Diamond Residence. All rights reserved.
        </p>
        <div style={{ width: "24px", height: "1px", background: C.gold, opacity: 0.4 }} />
      </div>
    </div>

    <style>{`
      @media (min-width: 768px) {
        .footer-grid {
          flex-direction: row !important;
          justify-content: space-between;
        }
      }
    `}</style>
  </footer>
);

// ─── ROOT PAGE ───────────────────────────────────────────────────
export default function DiamondResidenceLanding() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/rooms/categories`)
      .then((r) => r.json())
      .then((json) => {
        // Sort by display_order, highest tier first
        const sorted = (json.data || []).sort(
          (a, b) => (b.display_order ?? 0) - (a.display_order ?? 0)
        );
        setCategories(sorted);
      })
      .catch(() => {
        // Fallback if API unreachable during dev
        setCategories([
          { id: "1", name: "Executive Lounge", price_per_night: 45000, description: "", display_order: 3 },
          { id: "2", name: "Deluxe", price_per_night: 25000, description: "", display_order: 2 },
          { id: "3", name: "Standard", price_per_night: 15000, description: "", display_order: 1 },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <FontStyle />
      <main>
        <Hero />
        <Experience />
        <Calm />
        {!loading && <Rooms categories={categories} />}
        <CtaSection />
        <Footer />
      </main>
    </>
  );
}

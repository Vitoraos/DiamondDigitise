"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRooms } from "@/hooks/queries/useRooms";
import { RoomCard } from "@/components/public/RoomCard";
import { Spinner, Skeleton } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Hotel } from "lucide-react";

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-depth">
        <Image
          src="/images/hero-desktop.jpg"
          alt="Diamond Residence"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-void/60 via-transparent to-void" />
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-label mb-6"
        >
          Welcome to
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-display text-white mb-8"
        >
          Diamond<br />Residence
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-body text-lg max-w-xl mx-auto mb-12"
        >
          Experience quiet vintage luxury in the heart of the city. 
          Where timeless elegance meets modern comfort.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href="/rooms">
            <Button size="lg">Book Your Stay</Button>
          </Link>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <div className="w-px h-16 bg-gradient-to-b from-gold to-transparent" />
      </motion.div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="section-padding bg-void">
      <div className="container-custom">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-label mb-4">Our Story</p>
            <h2 className="text-h2 text-white mb-6">
              A Legacy of<br />Refined Hospitality
            </h2>
            <p className="text-body mb-6">
              Since 1987, Diamond Residence has been a sanctuary for discerning travelers. 
              Our commitment to impeccable service and attention to detail has earned us 
              a reputation as one of the finest boutique hotels in the region.
            </p>
            <p className="text-body">
              Each room is thoughtfully appointed with vintage furnishings, premium linens, 
              and modern amenities to ensure your stay is both comfortable and memorable.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="aspect-[3/4] relative bg-depth"
          >
            <Image
              src="/images/experience.jpg"
              alt="Hotel Experience"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function RoomsPreview() {
  const { data: rooms, isLoading, error } = useRooms();

  return (
    <section className="section-padding bg-depth">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <p className="text-label mb-4">Accommodations</p>
          <h2 className="text-h2 text-white">Curated Spaces</h2>
        </motion.div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/3] skeleton-shimmer" />
            ))}
          </div>
        )}

        {error && (
          <ErrorState 
            message="Unable to load rooms. Please check your connection and try again."
            onRetry={() => window.location.reload()}
          />
        )}

        {rooms && rooms.length === 0 && (
          <EmptyState title="No rooms available" description="Please check back later for availability." />
        )}

        {rooms && rooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.slice(0, 3).map((room: any, i: number) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <RoomCard room={room} />
              </motion.div>
            ))}
          </div>
        )}

        {rooms && rooms.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="/rooms">
              <Button variant="outline">View All Rooms</Button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="section-padding bg-void relative overflow-hidden">
      <div className="absolute inset-0 bg-depth">
        <Image
          src="/images/calm.jpg"
          alt="Calm atmosphere"
          fill
          className="object-cover opacity-30"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/80 to-transparent" />
      </div>
      <div className="container-custom relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-label mb-4">Begin Your Journey</p>
          <h2 className="text-h2 text-white mb-8">
            Reserve Your<br />Experience
          </h2>
          <p className="text-body max-w-xl mx-auto mb-12">
            Whether for business or leisure, allow us to craft a stay that exceeds 
            every expectation. Your room awaits.
          </p>
          <Link href="/rooms">
            <Button size="lg">Book Now</Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <main className="bg-void">
      <header className="fixed top-0 left-0 right-0 z-50 bg-void/80 backdrop-blur-sm border-b border-ghost">
        <div className="container-custom h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Hotel className="h-6 w-6 text-gold" strokeWidth={1.5} />
            <span className="text-sm font-bold tracking-[0.2em] uppercase text-white">
              Diamond Residence
            </span>
          </Link>
          <Link href="/rooms">
            <Button size="sm">Book Now</Button>
          </Link>
        </div>
      </header>

      <Hero />
      <AboutSection />
      <RoomsPreview />
      <FinalCTA />

      <footer className="bg-void border-t border-ghost py-12">
        <div className="container-custom text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Hotel className="h-5 w-5 text-gold" strokeWidth={1.5} />
            <span className="text-sm font-bold tracking-[0.2em] uppercase text-white">
              Diamond Residence
            </span>
          </div>
          <p className="text-xs text-dim">
            © {new Date().getFullYear()} Diamond Residence. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}

'use client'

// components/ui/GoldLine.jsx
// Animated gold divider — used at the top of every section

import { motion } from 'framer-motion'

export default function GoldLine({ delay = 0, mb = '2rem' }) {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{
        height: '1px',
        background: 'linear-gradient(90deg, #C9A84C, transparent)',
        transformOrigin: 'left',
        marginBottom: mb,
      }}
    />
  )
}

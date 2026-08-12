import { Variants } from 'framer-motion';

export const customEase = [0.25, 0.1, 0.25, 1] as const;

// Stagger parent container
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

// Fade up animation variant
export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: customEase,
    },
  },
};

// Slide in right variant (for feature rows)
export const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 24,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.55,
      ease: customEase,
    },
  },
};

// Subtle scale variant (for step numbers and icon badges)
export const subtleScale: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.88,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: customEase,
    },
  },
};

// Footer subtle fade-in variant
export const footerFade: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: customEase,
    },
  },
};

// Solution fade variant (for card solution reveal with 150ms delay)
export const solutionFade: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      delay: 0.15,
      ease: customEase,
    },
  },
};

// Reduced motion fallback variant
export const reducedMotionFade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4 },
  },
};

import { motion, useReducedMotion } from "motion/react";

export function Reveal({
  children,
  className,
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reducedMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : "hidden"}
      whileInView={reducedMotion ? {} : "visible"}
      viewport={{ once: true, amount: 0.12 }}
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={
        reducedMotion
          ? {}
          : {
              hidden: { opacity: 0, y: 18, scale: 0.985 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.48, ease: [0.16, 1, 0.3, 1] }
              }
            }
      }
    >
      {children}
    </motion.div>
  );
}

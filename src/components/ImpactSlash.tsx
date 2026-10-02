import { motion } from "motion/react";

function ImpactSlash() {
  const fragments = [
    { x: -320, y: -190, rotate: -25, delay: 0.14, scale: 0.8 },
    { x: 300, y: -160, rotate: 25, delay: 0.17, scale: 0.65 },
    { x: -350, y: 130, rotate: 20, delay: 0.2, scale: 0.6 },
    { x: 340, y: 150, rotate: -20, delay: 0.22, scale: 0.75 },
    { x: -140, y: 260, rotate: 35, delay: 0.25, scale: 0.5 },
    { x: 150, y: -270, rotate: -30, delay: 0.27, scale: 0.55 },
  ];

  return (
    <div className="impact-slash" aria-hidden="true">
      {/* Flash */}

      <motion.div
        className="impact-flash"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: [0, 0.7, 0],
          scale: [0.8, 1.1, 1.3],
        }}
        transition={{
          duration: 0.3,
          delay: 0.25,
        }}
      />

      {/* Slash */}

      <svg
        className="impact-svg"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >
        <motion.path
          className="impact-slash-shadow"
          d="M -100 1100 L 1100 -100"
          initial={{ pathLength: 0 }}
          animate={{
            pathLength: [0, 1, 1],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 0.4,
            delay: 0.08,
          }}
        />

        <motion.path
          className="impact-slash-main"
          d="M -100 1100 L 1100 -100"
          initial={{ pathLength: 0 }}
          animate={{
            pathLength: [0, 1, 1],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 0.36,
            delay: 0.1,
          }}
        />

        <motion.path
          className="impact-slash-secondary"
          d="M -120 1080 L 1080 -120"
          initial={{ pathLength: 0 }}
          animate={{
            pathLength: [0, 1, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 0.3,
            delay: 0.14,
          }}
        />
      </svg>

      {/* Triangular fragments */}

      <div className="impact-particles">
        {fragments.map((fragment, index) => (
          <motion.span
            key={index}
            className="impact-particle"
            initial={{
              x: 0,
              y: 0,
              scale: 0,
              opacity: 0,
              rotate: fragment.rotate,
            }}
            animate={{
              x: fragment.x,
              y: fragment.y,
              scale: [0, fragment.scale, 0],
              opacity: [0, 1, 0],
              rotate: fragment.rotate + 45,
            }}
            transition={{
              duration: 0.55,
              delay: fragment.delay,
            }}
          />
        ))}
      </div>

      {/* Simple burst */}

      <motion.div
        className="impact-burst"
        initial={{
          scale: 0,
          opacity: 0,
        }}
        animate={{
          scale: [0, 1, 0],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 0.3,
          delay: 0.22,
        }}
      />
    </div>
  );
}

export default ImpactSlash;

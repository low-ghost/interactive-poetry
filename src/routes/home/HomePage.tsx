import { ReactP5Wrapper } from '@p5-wrapper/react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { sketch as forestSketch } from '@routes/forest/ForestCanvas';
import { sketch as rippleSketch } from '@routes/ripple/RippleCanvas';
import { sketch as simpleDemoSketch } from '@routes/simple-demo/SimpleDemoCanvas';
import { sketch as towardsSketch } from '@routes/towards/TowardsCanvas';

const GITHUB_URL = 'https://github.com/low-ghost/interactive-poetry';
const SLIDES_URL =
  'https://low-ghost.github.io/interactive-poetry/slides/slides.html';

// Preview components that use the sketch without controls
const SimpleDemoPreview = () => (
  <div className="w-full h-full">
    <ReactP5Wrapper sketch={simpleDemoSketch} cursorColor={100} />
  </div>
);

const RipplePreview = () => (
  <div className="w-full h-full">
    <ReactP5Wrapper
      sketch={rippleSketch}
      background={true}
      strength={1.5}
      growthRate={8}
      decayRate={0.95}
      amplitude={15}
      text={`Shall I compare thee to a summer's day?`}
    />
  </div>
);

const ForestPreview = () => (
  <div className="w-full h-full">
    <ReactP5Wrapper
      sketch={forestSketch}
      letterDensity={400}
      swayAmount={10}
      distributionMode="gamma"
      gammaShape={0.8}
      gammaScale={0.033}
    />
  </div>
);

const TowardsPreview = () => (
  <div className="w-full h-full">
    <ReactP5Wrapper sketch={towardsSketch} />
  </div>
);

interface CanvasCardProps {
  to: string;
  title: string;
  description: string;
  previewComponent: React.ReactNode;
  delay?: number;
}

const CanvasCard = ({
  to,
  title,
  description,
  previewComponent,
  delay = 0,
}: CanvasCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: delay * 2 }}
    viewport={{ margin: '-50px' }}
  >
    <motion.div whileHover={{ scale: 1.05 }}>
      <Link
        to={to}
        className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow block"
      >
        <div className="h-48 relative overflow-hidden">
          <div className="absolute inset-0">{previewComponent}</div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </Link>
    </motion.div>
  </motion.div>
);

const InformationSection = () => (
  <motion.section
    className="py-24"
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    transition={{ duration: 1.6 }}
    viewport={{ margin: '-100px' }}
  >
    <motion.h1
      className="text-6xl font-bold mb-4 leading-tight tracking-tight"
      initial={{ opacity: 0, y: -20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0, delay: 0.4 }}
      viewport={{ margin: '-100px' }}
    >
      Function as a Breath of Thought:
    </motion.h1>
    <motion.h2
      className="text-3xl font-medium text-gray-700 dark:text-gray-300 mb-12"
      initial={{ opacity: 0, y: -20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0, delay: 0.8 }}
      viewport={{ margin: '-100px' }}
    >
      On the Computer as a Compositional
      <br />
      and Performance Tool for Poetry
    </motion.h2>
    <div className="flex gap-6 mt-12">
      <motion.a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="px-8 py-4 bg-white text-black border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-lg"
        whileHover={{ scale: 1.05 }}
      >
        View on GitHub
      </motion.a>
      <motion.a
        href={SLIDES_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="px-8 py-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-lg"
        whileHover={{ scale: 1.05 }}
      >
        View Slides
      </motion.a>
    </div>
    <motion.p
      className="text-xl mt-20 max-w-2xl leading-relaxed"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ margin: '-100px' }}
    >
      This project explores the creative potential at the intersection of
      poetry, code, and interactive media. I use p5.js and React to create
      immersive poetic experiences that blend language, visuals, user
      interaction and data visualization.
    </motion.p>
  </motion.section>
);

const HomePage = () => (
  <div className="space-y-12 max-w-4xl mx-auto px-6">
    <InformationSection />
    <motion.section
      className="space-y-8 mt-8"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1.6 }}
      viewport={{ margin: '-100px' }}
    >
      <h2 className="text-2xl font-semibold">Interactive Canvases</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <CanvasCard
          to="/simple-demo"
          title="Simple Demo"
          description="Basic interactive canvas demonstration"
          previewComponent={<SimpleDemoPreview />}
        />

        <CanvasCard
          to="/ripple"
          title="Ripple"
          description="Expanding ripple effects with interactive elements"
          previewComponent={<RipplePreview />}
          delay={0.1}
        />

        <CanvasCard
          to="/forest"
          title="Forest"
          description="Nature-inspired interactive visualization"
          previewComponent={<ForestPreview />}
          delay={0.2}
        />

        <CanvasCard
          to="/towards"
          title="Towards"
          description="Movement and direction-based interactions"
          previewComponent={<TowardsPreview />}
          delay={0.3}
        />
      </div>
    </motion.section>

    <motion.section
      className="space-y-3 mt-8 border-t pt-8"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1.6 }}
      viewport={{ margin: '-100px' }}
    >
      <motion.h2 className="text-xl font-semibold" whileHover={{ scale: 1.02 }}>
        Technology
      </motion.h2>
      <motion.p
        className="text-gray-700 dark:text-gray-300"
        whileHover={{ opacity: 0.8 }}
      >
        This project is built with React, TypeScript, P5.js, Tailwind CSS, and
        React Router.
      </motion.p>
    </motion.section>
  </div>
);

export default HomePage;

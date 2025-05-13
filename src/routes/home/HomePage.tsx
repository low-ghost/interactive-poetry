import { ReactP5Wrapper } from '@p5-wrapper/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { sketch as forestSketch } from '@routes/forest/ForestCanvas';
import { sketch as rippleSketch } from '@routes/ripple/RippleCanvas';
import { sketch as simpleDemoSketch } from '@routes/simple-demo/SimpleDemoCanvas';
import { sketch as towardsSketch } from '@routes/towards/TowardsCanvas';

// CSS to hide scrollbar
const scrollbarHideStyles = `
  ::-webkit-scrollbar {
    display: none;
  }
  
  * {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

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

const HomePage = () => {
  const [isClient, setIsClient] = useState(false);

  // Only render canvases on client-side to avoid SSR issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      {/* Add style tag to hide scrollbars */}
      <style>{scrollbarHideStyles}</style>
      <div className="space-y-12 max-w-4xl mx-auto px-6">
        <motion.section
          className="py-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1
            className="text-6xl font-bold mb-4 leading-tight tracking-tight"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Function as a Breath of Thought:
          </motion.h1>
          <motion.h2
            className="text-3xl font-medium text-gray-700 dark:text-gray-300 mb-12"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            On the Computer as a Compositional
            <br />
            and Performance Tool for Poetry
          </motion.h2>
          <motion.div
            className="flex gap-6 mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white text-black border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-lg"
            >
              View on GitHub
            </a>
            <a
              href={SLIDES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-lg"
            >
              View Slides
            </a>
          </motion.div>
          <motion.p
            className="text-xl mt-20 max-w-2xl leading-relaxed"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: '-100px' }}
          >
            This project explores the creative potential at the intersection of
            poetry, code, and interactive media. I use p5.js and React to create
            immersive poetic experiences that blend language, visuals, user
            interaction and data visualization.
          </motion.p>
        </motion.section>

        <motion.section
          className="space-y-8 mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: '-100px' }}
        >
          <h2 className="text-2xl font-semibold">Interactive Canvases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: '-50px' }}
            >
              <Link
                to="/simple-demo"
                className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="h-48 relative overflow-hidden">
                  {isClient && (
                    <div className="absolute inset-0">
                      <SimpleDemoPreview />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">Simple Demo</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Basic interactive canvas demonstration
                  </p>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true, margin: '-50px' }}
            >
              <Link
                to="/ripple"
                className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="h-48 relative overflow-hidden">
                  {isClient && (
                    <div className="absolute inset-0">
                      <RipplePreview />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">Ripple</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Expanding ripple effects with interactive elements
                  </p>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true, margin: '-50px' }}
            >
              <Link
                to="/forest"
                className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="h-48 relative overflow-hidden">
                  {isClient && (
                    <div className="absolute inset-0">
                      <ForestPreview />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">Forest</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Nature-inspired interactive visualization
                  </p>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true, margin: '-50px' }}
            >
              <Link
                to="/towards"
                className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="h-48 relative overflow-hidden">
                  {isClient && (
                    <div className="absolute inset-0">
                      <TowardsPreview />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">Towards</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Movement and direction-based interactions
                  </p>
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="space-y-3 mt-8 border-t pt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: '-100px' }}
        >
          <h2 className="text-xl font-semibold">Technology</h2>
          <p className="text-gray-700 dark:text-gray-300">
            This project is built with React, TypeScript, P5.js, Tailwind CSS,
            and React Router.
          </p>
        </motion.section>
      </div>
    </>
  );
};

export default HomePage;

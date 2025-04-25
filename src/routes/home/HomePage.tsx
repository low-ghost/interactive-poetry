import { Link } from 'react-router-dom';

const HomePage = () => (
  <div className="space-y-8 max-w-4xl mx-auto px-4">
    <section className="text-center py-8">
      <h1 className="text-4xl font-bold mb-4">Interactive Poetry</h1>
      <p className="text-xl text-gray-700 dark:text-gray-300">
        Exploring the intersection of code, creativity, and expression
      </p>
    </section>

    <section className="space-y-4 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold">Welcome to Interactive Poetry</h2>
      <p className="text-gray-700 dark:text-gray-300">
        We're exploring the potential of interactive poetics with p5.js,
        creating immersive experiences that blend language, visuals, and user
        interaction. Our experiments aim to push the boundaries of digital
        expression and create new forms of artistic engagement.
      </p>
      <p className="text-gray-700 dark:text-gray-300">
        Navigate through our examples using the sidebar to experience different
        interactive poetry sketches and demos.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Get Started</h2>
      <p className="text-gray-700 dark:text-gray-300">
        Check out our simple demo example to see how we use p5.js to create
        interactive experiences. Feel free to explore the code and learn how
        these interactions are built.
      </p>
      <div className="flex justify-center mt-6">
        <Link
          to="/simple-demo"
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-block"
          aria-label="View Simple Demo Example"
        >
          View Simple Demo
        </Link>
      </div>
    </section>

    <section className="space-y-3 mt-8 border-t pt-8">
      <h2 className="text-xl font-semibold">Technology</h2>
      <p className="text-gray-700 dark:text-gray-300">
        This project is built with React, TypeScript, P5.js, Tailwind CSS, and
        React Router.
      </p>
    </section>
  </div>
);

export default HomePage;

import { Link } from 'react-router-dom';

const NotFoundPage = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <h1 className="text-6xl font-bold text-gray-800 dark:text-gray-200">
        404
      </h1>
      <h2 className="text-2xl font-semibold mt-4 mb-6">Page Not Found</h2>
      <p className="text-gray-600 dark:text-gray-200 mb-8 text-lg max-w-md">
        A Nothing / we were, we are, we will / remain, flowering.
      </p>
      <p className="text-gray-500 dark:text-gray-200 -mt-6 mb-8 text-l italic">
        — Paul Celan
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Go Back
      </Link>
    </div>
  );

export default NotFoundPage;

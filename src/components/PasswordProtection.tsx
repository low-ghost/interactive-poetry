import { decryptString } from '@utils/encryption';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';

interface PasswordProtectionProps {
  onAuthenticated: () => void;
  title: string;
}

const PasswordProtection = ({
  onAuthenticated,
  title,
}: PasswordProtectionProps) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Encrypted password - generated with encryptString('your_password_here', 'p03try_k3y_2025')
  const ENCRYPTED_PASSWORD = 'E19DBBcLNw5SHQ==';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Add a small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    const decryptedPassword = decryptString(ENCRYPTED_PASSWORD);

    if (password === decryptedPassword) {
      // Store authentication in sessionStorage
      sessionStorage.setItem('auth_protected_content', 'true');
      onAuthenticated();
    } else {
      setError('Incorrect password');
      setPassword('');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full mx-4"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4"
          >
            <Lock className="w-8 h-8 text-gray-600 dark:text-gray-300" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Protected Content
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please enter the password to access "{title}"
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-red-500 text-sm"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={isLoading || !password}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? 'Verifying...' : 'Access Content'}
          </motion.button>
        </form>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          Access will be maintained for this browser session
        </p>
      </motion.div>
    </div>
  );
};

export default PasswordProtection;

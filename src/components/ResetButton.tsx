import React from 'react';

type ResetButtonProps = {
  onClick: () => void;
  className?: string;
};

/**
 * A reusable reset button component for control panels
 */
const ResetButton: React.FC<ResetButtonProps> = ({
  onClick,
  className = '',
}) => (
  <button
    onClick={onClick}
    className={`px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 ${className}`}
  >
    Reset
  </button>
);

export default ResetButton;

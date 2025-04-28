import { ChevronDown, ChevronUp } from 'lucide-react';
import { useRef, useState } from 'react';

/**
 * Text input control with auto/custom mode
 */
type TextAreaControlProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  defaultValue: string;
};

const TextAreaControl = ({
  value,
  onChange,
  defaultValue,
}: TextAreaControlProps) => {
  // Track if the text area has been interacted with
  const [isEngaged, setIsEngaged] = useState(value !== null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Use actual value or default for display and editing
  const displayValue = value !== null ? value : defaultValue;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIsEngaged(true);
    onChange(e.target.value);
  };

  const handleReset = () => {
    setIsEngaged(false);
    onChange(null);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none"
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>{isExpanded ? 'Hide Editor' : 'Show Editor'}</span>
        </button>

        {isEngaged ? (
          <button
            onClick={handleReset}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Default Sonnet
          </button>
        ) : (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Default Sonnet
          </span>
        )}
      </div>

      {isExpanded && (
        <div className="mt-2 w-full">
          <textarea
            ref={textareaRef}
            value={displayValue}
            onChange={handleChange}
            onFocus={() => {
              if (!isEngaged) {
                setIsEngaged(true);
                onChange(defaultValue);
              }
            }}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm h-60 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Enter text to display on canvas..."
          />
        </div>
      )}
    </div>
  );
};

export default TextAreaControl;

import { ControlItem } from '@type/controls';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { useState } from 'react';

/**
 * Control panel component with collapsible interface
 */
type ControlPanelProps = {
  controls: ControlItem[];
  onReset: () => void;
};

const ControlPanel = ({ controls, onReset }: ControlPanelProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md transition-all duration-300">
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center gap-2 text-left focus:outline-none"
        >
          <h3 className="font-medium">Canvas Controls</h3>
          <span>
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1 px-3 py-1 text-sm rounded bg-blue-700 hover:bg-blue-800 transition-colors"
          title="Reset all controls to default"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4">
          {controls.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-800 dark:text-gray-200">
                  {item.label}
                </h4>
                {item.id !== 'text' && <div>{item.control}</div>}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
              {item.id === 'text' && <div className="mt-2">{item.control}</div>}
              <div className="pt-2 border-b border-gray-200 dark:border-gray-700"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ControlPanel;

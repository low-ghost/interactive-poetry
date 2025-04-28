import { useState } from 'react';

/**
 * Slider control with value display
 */
type SliderControlProps = {
  value: number | null;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
};

const SliderControl = ({
  value,
  onChange,
  min,
  max,
  step,
}: SliderControlProps) => {
  // Track if the slider has been interacted with
  const [isEngaged, setIsEngaged] = useState(value !== null);

  // Use actual value or default for display
  const displayValue = value !== null ? value : (min + max) / 2;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsEngaged(true);
    onChange(parseFloat(e.target.value));
  };

  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={displayValue}
        onChange={handleChange}
        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
      />
      <span className="text-xs w-8 text-center">
        {isEngaged ? value?.toFixed(1) : 'Auto'}
      </span>
    </div>
  );
};

export default SliderControl;


import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface CustomDropdownProps {
  value: string | number;
  onChange: (value: any) => void;
  options: (Option | string | number)[];
  placeholder?: string;
  className?: string; // Classes for the trigger button
  bgColor?: string;
  align?: 'left' | 'right';
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  className = "",
  bgColor = "bg-white dark:bg-gray-800",
  align = 'left'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize options to Option[]
  const normalizedOptions: Option[] = options.map(opt => {
    if (typeof opt === 'object' && opt !== null && 'value' in opt) {
      return opt as Option;
    }
    // Explicitly cast opt to string | number to satisfy TypeScript
    return { value: opt as string | number, label: String(opt) };
  });

  const selectedLabel = normalizedOptions.find(o => String(o.value) === String(value))?.label || value;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary ${bgColor} text-gray-700 dark:text-gray-200 ${className}`}
        title={String(selectedLabel)}
      >
        <span className="flex-1 text-left truncate mr-2 min-w-0">{selectedLabel}</span>
        <i className={`fas fa-chevron-down text-[10px] text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && (
        <div className={`absolute z-50 min-w-full w-56 mt-1 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-fade-in whitespace-nowrap ${align === 'right' ? 'right-0' : 'left-0'}`}>
          {normalizedOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${String(value) === String(opt.value) ? 'text-primary font-bold bg-primary/5' : 'text-gray-700 dark:text-gray-300'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

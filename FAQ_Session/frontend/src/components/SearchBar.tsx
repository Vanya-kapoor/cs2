import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  onSubmit?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ placeholder, value, onChange, onSubmit }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="flex w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-sm p-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all group items-center">
      <div className="flex items-center pl-3 text-slate-400">
        <Search size={18} className="transition-transform group-focus-within:scale-105" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 text-sm font-normal text-slate-800 placeholder:text-slate-400 bg-transparent border-none outline-none"
      />
      {onSubmit && (
        <button
          onClick={onSubmit}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs shadow-sm transition-colors cursor-pointer select-none whitespace-nowrap"
        >
          Search
        </button>
      )}
    </div>
  );
};
export default SearchBar;

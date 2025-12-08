import React, { useState } from 'react';
import { Plus, X, AlertCircle, ChevronDown } from 'lucide-react';
import { MAX_KEYWORDS } from '../constants';

interface KeywordManagerProps {
  keywords: string[];
  setKeywords: (keywords: string[]) => void;
  searchDays: number;
  setSearchDays: (days: number) => void;
  onSearch: () => void;
  isLoading: boolean;
}

const KeywordManager: React.FC<KeywordManagerProps> = ({ 
  keywords, 
  setKeywords, 
  searchDays,
  setSearchDays,
  onSearch, 
  isLoading 
}) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const trimmed = input.trim();
    if (!trimmed) return;

    if (keywords.length >= MAX_KEYWORDS) {
      setError(`Max ${MAX_KEYWORDS} keywords allowed`);
      return;
    }

    if (keywords.includes(trimmed)) {
      setError('Keyword already exists');
      return;
    }

    setKeywords([...keywords, trimmed]);
    setInput('');
    setError(null);
  };

  const removeKeyword = (kwToRemove: string) => {
    setKeywords(keywords.filter(k => k !== kwToRemove));
    if (keywords.length - 1 < MAX_KEYWORDS) setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
          Search Parameters
        </h2>
        
        {/* Time Range Selector */}
        <div className="relative">
          <select 
            value={searchDays} 
            onChange={(e) => setSearchDays(Number(e.target.value))}
            className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900 transition-colors cursor-pointer"
            disabled={isLoading}
          >
            <option value={3}>Last 3 Days</option>
            <option value={5}>Last 5 Days</option>
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={365}>Last Year</option>
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-grow relative">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Add a keyword (e.g., 'bitcoin', 'splinterlands')"
            className={`w-full h-12 px-4 rounded-xl border bg-white dark:bg-slate-950 text-slate-900 dark:text-white ${error ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 dark:border-slate-700 focus:ring-red-100 dark:focus:ring-red-900 focus:border-red-500'} focus:ring-4 focus:outline-none transition-all placeholder:text-slate-400`}
            disabled={isLoading || keywords.length >= MAX_KEYWORDS}
          />
          <button
            onClick={() => handleAdd()}
            disabled={!input.trim() || keywords.length >= MAX_KEYWORDS || isLoading}
            className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
        
        <button
          onClick={onSearch}
          disabled={isLoading || keywords.length === 0}
          className="h-12 px-8 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center min-w-[140px]"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Run Search'
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center text-red-600 dark:text-red-400 text-sm mb-4 animate-fadeIn">
          <AlertCircle size={16} className="mr-2" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {keywords.length === 0 && (
          <span className="text-slate-400 dark:text-slate-500 text-sm italic py-2">No keywords added yet...</span>
        )}
        {keywords.map(k => (
          <div 
            key={k} 
            className="group flex items-center pl-3 pr-2 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
          >
            {k}
            <button
              onClick={() => removeKeyword(k)}
              className="ml-2 p-0.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-all"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 self-center">
          {keywords.length}/{MAX_KEYWORDS}
        </span>
      </div>
    </div>
  );
};

export default KeywordManager;
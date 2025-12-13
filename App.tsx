import React, { useState, useEffect, useMemo } from 'react';
import { Database, Search, AlertTriangle, Terminal, Copy, Check, Settings, X, Save, Layout, Moon, Sun, Heart, Vote, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { ConnectionSettings, FetchStatus, HivePost, HivePlatform } from './types';
import { fetchPostsByKeywords } from './services/hafService';
import { DEFAULT_ENDPOINT, PLATFORMS } from './constants';
import KeywordManager from './components/KeywordManager';
import PostCard from './components/PostCard';

const ITEMS_PER_PAGE = 9;

const App: React.FC = () => {
  // State initialization with localStorage checks
  const [keywords, setKeywords] = useState<string[]>([]);
  
  // Time Range State (String to support 'custom')
  const [timeRange, setTimeRange] = useState<string>("3");
  const [customDateRange, setCustomDateRange] = useState<{start: string, end: string}>({start: '', end: ''});

  // Search Scope State
  const [searchScope, setSearchScope] = useState<'global' | 'user'>('global');
  const [targetAuthor, setTargetAuthor] = useState<string>('');

  const [posts, setPosts] = useState<HivePost[]>([]);
  const [status, setStatus] = useState<FetchStatus>(FetchStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Filtering & Pagination State
  const [filterTerm, setFilterTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [endpointUrl, setEndpointUrl] = useState(DEFAULT_ENDPOINT);
  const [dbUser, setDbUser] = useState('hafsql_public');
  const [dbPass, setDbPass] = useState('hafsql_public');
  const [platform, setPlatform] = useState<HivePlatform>('peakd');

  // Theme State
  const [darkMode, setDarkMode] = useState(false);

  // Debug states
  const [debugQuery, setDebugQuery] = useState<string>('');
  const [debugLog, setDebugLog] = useState<string>('');
  const [showDebug, setShowDebug] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Load from LocalStorage on Mount
  useEffect(() => {
    // Keywords
    const savedKeywords = localStorage.getItem('hive_keywords');
    if (savedKeywords) {
      try {
        setKeywords(JSON.parse(savedKeywords));
      } catch (e) {
        console.error("Failed to parse saved keywords");
      }
    }

    // Platform
    const savedPlatform = localStorage.getItem('hive_platform');
    if (savedPlatform && Object.keys(PLATFORMS).includes(savedPlatform)) {
      setPlatform(savedPlatform as HivePlatform);
    }

    // Theme
    const savedTheme = localStorage.getItem('hive_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Save Keywords to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('hive_keywords', JSON.stringify(keywords));
  }, [keywords]);

  // Handle Theme Toggle
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hive_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hive_theme', 'light');
    }
  };

  // Reset time range to default if switching to global while in custom mode
  // This prevents the user from being stuck in "Custom" mode when switching to Global search
  useEffect(() => {
    if (searchScope === 'global' && timeRange === 'custom') {
      setTimeRange("3");
    }
  }, [searchScope, timeRange]);

  // Save Platform to LocalStorage
  const handlePlatformChange = (newPlatform: HivePlatform) => {
    setPlatform(newPlatform);
    localStorage.setItem('hive_platform', newPlatform);
  };
  
  const handleSearch = async () => {
    if (keywords.length === 0) return;
    
    const connection: ConnectionSettings = {
      endpointUrl: endpointUrl,
      useMock: false,
      username: dbUser,
      password: dbPass
    };

    // reset states
    setStatus(FetchStatus.LOADING);
    setPosts([]);
    setErrorMsg('');
    setDebugLog('Initializing search...');
    setDebugQuery('Waiting for server to generate SQL...');
    
    // Reset filter and pagination on new search
    setFilterTerm('');
    setCurrentPage(1);

    try {
      setDebugLog(prev => prev + `\nTarget Endpoint: ${connection.endpointUrl}`);
      
      if (timeRange === 'custom') {
         setDebugLog(prev => prev + `\nTime Mode: Custom Range (${customDateRange.start} to ${customDateRange.end})`);
      } else {
         setDebugLog(prev => prev + `\nTime Mode: Relative (Last ${timeRange} days)`);
      }
      
      const authorToSearch = searchScope === 'user' && targetAuthor.trim() ? targetAuthor.trim() : null;
      if (authorToSearch) {
        setDebugLog(prev => prev + `\nScope: Specific User (@${authorToSearch})`);
      } else {
        setDebugLog(prev => prev + `\nScope: Entire Blockchain`);
      }

      setDebugLog(prev => prev + `\nSending request...`);
      
      const { posts: results, debugSql } = await fetchPostsByKeywords(
        keywords, 
        timeRange, 
        customDateRange,
        authorToSearch, 
        connection
      );
      
      setDebugQuery(debugSql);
      setDebugLog(prev => prev + `\nSuccess! Received ${results.length} records.`);
      setPosts(results);
      setStatus(FetchStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Failed to fetch posts.";
      setErrorMsg(msg);
      setDebugLog(prev => prev + `\nERROR: ${msg}`);
      
      // Detailed Help Message
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
         setDebugLog(prev => prev + `\n\nCRITICAL CONNECTION ERROR:`);
         setDebugLog(prev => prev + `\n1. Ensure the backend server is running.`);
         setDebugLog(prev => prev + `\n2. If running locally with split terminals, change Middleware URL to: http://localhost:3000/search`);
         setDebugLog(prev => prev + `\n3. If on Render, ensure the deployment is healthy.`);
      }
      
      setStatus(FetchStatus.ERROR);
    }
  };

  const copyQuery = () => {
    navigator.clipboard.writeText(debugQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Filtering & Pagination Logic ---
  const filteredPosts = useMemo(() => {
    if (!filterTerm) return posts;
    const term = filterTerm.toLowerCase();
    return posts.filter(post => 
      post.title.toLowerCase().includes(term) ||
      post.author.toLowerCase().includes(term) ||
      post.body.toLowerCase().includes(term)
    );
  }, [posts, filterTerm]);

  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPosts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-600/20">
              <Database size={18} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Hive<span className="text-red-600">Keyword(s)</span>Fetcher
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${showSettings ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              title="Connection Settings"
            >
              <Settings size={18} />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${showDebug ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              <Terminal size={18} />
              <span className="hidden sm:inline">Debug</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 flex flex-col">
        <div className="animate-fadeIn flex-grow">
          
          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-8 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 animate-slideDown">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                  <Settings size={18} className="mr-2" /> Application Settings
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Connection Config */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Middleware URL</label>
                  <input 
                    type="text" 
                    value={endpointUrl}
                    onChange={(e) => setEndpointUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-lg focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900 focus:border-red-500"
                    placeholder="e.g. /search"
                  />
                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <p>Production (Render): <code>/search</code></p>
                    <p>Local Dev: <code>http://localhost:3000/search</code></p>
                  </div>
                </div>

                {/* Platform Config */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                    <Layout size={16} className="mr-2" />
                    Open Links In
                  </label>
                  <div className="relative">
                    <select
                      value={platform}
                      onChange={(e) => handlePlatformChange(e.target.value as HivePlatform)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-lg focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900 focus:border-red-500 appearance-none"
                    >
                      <option value="peakd">PeakD.com</option>
                      <option value="ecency">Ecency.com</option>
                      <option value="hive.blog">Hive.blog</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                   <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose your preferred Hive interface for viewing posts.
                  </p>
                </div>

              </div>
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center text-sm font-medium"
                >
                  <Save size={16} className="mr-2" /> Save & Close
                </button>
              </div>
            </div>
          )}

          <KeywordManager 
            keywords={keywords}
            setKeywords={setKeywords}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            customDateRange={customDateRange}
            setCustomDateRange={setCustomDateRange}
            onSearch={handleSearch}
            isLoading={status === FetchStatus.LOADING}
            searchScope={searchScope}
            setSearchScope={setSearchScope}
            targetAuthor={targetAuthor}
            setTargetAuthor={setTargetAuthor}
          />

          {/* Status & Results */}
          <div className="space-y-6">
            {status === FetchStatus.ERROR && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-start">
                <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Connection Error</p>
                  <p>{errorMsg}</p>
                  {errorMsg.includes("Failed to fetch") && (
                     <p className="mt-2 text-xs bg-white/50 dark:bg-black/20 p-2 rounded">
                        <strong>Troubleshooting:</strong><br/>
                        1. Is the backend server running?<br/>
                        2. If local, try changing Middleware URL to <code>http://localhost:3000/search</code> in settings.
                     </p>
                  )}
                </div>
              </div>
            )}

            {status === FetchStatus.SUCCESS && (
              <>
                {/* Result Header & Filter */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                      Search Results <span className="text-slate-400 dark:text-slate-500 font-normal">({filteredPosts.length}{filteredPosts.length !== posts.length ? ` of ${posts.length}` : ''})</span>
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      Opening in {PLATFORMS[platform].replace('https://', '')}
                    </span>
                  </div>

                  {/* Filter Input */}
                  {posts.length > 0 && (
                    <div className="relative w-full sm:w-64">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Filter results..." 
                        value={filterTerm}
                        onChange={(e) => {
                          setFilterTerm(e.target.value);
                          setCurrentPage(1); // Reset to page 1 on filter change
                        }}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                      />
                    </div>
                  )}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedPosts.map((post) => (
                    <PostCard 
                      key={`${post.author}-${post.permlink}`} 
                      post={post} 
                      keywords={keywords}
                      platformUrl={PLATFORMS[platform]}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8 py-4">
                    <button 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 px-4">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Empty States */}
            {status === FetchStatus.SUCCESS && posts.length === 0 && (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Search size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  No posts found matching your keywords 
                  {timeRange === 'custom' 
                    ? ` between ${customDateRange.start} and ${customDateRange.end}.`
                    : ` in the last ${timeRange} days.`
                  }
                </p>
              </div>
            )}
            
            {status === FetchStatus.SUCCESS && posts.length > 0 && filteredPosts.length === 0 && (
               <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Filter size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No matches found for "{filterTerm}"</p>
                <button 
                  onClick={() => setFilterTerm('')}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  Clear filter
                </button>
              </div>
            )}

            {status === FetchStatus.IDLE && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 text-slate-400 dark:text-slate-500">
                  <Database size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">Ready to Search</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Add keywords above to scan the Hive blockchain for relevant posts.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Debug Console - Moved to Bottom */}
        {showDebug && (debugQuery || debugLog) && (
            <div className="mt-12 bg-slate-900 dark:bg-black rounded-xl overflow-hidden shadow-lg border border-slate-800">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Debug Information</span>
                {debugQuery && (
                  <button 
                    onClick={copyQuery}
                    className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy Query'}
                  </button>
                )}
              </div>
              <div className="p-4 overflow-x-auto max-h-96">
                {debugQuery && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-slate-500 mb-1">GENERATED SQL (ON SERVER):</h4>
                    <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap break-all">{debugQuery}</pre>
                  </div>
                )}
                {debugLog && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 mb-1">EXECUTION LOG:</h4>
                    <pre className="text-xs font-mono text-blue-300 whitespace-pre-wrap">{debugLog}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 mt-12 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Created with</span>
            <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              by <a href="https://peakd.com/@louis88" target="_blank" rel="noreferrer" className="text-slate-900 dark:text-white font-semibold hover:text-red-600 dark:hover:text-red-500 transition-colors">@louis88</a>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href="https://peakd.com/me/witnesses" 
              target="_blank" 
              rel="noreferrer" 
              className="group flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-red-100 dark:group-hover:bg-red-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors">
                 <Vote size={14} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 leading-none mb-0.5">Witness</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-red-700 dark:group-hover:text-red-400 leading-none">Vote louis.witness</span>
              </div>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
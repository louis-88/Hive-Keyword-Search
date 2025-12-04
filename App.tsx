import React, { useState, useEffect } from 'react';
import { Database, Github, Search, AlertTriangle, Terminal, Copy, Check, Settings, X, Save, Layout } from 'lucide-react';
import { ConnectionSettings, FetchStatus, HivePost, HivePlatform } from './types';
import { fetchPostsByKeywords } from './services/hafService';
import { DEFAULT_ENDPOINT, SEARCH_DAYS, PLATFORMS } from './constants';
import KeywordManager from './components/KeywordManager';
import PostCard from './components/PostCard';

const App: React.FC = () => {
  // State initialization with localStorage checks
  const [keywords, setKeywords] = useState<string[]>([]);
  
  const [posts, setPosts] = useState<HivePost[]>([]);
  const [status, setStatus] = useState<FetchStatus>(FetchStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [endpointUrl, setEndpointUrl] = useState(DEFAULT_ENDPOINT);
  const [dbUser, setDbUser] = useState('hafsql_public');
  const [dbPass, setDbPass] = useState('hafsql_public');
  const [platform, setPlatform] = useState<HivePlatform>('peakd');

  // Debug states
  const [debugQuery, setDebugQuery] = useState<string>('');
  const [debugLog, setDebugLog] = useState<string>('');
  const [showDebug, setShowDebug] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Load from LocalStorage on Mount
  useEffect(() => {
    const savedKeywords = localStorage.getItem('hive_keywords');
    if (savedKeywords) {
      try {
        setKeywords(JSON.parse(savedKeywords));
      } catch (e) {
        console.error("Failed to parse saved keywords");
      }
    }

    const savedPlatform = localStorage.getItem('hive_platform');
    if (savedPlatform && Object.keys(PLATFORMS).includes(savedPlatform)) {
      setPlatform(savedPlatform as HivePlatform);
    }
  }, []);

  // Save Keywords to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('hive_keywords', JSON.stringify(keywords));
  }, [keywords]);

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

    try {
      setDebugLog(prev => prev + `\nTarget Endpoint: ${connection.endpointUrl}`);
      setDebugLog(prev => prev + `\nSending request...`);
      
      const { posts: results, debugSql } = await fetchPostsByKeywords(keywords, connection);
      
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-600/20">
              <Database size={18} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Hive<span className="text-red-600">Fetcher</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${showSettings ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              title="Connection Settings"
            >
              <Settings size={18} />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${showDebug ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Terminal size={18} />
              <span className="hidden sm:inline">Debug</span>
            </button>
            <a 
              href="https://github.com/louis-88/hive-fetcher-hafsql" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
            >
              <Github size={18} />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 flex flex-col">
        <div className="animate-fadeIn flex-grow">
          
          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-slideDown">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                  <Settings size={18} className="mr-2" /> Application Settings
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Connection Config */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">Middleware URL</label>
                  <input 
                    type="text" 
                    value={endpointUrl}
                    onChange={(e) => setEndpointUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500"
                    placeholder="e.g. /search"
                  />
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>Production (Render): <code>/search</code></p>
                    <p>Local Dev: <code>http://localhost:3000/search</code></p>
                  </div>
                </div>

                {/* Platform Config */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700 flex items-center">
                    <Layout size={16} className="mr-2" />
                    Open Links In
                  </label>
                  <div className="relative">
                    <select
                      value={platform}
                      onChange={(e) => handlePlatformChange(e.target.value as HivePlatform)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 appearance-none bg-white"
                    >
                      <option value="peakd">PeakD.com</option>
                      <option value="ecency">Ecency.com</option>
                      <option value="hive.blog">Hive.blog</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                   <p className="text-xs text-slate-500">
                    Choose your preferred Hive interface for viewing posts.
                  </p>
                </div>

              </div>
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center text-sm font-medium"
                >
                  <Save size={16} className="mr-2" /> Save & Close
                </button>
              </div>
            </div>
          )}

          <KeywordManager 
            keywords={keywords}
            setKeywords={setKeywords}
            onSearch={handleSearch}
            isLoading={status === FetchStatus.LOADING}
          />

          {/* Status & Results */}
          <div className="space-y-6">
            {status === FetchStatus.ERROR && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-start">
                <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Connection Error</p>
                  <p>{errorMsg}</p>
                  {errorMsg.includes("Failed to fetch") && (
                     <p className="mt-2 text-xs bg-white/50 p-2 rounded">
                        <strong>Troubleshooting:</strong><br/>
                        1. Is the backend server running?<br/>
                        2. If local, try changing Middleware URL to <code>http://localhost:3000/search</code> in settings.
                     </p>
                  )}
                </div>
              </div>
            )}

            {status === FetchStatus.SUCCESS && (
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">
                  Search Results <span className="text-slate-400 font-normal">({posts.length})</span>
                </h3>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  Opening in {PLATFORMS[platform].replace('https://', '')}
                </span>
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard 
                  key={`${post.author}-${post.permlink}`} 
                  post={post} 
                  keywords={keywords}
                  platformUrl={PLATFORMS[platform]}
                />
              ))}
            </div>

            {/* Empty States */}
            {status === FetchStatus.SUCCESS && posts.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Search size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">No posts found matching your keywords in the last {SEARCH_DAYS} days.</p>
              </div>
            )}

            {status === FetchStatus.IDLE && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4 text-slate-400">
                  <Database size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-700 mb-2">Ready to Search</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Add keywords above to scan the Hive blockchain for relevant posts from the last {SEARCH_DAYS} days.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Debug Console - Moved to Bottom */}
        {showDebug && (debugQuery || debugLog) && (
            <div className="mt-12 bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800">
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
    </div>
  );
};

export default App;
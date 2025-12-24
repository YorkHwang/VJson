
import React, { useState, useEffect, useRef, useCallback } from 'react';
import JsonNode from './components/JsonNode';
import { JsonValue, HistoryItem, ContextMenuState } from './types';
import { Language, translations, languages } from './translations';

const getBrowserLanguage = (): Language => {
  const lang = navigator.language;
  if (lang.startsWith('zh-TW') || lang.startsWith('zh-HK')) return 'zh-TW';
  if (lang.startsWith('zh')) return 'zh-CN';
  if (lang.startsWith('ja')) return 'ja';
  if (lang.startsWith('de')) return 'de';
  if (lang.startsWith('fr')) return 'fr';
  if (lang.startsWith('es')) return 'es';
  return 'en';
};

const INITIAL_JSON = `{
  "name": "VJson",
  "version": "1.5.0",
  "features": [
    "Formatting",
    "Real-time Visualization",
    "History Management",
    "Search & Highlight",
    "Context Menu Actions",
    "Multi-language Support",
    "Expand/Collapse All Controls",
    "Escape/Unescape Tools"
  ],
  "author": {
    "name": "Developer",
    "status": "active",
    "location": "Global"
  }
}`;

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(getBrowserLanguage());
  const t = translations[lang];

  const [input, setInput] = useState(INITIAL_JSON);
  const [parsedData, setParsedData] = useState<JsonValue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'visual' | 'raw'>('visual');
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, key: '', value: '', path: ''
  });
  
  // Resizable layout state
  const [leftWidth, setLeftWidth] = useState(45); // percentage
  const [isResizing, setIsResizing] = useState(false);
  
  // Tree expansion control
  const [treeKey, setTreeKey] = useState(0);
  const [defaultExpanded, setDefaultExpanded] = useState<boolean | undefined>(undefined);

  const mainRef = useRef<HTMLElement>(null);

  const handleParse = useCallback((jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      setParsedData(data);
      setError(null);
    } catch (e: any) {
      try {
        const unescaped = jsonString.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        const data = JSON.parse(unescaped);
        setParsedData(data);
        setError(null);
      } catch (e2: any) {
        setError(e.message);
        setParsedData(null);
      }
    }
  }, []);

  useEffect(() => {
    handleParse(input);
  }, [input, handleParse]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(prev => ({ ...prev, visible: false }));
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Optimized Resizing Logic
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing || !mainRef.current) return;
    
    const mainRect = mainRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - mainRect.left) / mainRect.width) * 100;
    
    // Constraint between 15% and 85%
    if (newLeftWidth > 15 && newLeftWidth < 85) {
      setLeftWidth(newLeftWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const handleFormat = () => {
    try {
      const obj = JSON.parse(input);
      const formatted = JSON.stringify(obj, null, 2);
      setInput(formatted);
      addToHistory(formatted);
    } catch (e) {
      setError("Cannot format invalid JSON");
    }
  };

  const handleMinify = () => {
    try {
      const obj = JSON.parse(input);
      const minified = JSON.stringify(obj);
      setInput(minified);
      addToHistory(minified);
    } catch (e) {
      setError("Cannot minify invalid JSON");
    }
  };

  const handleEscape = () => {
    try {
      const obj = JSON.parse(input);
      const minified = JSON.stringify(obj);
      const escaped = minified.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      setInput(escaped);
      addToHistory(escaped);
    } catch (e) {
      const escaped = input.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      setInput(escaped);
      addToHistory(escaped);
    }
  };

  const handleUnescape = () => {
    const unescaped = input.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    setInput(unescaped);
    addToHistory(unescaped);
  };

  const handleExpandAll = () => {
    setDefaultExpanded(true);
    setTreeKey(prev => prev + 1);
  };

  const handleCollapseAll = () => {
    setDefaultExpanded(false);
    setTreeKey(prev => prev + 1);
  };

  const addToHistory = (content: string) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      content
    };
    setHistory(prev => [newItem, ...prev].slice(0, 10));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleContextMenu = (e: React.MouseEvent, data: { key: string; value: string; path: string }) => {
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      ...data
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">VJson <span className="text-sm font-normal text-slate-400">v1.5</span></h1>
        </div>
        <div className="flex gap-3 items-center">
          <select 
            value={lang}
            onChange={(e) => setLang(e.target.value as Language)}
            className="text-sm border border-slate-200 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white text-slate-600 cursor-pointer"
          >
            {languages.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      </header>

      <main ref={mainRef} className="flex-1 flex overflow-hidden relative select-none">
        {/* Left Side: Editor */}
        <div style={{ width: `${leftWidth}%` }} className="flex flex-col bg-white overflow-hidden min-w-[150px]">
          <div className="h-14 flex items-center justify-between px-4 bg-slate-50 border-b border-slate-200 shrink-0 overflow-x-auto no-scrollbar">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{t.editorTitle}</span>
            <div className="flex gap-1.5 items-center ml-2">
              <button onClick={handleFormat} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors font-medium whitespace-nowrap">
                {t.format}
              </button>
              <button onClick={handleMinify} className="text-xs px-2 py-1 border border-indigo-200 text-indigo-600 rounded hover:bg-indigo-50 transition-colors font-medium whitespace-nowrap">
                {t.minify}
              </button>
              <button onClick={handleEscape} className="text-xs px-2 py-1 border border-indigo-200 text-indigo-600 rounded hover:bg-indigo-50 transition-colors font-medium whitespace-nowrap lg:block hidden">
                {t.escape}
              </button>
              <button onClick={handleUnescape} className="text-xs px-2 py-1 border border-indigo-200 text-indigo-600 rounded hover:bg-indigo-50 transition-colors font-medium whitespace-nowrap lg:block hidden">
                {t.unescape}
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1 lg:block hidden"></div>
              <button onClick={() => copyToClipboard(input)} className="text-xs text-slate-600 hover:text-indigo-600 font-medium px-1 whitespace-nowrap">
                {t.copy}
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 leading-relaxed select-text"
            placeholder={t.placeholder}
            spellCheck={false}
          />
          {error && (
            <div className="bg-red-50 p-3 border-t border-red-200 flex items-start gap-2 shrink-0">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-red-600 font-medium mt-0.5 whitespace-pre-wrap line-clamp-2" title={error}>{error}</span>
            </div>
          )}
        </div>

        {/* Improved Resizer Divider */}
        <div 
          onMouseDown={startResizing}
          className={`w-2 h-full cursor-col-resize flex-shrink-0 z-20 group relative select-none transition-colors ${isResizing ? 'bg-indigo-100' : 'hover:bg-indigo-50'}`}
        >
          {/* Visual line */}
          <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 transition-all ${isResizing ? 'bg-indigo-600 w-1' : 'bg-slate-200 group-hover:bg-indigo-400 group-hover:w-1'}`}></div>
          {/* Interaction area extender */}
          <div className="absolute inset-y-0 -left-1 -right-1"></div>
        </div>

        {/* Right Side: Visualizer */}
        <div style={{ width: `${100 - leftWidth}%` }} className="flex flex-col bg-white overflow-hidden min-w-[200px]">
          <div className="h-14 flex items-center justify-between px-4 bg-slate-50 border-b border-slate-200 shrink-0">
            <div className="flex gap-4 h-full shrink-0">
              <button 
                onClick={() => setActiveTab('visual')}
                className={`text-xs font-semibold uppercase tracking-wider h-full border-b-2 transition-colors px-2 whitespace-nowrap ${activeTab === 'visual' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
              >
                {t.treeView}
              </button>
              <button 
                onClick={() => setActiveTab('raw')}
                className={`text-xs font-semibold uppercase tracking-wider h-full border-b-2 transition-colors px-2 whitespace-nowrap ${activeTab === 'raw' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
              >
                {t.rawData}
              </button>
            </div>
            <div className="flex gap-3 items-center overflow-hidden">
              {activeTab === 'visual' && (
                <div className="flex items-center gap-2 overflow-hidden">
                  <button onClick={handleExpandAll} className="text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors font-medium border border-indigo-100 whitespace-nowrap lg:block hidden">
                    {t.expandAll}
                  </button>
                  <button onClick={handleCollapseAll} className="text-xs text-slate-600 hover:bg-slate-100 px-2 py-1 rounded transition-colors font-medium border border-slate-200 whitespace-nowrap lg:block hidden">
                    {t.collapseAll}
                  </button>
                  <div className="w-px h-6 bg-slate-200 mx-1 lg:block hidden"></div>
                  <div className="relative group shrink min-w-0 max-w-[200px]">
                    <input 
                      type="text" 
                      placeholder={t.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-xs px-3 py-1.5 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full transition-all select-text"
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div className="h-6 w-px bg-slate-200 mx-1 flex-shrink-0"></div>
              <button onClick={() => copyToClipboard(input)} className="text-slate-400 hover:text-slate-600 flex-shrink-0" title="Copy JSON">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6 bg-slate-50/30 relative select-text">
            {activeTab === 'visual' && (
              parsedData ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-w-max">
                  <JsonNode 
                    key={`tree-${treeKey}`}
                    name="" 
                    value={parsedData} 
                    depth={0} 
                    isLast={true} 
                    currentPath="$"
                    searchTerm={searchTerm}
                    t={t}
                    onCopyPath={(path) => copyToClipboard(path)}
                    onContextMenu={handleContextMenu}
                    initialExpanded={defaultExpanded}
                  />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 text-center select-none">
                  <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm font-medium">{t.invalidJson}</p>
                </div>
              )
            )}

            {activeTab === 'raw' && (
              <pre className="font-mono text-sm bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-auto text-slate-600 leading-relaxed whitespace-pre-wrap">
                {input}
              </pre>
            )}
          </div>
        </div>
      </main>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className="fixed bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 min-w-[160px] animate-in fade-in zoom-in duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => { copyToClipboard(contextMenu.key); setContextMenu(p => ({ ...p, visible: false })); }}
            className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
            {t.copyKey}
          </button>
          <button 
            onClick={() => { copyToClipboard(contextMenu.value); setContextMenu(p => ({ ...p, visible: false })); }}
            className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
            {t.copyValue}
          </button>
          <button 
            onClick={() => { copyToClipboard(contextMenu.path); setContextMenu(p => ({ ...p, visible: false })); }}
            className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 border-t border-slate-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
            {t.copyPath}
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="h-12 bg-white border-t border-slate-200 flex items-center px-6 justify-between text-xs text-slate-400 font-medium shrink-0">
        <div className="flex gap-4 items-center h-full">
          <span>{history.length} {t.historyItems}</span>
          <div className="flex gap-2">
            {history.map((item, idx) => (
              <button 
                key={item.id} 
                onClick={() => setInput(item.content)}
                className="w-5 h-5 bg-slate-100 rounded hover:bg-indigo-100 hover:text-indigo-600 flex items-center justify-center transition-colors"
                title={`${t.version} ${history.length - idx}`}
              >
                {history.length - idx}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <span>{t.tokens}: {input.length}</span>
          <span className="text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            {t.syncActive}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;

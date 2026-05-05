import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shuffle, Trash2, Copy, Check, Info, FileDown, FileUp, History, Clock, Calendar, ArrowRight } from 'lucide-react';

interface HistoryItem {
  id: string;
  timestamp: string;
  names: string[];
}

export default function App() {
  const [namesInput, setNamesInput] = useState('');
  const [shuffledNames, setShuffledNames] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered history based on search term
  const filteredHistory = Array.isArray(history) ? history.filter(item => 
    item.timestamp.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.names.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('shuffle_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('shuffle_history', JSON.stringify(history));
  }, [history]);

  const shuffle = useCallback(() => {
    const names = namesInput
      .split(/[\n,]/)
      .map((name) => name.trim())
      .filter((name) => name !== '');

    if (names.length === 0) {
      setShuffledNames([]);
      return;
    }

    const arr = [...names];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    setShuffledNames(arr);
    setCopied(false);

    // Add to history
    const newHistoryItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleString(),
      names: arr
    };
    setHistory(prev => [newHistoryItem, ...prev].slice(0, 50)); 
  }, [namesInput]);

  const clear = () => {
    setNamesInput('');
    setShuffledNames([]);
    setCopied(false);
  };

  const copyToClipboard = () => {
    if (shuffledNames.length === 0) return;
    navigator.clipboard.writeText(shuffledNames.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportToCSV = (names: string[] = shuffledNames, label?: string) => {
    if (names.length === 0) return;
    
    const BOM = '\uFEFF';
    const csvContent = BOM + "序號,姓名\n" + names.map((name, index) => `${index + 1},${name}`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const date = new Date();
    const timestampStr = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}_${date.getHours().toString().padStart(2,'0')}${date.getMinutes().toString().padStart(2,'0')}`;
    link.setAttribute('href', url);
    link.setAttribute('download', `${label || '排序名單'}_${timestampStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setNamesInput(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const applyHistoryItem = (item: HistoryItem) => {
    setShuffledNames(item.names);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    if (confirm('確定要清空所有歷史記錄嗎？')) {
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF1EB] via-[#FAD0C4] to-[#FFD1FF] text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#FF9A9E] to-[#A18CD1]"
          >
            每月高檢隨機排序
          </motion.h1>
          <div className="flex items-center justify-center gap-4 mt-4">
             <div className="h-px bg-slate-300 w-8 md:w-16"></div>
             <p className="text-lg font-bold text-slate-500 italic">精準日期儲存 • 歷史紀錄追蹤</p>
             <div className="h-px bg-slate-300 w-8 md:w-16"></div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Input column */}
          <section className="space-y-6">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/50 shadow-xl shadow-pink-200/40">
              <label 
                htmlFor="names-input"
                className="block text-sm font-bold uppercase mb-4 flex flex-wrap items-center gap-2 text-slate-600"
              >
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-[#FF9A9E]" /> 
                  請輸入人名
                </div>
                
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-slate-500 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer border border-slate-100 shadow-sm"
                  >
                    <FileUp size={14} />
                    匯入檔案
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.csv"
                    className="hidden"
                  />
                  {namesInput.trim() && (
                    <span className="bg-gradient-to-r from-[#FF9A9E] to-[#FAD0C4] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                      目前：{namesInput.split(/[\n,]/).map(n => n.trim()).filter(n => n !== '').length} 人
                    </span>
                  )}
                </div>
              </label>
              
              <textarea
                id="names-input"
                placeholder="例如：&#10;王小明&#10;李小華&#10;張大德"
                value={namesInput}
                onChange={(e) => setNamesInput(e.target.value)}
                className="w-full h-64 p-5 rounded-2xl border border-pink-50 focus:outline-none focus:ring-4 focus:ring-pink-100/30 bg-white font-medium resize-none shadow-inner transition-all placeholder:text-slate-300"
              />
              
              <div className="flex gap-4 mt-8">
                <button
                  id="action-shuffle"
                  onClick={shuffle}
                  className="flex-1 bg-gradient-to-r from-[#FF9A9E] to-[#FAD0C4] text-white px-6 py-4 rounded-2xl font-black uppercase tracking-wider text-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer shadow-md"
                >
                  <Shuffle size={24} /> 開始排序
                </button>
                <button
                  id="action-clear"
                  onClick={clear}
                  className="bg-white text-slate-300 border border-slate-100 p-4 rounded-2xl hover:text-red-400 hover:bg-red-50 active:scale-95 transition-all cursor-pointer shadow-sm group"
                  title="全部清除"
                >
                  <Trash2 size={24} className="group-hover:rotate-6 transition-transform" />
                </button>
              </div>
            </div>

            {/* Desktop History Section */}
            <div className="hidden lg:block bg-white/50 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center gap-2 font-black text-slate-500 uppercase tracking-widest text-xs">
                  <History size={16} /> 歷史排序紀錄
                </h3>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="text-[10px] font-bold text-slate-400 hover:text-red-400 transition-colors uppercase"
                  >
                    清空歷史
                  </button>
                )}
              </div>

              {/* History Search */}
              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="搜尋日期或人名..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/60 border border-slate-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pink-200/50 transition-all placeholder:text-slate-300"
                />
              </div>
              
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-3 custom-scrollbar">
                {filteredHistory.length === 0 ? (
                  <div className="py-12 text-center text-slate-300 italic text-sm">
                    {searchTerm ? '找不到符合的結果' : '尚未有任何排序紀錄'}
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => applyHistoryItem(item)}
                      className="group p-4 bg-white/60 rounded-2xl border border-transparent hover:border-[#FF9A9E]/30 hover:bg-white hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                           <Calendar size={10} />
                           {item.timestamp}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              exportToCSV(item.names, `歷史排序_${item.timestamp.replace(/[/:\s]/g, '_')}`);
                            }}
                            className="p-1 text-slate-300 hover:text-green-500 transition-all"
                            title="下載此紀錄"
                          >
                            <FileDown size={14} />
                          </button>
                          <button 
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="p-1 text-slate-300 hover:text-red-400 transition-all"
                            title="刪除"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-slate-700 truncate pr-6">
                        {item.names.length} 人：{item.names.slice(0, 3).join(', ')}{item.names.length > 3 ? '...' : ''}
                      </div>
                      <div className="absolute right-3 bottom-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <ArrowRight size={14} className="text-[#FF9A9E]" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Result Column */}
          <section className="space-y-6">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 min-h-[500px] border border-white/50 shadow-xl shadow-indigo-100/30 relative">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <h2 className="text-xl font-black text-indigo-900/30 uppercase tracking-widest">當前排序結果</h2>
                <div className="flex gap-2">
                  {shuffledNames.length > 0 && (
                    <>
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-100 font-bold text-xs text-slate-500 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                      >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        {copied ? '已複製名單' : '複製文字'}
                      </button>
                      <button
                        onClick={() => exportToCSV(shuffledNames)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#A18CD1] text-white font-bold text-xs hover:bg-[#8E7AC0] hover:shadow-lg transition-all cursor-pointer shadow-md"
                      >
                        <FileDown size={14} />
                        下載 Excel (CSV)
                      </button>
                    </>
                  )}
                </div>
              </div>

              {shuffledNames.length === 0 ? (
                <div className="h-80 flex flex-col items-center justify-center text-center opacity-20">
                  <div className="mb-8 p-12 rounded-full bg-slate-50 shadow-inner">
                    <Shuffle size={80} className="text-slate-300" />
                  </div>
                  <p className="font-bold uppercase tracking-[0.4em] text-xs">請先於左側輸入名單並排序</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {shuffledNames.map((name, index) => (
                      <motion.div
                        key={`${name}-${index}`}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 450,
                          damping: 35,
                          delay: index * 0.02 
                        }}
                        className="bg-white/90 rounded-2xl p-4 flex items-center justify-between group hover:shadow-md transition-all border border-transparent hover:border-pink-50"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#FBC2EB] to-[#A18CD1] text-white font-black text-sm">
                            {index + 1}
                          </span>
                          <span className="font-bold text-slate-700 text-lg">{name}</span>
                        </div>
                        <Shuffle size={14} className="text-slate-100 group-hover:text-pink-200 transition-colors" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              
              {shuffledNames.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 bg-gradient-to-r from-[#A18CD1] to-[#FBC2EB] text-white p-5 rounded-2xl font-bold text-sm flex justify-between shadow-lg shadow-purple-100/40"
                >
                  <span className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-sm" />
                    本組人數：{shuffledNames.length} 人
                  </span>
                  <span className="opacity-80 flex items-center gap-1.5">
                    <Clock size={14} />
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 隨機生成
                  </span>
                </motion.div>
              )}
            </div>

            {/* Mobile History (Horizontal) */}
            <div className="lg:hidden bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/30 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center gap-2 font-black text-slate-500 uppercase tracking-widest text-xs">
                  <History size={16} /> 歷史紀錄
                </h3>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="text-[10px] font-bold text-slate-400 hover:text-red-400"
                  >
                    清空
                  </button>
                )}
              </div>

              {/* Mobile Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="搜尋歷史紀錄..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-white/60 border border-slate-100 rounded-xl text-xs focus:outline-none shadow-sm"
                />
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-6 px-1 custom-scrollbar">
                {filteredHistory.length === 0 ? (
                  <div className="w-full text-center py-4 text-slate-300 italic text-sm">
                    {searchTerm ? '找不到結果' : '暫無紀錄'}
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <motion.div 
                      key={item.id}
                      onClick={() => applyHistoryItem(item)}
                      className="min-w-[220px] flex-shrink-0 p-5 bg-white rounded-2xl border border-white hover:shadow-lg transition-all cursor-pointer relative"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {item.timestamp}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              exportToCSV(item.names, `歷史排序_${item.timestamp.replace(/[/:\s]/g, '_')}`);
                            }}
                            className="p-1 text-slate-200 hover:text-green-500"
                          >
                            <FileDown size={14} />
                          </button>
                          <button 
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="p-1 text-slate-200 hover:text-red-400"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm font-black text-slate-700 mb-2">
                        {item.names.length} 人排序
                      </div>
                      <div className="text-[11px] text-slate-400 truncate opacity-60">
                        {item.names.slice(0, 2).join(', ')}...
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-20 text-center border-t border-white/40 pt-10 pb-8">
          <p className="font-bold uppercase text-[10px] tracking-[0.5em] text-slate-400">
            Magic Shuffler • 隨機排序紀錄系統 Version 2.0
          </p>
        </footer>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(161, 140, 209, 0.15);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(161, 140, 209, 0.3);
        }
      `}</style>
    </div>
  );
}

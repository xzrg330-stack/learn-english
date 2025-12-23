
import React, { useState, useEffect, useCallback } from 'react';
import { Article } from './types';
import { ReaderNavbar, AdminNavbar } from './components/Navbar';
import ArticleCard from './components/ArticleCard';
import ArticleEditor from './components/ArticleEditor';
import ArticleReader from './components/ArticleReader';

const App: React.FC = () => {
  const [view, setView] = useState<'reader' | 'admin'>('reader');
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Function to determine view from URL
  const getViewFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'admin' ? 'admin' : 'reader';
  }, []);

  // Handle navigation
  const navigate = useCallback((targetView: 'reader' | 'admin') => {
    setView(targetView);
    setSelectedArticleId(null);
    setShowEditor(false);
    setEditingArticleId(null);
    
    // Update URL without reload
    const url = new URL(window.location.href);
    if (targetView === 'admin') {
      url.searchParams.set('view', 'admin');
    } else {
      url.searchParams.delete('view');
    }
    window.history.pushState({}, '', url.toString());
  }, []);

  useEffect(() => {
    // Initial view set
    setView(getViewFromUrl());

    // Listen for back/forward browser buttons
    const handlePopState = () => {
      setView(getViewFromUrl());
      setSelectedArticleId(null);
      setShowEditor(false);
    };

    window.addEventListener('popstate', handlePopState);
    
    const saved = localStorage.getItem('local_reader_articles_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Data migration: Ensure all old articles have isPublished property
      const migrated = parsed.map((a: any) => ({
        ...a,
        isPublished: a.isPublished !== undefined ? a.isPublished : true
      }));
      setArticles(migrated);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [getViewFromUrl]);

  useEffect(() => {
    if (articles.length > 0) {
      localStorage.setItem('local_reader_articles_v1', JSON.stringify(articles));
    }
  }, [articles]);

  const handleSaveArticle = (data: Omit<Article, 'id' | 'createdAt' | 'viewCount' | 'isPublished'>) => {
    if (editingArticleId) {
      setArticles(prev => prev.map(a => a.id === editingArticleId ? { ...a, ...data } : a));
    } else {
      const newArticle: Article = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: Date.now(),
        viewCount: 0,
        isPublished: true // Default to published when new
      };
      setArticles([newArticle, ...articles]);
    }
    setShowEditor(false);
    setEditingArticleId(null);
  };

  const handleTogglePublish = (id: string) => {
    setArticles(prev => prev.map(a => 
      a.id === id ? { ...a, isPublished: !a.isPublished } : a
    ));
  };

  const handleDeleteArticle = (id: string) => {
    if (confirm("确定要删除这篇文章吗？")) {
      const updated = articles.filter(a => a.id !== id);
      setArticles(updated);
      localStorage.setItem('local_reader_articles_v1', JSON.stringify(updated));
    }
  };

  const handleSelectArticle = (id: string) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, viewCount: a.viewCount + 1 } : a));
    setSelectedArticleId(id);
  };

  const renderReaderPage = () => {
    const selectedArticle = articles.find(a => a.id === selectedArticleId);
    // Only show published articles to readers
    const publishedArticles = articles.filter(a => a.isPublished);

    return (
      <div className="min-h-screen flex flex-col bg-gray-50/50">
        <ReaderNavbar onNavigate={navigate} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-10">
          {selectedArticle ? (
            <ArticleReader article={selectedArticle} onBack={() => setSelectedArticleId(null)} />
          ) : (
            <div className="animate-in fade-in duration-500">
              <div className="mb-12">
                <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">名师AI动画学英语</h2>
              </div>
              {publishedArticles.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                  <p className="text-gray-400 font-bold">目前书库为空，请联系管理员上传文章。</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {publishedArticles.map(article => (
                    <ArticleCard key={article.id} article={article} onClick={() => handleSelectArticle(article.id)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  };

  const renderAdminPage = () => {
    const editingArticle = articles.find(a => a.id === editingArticleId);

    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <AdminNavbar onNavigate={navigate} />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-10">
          {showEditor ? (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <button onClick={() => { setShowEditor(false); setEditingArticleId(null); }} className="mb-6 text-indigo-600 flex items-center gap-2 font-bold hover:underline">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                取消编辑并返回列表
              </button>
              <ArticleEditor onSave={handleSaveArticle} initialArticle={editingArticle} />
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 gap-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">文章库管理</h2>
                  <p className="text-slate-500 mt-1">上传、编辑文章及对应的句子级音频。</p>
                </div>
                <button 
                  onClick={() => { setEditingArticleId(null); setShowEditor(true); }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 transition-all flex items-center gap-3 w-full md:w-auto justify-center"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  发布新文章
                </button>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">标题</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">状态</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">阅读量</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">管理操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {articles.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold italic">
                            暂无文章，点击上方按钮发布第一篇。
                          </td>
                        </tr>
                      ) : (
                        articles.map(article => (
                          <tr key={article.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-6">
                              <span className="font-bold text-slate-900 block truncate max-w-md">{article.title}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(article.createdAt).toLocaleDateString()}</span>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <button 
                                onClick={() => handleTogglePublish(article.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black transition-all ${
                                  article.isPublished 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${article.isPublished ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                                {article.isPublished ? '已上架' : '已下架'}
                              </button>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black">
                                {article.viewCount} 阅览
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-3">
                                <button onClick={() => { setEditingArticleId(article.id); setShowEditor(true); }} className="p-3 bg-slate-100 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all" title="编辑文章">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button onClick={() => handleDeleteArticle(article.id)} className="p-3 bg-slate-100 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all" title="删除文章">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  };

  return view === 'admin' ? renderAdminPage() : renderReaderPage();
};

export default App;

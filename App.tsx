
import React, { useState, useEffect, useCallback } from 'react';
import { Article } from './types';
import { ReaderNavbar, AdminNavbar } from './components/Navbar';
import ArticleCard from './components/ArticleCard';
import ArticleEditor from './components/ArticleEditor';
import ArticleReader from './components/ArticleReader';
import { articleService } from './services/articleService';

export const ReaderApp: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  const loadArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await articleService.fetchArticles();
      setArticles(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  const handleSelectArticle = async (id: string) => {
    setSelectedArticleId(id);
    try {
      await articleService.incrementViewCount(id);
      setArticles(prev => prev.map(a => a.id === id ? { ...a, viewCount: a.viewCount + 1 } : a));
    } catch (err) {
      console.warn("更新阅读量失败");
    }
  };

  const selectedArticle = articles.find(a => a.id === selectedArticleId);
  const publishedArticles = articles.filter(a => a.isPublished);

  if (selectedArticle) {
    return (
      <div className="min-h-screen">
        <ReaderNavbar />
        <main className="max-w-7xl mx-auto px-8 py-12">
          <ArticleReader article={selectedArticle} onBack={() => setSelectedArticleId(null)} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ReaderNavbar />
      
      <main className="max-w-7xl mx-auto px-8 py-20">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-16 border-b-2 border-[#2c2c2c] pb-6 gap-6">
           <div className="flex items-center gap-6">
              <h2 className="text-4xl font-black text-[#2c2c2c] tracking-widest calligraphy">雅颂集</h2>
              <div className="text-[10px] text-[#8b8b8b] uppercase tracking-[0.4em] font-bold">Classic Library</div>
           </div>
           {isLoading && <div className="text-[10px] font-bold tracking-[0.2em] text-[#b22222] animate-pulse">正在开启书箱...</div>}
        </div>

        {publishedArticles.length === 0 && !isLoading ? (
          <div className="text-center py-40 border-4 border-double border-[#d4b16a]/20 bg-white/50">
            <h3 className="text-3xl font-black text-[#8b8b8b] tracking-widest calligraphy">书斋待兴</h3>
            <p className="text-[#8b8b8b] font-bold mt-4">暂无收录，敬请垂询</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {publishedArticles.map(article => (
              <ArticleCard key={article.id} article={article} onClick={() => handleSelectArticle(article.id)} />
            ))}
          </div>
        )}
      </main>

      <footer className="py-20 text-center border-t border-[#d4b16a]/20 mt-20 flex flex-col gap-4">
         <div className="text-[10px] font-bold text-[#8b8b8b] uppercase tracking-[0.5em]">—— 雅颂书院出品 ——</div>
         <a href="admin.html" className="text-[9px] text-slate-300 hover:text-slate-500 transition-colors uppercase tracking-widest">案台入口</a>
      </footer>
    </div>
  );
};

export const AdminApp: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const loadArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await articleService.fetchArticles();
      setArticles(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleSaveArticle = async (data: Omit<Article, 'id' | 'createdAt' | 'viewCount' | 'isPublished'>) => {
    setIsLoading(true);
    try {
      const articleToSave: Omit<Article, 'viewCount' | 'createdAt'> = {
        ...data,
        id: editingArticleId || Math.random().toString(36).substr(2, 9),
        isPublished: true
      };
      await articleService.saveArticle(articleToSave);
      await loadArticles();
      setShowEditor(false);
      setEditingArticleId(null);
    } catch (err) {
      alert("保存失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublish = async (article: Article) => {
    try {
      await articleService.togglePublish(article.id, article.isPublished);
      setArticles(prev => prev.map(a => a.id === article.id ? { ...a, isPublished: !a.isPublished } : a));
    } catch (err) {
      alert("更新状态失败");
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("确定要删除这篇文章吗？")) return;
    setIsLoading(true);
    try {
      await articleService.deleteArticle(id);
      await loadArticles();
    } catch (err) {
      alert("删除失败");
    } finally {
      setIsLoading(false);
    }
  };

  const editingArticle = articles.find(a => a.id === editingArticleId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AdminNavbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-8 py-20">
        {showEditor ? (
          <div>
            <button onClick={() => { setShowEditor(false); setEditingArticleId(null); }} className="mb-10 text-[#b22222] font-bold text-xs tracking-widest flex items-center gap-2 group">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              放弃编辑并返回案台
            </button>
            <ArticleEditor onSave={handleSaveArticle} initialArticle={editingArticle} />
          </div>
        ) : (
          <div className="space-y-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-12 bg-white border border-[#d4b16a] p-12">
               <div>
                  <h2 className="text-4xl font-black text-[#2c2c2c] tracking-tighter">藏经阁管理</h2>
                  <p className="text-[#8b8b8b] mt-2">书简录入与修撰处</p>
               </div>
               <button onClick={() => { setEditingArticleId(null); setShowEditor(true); }} className="bg-[#b22222] text-white px-10 py-4 font-bold text-sm tracking-widest hover:bg-[#2c2c2c] transition-all">
                  新增篇章
               </button>
            </header>

            <div className="bg-white border border-[#d4b16a] overflow-hidden">
               <table className="w-full text-left">
                  <
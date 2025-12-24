
import React from 'react';

export const ReaderNavbar: React.FC = () => {
  return (
    <nav className="sticky top-0 z-50 bg-[#f9f4e8]/90 backdrop-blur-sm border-b-2 border-[#2c2c2c] px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="seal">雅颂书院</div>
          <span className="font-black text-2xl tracking-widest text-[#2c2c2c] calligraphy">名师英语点读</span>
        </div>
        <div className="flex items-center gap-6">
          <a 
            href="admin.html" 
            className="text-xs font-bold text-[#8b8b8b] hover:text-[#b22222] transition-colors tracking-widest border-b border-transparent hover:border-[#b22222] pb-1"
          >
            书斋管理
          </a>
        </div>
      </div>
    </nav>
  );
};

export const AdminNavbar: React.FC = () => {
  return (
    <nav className="sticky top-0 z-50 bg-[#2c2c2c] border-b border-[#d4b16a] px-8 py-4 text-[#f9f4e8]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-[#b22222] text-white px-2 py-1 text-xs font-bold">书院管理</div>
          <span className="font-black text-xl tracking-tighter">内容案台</span>
        </div>
        <a 
          href="index.html"
          className="border border-[#d4b16a] px-6 py-2 text-xs font-bold hover:bg-[#d4b16a] hover:text-[#2c2c2c] transition-all"
        >
          返回书斋
        </a>
      </div>
    </nav>
  );
};

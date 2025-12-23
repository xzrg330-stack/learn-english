
import React from 'react';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  onClick: () => void;
  onDelete?: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick, onDelete }) => {
  const previewText = article.segments.map(s => s.text).join(' ').slice(0, 150) + '...';
  
  return (
    <div 
      className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer flex flex-col"
      onClick={onClick}
    >
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        <img 
          src={`https://picsum.photos/seed/${article.id}/600/400`} 
          alt={article.title}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
        />
        <div className="absolute top-4 left-4 flex gap-1">
          {article.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-2 py-1 bg-white/90 backdrop-blur shadow-sm rounded text-[10px] font-bold uppercase text-gray-700">
              {tag}
            </span>
          ))}
        </div>
        <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/50 backdrop-blur rounded-lg flex items-center gap-1.5 text-white text-[10px] font-bold">
           <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
           {article.viewCount}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-3 flex-1 mb-4 leading-relaxed">
          {previewText}
        </p>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">
              {article.author[0].toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-gray-700">{article.author}</span>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{new Date(article.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;

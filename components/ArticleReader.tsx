
import React, { useState, useEffect, useRef } from 'react';
import { Article, VocabularyItem } from '../types';
import { smartDecodeAudio } from '../services/geminiService';

interface ArticleReaderProps {
  article: Article;
  onBack: () => void;
}

const ArticleReader: React.FC<ArticleReaderProps> = ({ article, onBack }) => {
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [activeWord, setActiveWord] = useState<VocabularyItem | null>(null);
  const [wordPopupPos, setWordPopupPos] = useState<{ top: number, left: number } | null>(null);
  
  const audioRef = useRef<{ source: AudioBufferSourceNode; context: AudioContext } | null>(null);
  const wordAudioRef = useRef<{ source: AudioBufferSourceNode; context: AudioContext } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      // Close word popup if clicking away from a word
      if (activeWord && !(event.target as HTMLElement).closest('strong')) {
        setActiveWord(null);
        setWordPopupPos(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeWord]);

  useEffect(() => {
    if (audioRef.current && audioRef.current.source) {
      audioRef.current.source.playbackRate.setTargetAtTime(playbackSpeed, audioRef.current.context.currentTime, 0.1);
    }
  }, [playbackSpeed]);

  useEffect(() => {
    return () => {
      stopAudio();
      stopWordAudio();
    };
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
      try { audioRef.current.source.stop(); } catch (e) {}
      audioRef.current.context.close();
      audioRef.current = null;
    }
    setActiveSegmentId(null);
  };

  const stopWordAudio = () => {
    if (wordAudioRef.current) {
      try { wordAudioRef.current.source.stop(); } catch (e) {}
      wordAudioRef.current.context.close();
      wordAudioRef.current = null;
    }
  };

  const handlePointRead = async (segmentId: string, preAudio?: string) => {
    if (isLoading) return;
    if (activeSegmentId === segmentId) {
      stopAudio();
      return;
    }

    if (!preAudio) {
      alert("该句子尚未配置本地音频。");
      return;
    }

    stopAudio();
    setIsLoading(true);
    setActiveSegmentId(segmentId);

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await smartDecodeAudio(preAudio, audioContext);
      
      if (audioContext.state === 'suspended') await audioContext.resume();

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = playbackSpeed;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        if (activeSegmentId === segmentId) {
          setActiveSegmentId(null);
          setTimeout(() => { try { audioContext.close(); } catch(e) {} }, 100);
          audioRef.current = null;
        }
      };

      source.start(0);
      audioRef.current = { source, context: audioContext };
    } catch (err) {
      console.error("Playback Error:", err);
      setActiveSegmentId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordClick = async (e: React.MouseEvent, wordItem: VocabularyItem) => {
    e.stopPropagation(); 
    stopWordAudio();

    // Calculate position
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (containerRect) {
      setWordPopupPos({
        top: rect.top - containerRect.top - 10, // 10px spacing
        left: rect.left - containerRect.left + (rect.width / 2)
      });
    }

    setActiveWord(wordItem);

    if (!wordItem.audioData) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await smartDecodeAudio(wordItem.audioData, audioContext);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
      wordAudioRef.current = { source, context: audioContext };
      
      source.onended = () => {
         setTimeout(() => { try { audioContext.close(); } catch(e) {} }, 100);
         wordAudioRef.current = null;
      };
    } catch (err) {
      console.error("Word Audio Playback Error", err);
    }
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const renderHighlightedText = (text: string) => {
    if (!article.keyVocabulary || article.keyVocabulary.length === 0) return text;
    
    const sortedVocab = [...article.keyVocabulary].sort((a, b) => b.word.length - a.word.length);
    const pattern = sortedVocab.map(v => escapeRegExp(v.word)).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      const vocabMatch = sortedVocab.find(v => v.word.toLowerCase() === part.toLowerCase());
      if (vocabMatch) {
        return (
          <strong 
            key={i}
            onClick={(e) => handleWordClick(e, vocabMatch)}
            className={`
              inline-block px-1 rounded-md cursor-help border-b-2 font-black transition-all duration-200
              ${activeWord?.id === vocabMatch.id 
                ? 'bg-yellow-300 border-yellow-500 scale-105 shadow-sm text-gray-900' 
                : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-yellow-100 hover:border-yellow-400'
              }
            `}
          >
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="max-w-4xl mx-auto pb-32 px-2 sm:px-4 relative" ref={containerRef}>
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={onBack}
          className="py-2 px-1 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-semibold text-sm sm:text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回书库
        </button>

        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2.5 rounded-xl border transition-all duration-200 flex items-center gap-2 ${
              isMenuOpen ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            <span className="text-sm font-bold hidden sm:inline">语速设置</span>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in duration-200">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">播放语速</label>
                <div className="grid grid-cols-3 gap-2">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                    <button
                      key={s}
                      onClick={() => setPlaybackSpeed(s)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        playbackSpeed === s ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
            </div>
          )}
        </div>
      </div>

      <header className="mb-10 border-b border-gray-100 pb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags.map(tag => (
            <span key={tag} className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-6 serif-font">
          {article.title}
        </h1>
        <div className="flex items-center gap-4 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {article.author[0].toUpperCase()}
            </div>
            <span className="font-semibold text-gray-700">{article.author}</span>
          </div>
          <span className="font-medium">{new Date(article.createdAt).toLocaleDateString()}</span>
        </div>
      </header>

      {/* Vocabulary Definition Popup */}
      {activeWord && wordPopupPos && (
        <div 
          className="absolute z-[60] animate-in zoom-in-95 fade-in slide-in-from-bottom-2 duration-200"
          style={{
            top: `${wordPopupPos.top}px`,
            left: `${wordPopupPos.left}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-100 p-4 min-w-[200px] max-w-[280px]">
            <h4 className="text-lg font-black text-blue-600 mb-1">{activeWord.word}</h4>
            <div className="h-px bg-blue-50 w-full mb-2"></div>
            <p className="text-gray-600 text-sm leading-relaxed">{activeWord.definition}</p>
            {/* Arrow pointing down */}
            <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-white/95 border-r border-b border-blue-100 rotate-45"></div>
          </div>
        </div>
      )}

      <div className="prose prose-lg max-w-none serif-font space-y-4">
        {article.segments.map((seg) => (
          <div 
            key={seg.id}
            onClick={() => handlePointRead(seg.id, seg.audioData)}
            className={`
              relative p-4 rounded-2xl cursor-pointer transition-all duration-300 leading-relaxed
              ${activeSegmentId === seg.id 
                ? 'bg-blue-600 text-white shadow-xl transform scale-[1.01] z-10' 
                : 'hover:bg-gray-50 text-gray-800'
              }
              ${!seg.audioData ? 'opacity-70 italic cursor-default' : ''}
            `}
          >
            <div className={`text-lg sm:text-xl font-medium ${activeSegmentId === seg.id ? 'text-white' : 'text-gray-800'}`}>
              {renderHighlightedText(seg.text)}
            </div>
            
            {seg.translation && activeSegmentId === seg.id && (
              <div className="mt-2 pt-2 border-t border-white/20 animate-in fade-in slide-in-from-top-1 duration-300">
                <p className="text-sm sm:text-base text-blue-50 font-sans italic opacity-90">
                  {seg.translation}
                </p>
              </div>
            )}
            
            {activeSegmentId === seg.id && (
              <span className="absolute -top-1.5 -right-1.5 bg-white text-blue-600 rounded-full p-1.5 shadow-md border border-blue-100">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
              </span>
            )}
          </div>
        ))}
      </div>

      {(activeSegmentId !== null || isLoading) && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4">
          <button 
            onClick={stopAudio}
            className="flex items-center gap-3 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl transition-all active:scale-95 group"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-bold text-sm tracking-widest uppercase">停止播放</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default ArticleReader;

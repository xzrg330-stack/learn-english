
import { createClient } from '@supabase/supabase-js';
import { Article } from '../types';

/**
 * 注意：由于这是演示项目，请在下方填入您的 Supabase 凭据。
 * 在实际生产环境中，这些应该存储在环境变量中。
 */
const SUPABASE_URL = 'https://your-project-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// 初始化 Supabase 客户端
// 如果没有提供真实的 URL，则回退到模拟模式，但代码结构已完全准备好
const isMockMode = SUPABASE_URL.includes('your-project-url');
const supabase = isMockMode ? null : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const articleService = {
  /**
   * 获取所有文章
   */
  async fetchArticles(): Promise<Article[]> {
    if (isMockMode) {
      console.warn("未检测到 Supabase 凭据，正在使用模拟/本地数据");
      const saved = localStorage.getItem('local_reader_articles_v1');
      return saved ? JSON.parse(saved) : [];
    }

    const { data, error } = await supabase!
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // 转换字段名为前端使用的骆驼拼写法
    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      segments: item.segments,
      keyVocabulary: item.key_vocabulary,
      author: item.author,
      createdAt: new Date(item.created_at).getTime(),
      tags: item.tags,
      viewCount: item.view_count,
      isPublished: item.is_published,
      coverImage: item.cover_image
    }));
  },

  /**
   * 保存或更新文章
   */
  async saveArticle(article: Omit<Article, 'viewCount' | 'createdAt'>): Promise<void> {
    if (isMockMode) {
      const saved = localStorage.getItem('local_reader_articles_v1');
      const articles: Article[] = saved ? JSON.parse(saved) : [];
      const index = articles.findIndex(a => a.id === article.id);
      
      if (index > -1) {
        articles[index] = { ...articles[index], ...article };
      } else {
        articles.unshift({
          ...article,
          viewCount: 0,
          createdAt: Date.now()
        } as Article);
      }
      localStorage.setItem('local_reader_articles_v1', JSON.stringify(articles));
      return;
    }

    const payload = {
      id: article.id,
      title: article.title,
      segments: article.segments,
      key_vocabulary: article.keyVocabulary,
      author: article.author,
      tags: article.tags,
      is_published: article.isPublished,
      cover_image: article.coverImage,
      // created_at 由数据库自动处理或在新建时传入
    };

    const { error } = await supabase!
      .from('articles')
      .upsert(payload);

    if (error) throw error;
  },

  /**
   * 删除文章
   */
  async deleteArticle(id: string): Promise<void> {
    if (isMockMode) {
      const saved = localStorage.getItem('local_reader_articles_v1');
      if (saved) {
        const articles: Article[] = JSON.parse(saved);
        localStorage.setItem('local_reader_articles_v1', JSON.stringify(articles.filter(a => a.id !== id)));
      }
      return;
    }

    const { error } = await supabase!
      .from('articles')
      .delete()
      .match({ id });

    if (error) throw error;
  },

  /**
   * 增加阅读量（原子性操作）
   */
  async incrementViewCount(id: string): Promise<void> {
    if (isMockMode) {
      const saved = localStorage.getItem('local_reader_articles_v1');
      if (saved) {
        const articles: Article[] = JSON.parse(saved);
        const index = articles.findIndex(a => a.id === id);
        if (index > -1) {
          articles[index].viewCount += 1;
          localStorage.setItem('local_reader_articles_v1', JSON.stringify(articles));
        }
      }
      return;
    }

    const { error } = await supabase!.rpc('increment_view_count', { article_id: id });
    
    // 如果没有配置 RPC 也可以直接更新，虽然非原子性
    if (error) {
       const { data } = await supabase!.from('articles').select('view_count').eq('id', id).single();
       await supabase!.from('articles').update({ view_count: (data?.view_count || 0) + 1 }).eq('id', id);
    }
  },

  /**
   * 切换上下架状态
   */
  async togglePublish(id: string, currentState: boolean): Promise<void> {
    if (isMockMode) {
      const saved = localStorage.getItem('local_reader_articles_v1');
      if (saved) {
        const articles: Article[] = JSON.parse(saved);
        const index = articles.findIndex(a => a.id === id);
        if (index > -1) {
          articles[index].isPublished = !currentState;
          localStorage.setItem('local_reader_articles_v1', JSON.stringify(articles));
        }
      }
      return;
    }

    const { error } = await supabase!
      .from('articles')
      .update({ is_published: !currentState })
      .match({ id });

    if (error) throw error;
  }
};

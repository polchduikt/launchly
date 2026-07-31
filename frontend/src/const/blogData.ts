export interface BlogArticle {
  id: string;
  title: string;
  category: string;
  author: string;
  readTime: string;
  date: string;
  summary: string;
  coverImage: string;
  tags: string[];
  contentBlocks: Array<
    | { type: 'paragraph'; text: string }
    | { type: 'heading'; text: string; level: number }
    | { type: 'quote'; text: string; author?: string }
    | { type: 'list'; items: string[] }
    | { type: 'image'; url: string; caption?: string }
  >;
}

export const BLOG_ARTICLES: BlogArticle[] = [];

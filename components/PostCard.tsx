import React, { useMemo } from 'react';
import { HivePost } from '../types';
import { ExternalLink, Calendar, User, Image as ImageIcon } from 'lucide-react';

interface PostCardProps {
  post: HivePost;
  keywords: string[];
  platformUrl: string;
}

const PostCard: React.FC<PostCardProps> = ({ post, keywords, platformUrl }) => {
  const hiveUrl = `${platformUrl}/@${post.author}/${post.permlink}`;
  const authorUrl = `${platformUrl}/@${post.author}`;

  // Helper to extract the first image from Markdown or HTML
  const postImage = useMemo(() => {
    // 1. Try Markdown image syntax: ![alt](url)
    const mdMatch = post.body.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
    if (mdMatch && mdMatch[1]) return mdMatch[1];

    // 2. Try HTML image tag: <img src="url">
    const htmlMatch = post.body.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/);
    if (htmlMatch && htmlMatch[1]) return htmlMatch[1];

    return null;
  }, [post.body]);

  // Helper to highlight keywords in snippet
  const getHighlightSnippet = (text: string, maxLength: number = 200) => {
    // Remove markdown image syntax for the snippet to look cleaner
    const cleanText = text
      .replace(/!\[.*?\]\(.*?\)/g, '') // remove md images
      .replace(/<img[^>]*>/g, '')      // remove html images
      .replace(/(?:^|\n)#+\s/g, '')    // remove headers
      .trim();

    let snippet = cleanText.slice(0, maxLength);
    if (cleanText.length > maxLength) snippet += '...';
    
    return snippet; 
  };

  const formattedDate = new Date(post.created).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md dark:hover:shadow-slate-900/50 transition-all duration-200 flex flex-col h-full group">
      
      {/* Post Image Preview */}
      {postImage ? (
        <div className="h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
            <img 
              src={postImage} 
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ) : (
        <div className="h-48 w-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-300 dark:text-slate-700">
           <ImageIcon size={48} />
        </div>
      )}

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-3">
          <div>
             <a 
              href={authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 mb-1"
             >
               <User size={16} className="mr-1.5 text-slate-400 dark:text-slate-500" />
               @{post.author}
             </a>
             <div className="flex items-center text-xs text-slate-500 dark:text-slate-500">
               <Calendar size={14} className="mr-1.5" />
               {formattedDate}
             </div>
          </div>
          <a 
            href={hiveUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-slate-400 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Open Post"
          >
            <ExternalLink size={18} />
          </a>
        </div>

        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 leading-tight line-clamp-2">
          <a href={hiveUrl} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-red-500/50">
            {post.title}
          </a>
        </h3>

        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 flex-grow break-words overflow-hidden">
          {getHighlightSnippet(post.body)}
        </p>

        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50">
             #{post.category || 'general'}
           </span>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
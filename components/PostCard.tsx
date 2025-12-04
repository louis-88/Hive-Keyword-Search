import React from 'react';
import { HivePost } from '../types';
import { ExternalLink, Calendar, User } from 'lucide-react';

interface PostCardProps {
  post: HivePost;
  keywords: string[];
}

const PostCard: React.FC<PostCardProps> = ({ post, keywords }) => {
  const hiveUrl = `https://hive.blog/@${post.author}/${post.permlink}`;

  // Helper to highlight keywords in snippet
  const getHighlightSnippet = (text: string, maxLength: number = 200) => {
    let snippet = text.slice(0, maxLength);
    if (text.length > maxLength) snippet += '...';
    
    // Simple naive highlighting for display purposes
    // In a real robust app, we'd use a parser to avoid breaking HTML tags if body contains HTML
    // Assuming body is plain text or markdown for this snippet view
    return snippet; 
  };

  const formattedDate = new Date(post.created).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <div>
           <a 
            href={`https://hive.blog/@${post.author}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm font-semibold text-slate-700 hover:text-red-600 mb-1"
           >
             <User size={16} className="mr-1.5 text-slate-400" />
             @{post.author}
           </a>
           <div className="flex items-center text-xs text-slate-500">
             <Calendar size={14} className="mr-1.5" />
             {formattedDate}
           </div>
        </div>
        <a 
          href={hiveUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-red-600 transition-colors"
          title="Open on Hive.blog"
        >
          <ExternalLink size={18} />
        </a>
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight line-clamp-2">
        <a href={hiveUrl} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-red-500/50">
          {post.title}
        </a>
      </h3>

      <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-grow break-words overflow-hidden">
        {getHighlightSnippet(post.body)}
      </p>

      <div className="mt-auto pt-3 border-t border-slate-100 flex flex-wrap gap-2">
         {/* Display matches found in a pill if needed, or just category */}
         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
           #{post.category || 'general'}
         </span>
      </div>
    </div>
  );
};

export default PostCard;

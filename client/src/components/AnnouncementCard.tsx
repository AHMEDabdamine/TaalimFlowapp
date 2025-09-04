import { Announcement } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useState } from 'react';
import { X, Maximize2 } from 'lucide-react';

interface AnnouncementCardProps {
  announcement: Announcement;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullView, setShowFullView] = useState(false);
  const isLongContent = announcement.content.length > 120;

  return (
    <div className="announcement-card rounded-xl p-4 lg:p-6 text-white h-fit">
      {/* Display image if available */}
      {announcement.imageUrl && (
        <div className="mb-4 relative group">
          <img 
            src={announcement.imageUrl} 
            alt={announcement.title}
            className="w-full h-auto object-contain rounded-lg cursor-pointer transition-transform hover:scale-[1.02] max-h-96"
            onClick={() => setShowFullView(true)}
          />
          {/* Expand icon overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
            <Maximize2 className="w-8 h-8 text-white" />
          </div>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-reverse space-x-2">
          <div className="w-2 h-2 bg-white dark:bg-gray-300 rounded-full"></div>
          <span className="text-sm opacity-90">
            {formatDistanceToNow(new Date(announcement.createdAt), { 
              addSuffix: true, 
              locale: ar 
            })}
          </span>
        </div>
        <svg className="w-5 h-5 opacity-80" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <h4 
        className="font-bold text-lg lg:text-xl mb-2 lg:mb-3 line-clamp-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setShowFullView(true)}
      >
        {announcement.title}
      </h4>
      <p className="text-sm lg:text-base opacity-90 leading-relaxed">
        {isLongContent && !isExpanded 
          ? `${announcement.content.substring(0, 120)}...`
          : announcement.content
        }
      </p>
      {isLongContent && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 lg:mt-4 bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm lg:text-base font-medium hover:bg-white/30 dark:hover:bg-gray-700/60 transition-colors"
        >
          {isExpanded ? 'إخفاء' : 'اقرأ المزيد'}
        </button>
      )}
      
      {/* View Full Post Button */}
      <button 
        onClick={() => setShowFullView(true)}
        className="mt-3 lg:mt-4 bg-blue-500/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm lg:text-base font-medium hover:bg-blue-500/30 transition-colors flex items-center gap-2"
      >
        <Maximize2 className="w-4 h-4" />
        عرض كامل
      </button>
      
      {/* Full View Modal */}
      {showFullView && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowFullView(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl max-h-[90vh] w-full overflow-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 line-clamp-1">
                {announcement.title}
              </h3>
              <button 
                onClick={() => setShowFullView(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {/* Full Size Image */}
              {announcement.imageUrl && (
                <div className="mb-6">
                  <img 
                    src={announcement.imageUrl} 
                    alt={announcement.title}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>
              )}
              
              {/* Announcement Details */}
              <div className="space-y-4">
                <div className="flex items-center space-x-reverse space-x-3 text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>
                    {formatDistanceToNow(new Date(announcement.createdAt), { 
                      addSuffix: true, 
                      locale: ar 
                    })}
                  </span>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                  {announcement.title}
                </h2>
                
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {announcement.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

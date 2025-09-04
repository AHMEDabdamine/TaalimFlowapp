import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BlogPost } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

export default function Blog() {
  const { user, loading: authLoading } = useAuth();
  
  const { data: posts = [], isLoading: loading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog-posts'],
    enabled: !!user && !authLoading,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">المدونة</h2>
      
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.filter(post => post.published).map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{post.title}</CardTitle>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(post.createdAt), { 
                    addSuffix: true, 
                    locale: ar 
                  })}
                </p>
              </CardHeader>
              <CardContent>
                {post.imageUrl && (
                  <div className="mb-4">
                    <img 
                      src={post.imageUrl} 
                      alt={post.title} 
                      className="w-full h-48 object-cover rounded-lg"
                      style={{ aspectRatio: '16/9' }}
                    />
                  </div>
                )}
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">لا توجد مقالات حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Share',
  robots: { index: false, follow: false },
};

interface SharePageProps {
  searchParams: Promise<{
    title?: string;
    text?: string;
    url?: string;
  }>;
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const params = await searchParams;
  const { title, text, url } = params;
  
  // If a URL is shared, redirect to the reader
  if (url) {
    redirect(`/read?url=${encodeURIComponent(url)}`);
  }
  
  // If text contains a URL, extract and redirect
  if (text) {
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      redirect(`/read?url=${encodeURIComponent(urlMatch[0])}`);
    }
  }
  
  // Otherwise, show a simple share receipt page
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center shadow-lg shadow-gray-500/30">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-white">Content Shared</h1>
          <p className="text-gray-400 mt-2">Thanks for sharing with Free Crypto News!</p>
        </div>
        
        {(title || text) && (
          <div className="bg-gray-800/50 rounded-xl p-4 text-left border border-gray-700/50">
            {title && (
              <p className="text-white font-medium">{title}</p>
            )}
            {text && (
              <p className="text-gray-400 text-sm mt-2">{text}</p>
            )}
          </div>
        )}
        
        <a
          href="/"
          className="inline-block w-full py-3 px-6 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-semibold rounded-xl transition-all duration-200"
        >
          Go to Home
        </a>
      </div>
    </div>
  );
}

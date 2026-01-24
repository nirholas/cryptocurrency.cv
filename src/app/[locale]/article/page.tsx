import { redirect } from 'next/navigation';

// Redirect /article to home page - articles require an ID
export default function ArticlePage() {
  redirect('/');
}

import { redirect } from 'next/navigation';

/**
 * Blog Root Redirect
 * 
 * Redirects /blog to /en/blog (default locale)
 * Users will be directed to the proper localized blog page
 */
export default function BlogRedirect() {
  redirect('/en/blog');
}

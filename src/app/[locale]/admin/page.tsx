import { generateSEOMetadata } from '@/lib/seo';
import AdminDashboard from './AdminDashboard';

export const metadata = generateSEOMetadata({
  title: 'Admin Dashboard',
  description: 'Admin dashboard for monitoring API usage and system health.',
  path: '/admin',
  noindex: true,
});

export default function AdminPage() {
  return <AdminDashboard />;
}

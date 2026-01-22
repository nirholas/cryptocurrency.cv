import { Metadata } from 'next';
import AdminDashboard from './AdminDashboard';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Crypto News',
  description: 'Admin dashboard for monitoring API usage and system health',
  robots: 'noindex, nofollow',
};

export default function AdminPage() {
  return <AdminDashboard />;
}

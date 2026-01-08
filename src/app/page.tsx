import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Posts from '@/components/Posts';
import Footer from '@/components/Footer';
import { getLatestNews } from '@/lib/crypto-news';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function Home() {
  const data = await getLatestNews(30);
  
  return (
    <div className="max-w-7xl mx-auto">
      <Header />
      <Hero />
      <Posts articles={data.articles} />
      <hr className="bg-gray-300 w-[95%] mt-12 h-[0.5px] mx-auto" />
      <Footer />
    </div>
  );
}

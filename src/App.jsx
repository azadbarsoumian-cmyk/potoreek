import { Suspense, lazy, useState } from 'react';
import ComingSoon from '@/pages/ComingSoon';
import { showComingSoon } from '@/lib/siteMode';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import Stories from '@/pages/Stories';
import StoryDetail from '@/pages/StoryDetail';
import Shop from '@/pages/Shop';
import Videos from '@/pages/Videos';
import Blog from '@/pages/Blog';
import BlogDetail from '@/pages/BlogDetail';
import News from '@/pages/News';
import Contact from '@/pages/Contact';
import Poems from '@/pages/Poems';
import Quotes from '@/pages/Quotes';
import NotFound from '@/pages/NotFound';
const Fidayis = lazy(() => import('@/pages/Fidayis'));
const FidayiDetail = lazy(() => import('@/pages/FidayiDetail'));

// The map page pulls in Leaflet, so it loads only when visited.
const ArchiveMap = lazy(() => import('@/pages/ArchiveMap'));
// The Command Center is its own app, loaded only at /admin.
const AdminApp = lazy(() => import('@/admin/AdminApp'));

const isAdminPath = () => window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');

function App() {
  const [admin] = useState(isAdminPath);
  const [comingSoon] = useState(() => !admin && showComingSoon());

  // The Command Center stays reachable while the public site is in coming-soon mode.
  if (admin) {
    return (
      <Router>
        <Suspense fallback={<div className="min-h-screen bg-[#140e0b]" />}>
          <Routes>
            <Route path="/admin/*" element={<AdminApp />} />
          </Routes>
        </Suspense>
      </Router>
    );
  }
  if (comingSoon) return <ComingSoon />;

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/stories/:id" element={<StoryDetail />} />
          <Route path="/fidayis" element={<Suspense fallback={null}><Fidayis /></Suspense>} />
          <Route path="/fidayi/:slug" element={<Suspense fallback={null}><FidayiDetail /></Suspense>} />
          <Route path="/map" element={<Suspense fallback={null}><ArchiveMap /></Suspense>} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/news" element={<News />} />
          <Route path="/poems" element={<Poems />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

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

// The map page pulls in Leaflet, so it loads only when visited.
const ArchiveMap = lazy(() => import('@/pages/ArchiveMap'));

function App() {
  const [comingSoon] = useState(showComingSoon);
  if (comingSoon) return <ComingSoon />;

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/stories/:id" element={<StoryDetail />} />
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

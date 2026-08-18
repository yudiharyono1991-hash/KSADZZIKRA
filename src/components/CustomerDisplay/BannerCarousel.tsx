import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Banner } from '../../types';

interface BannerCarouselProps {
  banners: Banner[];
  autoPlayInterval?: number;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners, autoPlayInterval = 4000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const activeBanners = banners.filter(b => b.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % activeBanners.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [activeBanners.length, autoPlayInterval, currentIndex]); // Added currentIndex to dep array to reset interval on manual navigation if needed. actually better without it so interval is constant. Let's remove it and use just length and interval.

  // Re-run effect to ensure stable interval
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeBanners.length);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [activeBanners.length, autoPlayInterval]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  if (activeBanners.length === 0) return null;

  const getInternalPath = (url: string) => {
    let cleanUrl = url;
    
    // Fallback if the user typed plain text instead of a valid URL path
    if (!cleanUrl.includes('/') && !cleanUrl.includes('katalog') && !cleanUrl.includes('http')) {
      return '/katalog?category=Promo';
    }

    if (cleanUrl.includes('localhost:3001/#/')) {
      cleanUrl = cleanUrl.split('localhost:3001/#/')[1];
    }
    if (cleanUrl.startsWith('/#/')) cleanUrl = cleanUrl.substring(3);
    if (cleanUrl.startsWith('#/')) cleanUrl = cleanUrl.substring(2);
    if (cleanUrl.startsWith('/')) cleanUrl = cleanUrl.substring(1);
    
    // If it's empty after cleaning, default to catalog
    if (!cleanUrl) return '/katalog?category=Promo';
    
    return `/${cleanUrl}`;
  };

  const renderBannerContent = (banner: Banner) => (
    <>
      {/* Store Background with Glass Effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-70 dark:opacity-50"
        style={{ backgroundImage: `url(/store-bg.jpg)` }}
      />
      <div className="absolute inset-0 bg-white/40 dark:bg-black/50 backdrop-blur-md" />
      {/* Main Image */}
      <img 
        src={banner.imageUrl} 
        alt={banner.title}
        className="relative z-10 w-full h-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
      />
      {/* Floating Button */}
      {banner.targetUrl && (
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20">
          <span className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-full font-bold shadow-xl transition-all hover:scale-105 hover:-translate-y-1 flex items-center gap-1.5 whitespace-nowrap text-xs md:text-sm border border-amber-400/50">
            Lihat Katalog Promo <ChevronRight size={14} className="shrink-0" />
          </span>
        </div>
      )}
    </>
  );

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl group h-[50vh] sm:h-auto sm:aspect-[21/9] bg-black">
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {activeBanners[currentIndex].targetUrl ? (
            activeBanners[currentIndex].targetUrl?.startsWith('http') ? (
              <a 
                href={activeBanners[currentIndex].targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full relative overflow-hidden flex items-center justify-center p-4 pb-16 sm:p-4 sm:pb-16"
              >
                {renderBannerContent(activeBanners[currentIndex])}
              </a>
            ) : (
              <Link 
                to={getInternalPath(activeBanners[currentIndex].targetUrl!)}
                className="block w-full h-full relative overflow-hidden flex items-center justify-center p-4 pb-16 sm:p-4 sm:pb-16"
              >
                {renderBannerContent(activeBanners[currentIndex])}
              </Link>
            )
          ) : (
            <div className="block w-full h-full relative overflow-hidden flex items-center justify-center p-4 sm:p-4">
              {renderBannerContent(activeBanners[currentIndex])}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Indicators */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
          {activeBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-300 rounded-full ${
                currentIndex === idx 
                  ? 'w-6 h-2 bg-amber-400' 
                  : 'w-2 h-2 bg-white/50 hover:bg-white'
              }`}
            />
          ))}
        </div>
      )}

      {/* Prev/Next Arrows */}
      {activeBanners.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-all z-30 opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-all z-30 opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
    </div>
  );
};

export default BannerCarousel;

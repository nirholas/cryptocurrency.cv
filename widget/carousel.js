/**
 * Crypto News Carousel Widget - Standalone JS
 * 
 * @example
 * <div id="crypto-carousel" class="crypto-carousel">...</div>
 * <script src="https://nirholas.github.io/free-crypto-news/widget/carousel.js"></script>
 */
(function() {
  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    .crypto-carousel {
      --carousel-bg: #0a0a0a;
      --carousel-card-bg: #141414;
      --carousel-text: #fafafa;
      --carousel-accent: #f7931a;
      --carousel-muted: #a1a1a1;
      --carousel-border: #262626;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--carousel-bg);
      border-radius: 16px;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
    }
    .crypto-carousel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .crypto-carousel-title {
      color: var(--carousel-text);
      font-size: 1.25rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .crypto-carousel-title span { color: var(--carousel-accent); }
    .crypto-carousel-nav { display: flex; gap: 0.5rem; }
    .crypto-carousel-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 1px solid var(--carousel-border);
      background: var(--carousel-card-bg);
      color: var(--carousel-text);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .crypto-carousel-btn:hover {
      border-color: var(--carousel-accent);
      color: var(--carousel-accent);
    }
    .crypto-carousel-viewport { overflow: hidden; }
    .crypto-carousel-track {
      display: flex;
      transition: transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
    }
    .crypto-carousel-slide {
      flex: 0 0 100%;
      padding: 0 0.25rem;
    }
    .crypto-carousel-card {
      background: var(--carousel-card-bg);
      border: 1px solid var(--carousel-border);
      border-radius: 12px;
      padding: 1.5rem;
      height: 100%;
      transition: border-color 0.2s;
    }
    .crypto-carousel-card:hover { border-color: var(--carousel-accent); }
    .crypto-carousel-card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .crypto-carousel-source {
      background: var(--carousel-accent);
      color: #000;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .crypto-carousel-time {
      color: var(--carousel-muted);
      font-size: 0.85rem;
    }
    .crypto-carousel-card h3 {
      color: var(--carousel-text);
      font-size: 1.1rem;
      line-height: 1.4;
      margin-bottom: 0.75rem;
    }
    .crypto-carousel-card h3 a {
      color: inherit;
      text-decoration: none;
    }
    .crypto-carousel-card h3 a:hover { color: var(--carousel-accent); }
    .crypto-carousel-card p {
      color: var(--carousel-muted);
      font-size: 0.9rem;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .crypto-carousel-dots {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    .crypto-carousel-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--carousel-border);
      cursor: pointer;
      transition: all 0.2s;
    }
    .crypto-carousel-dot.active {
      background: var(--carousel-accent);
      width: 24px;
      border-radius: 4px;
    }
    .crypto-carousel-loading {
      text-align: center;
      padding: 3rem;
      color: var(--carousel-muted);
    }
    .crypto-carousel.light {
      --carousel-bg: #ffffff;
      --carousel-card-bg: #f9fafb;
      --carousel-text: #0a0a0a;
      --carousel-muted: #6b7280;
      --carousel-border: #e5e7eb;
    }
    .crypto-carousel.grid .crypto-carousel-slide { flex: 0 0 33.333%; }
    @media (max-width: 768px) {
      .crypto-carousel.grid .crypto-carousel-slide { flex: 0 0 100%; }
    }
    .crypto-carousel-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: var(--carousel-accent);
      border-radius: 0 0 16px 16px;
      transition: width 0.1s linear;
    }
  `;
  document.head.appendChild(style);

  window.CryptoCarousel = {
    API_BASE: 'https://free-crypto-news.vercel.app',
    instances: new Map(),
    
    async init(selector, options) {
      options = options || {};
      var container = document.querySelector(selector);
      if (!container) return;
      
      var config = {
        limit: options.limit || 6,
        category: options.category || 'all',
        autoPlay: options.autoPlay !== false,
        interval: options.interval || 5000,
        showDots: options.showDots !== false,
        slidesPerView: container.classList.contains('grid') ? 3 : 1,
      };
      
      var instance = {
        container: container,
        config: config,
        currentIndex: 0,
        articles: [],
        autoPlayTimer: null,
      };
      
      this.instances.set(selector, instance);
      
      try {
        var endpoint = config.category === 'all' ? '/api/news' : '/api/' + config.category;
        var response = await fetch(this.API_BASE + endpoint + '?limit=' + config.limit);
        var data = await response.json();
        
        instance.articles = data.articles || [];
        this.render(instance);
        this.setupNavigation(instance);
        
        if (config.autoPlay) {
          this.startAutoPlay(instance);
        }
      } catch (error) {
        var track = container.querySelector('.crypto-carousel-track');
        if (track) {
          track.innerHTML = '<div class="crypto-carousel-loading">Failed to load news</div>';
        }
      }
    },
    
    render: function(instance) {
      var container = instance.container;
      var articles = instance.articles;
      var config = instance.config;
      var track = container.querySelector('.crypto-carousel-track');
      var dotsContainer = container.querySelector('.crypto-carousel-dots');
      var self = this;
      
      if (!track || !articles.length) return;
      
      track.innerHTML = articles.map(function(article) {
        return '<div class="crypto-carousel-slide"><div class="crypto-carousel-card">' +
          '<div class="crypto-carousel-card-header">' +
          '<span class="crypto-carousel-source">' + self.escapeHtml(article.source) + '</span>' +
          '<span class="crypto-carousel-time">' + self.escapeHtml(article.timeAgo) + '</span>' +
          '</div>' +
          '<h3><a href="' + self.escapeHtml(article.link) + '" target="_blank" rel="noopener">' +
          self.escapeHtml(article.title) + '</a></h3>' +
          (article.description ? '<p>' + self.escapeHtml(self.truncate(article.description, 150)) + '</p>' : '') +
          '</div></div>';
      }).join('');
      
      if (config.showDots && dotsContainer) {
        var totalSlides = Math.ceil(articles.length / config.slidesPerView);
        var dotsHtml = '';
        for (var i = 0; i < totalSlides; i++) {
          dotsHtml += '<div class="crypto-carousel-dot ' + (i === 0 ? 'active' : '') + '" data-index="' + i + '"></div>';
        }
        dotsContainer.innerHTML = dotsHtml;
      }
    },
    
    setupNavigation: function(instance) {
      var self = this;
      var container = instance.container;
      var config = instance.config;
      var articles = instance.articles;
      
      container.querySelectorAll('.crypto-carousel-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var dir = btn.dataset.dir;
          var totalSlides = Math.ceil(articles.length / config.slidesPerView);
          
          if (dir === 'next') {
            instance.currentIndex = (instance.currentIndex + 1) % totalSlides;
          } else {
            instance.currentIndex = (instance.currentIndex - 1 + totalSlides) % totalSlides;
          }
          
          self.goToSlide(instance, instance.currentIndex);
          if (config.autoPlay) self.startAutoPlay(instance);
        });
      });
      
      container.querySelectorAll('.crypto-carousel-dot').forEach(function(dot) {
        dot.addEventListener('click', function() {
          var index = parseInt(dot.dataset.index);
          self.goToSlide(instance, index);
          if (config.autoPlay) self.startAutoPlay(instance);
        });
      });
      
      container.addEventListener('mouseenter', function() {
        if (instance.autoPlayTimer) {
          clearInterval(instance.autoPlayTimer);
          instance.autoPlayTimer = null;
        }
      });
      
      container.addEventListener('mouseleave', function() {
        if (config.autoPlay) self.startAutoPlay(instance);
      });
    },
    
    goToSlide: function(instance, index) {
      var container = instance.container;
      var config = instance.config;
      var track = container.querySelector('.crypto-carousel-track');
      var dots = container.querySelectorAll('.crypto-carousel-dot');
      
      instance.currentIndex = index;
      var slideWidth = 100 / config.slidesPerView;
      track.style.transform = 'translateX(-' + (index * slideWidth) + '%)';
      
      dots.forEach(function(dot, i) {
        dot.classList.toggle('active', i === index);
      });
    },
    
    startAutoPlay: function(instance) {
      var self = this;
      var config = instance.config;
      var articles = instance.articles;
      
      if (instance.autoPlayTimer) clearInterval(instance.autoPlayTimer);
      
      var totalSlides = Math.ceil(articles.length / config.slidesPerView);
      
      instance.autoPlayTimer = setInterval(function() {
        instance.currentIndex = (instance.currentIndex + 1) % totalSlides;
        self.goToSlide(instance, instance.currentIndex);
      }, config.interval);
    },
    
    escapeHtml: function(text) {
      if (!text) return '';
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },
    
    truncate: function(text, maxLength) {
      if (!text || text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    }
  };

  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.crypto-carousel[data-auto-init]').forEach(function(el) {
      CryptoCarousel.init('#' + el.id, {
        limit: parseInt(el.dataset.limit) || 6,
        category: el.dataset.category || 'all',
        autoPlay: el.dataset.autoplay !== 'false'
      });
    });
  });
})();

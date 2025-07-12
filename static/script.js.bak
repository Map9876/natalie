document.addEventListener('DOMContentLoaded', function() {
  // 配置
  const config = {
    itemsPerLoad: 30,
    currentPage: 1,
    allNewsItems: [],
    filteredItems: []
  };

  // DOM元素
  const elements = {
    container: document.querySelector('.news-container'),
    loadMoreBtn: document.querySelector('.load-more button'),
    timelineSidebar: document.querySelector('.timeline-sidebar'),
    mobileToggle: document.querySelector('.mobile-timeline-toggle'),
    mobileTimeline: document.querySelector('.mobile-timeline'),
    dateFilter: document.querySelector('.date-filter')
  };

  // 初始化
  init();

  function init() {
    loadNewsData();
    setupEventListeners();
  }

  function loadNewsData() {
    fetch('data/news.json')
      .then(response => response.json())
      .then(data => {
        config.allNewsItems = data.news;
        config.filteredItems = [...config.allNewsItems];
        renderNewsItems();
        createTimeline();
        createDateFilter();
      })
      .catch(error => console.error('Error loading news data:', error));
  }

  function renderNewsItems() {
    const startIdx = (config.currentPage - 1) * config.itemsPerLoad;
    const endIdx = startIdx + config.itemsPerLoad;
    const itemsToShow = config.filteredItems.slice(0, endIdx);
    
    elements.container.innerHTML = itemsToShow.map(item => `
      <div class="news-item" data-date="${item.date}">
        <a href="${item.link}" target="_blank" rel="noopener">
          <img src="${item.image_url}" alt="${item.title}" class="news-image" loading="lazy">
          <div class="news-content">
            <h3 class="news-title">${item.title}</h3>
            <div class="news-date">${formatDate(item.date)}</div>
          </div>
        </a>
      </div>
    `).join('');
    
    // 显示/隐藏加载更多按钮
    elements.loadMoreBtn.style.display = 
      endIdx < config.filteredItems.length ? 'block' : 'none';
  }

  function createTimeline() {
    // 获取所有唯一日期
    const uniqueDates = [...new Set(config.allNewsItems.map(item => item.date))]
      .sort((a, b) => new Date(b) - new Date(a));
    
    // 创建桌面版时间轴
    elements.timelineSidebar.innerHTML = uniqueDates.map(date => {
      const d = new Date(date);
      return `
        <div class="timeline-item" data-date="${date}">
          <div class="timeline-month">${d.getMonth() + 1}</div>
          <div class="timeline-day">${d.getDate()}</div>
        </div>
      `;
    }).join('');
    
    // 创建移动版时间轴
    elements.mobileTimeline.innerHTML = `
      <div class="mobile-timeline-close">×</div>
      <h3>日期导航</h3>
      ${uniqueDates.map(date => {
        const d = new Date(date);
        return `
          <div class="timeline-item" data-date="${date}">
            <div class="timeline-month">${d.getMonth() + 1}月</div>
            <div class="timeline-day">${d.getDate()}日</div>
          </div>
        `;
      }).join('')}
    `;
    
    // 设置时间轴点击事件
    document.querySelectorAll('.timeline-item').forEach(item => {
      item.addEventListener('click', function() {
        const date = this.getAttribute('data-date');
        filterByDate(date);
        
        // 移动端关闭菜单
        elements.mobileTimeline.classList.remove('active');
      });
    });
  }

  function createDateFilter() {
    // 获取最近7天日期
    const recentDates = [...new Set(config.allNewsItems.map(item => item.date))]
      .sort((a, b) => new Date(b) - new Date(a))
      .slice(0, 7);
    
    elements.dateFilter.innerHTML = `
      <button data-date="all" class="active">全部</button>
      ${recentDates.map(date => {
        const d = new Date(date);
        return `<button data-date="${date}">${d.getMonth() + 1}/${d.getDate()}</button>`;
      }).join('')}
    `;
    
    // 设置筛选按钮事件
    elements.dateFilter.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', function() {
        elements.dateFilter.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const date = this.getAttribute('data-date');
        if (date === 'all') {
          config.filteredItems = [...config.allNewsItems];
        } else {
          filterByDate(date);
        }
        
        config.currentPage = 1;
        renderNewsItems();
        scrollToTop();
      });
    });
  }

  function filterByDate(date) {
    config.filteredItems = config.allNewsItems.filter(item => item.date === date);
    config.currentPage = 1;
    renderNewsItems();
    scrollToTop();
  }

  function formatDate(isoDate) {
    const d = new Date(isoDate);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }

  function setupEventListeners() {
    // 加载更多
    elements.loadMoreBtn.addEventListener('click', function() {
      config.currentPage++;
      renderNewsItems();
    });
    
    // 移动端菜单切换
    elements.mobileToggle.addEventListener('click', function() {
      elements.mobileTimeline.classList.add('active');
    });
    
    elements.mobileTimeline.querySelector('.mobile-timeline-close').addEventListener('click', function() {
      elements.mobileTimeline.classList.remove('active');
    });
    
    // 滚动时高亮时间轴
    window.addEventListener('scroll', function() {
      const newsItems = document.querySelectorAll('.news-item');
      let currentDate = '';
      
      newsItems.forEach(item => {
        const rect = item.getBoundingClientRect();
        if (rect.top <= 100) {  // 距离顶部100px以内
          currentDate = item.getAttribute('data-date');
        }
      });
      
      if (currentDate) {
        document.querySelectorAll('.timeline-item').forEach(item => {
          item.classList.toggle('active', item.getAttribute('data-date') === currentDate);
        });
      }
    });
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
});
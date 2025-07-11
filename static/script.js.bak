document.addEventListener('DOMContentLoaded', function() {
  // 分页控制
  const itemsPerPage = 12;
  let currentPage = 1;
  const dateGroups = document.querySelectorAll('.date-group');
  let visibleGroups = [];
  
  // 初始化时间轴
  initTimeline();
  
  // 初始化分页
  initPagination();
  
  // 回到顶部按钮
  const backToTopBtn = document.createElement('div');
  backToTopBtn.className = 'back-to-top';
  backToTopBtn.innerHTML = '↑';
  backToTopBtn.addEventListener('click', scrollToTop);
  document.body.appendChild(backToTopBtn);
  
  window.addEventListener('scroll', function() {
    backToTopBtn.classList.toggle('visible', window.scrollY > 300);
  });
  
  function initTimeline() {
    const timeline = document.createElement('div');
    timeline.className = 'timeline';
    
    const dates = Array.from(document.querySelectorAll('.date-group')).map(group => {
      const month = group.querySelector('.date-month').textContent;
      const day = group.querySelector('.date-day').textContent;
      return { month, day, element: group };
    });
    
    // 去重并创建时间轴项目
    const uniqueDates = [];
    const seenDates = new Set();
    
    dates.forEach(date => {
      const dateKey = `${date.month}-${date.day}`;
      if (!seenDates.has(dateKey)) {
        seenDates.add(dateKey);
        uniqueDates.push(date);
      }
    });
    
    uniqueDates.forEach((date, index) => {
      const timelineItem = document.createElement('div');
      timelineItem.className = 'timeline-item';
      timelineItem.innerHTML = `
        <div class="timeline-date">
          <div class="timeline-month">${date.month}</div>
          <div class="timeline-day">${date.day}</div>
        </div>
        <div class="timeline-dot"></div>
        ${index < uniqueDates.length - 1 ? '<div class="timeline-line"></div>' : ''}
      `;
      
      timelineItem.addEventListener('click', () => {
        date.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      
      timeline.appendChild(timelineItem);
    });
    
    document.body.insertBefore(timeline, document.querySelector('.main-content'));
    
    // 监听滚动，高亮当前日期
    window.addEventListener('scroll', function() {
      const scrollPosition = window.scrollY + 100;
      
      dateGroups.forEach(group => {
        const rect = group.getBoundingClientRect();
        const groupTop = rect.top + window.scrollY;
        const groupBottom = groupTop + rect.height;
        
        if (scrollPosition >= groupTop && scrollPosition < groupBottom) {
          const month = group.querySelector('.date-month').textContent;
          const day = group.querySelector('.date-day').textContent;
          
          // 高亮对应的时间轴项目
          const timelineItems = document.querySelectorAll('.timeline-item');
          timelineItems.forEach(item => {
            const itemMonth = item.querySelector('.timeline-month').textContent;
            const itemDay = item.querySelector('.timeline-day').textContent;
            
            if (itemMonth === month && itemDay === day) {
              item.querySelector('.timeline-dot').style.transform = 'translateX(-50%) scale(1.5)';
              item.querySelector('.timeline-month').style.color = '#000';
            } else {
              item.querySelector('.timeline-dot').style.transform = 'translateX(-50%)';
              item.querySelector('.timeline-month').style.color = '';
            }
          });
        }
      });
    });
  }
  
  function initPagination() {
    // 分组日期内容
    const allGroups = Array.from(document.querySelectorAll('.date-group'));
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination';
    document.querySelector('.main-content').appendChild(paginationContainer);
    
    updateVisibleGroups();
    renderPagination();
    
    function updateVisibleGroups() {
      const startIdx = (currentPage - 1) * itemsPerPage;
      const endIdx = startIdx + itemsPerPage;
      visibleGroups = allGroups.slice(startIdx, endIdx);
      
      // 隐藏所有组，然后显示可见组
      allGroups.forEach(group => group.style.display = 'none');
      visibleGroups.forEach(group => group.style.display = 'block');
    }
    
    function renderPagination() {
      const totalPages = Math.ceil(allGroups.length / itemsPerPage);
      paginationContainer.innerHTML = '';
      
      if (totalPages <= 1) return;
      
      // 上一页按钮
      if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← 上一页';
        prevBtn.addEventListener('click', () => {
          currentPage--;
          updateVisibleGroups();
          renderPagination();
          scrollToTop();
        });
        paginationContainer.appendChild(prevBtn);
      }
      
      // 页码按钮
      const maxVisiblePages = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        if (i === currentPage) {
          pageBtn.classList.add('active');
        }
        pageBtn.addEventListener('click', () => {
          currentPage = i;
          updateVisibleGroups();
          renderPagination();
          scrollToTop();
        });
        paginationContainer.appendChild(pageBtn);
      }
      
      // 下一页按钮
      if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '下一页 →';
        nextBtn.addEventListener('click', () => {
          currentPage++;
          updateVisibleGroups();
          renderPagination();
          scrollToTop();
        });
        paginationContainer.appendChild(nextBtn);
      }
    }
  }
  
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
});

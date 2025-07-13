/**
 * コミックナタリー - 高密度ビジュアルビューア
 * 安定版 v1.2
 */

// アプリケーション設定
const CONFIG = {
    itemsPerPage: 30,      // 1ページあたりのアイテム数
    maxPages: 10,          // 最大ページ数
    placeholderImage: 'static/placeholder.jpg',
    dataUrl: 'data/news.json'
};

// 状態管理
const STATE = {
    currentPage: 1,
    allItems: [],
    filteredItems: [],
    isLoading: false,
    isInitialized: false
};

// DOM要素キャッシュ
const DOM = {
    container: null,
    loadMoreBtn: null,
    timeline: null,
    mobileMenuBtn: null,
    mobileMenu: null,
    dateFilter: null,
    loadingOverlay: null
};

// 初期化関数
function initialize() {
    try {
        // DOM要素のキャッシュ
        cacheDOMElements();
        
        // 必須要素のチェック
        if (!validateEssentialElements()) {
            throw new Error('必須DOM要素が見つかりません');
        }
        
        // イベントリスナーの設定
        setupEventListeners();
        
        // データの読み込み
        loadData();
        
        STATE.isInitialized = true;
    } catch (error) {
        console.error('初期化エラー:', error);
        showError('システムの初期化に失敗しました');
    }
}

// DOM要素をキャッシュ
function cacheDOMElements() {
    DOM.container = document.querySelector('.news-container');
    DOM.loadMoreBtn = document.querySelector('.load-more button');
    DOM.timeline = document.querySelector('.timeline-sidebar');
    DOM.mobileMenuBtn = document.querySelector('.mobile-timeline-toggle');
    DOM.mobileMenu = document.querySelector('.mobile-timeline');
    DOM.dateFilter = document.querySelector('.date-filter');
    DOM.loadingOverlay = document.querySelector('.loading-overlay');
}

// 必須要素の検証
function validateEssentialElements() {
    return DOM.container && DOM.loadMoreBtn;
}

// データ読み込み
function loadData() {
    if (STATE.isLoading) return;
    
    STATE.isLoading = true;
    showLoading(true);

    fetch(CONFIG.dataUrl)
        .then(response => {
            if (!response.ok) throw new Error(`HTTPエラー: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!data?.news) throw new Error('無効なデータ形式');
            
            processData(data.news);
            renderContent();
            setupDynamicComponents();
            
            // コンテンツ表示
            setTimeout(() => {
                document.body.classList.remove('preload');
                showLoading(false);
            }, 300);
        })
        .catch(error => {
            console.error('データ読み込みエラー:', error);
            showError('データの読み込みに失敗しました');
        })
        .finally(() => {
            STATE.isLoading = false;
        });
}

// データ処理
function processData(items) {
    STATE.allItems = items
        .map(item => ({
            ...item,
            dateObj: new Date(item.date),
            timestamp: new Date(item.date).getTime()
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
    
    STATE.filteredItems = [...STATE.allItems];
}

// コンテンツ描画
function renderContent() {
    try {
        const startIdx = (STATE.currentPage - 1) * CONFIG.itemsPerPage;
        const endIdx = startIdx + CONFIG.itemsPerPage;
        const itemsToShow = STATE.filteredItems.slice(0, endIdx);
        
        if (itemsToShow.length === 0) {
            showNoResults();
            return;
        }
        
        // アイテムのグループ化 (日付ごと)
        const groupedItems = groupItemsByDate(itemsToShow);
        
        // HTML生成
        DOM.container.innerHTML = generateHTML(groupedItems);
        
        // ページネーション制御
        DOM.loadMoreBtn.style.display = 
            endIdx < STATE.filteredItems.length && STATE.currentPage < CONFIG.maxPages 
            ? 'block' : 'none';
        
        // 画像の遅延読み込み
        initLazyLoad();
    } catch (error) {
        console.error('描画エラー:', error);
        showError('コンテンツの表示に失敗しました');
    }
}

// 日付ごとにアイテムをグループ化
function groupItemsByDate(items) {
    const groups = {};
    
    items.forEach(item => {
        const dateStr = formatDate(item.dateObj);
        if (!groups[dateStr]) {
            groups[dateStr] = {
                date: item.dateObj,
                items: []
            };
        }
        groups[dateStr].items.push(item);
    });
    
    return Object.values(groups).sort((a, b) => b.date - a.date);
}

// HTML生成
function generateHTML(groups) {
    return groups.map(group => `
        <div class="date-group" data-date="${group.date.toISOString()}">
            <div class="date-header">
                <span class="date-month">${group.date.getMonth() + 1}月</span>
                <span class="date-day">${group.date.getDate()}日</span>
            </div>
            <div class="news-grid">
                ${group.items.map(item => `
                    <article class="news-item">
                        <a href="${item.link}" target="_blank" rel="noopener">
                            <div class="news-image-container">
                                <img src="${CONFIG.placeholderImage}" 
                                     data-src="${item.image_url || CONFIG.placeholderImage}" 
                                     alt="${item.title}" 
                                     class="news-image" 
                                     loading="lazy"
                                     onerror="this.src='${CONFIG.placeholderImage}'">
                            </div>
                            <div class="news-content">
                                <h3 class="news-title">${item.title}</h3>
                            </div>
                        </a>
                    </article>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// 遅延読み込み初期化
function initLazyLoad() {
    const lazyImages = document.querySelectorAll('.news-image[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    loadImage(img);
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '100px 0px'
        });

        lazyImages.forEach(img => observer.observe(img));
    } else {
        // フォールバック
        lazyImages.forEach(loadImage);
    }
}

// 画像読み込み
function loadImage(img) {
    if (img.dataset.src) {
        img.src = img.dataset.src;
        img.onload = () => {
            img.classList.add('loaded');
            img.removeAttribute('data-src');
        };
    }
}

// 動的コンポーネントの設定
function setupDynamicComponents() {
    createTimeline();
    createDateFilter();
    updateActiveDate();
}

// タイムライン作成
function createTimeline() {
    if (!DOM.timeline || !DOM.mobileMenu) return;
    
    const uniqueDates = [...new Set(STATE.allItems.map(item => item.date))]
        .sort((a, b) => b - a);
    
    const timelineHTML = uniqueDates.map(date => `
        <div class="timeline-item" data-date="${date.toISOString()}">
            <div class="timeline-month">${date.getMonth() + 1}</div>
            <div class="timeline-day">${date.getDate()}</div>
        </div>
    `).join('');
    
    DOM.timeline.innerHTML = timelineHTML;
    DOM.mobileMenu.innerHTML = `
        <div class="mobile-timeline-close">×</div>
        <h3>日付で絞り込み</h3>
        ${timelineHTML}
    `;
    
    // タイムラインアイテムのイベント
    document.querySelectorAll('.timeline-item').forEach(item => {
        item.addEventListener('click', () => {
            const date = new Date(item.dataset.date);
            filterByDate(date);
            DOM.mobileMenu.classList.remove('active');
        });
    });
}

// 日付フィルター作成
function createDateFilter() {
    if (!DOM.dateFilter) return;
    
    const recentDates = [...new Set(STATE.allItems.map(item => item.date))]
        .sort((a, b) => b - a)
        .slice(0, 7);
    
    DOM.dateFilter.innerHTML = `
        <button data-date="all" class="active">すべて</button>
        ${recentDates.map(date => `
            <button data-date="${date.toISOString()}">
                ${date.getMonth() + 1}/${date.getDate()}
            </button>
        `).join('')}
    `;
    
    // フィルターボタンのイベント
    DOM.dateFilter.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            DOM.dateFilter.querySelectorAll('button').forEach(b => 
                b.classList.remove('active'));
            btn.classList.add('active');
            
            const dateStr = btn.dataset.date;
            if (dateStr === 'all') {
                STATE.filteredItems = [...STATE.allItems];
            } else {
                const date = new Date(dateStr);
                filterByDate(date);
            }
            
            STATE.currentPage = 1;
            renderContent();
            scrollToTop();
        });
    });
}

// 日付でフィルタリング
function filterByDate(date) {
    STATE.filteredItems = STATE.allItems.filter(item => 
        item.dateObj.toDateString() === date.toDateString());
}

// アクティブな日付を更新
function updateActiveDate() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const date = entry.target.dataset.date;
                highlightTimelineItem(date);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '-50px 0px -50% 0px'
    });
    
    document.querySelectorAll('.date-group').forEach(group => {
        observer.observe(group);
    });
}

// タイムラインアイテムをハイライト
function highlightTimelineItem(dateStr) {
    document.querySelectorAll('.timeline-item').forEach(item => {
        item.classList.toggle('active', item.dataset.date === dateStr);
    });
}

// イベントリスナーの設定
function setupEventListeners() {
    // もっと読み込むボタン
    DOM.loadMoreBtn.addEventListener('click', () => {
        STATE.currentPage++;
        renderContent();
    });
    
    // モバイルメニュー
    DOM.mobileMenuBtn?.addEventListener('click', () => {
        DOM.mobileMenu.classList.add('active');
    });
    
    document.querySelector('.mobile-timeline-close')?.addEventListener('click', () => {
        DOM.mobileMenu.classList.remove('active');
    });
    
    // スクロールイベント (スロットリング)
    window.addEventListener('scroll', throttle(() => {
        updateActiveDate();
    }, 100));
}

// ユーティリティ関数

function formatDate(date) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function showLoading(show) {
    if (DOM.loadingOverlay) {
        DOM.loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

function showError(message) {
    if (DOM.container) {
        DOM.container.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
                <button onclick="window.location.reload()">再読み込み</button>
            </div>
        `;
    }
}

function showNoResults() {
    if (DOM.container) {
        DOM.container.innerHTML = `
            <div class="no-results">
                <p>表示するコンテンツがありません</p>
            </div>
        `;
        DOM.loadMoreBtn.style.display = 'none';
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}

// DOMの準備ができたら初期化
document.addEventListener('DOMContentLoaded', initialize);
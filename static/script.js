/**
 * コミックナタリー - 高密度ビジュアルビューア
 * 安定版 v1.3
 */

document.addEventListener('DOMContentLoaded', function() {
    // アプリケーション設定
    const CONFIG = {
        itemsPerPage: 30,
        placeholderImage: 'static/placeholder.jpg',
        dataUrl: 'data/news.json'
    };

    // 状態管理
    const STATE = {
        currentPage: 1,
        allItems: [],
        filteredItems: [],
        isLoading: false
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

    // メイン初期化関数
    function initialize() {
        try {
            // ローディング表示開始
            showLoading(true);
            
            // DOM要素の取得を確実に行う
            setTimeout(() => {
                cacheDOMElements();
                
                if (!validateEssentialElements()) {
                    throw new Error('必須のDOM要素が見つかりません');
                }
                
                setupEventListeners();
                loadData();
            }, 100);
        } catch (error) {
            console.error('初期化エラー:', error);
            showError('ページの初期化に失敗しました');
            showLoading(false);
        }
    }

    // DOM要素をキャッシュ (より堅牢な実装)
    function cacheDOMElements() {
        DOM.container = document.querySelector('.news-container');
        DOM.loadMoreBtn = document.querySelector('.load-more button');
        DOM.timeline = document.querySelector('.timeline-sidebar');
        DOM.mobileMenuBtn = document.querySelector('.mobile-timeline-toggle');
        DOM.mobileMenu = document.querySelector('.mobile-timeline');
        DOM.dateFilter = document.querySelector('.date-filter');
        DOM.loadingOverlay = document.querySelector('.loading-overlay');
        
        console.log('キャッシュしたDOM要素:', DOM);
    }

    // 必須要素の検証
    function validateEssentialElements() {
        const essentials = [DOM.container, DOM.loadMoreBtn];
        return essentials.every(element => element !== null);
    }

    // データ読み込み
    function loadData() {
        if (STATE.isLoading) return;
        
        STATE.isLoading = true;
        
        fetch(CONFIG.dataUrl)
            .then(response => {
                if (!response.ok) throw new Error(`HTTPエラー: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (!data?.news) throw new Error('無効なデータ形式');
                
                processData(data.news);
                renderContent();
                
                // コンテンツ表示
                setTimeout(() => {
                    document.body.classList.remove('preload');
                    showLoading(false);
                }, 300);
            })
            .catch(error => {
                console.error('データ読み込みエラー:', error);
                showError('ニュースデータの読み込みに失敗しました');
                showLoading(false);
            })
            .finally(() => {
                STATE.isLoading = false;
            });
    }

    // データ処理
    function processData(items) {
        STATE.allItems = items.map(item => ({
            ...item,
            dateObj: new Date(item.date),
            timestamp: new Date(item.date).getTime()
        })).sort((a, b) => b.timestamp - a.timestamp);
        
        STATE.filteredItems = [...STATE.allItems];
    }

    // コンテンツ描画 (画像表示問題を修正)
    function renderContent() {
        try {
            const startIdx = (STATE.currentPage - 1) * CONFIG.itemsPerPage;
            const endIdx = startIdx + CONFIG.itemsPerPage;
            const itemsToShow = STATE.filteredItems.slice(0, endIdx);
            
            if (itemsToShow.length === 0) {
                showNoResults();
                return;
            }
            
            DOM.container.innerHTML = generateItemsHTML(itemsToShow);
            DOM.loadMoreBtn.style.display = 
                endIdx < STATE.filteredItems.length ? 'block' : 'none';
            
            // 画像の遅延読み込みを初期化
            initLazyLoad();
        } catch (error) {
            console.error('描画エラー:', error);
            showError('コンテンツの表示に問題が発生しました');
        }
    }

    // アイテムHTML生成 (画像表示問題を修正)
    function generateItemsHTML(items) {
        return items.map(item => `
            <div class="news-item" data-date="${item.date}">
                <a href="${item.link}" target="_blank" rel="noopener">
                    <div class="news-image-container">
                        <img src="${CONFIG.placeholderImage}" 
                             data-src="${item.image_url || CONFIG.placeholderImage}" 
                             alt="${item.title}" 
                             class="news-image" 
                             loading="lazy"
                             onerror="this.onerror=null;this.src='${CONFIG.placeholderImage}'">
                    </div>
                    <div class="news-content">
                        <h3 class="news-title">${item.title}</h3>
                        <div class="news-date">${formatDate(item.dateObj)}</div>
                    </div>
                </a>
            </div>
        `).join('');
    }

    // 画像の遅延読み込み (改善版)
    function initLazyLoad() {
        const lazyImages = document.querySelectorAll('.news-image[loading="lazy"]');
        
        if (!('IntersectionObserver' in window)) {
            // フォールバック: 直接読み込み
            lazyImages.forEach(img => {
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                }
            });
            return;
        }
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    loadImage(img);
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '200px 0px'
        });
        
        lazyImages.forEach(img => {
            if (img.dataset.src) {
                observer.observe(img);
            }
        });
    }

    // 画像読み込み処理
    function loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;
        
        const imageLoader = new Image();
        imageLoader.src = src;
        
        imageLoader.onload = () => {
            img.src = src;
            img.classList.add('loaded');
            img.removeAttribute('data-src');
        };
        
        imageLoader.onerror = () => {
            img.src = CONFIG.placeholderImage;
            img.classList.add('loaded');
            img.removeAttribute('data-src');
        };
    }

    // イベントリスナーの設定
    function setupEventListeners() {
        // もっと読み込むボタン
        if (DOM.loadMoreBtn) {
            DOM.loadMoreBtn.addEventListener('click', () => {
                STATE.currentPage++;
                renderContent();
            });
        }
        
        // モバイルメニューボタン
        if (DOM.mobileMenuBtn && DOM.mobileMenu) {
            DOM.mobileMenuBtn.addEventListener('click', () => {
                DOM.mobileMenu.classList.add('active');
            });
            
            const closeBtn = DOM.mobileMenu.querySelector('.mobile-timeline-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    DOM.mobileMenu.classList.remove('active');
                });
            }
        }
    }

    // ユーティリティ関数
    function formatDate(date) {
        return `${date.getMonth() + 1}/${date.getDate()}`;
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
            if (DOM.loadMoreBtn) DOM.loadMoreBtn.style.display = 'none';
        }
    }

    // 初期化を開始
    initialize();
});
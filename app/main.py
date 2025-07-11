import requests
from bs4 import BeautifulSoup
from datetime import datetime
import json
import os
from operator import itemgetter

class NatalieScraper:
    def __init__(self):
        self.base_url = "https://natalie.mu/comic/tag/564"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

    def scrape_news(self):
        try:
            print(f"Scraping news from {self.base_url}")
            response = requests.get(self.base_url, headers=self.headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            news_items = []
            news_cards = soup.select('.NA_card_wrapper .NA_card')
            
            for card in news_cards:
                try:
                    title = card.select_one('.NA_card_title').text.strip()
                    link = card.select_one('a[href^="https://natalie.mu/comic/news/"]')['href']
                    
                    img_tag = card.select_one('.NA_thumb img')
                    image_url = img_tag['data-src'].split('?')[0] if img_tag and 'data-src' in img_tag.attrs else None
                    
                    date_text = card.select_one('.NA_card_date').text.strip()
                    date_obj = datetime.strptime(date_text, '%m月%d日').date()
                    
                    news_items.append({
                        'title': title,
                        'link': link,
                        'image_url': image_url,
                        'date': date_obj.isoformat(),
                        'timestamp': datetime.combine(date_obj, datetime.min.time()).timestamp()
                    })
                except Exception as e:
                    print(f"Error parsing card: {e}")
                    continue
            
            # 按时间降序排序
            news_items.sort(key=itemgetter('timestamp'), reverse=True)
            
            print(f"Successfully scraped {len(news_items)} news items")
            return news_items
            
        except Exception as e:
            print(f"Error scraping news: {e}")
            return []

    def save_data(self, news_items):
        os.makedirs('output/data', exist_ok=True)
        data = {
            'last_updated': datetime.now().isoformat(),
            'news': news_items
        }
        
        with open('output/data/news.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        # 复制静态文件
        self.copy_static_files()

    def copy_static_files(self):
        os.makedirs('output/static', exist_ok=True)
        
        # 复制CSS
        if os.path.exists('static/style.css'):
            with open('static/style.css', 'r', encoding='utf-8') as src, \
                 open('output/static/style.css', 'w', encoding='utf-8') as dst:
                dst.write(src.read())
        
        # 复制JS
        if os.path.exists('static/script.js'):
            with open('static/script.js', 'r', encoding='utf-8') as src, \
                 open('output/static/script.js', 'w', encoding='utf-8') as dst:
                dst.write(src.read())
        
        # 复制HTML模板
        if os.path.exists('templates/index.html'):
            with open('templates/index.html', 'r', encoding='utf-8') as src, \
                 open('output/index.html', 'w', encoding='utf-8') as dst:
                dst.write(src.read())

def main():
    print("=== Natalie Comic News Scraper ===")
    scraper = NatalieScraper()
    
    news_items = scraper.scrape_news()
    if news_items:
        scraper.save_data(news_items)
    else:
        print("No news items found")
        exit(1)
    
    print("=== Process completed ===")

if __name__ == '__main__':
    main()
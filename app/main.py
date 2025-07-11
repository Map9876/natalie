import requests
from bs4 import BeautifulSoup
from datetime import datetime
import os
from jinja2 import Template
from itertools import groupby

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
                    # 转换日期格式为 "7月11日" 形式
                    date_obj = datetime.strptime(date_text, '%m月%d日')
                    formatted_date = f"{date_obj.month}月{date_obj.day}日"
                    
                    news_items.append({
                        'title': title,
                        'link': link,
                        'image_url': image_url,
                        'date': formatted_date,
                        'date_obj': date_obj  # 用于排序
                    })
                except Exception as e:
                    print(f"Error parsing card: {e}")
                    continue
            
            # 按日期排序 (最新的在前面)
            news_items.sort(key=lambda x: x['date_obj'], reverse=True)
            
            print(f"Successfully scraped {len(news_items)} news items")
            return news_items
            
        except Exception as e:
            print(f"Error scraping news: {e}")
            return []

    def generate_html(self, news_items):
        try:
            print("Generating HTML page...")
            
            # 准备自定义的 groupby 过滤器
            def group_by_date(items):
                grouped = {}
                for item in items:
                    if item['date'] not in grouped:
                        grouped[item['date']] = []
                    grouped[item['date']].append(item)
                return sorted(grouped.items(), key=lambda x: x[1][0]['date_obj'], reverse=True)
            
            with open('index_template.html', 'r', encoding='utf-8') as f:
                template = Template(f.read())
            
            # 注册 groupby 过滤器
            template.globals['groupby'] = group_by_date
            
            html_content = template.render(
                news_items=news_items,
                last_updated=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                current_year=datetime.now().year
            )
            
            os.makedirs('output', exist_ok=True)
            with open('output/index.html', 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            # 复制静态文件
            os.makedirs('output/static', exist_ok=True)
            if os.path.exists('static/style.css'):
                with open('static/style.css', 'r', encoding='utf-8') as src, \
                     open('output/static/style.css', 'w', encoding='utf-8') as dst:
                    dst.write(src.read())
            
            if os.path.exists('static/script.js'):
                with open('static/script.js', 'r', encoding='utf-8') as src, \
                     open('output/static/script.js', 'w', encoding='utf-8') as dst:
                    dst.write(src.read())
            
            print("HTML generated successfully")
            return True
        except Exception as e:
            print(f"Error generating HTML: {e}")
            return False

def main():
    print("=== Natalie Comic News Scraper ===")
    scraper = NatalieScraper()
    
    news_items = scraper.scrape_news()
    if news_items:
        if not scraper.generate_html(news_items):
            exit(1)
    else:
        print("No news items found")
        exit(1)
    
    print("=== Process completed ===")

if __name__ == '__main__':
    main()
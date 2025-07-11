import requests
from bs4 import BeautifulSoup
from datetime import datetime
import json
import os
from jinja2 import Template

def scrape_news():
    url = "https://natalie.mu/comic/tag/564"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        news_items = []
        news_cards = soup.select('.NA_card_wrapper .NA_card')
        
        for card in news_cards:
            try:
                title = card.select_one('.NA_card_title').text.strip()
                link = card.select_one('a[href^="https://natalie.mu/comic/news/"]')['href']
                summary = card.select_one('.NA_card_summary').text.strip()
                
                img_tag = card.select_one('.NA_thumb img')
                if img_tag and 'data-src' in img_tag.attrs:
                    image_url = img_tag['data-src'].split('?')[0]  # Remove query params
                else:
                    image_url = None
                
                date = card.select_one('.NA_card_date').text.strip()
                
                news_items.append({
                    'title': title,
                    'link': link,
                    'image_url': image_url,
                    'summary': summary,
                    'date': date
                })
            except Exception as e:
                print(f"Error parsing card: {e}")
                continue
        
        return news_items
        
    except Exception as e:
        print(f"Error scraping news: {e}")
        return []

def generate_html(news_items):
    # Load template
    with open('index_template.html', 'r', encoding='utf-8') as f:
        template_content = f.read()
    
    # Render template
    template = Template(template_content)
    return template.render(
        news_items=news_items,
        last_updated=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        current_year=datetime.now().year
    )

def main():
    print("Starting scraping process...")
    
    # 1. Scrape news
    news_items = scrape_news()
    print(f"Scraped {len(news_items)} news items")
    
    # 2. Generate HTML
    html_content = generate_html(news_items)
    
    # 3. Save output
    os.makedirs('output', exist_ok=True)
    with open('output/index.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print("HTML generated successfully")

if __name__ == '__main__':
    main()
    
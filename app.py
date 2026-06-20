import os
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

# Feed URL for BigQuery Release Notes
FEED_URL = 'https://docs.cloud.google.com/feeds/bigquery-release-notes.xml'

def parse_feed_content():
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        xml_data = response.content
    except Exception as e:
        print(f"Error fetching feed: {e}")
        return None

    try:
        root = ET.fromstring(xml_data)
    except ET.ParseError as e:
        print(f"Error parsing XML: {e}")
        return None

    # Atom Feed Namespace
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    entries = []
    
    for entry in root.findall('atom:entry', ns):
        title_elem = entry.find('atom:title', ns)
        date_str = title_elem.text if title_elem is not None else 'Unknown Date'
        
        updated_elem = entry.find('atom:updated', ns)
        updated = updated_elem.text if updated_elem is not None else ''
        
        link_elem = entry.find('atom:link[@rel="alternate"]', ns)
        link = link_elem.get('href') if link_elem is not None else ''
        
        # Unique identifier
        id_elem = entry.find('atom:id', ns)
        entry_id = id_elem.text if id_elem is not None else ''
        
        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ''
        
        # Parse content_html using BeautifulSoup to isolate updates
        soup = BeautifulSoup(content_html, 'html.parser')
        
        items = []
        current_type = 'General'
        current_html_blocks = []
        
        # We iterate through children to group elements under their headers
        for child in soup.children:
            if child.name in ['h3', 'h4', 'h2']:
                # Save the accumulated block if it exists
                if current_html_blocks:
                    block_html = ''.join(str(b) for b in current_html_blocks)
                    block_text = ''.join(b.get_text() for b in current_html_blocks).strip()
                    items.append({
                        'type': current_type,
                        'html': block_html,
                        'text': block_text
                    })
                    current_html_blocks = []
                current_type = child.get_text().strip()
            elif child.name is not None:
                current_html_blocks.append(child)
        
        # Append the final block
        if current_html_blocks:
            block_html = ''.join(str(b) for b in current_html_blocks)
            block_text = ''.join(b.get_text() for b in current_html_blocks).strip()
            items.append({
                'type': current_type,
                'html': block_html,
                'text': block_text
            })
            
        # Fallback if no structured header tags were parsed
        if not items and content_html.strip():
            items.append({
                'type': 'General',
                'html': content_html,
                'text': soup.get_text().strip()
            })
            
        entries.append({
            'id': entry_id,
            'date': date_str,
            'updated': updated,
            'link': link,
            'items': items
        })
        
    return entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    data = parse_feed_content()
    if data is None:
        return jsonify({
            'success': False,
            'message': 'Failed to fetch or parse release notes from the Google Cloud Feed.'
        }), 500
        
    return jsonify({
        'success': True,
        'data': data
    })

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5001)

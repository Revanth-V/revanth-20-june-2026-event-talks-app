import xml.etree.ElementTree as ET
import requests
from bs4 import BeautifulSoup

def parse_feed():
    url = 'https://docs.cloud.google.com/feeds/bigquery-release-notes.xml'
    response = requests.get(url)
    root = ET.fromstring(response.content)
    
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    entries = []
    
    for entry in root.findall('atom:entry', ns):
        title = entry.find('atom:title', ns).text
        updated = entry.find('atom:updated', ns).text
        link_elem = entry.find('atom:link[@rel="alternate"]', ns)
        link = link_elem.get('href') if link_elem is not None else ''
        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ''
        
        soup = BeautifulSoup(content_html, 'html.parser')
        
        # Google release notes typically structure changes under headers (e.g. <h3>Feature</h3> or <h3>Resolved</h3>)
        # followed by one or more paragraphs or lists until the next header.
        items = []
        current_type = 'General'
        current_html_blocks = []
        
        # We will iterate through children and group elements
        for child in soup.children:
            if child.name in ['h3', 'h4', 'h2']:
                # Save previous item if we have content
                if current_html_blocks:
                    items.append({
                        'type': current_type,
                        'html': ''.join(str(b) for b in current_html_blocks),
                        'text': ''.join(b.get_text() for b in current_html_blocks).strip()
                    })
                    current_html_blocks = []
                current_type = child.get_text().strip()
            elif child.name is not None:
                current_html_blocks.append(child)
        
        # Add the last item
        if current_html_blocks:
            items.append({
                'type': current_type,
                'html': ''.join(str(b) for b in current_html_blocks),
                'text': ''.join(b.get_text() for b in current_html_blocks).strip()
            })
            
        # If no h3 was found but there was content
        if not items and content_html.strip():
            items.append({
                'type': 'General',
                'html': content_html,
                'text': soup.get_text().strip()
            })
            
        entries.append({
            'date': title,
            'updated': updated,
            'link': link,
            'items': items
        })
        
    return entries

if __name__ == '__main__':
    data = parse_feed()
    print(f"Fetched {len(data)} entries.")
    if data:
        print("\nFirst Entry:")
        print("Date:", data[0]['date'])
        print("Link:", data[0]['link'])
        print("Items:")
        for idx, item in enumerate(data[0]['items']):
            print(f"  Item {idx+1} [{item['type']}]:")
            print("    Text snippet:", item['text'][:200], "...")

# Image URL Scraper Script

This script scrapes base image URLs from the https://public.work/ website and saves them to a JSON file.

## Setup

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

```bash
python scrape_images.py
```

The script will create a file called `image_urls.json` with the extracted base URLs.

## Notes

- The script extracts only the base URL from the image sources, removing any query parameters.
- The script uses Selenium to access dynamically loaded content.
- Example output format:
  ```
  [
    "https://cdn.cosmos.so/87c137bc-ebfa-4fa3-84f0-d6ba101947f2",
    "https://cdn.cosmos.so/59626929-7dd2-455a-9280-1ce5ec529d53",
    ...
  ]
  ```

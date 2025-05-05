#!/usr/bin/env python3
import json

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager


def scrape_image_urls(url):
    """Scrape base image URLs from the specified website."""
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)

    try:
        driver.get(url)

        # Find all img elements with class "grid_item_img"
        img_elements = driver.find_elements(By.CLASS_NAME, "grid_item_img")

        # Extract the base URL from each img element
        image_urls = []
        for img in img_elements:
            src = img.get_attribute("src")
            if src:
                # Extract just the URL part before any query parameters
                base_url = src.split("?")[0] if "?" in src else src
                image_urls.append(base_url)

        return image_urls

    finally:
        driver.quit()


def main():
    url = "https://public.work/"
    output_file = "./src/constants/image_urls.json"

    image_urls = scrape_image_urls(url)

    with open(output_file, "w") as f:
        json.dump(image_urls, f, indent=2)


if __name__ == "__main__":
    main()

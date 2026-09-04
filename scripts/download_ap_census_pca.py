import os
import urllib.request
import sys
import time

CENSUS_PCA_AP_URLS = {
    "2811": ("Srikakulam", "https://censusindia.gov.in/nada/index.php/catalog/6733/download/9810/DDW_PCA2811_2011_MDDS%20with%20UI.xlsx"),
    "2812": ("Vizianagaram", "https://censusindia.gov.in/nada/index.php/catalog/6734/download/9811/DDW_PCA2812_2011_MDDS%20with%20UI.xlsx"),
    "2813": ("Visakhapatnam", "https://censusindia.gov.in/nada/index.php/catalog/6735/download/9812/DDW_PCA2813_2011_MDDS%20with%20UI.xlsx"),
    "2814": ("East Godavari", "https://censusindia.gov.in/nada/index.php/catalog/6736/download/9813/DDW_PCA2814_2011_MDDS%20with%20UI.xlsx"),
    "2815": ("West Godavari", "https://censusindia.gov.in/nada/index.php/catalog/6737/download/9814/DDW_PCA2815_2011_MDDS%20with%20UI.xlsx"),
    "2816": ("Krishna", "https://censusindia.gov.in/nada/index.php/catalog/6738/download/9815/DDW_PCA2816_2011_MDDS%20with%20UI.xlsx"),
    "2817": ("Guntur", "https://censusindia.gov.in/nada/index.php/catalog/6739/download/9816/DDW_PCA2817_2011_MDDS%20with%20UI.xlsx"),
    "2818": ("Prakasam", "https://censusindia.gov.in/nada/index.php/catalog/6740/download/9817/DDW_PCA2818_2011_MDDS%20with%20UI.xlsx"),
    "2819": ("SPS Nellore", "https://censusindia.gov.in/nada/index.php/catalog/6741/download/9818/DDW_PCA2819_2011_MDDS%20with%20UI.xlsx"),
    "2820": ("YSR Kadapa", "https://censusindia.gov.in/nada/index.php/catalog/6742/download/9819/DDW_PCA2820_2011_MDDS%20with%20UI.xlsx"),
    "2821": ("Kurnool", "https://censusindia.gov.in/nada/index.php/catalog/6743/download/9820/DDW_PCA2821_2011_MDDS%20with%20UI.xlsx"),
    "2822": ("Anantapur", "https://censusindia.gov.in/nada/index.php/catalog/6744/download/9821/DDW_PCA2822_2011_MDDS%20with%20UI.xlsx"),
    "2823": ("Chittoor", "https://censusindia.gov.in/nada/index.php/catalog/6745/download/9822/DDW_PCA2823_2011_MDDS%20with%20UI.xlsx"),
}

OUTPUT_DIR = "data/raw/census"

def download_all():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

    for code, (name, url) in CENSUS_PCA_AP_URLS.items():
        filename = f"DDW_PCA{code}_2011_MDDS_with_UI.xlsx"
        target_path = os.path.join(OUTPUT_DIR, filename)

        if os.path.exists(target_path) and os.path.getsize(target_path) > 100000:
            print(f"[{code}] {name}: Already downloaded ({os.path.getsize(target_path)/1024:.1f} KB)")
            continue

        print(f"[{code}] Downloading {name} from Census of India NADA portal...")
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=30) as response, open(target_path, 'wb') as out_file:
                out_file.write(response.read())
            print(f"[{code}] Successfully saved: {target_path} ({os.path.getsize(target_path)/1024:.1f} KB)")
            time.sleep(1) # respectful rate limit
        except Exception as e:
            print(f"[{code}] Error downloading {name}: {e}")

if __name__ == "__main__":
    download_all()

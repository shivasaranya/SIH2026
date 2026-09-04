import urllib.request
import re

def check_jrc_page():
    url = "https://global-surface-water.appspot.com/download"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            html = res.read().decode('utf-8')
            # Look for storage.googleapis.com links
            links = re.findall(r'https://storage\.googleapis\.com/global-surface-water/[^\s"\'<>]+', html)
            print("Found GSW links:", len(links))
            for l in links[:5]:
                print("  Sample:", l)
            ap_matches = [l for l in links if ('80E' in l or '70E' in l) and ('10N' in l or '20N' in l)]
            print("AP tile matches:", len(ap_matches))
            for m in ap_matches[:10]:
                print("  AP Match:", m)
    except Exception as e:
        print("GSW Page Error:", e)

def check_ibtracs_files():
    url = "https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/shapefile/"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            html = res.read().decode('utf-8')
            links = re.findall(r'href=[\'"]([^\'"]+\.zip)[\'"]', html, re.I)
            print("IBTrACS Shapefile links:", links[:10])
    except Exception as e:
        print("IBTrACS Shapefile Error:", e)

if __name__ == "__main__":
    check_jrc_page()
    check_ibtracs_files()

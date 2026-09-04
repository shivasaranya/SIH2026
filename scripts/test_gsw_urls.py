import urllib.request

patterns = [
    "https://storage.googleapis.com/global-surface-water/downloads2021/occurrence/occurrence_80E_10Nv1_4_2021.tif",
    "https://storage.googleapis.com/global-surface-water/downloads2021/recurrence/recurrence_80E_10Nv1_4_2021.tif",
    "https://storage.googleapis.com/global-surface-water/downloads2021/occurrence/occurrence_80E_20Nv1_4_2021.tif",
    "https://storage.googleapis.com/global-surface-water/downloads2021/occurrence/occurrence_70E_10Nv1_4_2021.tif",
    "https://storage.googleapis.com/global-surface-water/downloads2021/occurrence/occurrence_70E_20Nv1_4_2021.tif",
]

for url in patterns:
    try:
        req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as res:
            size_mb = int(res.headers.get('Content-Length', 0)) / (1024*1024)
            print(f"SUCCESS: {url} -> Status {res.status}, Size: {size_mb:.2f} MB")
    except Exception as e:
        print(f"FAILED: {url} -> {e}")

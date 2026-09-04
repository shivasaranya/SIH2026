#!/usr/bin/env python3
"""
Sahayata (SIH26191) - Phase 3A: Candidate Carrying Capacity Dataset Verification Script
Author: Antigravity Implementation Engineer
Date: September 2026

Probes candidate open APIs, datasets, and catalog metadata for Physical Carrying Capacity Assessment.
"""

import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

CANDIDATES = [
    {
        "name": "APSAC OGC WMS (gatishakti - Cyclone Shelters)",
        "url": "https://apsac.ap.gov.in/geoserver/gatishakti/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities",
        "dimension": "Shelter Capacity",
        "expected": "WMS Capabilities XML"
    },
    {
        "name": "Bhuvan ISRO OGC Services",
        "url": "https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms?SERVICE=WMS&REQUEST=GetCapabilities",
        "dimension": "Land Use / Road / Infrastructure",
        "expected": "WMS Capabilities XML"
    },
    {
        "name": "OpenStreetMap Overpass API (AP Highway Sample)",
        "url": "https://overpass-api.de/api/interpreter?data=[out:json];node(15.9,79.7,16.0,79.8)[amenity=hospital];out;",
        "dimension": "Health Infrastructure / OSM",
        "expected": "JSON response"
    }
]

def check_endpoints():
    print("==================================================")
    print("PHASE 3A: PROBING CARRYING CAPACITY ENDPOINTS")
    print("==================================================")
    for c in CANDIDATES:
        print(f"\nProbing: {c['name']} ({c['dimension']})")
        print(f"URL: {c['url'][:80]}...")
        try:
            req = urllib.request.Request(c['url'], headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            with urllib.request.urlopen(req, timeout=10, context=ctx) as response:
                status = response.getcode()
                content_type = response.headers.get('Content-Type', '')
                print(f"-> Status: {status} | Content-Type: {content_type}")
        except Exception as e:
            print(f"-> Result/Note: {e}")

if __name__ == "__main__":
    check_endpoints()

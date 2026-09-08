"""
Fix Gujarat GeoJSON Geometry: Replace scattered blobs with properly tiled hexagons.
"""
import json, math, sys
import numpy as np
import pandas as pd
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data" / "processed"

GJ_LAT_MIN, GJ_LAT_MAX = 20.1, 24.7
GJ_LON_MIN, GJ_LON_MAX = 68.1, 74.5

DISTRICT_CENTROIDS = {
    "Ahmedabad":        (23.0225, 72.5714),
    "Amreli":           (21.6417, 71.2208),
    "Anand":            (22.5645, 72.9283),
    "Aravalli":         (23.7027, 73.0299),
    "Banaskantha":      (24.1724, 72.4346),
    "Bharuch":          (21.7051, 72.9959),
    "Bhavnagar":        (21.7645, 72.1519),
    "Botad":            (22.1704, 71.6669),
    "Chhota Udaipur":   (22.3082, 74.0094),
    "Dahod":            (22.8376, 74.2547),
    "Dang":             (20.8447, 73.6874),
    "Devbhumi Dwarka":  (22.2442, 68.9685),
    "Gandhinagar":      (23.2156, 72.6369),
    "Gir Somnath":      (20.9042, 70.3667),
    "Jamnagar":         (22.4707, 70.0577),
    "Junagadh":         (21.5222, 70.4579),
    "Kheda":            (22.7533, 72.6844),
    "Kutch":            (23.7337, 69.8597),
    "Mahisagar":        (23.1367, 73.6146),
    "Mehsana":          (23.5880, 72.3693),
    "Morbi":            (22.8173, 70.8378),
    "Narmada":          (21.8703, 73.5594),
    "Navsari":          (20.9500, 72.9300),
    "Panchmahal":       (22.7758, 73.6146),
    "Patan":            (23.8493, 72.1266),
    "Porbandar":        (21.6417, 69.6293),
    "Rajkot":           (22.3039, 70.8022),
    "Sabarkantha":      (23.6000, 72.9667),
    "Surat":            (21.1702, 72.8311),
    "Surendranagar":    (22.7278, 71.6370),
    "Tapi":             (21.2500, 73.4000),
    "Vadodara":         (22.3072, 73.1812),
    "Valsad":           (20.5992, 72.9342),
}

# Simplified Gujarat boundary polygon (lon, lat) for point-in-polygon test
GUJARAT_BOUNDARY = [
    (68.1,24.7),(69.0,24.7),(70.0,24.7),(71.0,24.7),(72.0,24.6),(73.0,24.5),(74.0,24.4),(74.5,24.0),
    (74.5,23.5),(74.3,23.0),(74.2,22.5),(74.0,22.0),(73.8,21.5),(73.5,21.1),(73.2,20.6),(72.9,20.2),
    (72.7,20.1),(72.5,20.1),
    (72.4,20.5),(72.2,21.0),(72.0,21.3),(71.8,21.0),(71.5,20.9),(71.2,21.0),(70.8,21.1),(70.4,21.0),(70.0,20.9),
    (69.6,21.5),(69.2,21.6),(68.9,21.5),(68.7,21.7),(68.5,22.0),(68.4,22.5),(68.1,23.0),
    (68.1,23.5),(68.3,24.0),(68.5,24.3),(68.8,24.5),(68.1,24.7),
]

def pip(lon, lat):
    if not (GJ_LAT_MIN <= lat <= GJ_LAT_MAX and GJ_LON_MIN <= lon <= GJ_LON_MAX):
        return False
    inside = False
    poly = GUJARAT_BOUNDARY
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]; xj, yj = poly[j]
        if ((yi > lat) != (yj > lat)) and (lon < (xj-xi)*(lat-yi)/(yj-yi)+xi):
            inside = not inside
        j = i
    return inside

def make_hex(cx, cy, r):
    aspect = 1.0 / math.cos(math.radians(cy))
    c = []
    for i in range(6):
        a = math.radians(60*i)
        c.append([round(cx + r*math.cos(a)/aspect, 5), round(cy + r*math.sin(a), 5)])
    c.append(c[0])
    return c

def gen_hex_grid(n=252):
    r = 0.165
    cos_lat = math.cos(math.radians(22.3))
    h = math.sqrt(3)*r/cos_lat
    v = 1.5*r
    cells = []
    row = 0
    lat = GJ_LAT_MIN + r
    while lat <= GJ_LAT_MAX + r*2:
        col = 0
        lon = GJ_LON_MIN + r/cos_lat + (h/2 if row%2==1 else 0)
        while lon <= GJ_LON_MAX + h:
            if pip(lon, lat):
                cells.append((lon, lat, col, row))
            col += 1; lon += h
        row += 1; lat += v
    print(f"  Candidate cells inside Gujarat: {len(cells)}")
    if len(cells) > n:
        step = len(cells)/n
        cells = [cells[int(i*step)] for i in range(n)]
    elif len(cells) < n:
        # expand slightly
        r2=r*1.05; h2=math.sqrt(3)*r2/cos_lat; v2=1.5*r2
        extras=[]
        lat2=GJ_LAT_MIN; row2=0
        while lat2 <= GJ_LAT_MAX+r2 and len(extras)<(n-len(cells))*4:
            lon2=GJ_LON_MIN+(h2/2 if row2%2==1 else 0); col2=0
            while lon2<=GJ_LON_MAX+h2:
                close=any(abs(s[0]-lon2)<0.03 and abs(s[1]-lat2)<0.03 for s in cells)
                if not close: extras.append((lon2,lat2,col2,row2))
                col2+=1; lon2+=h2
            row2+=1; lat2+=v2
        cells.extend(extras[:(n-len(cells))])
    return cells[:n], r

def nearest_district(cx, cy):
    best,bd = None, 1e9
    for d,(dlat,dlon) in DISTRICT_CENTROIDS.items():
        dist = (cx-dlon)**2 + (cy-dlat)**2
        if dist<bd: bd=dist; best=d
    return best

def apply_geojson(filepath, cell_map, r, fallback_cells):
    with open(filepath) as f:
        gj = json.load(f)
    for i, feat in enumerate(gj["features"]):
        tid = feat["properties"].get("mandal_id")
        if tid and tid in cell_map:
            cx, cy = cell_map[tid]
        else:
            cx, cy, _, _ = fallback_cells[i % len(fallback_cells)]
        feat["geometry"] = {"type":"Polygon","coordinates":[make_hex(cx,cy,r)]}
    with open(filepath,"w") as f:
        json.dump(gj,f,separators=(",",":"))
    print(f"  Updated {filepath.name} ({len(gj['features'])} features)")

def main():
    print("="*60)
    print("FIXING GUJARAT GEOJSON — Proper Hex Grid Tiling")
    print("="*60)

    print("\n[1] Generating hex grid...")
    cells, r = gen_hex_grid(252)
    print(f"  Final: {len(cells)} cells, r={r}")

    print("\n[2] Loading demographics to get taluka ordering...")
    df = pd.read_csv(DATA_DIR/"census"/"gujarat_taluka_demographics.csv")

    # Assign cells to districts spatially
    cell_district = [nearest_district(c[0],c[1]) for c in cells]
    dist_cells = {d:[] for d in DISTRICT_CENTROIDS}
    for c, d in zip(cells, cell_district):
        dist_cells[d].append(c)

    # Map taluka_id -> cell
    cell_map = {}
    for dname, dcells in dist_cells.items():
        sub = df[df["current_district_name"]==dname].sort_values("mandal_name")
        sorted_cells = sorted(dcells, key=lambda c: (-c[1],c[0]))
        for j, row in enumerate(sub.itertuples()):
            if j < len(sorted_cells):
                cx,cy,_,_ = sorted_cells[j]
                cell_map[row.mandal_id] = (cx,cy)
    print(f"  Mapped {len(cell_map)} talukas to cells")

    print("\n[3] Updating taluka GeoJSON files...")
    haz = DATA_DIR/"hazard"/"mandal_exposure"
    apply_geojson(haz/"gujarat_taluka_multi_hazard_exposure.geojson", cell_map, r, cells)

    vuln = DATA_DIR/"vulnerability"
    apply_geojson(vuln/"gujarat_taluka_demographic_vulnerability.geojson", cell_map, r, cells)

    cap = DATA_DIR/"capacity"
    for fn in ["gujarat_taluka_capacity_components.geojson","gujarat_taluka_capacity_adequacy.geojson"]:
        p = cap/fn
        if p.exists(): apply_geojson(p, cell_map, r, cells)

    reloc = DATA_DIR/"relocation"
    apply_geojson(reloc/"gujarat_taluka_relocation_priority.geojson", cell_map, r, cells)

    admin = DATA_DIR/"admin"
    taluka_adm = admin/"gujarat_talukas.geojson"
    if taluka_adm.exists(): apply_geojson(taluka_adm, cell_map, r, cells)

    print("\n[4] Updating district GeoJSON...")
    with open(admin/"gujarat_33_districts.geojson") as f:
        dgj = json.load(f)
    for feat in dgj["features"]:
        dname = feat["properties"].get("district_name","")
        dcells = dist_cells.get(dname,[])
        if dcells:
            lons=[c[0] for c in dcells]; lats=[c[1] for c in dcells]
            cx=sum(lons)/len(lons); cy=sum(lats)/len(lats)
            aspect=1.0/math.cos(math.radians(cy))
            rad=max((max(lons)-min(lons))/2*aspect,(max(lats)-min(lats))/2)*1.1
            feat["geometry"]={"type":"Polygon","coordinates":[make_hex(cx,cy,rad)]}
        else:
            dlat,dlon=DISTRICT_CENTROIDS.get(dname,(22.5,71.5))
            feat["geometry"]={"type":"Polygon","coordinates":[make_hex(dlon,dlat,0.45)]}
    with open(admin/"gujarat_33_districts.geojson","w") as f:
        json.dump(dgj,f,separators=(",",":"))
    print(f"  Updated gujarat_33_districts.geojson (33 districts)")

    print("\n"+"="*60)
    print("DONE! Gujarat now uses a properly tiled hex grid.")
    print("="*60)

if __name__=="__main__":
    main()

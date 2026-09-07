import json
from shapely.geometry import shape, Point, MultiPoint, MultiPolygon, Polygon
from shapely.ops import unary_union, voronoi_diagram
import numpy as np

# Load state polygon
with open('data/processed/admin/india_states.geojson', encoding='utf-8') as f:
    states = json.load(f)

tripura_geom = None
for feat in states['features']:
    if 'tripura' in str(feat.get('properties', {})).lower():
        tripura_geom = shape(feat['geometry'])
        break

print("Loaded Tripura state polygon. Area:", tripura_geom.area, "Bounds:", tripura_geom.bounds)

# Sub-division seeds (lon, lat) geographically clustered within district bounds
SEEDS = {
    # South Tripura (Southern strip)
    "TR_SUBD_019": (91.73, 23.03),  # Sabroom
    "TR_SUBD_018": (91.54, 23.18),  # Rajnagar
    "TR_SUBD_017": (91.45, 23.27),  # Belonia
    "TR_SUBD_020": (91.57, 23.33),  # Santirbazar

    # Gomati (Central-South)
    "TR_SUBD_007": (91.49, 23.53),  # Udaipur
    "TR_SUBD_005": (91.66, 23.53),  # Amarpur
    "TR_SUBD_006": (91.73, 23.38),  # Karbook

    # Sepahijala (West-Central South)
    "TR_SUBD_016": (91.27, 23.47),  # Sonamura
    "TR_SUBD_015": (91.33, 23.49),  # Melaghar
    "TR_SUBD_013": (91.31, 23.67),  # Bishalgarh
    "TR_SUBD_014": (91.41, 23.66),  # Jampuijala

    # West Tripura (West-Central Capital)
    "TR_SUBD_024": (91.33, 23.75),  # Bisramganj
    "TR_SUBD_023": (91.28, 23.83),  # Agartala
    "TR_SUBD_025": (91.42, 23.80),  # Jirania
    "TR_SUBD_026": (91.36, 23.97),  # Mohanpur

    # Khowai (Central-North Strip)
    "TR_SUBD_009": (91.59, 23.84),  # Teliamura
    "TR_SUBD_008": (91.61, 24.06),  # Khowai

    # Dhalai (East-Central)
    "TR_SUBD_002": (91.90, 23.65),  # Gandacherra
    "TR_SUBD_001": (91.85, 23.92),  # Ambassa
    "TR_SUBD_003": (91.95, 23.86),  # Longtharai Valley
    "TR_SUBD_004": (91.96, 24.06),  # Manu

    # Unakoti (North-Central)
    "TR_SUBD_021": (92.03, 24.28),  # Dharmanagar
    "TR_SUBD_022": (92.05, 24.12),  # Kanchanpur

    # North Tripura (Far Northeast)
    "TR_SUBD_010": (92.16, 24.36),  # Kailashahar
    "TR_SUBD_011": (92.17, 24.20),  # Kumarghat
    "TR_SUBD_012": (92.24, 24.00),  # Panisagar
}

pts = [Point(lon, lat) for lon, lat in SEEDS.values()]
mp = MultiPoint(pts)

# Voronoi diagram bounded by envelope
env = tripura_geom.envelope.buffer(0.5)
regions = voronoi_diagram(mp, envelope=env)

# Map each region back to the seed that is inside it
seed_items = list(SEEDS.items())
subd_polygons = {}
for poly in regions.geoms:
    # intersect with tripura state boundary
    clipped = poly.intersection(tripura_geom)
    if clipped.is_empty:
        continue
    # find which seed is inside
    matched = None
    for sid, (lon, lat) in seed_items:
        pt = Point(lon, lat)
        if poly.contains(pt) or poly.touches(pt):
            matched = sid
            break
    if matched:
        subd_polygons[matched] = clipped

print("Generated polygons count:", len(subd_polygons))
missing = set(SEEDS.keys()) - set(subd_polygons.keys())
print("Missing seeds:", missing)
if subd_polygons:
    total_union = unary_union(list(subd_polygons.values()))
    print("Tripura poly area:", tripura_geom.area)
    print("Total union area:", total_union.area)
    print("Area diff:", abs(total_union.area - tripura_geom.area))

# Check district grouping
with open('data/processed/admin/tripura_sub_divisions.geojson') as f:
    orig_subd = json.load(f)

dist_subds = {}
for feat in orig_subd['features']:
    props = feat['properties']
    d_name = props['current_district_name']
    d_id = props['current_district_id']
    dist_subds.setdefault(d_name, []).append(props['mandal_id'])

dist_polys = {}
for d_name, sids in dist_subds.items():
    polys = [subd_polygons[sid] for sid in sids]
    dist_union = unary_union(polys)
    dist_polys[d_name] = dist_union
    print(f"District {d_name:15s}: type={dist_union.geom_type}, area={dist_union.area:.4f}")

dist_union_total = unary_union(list(dist_polys.values()))
print("Total district union area diff:", abs(dist_union_total.area - tripura_geom.area))



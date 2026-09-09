import geopandas as gpd
import json

# 1. Load ADM2
gdf2 = gpd.read_file('data/raw/admin/tamil_nadu/india_adm2.geojson')
hp_names = ['Una', 'Solan', 'Sirmaur', 'Kinnaur', 'Kullu', 'Chamba', 'Shimla', 'Bilaspur', 'Kangra', 'Lahul & Spiti', 'Mandi', 'Hamirpur']
hp_districts = gdf2[gdf2['shapeName'].isin(hp_names)].copy()
hp_districts['lat'] = hp_districts.geometry.centroid.y
hp_districts = hp_districts[hp_districts['lat'] > 30.0].copy()
print('Filtered HP Districts count:', len(hp_districts))
for _, r in hp_districts.iterrows():
    print(r['shapeName'], r['shapeID'], round(r.geometry.centroid.y, 2), round(r.geometry.centroid.x, 2))

# 2. Load ADM3
gdf3 = gpd.read_file('data/raw/admin/tamil_nadu/india_adm3.geojson')
joined = gpd.sjoin(gdf3, hp_districts[['shapeName', 'geometry']], how='inner', predicate='intersects')
joined['centroid'] = joined.geometry.centroid
# Filter by centroid containment
district_geoms = {r['shapeName']: r.geometry for _, r in hp_districts.iterrows()}
joined['inside'] = joined.apply(lambda r: district_geoms[r['shapeName_right']].contains(r['centroid']), axis=1)
hp_tehsils = joined[joined['inside']].drop_duplicates(subset=['shapeID']).copy()
print('\nTotal HP Tehsils cleanly inside HP districts:', len(hp_tehsils))
print('\nTehsils per district breakdown:')
print(hp_tehsils['shapeName_right'].value_counts())
print('\nSample Tehsils:')
for _, r in hp_tehsils.head(10).iterrows():
    print(r['shapeName_left'], '->', r['shapeName_right'])

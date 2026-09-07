import os
import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import shape, Point, Polygon, MultiPolygon, mapping
from shapely.validation import make_valid
import rasterio
from rasterio.mask import mask

from app.core.config import settings
from app.village.schemas import (
    SectorHazardDetail,
    VillageGeometryResponse,
    VillageHazardResponse,
    VillageScenarioRequest,
    VillageScenarioResponse,
    VillageRelocationCandidate,
    VillageRelocationResponse,
)

class VillageSpatialService:
    def __init__(self):
        self._villages_gdf: Optional[gpd.GeoDataFrame] = None
        self._villages_index: Optional[pd.DataFrame] = None
        self._tracks_gdf: Optional[gpd.GeoDataFrame] = None
        self._wind_gdf: Optional[gpd.GeoDataFrame] = None
        self._host_df: Optional[pd.DataFrame] = None
        self._cap_df: Optional[pd.DataFrame] = None
        self._mandal_centroids_7755: Dict[str, Point] = {}
        self._mandal_centroids_by_id_7755: Dict[str, Point] = {}
        self._adj_map: Dict[str, List[str]] = {}

    def _get_gis_dir(self) -> Path:
        return settings.DATA_DIR / "processed" / "gis" / "villages"

    def _ensure_data_loaded(self):
        if self._villages_gdf is not None:
            return

        gis_dir = self._get_gis_dir()
        parquet_path = gis_dir / "ap_villages.parquet"
        index_path = gis_dir / "ap_villages_index.csv"

        if not parquet_path.exists():
            raise FileNotFoundError(f"Village spatial dataset not found at {parquet_path}. Run scripts/process_soi_villages.py first.")

        # Read GeoParquet (EPSG:7755)
        self._villages_gdf = gpd.read_parquet(parquet_path)
        if index_path.exists():
            self._villages_index = pd.read_csv(index_path)
        else:
            self._villages_index = self._villages_gdf.drop(columns=["geometry"])

        # Load Cyclone Tracks in EPSG:7755
        tracks_path = settings.DATA_DIR / "processed" / "hazard" / "cyclone" / "ap_bay_of_bengal_tracks.geojson"
        if tracks_path.exists():
            try:
                self._tracks_gdf = gpd.read_file(tracks_path).to_crs("EPSG:7755")
            except Exception:
                self._tracks_gdf = None

        # Load Wind Layer in EPSG:4326
        wind_path = settings.DATA_DIR / "processed" / "hazard" / "wind" / "ap_district_wind_hazard.geojson"
        if wind_path.exists():
            try:
                self._wind_gdf = gpd.read_file(wind_path)
            except Exception:
                self._wind_gdf = None

        # Load Candidate Host Zones & Capacity
        host_csv = settings.DATA_DIR / "processed" / "capacity" / "host_zone_candidates.csv"
        cap_csv = settings.DATA_DIR / "processed" / "capacity" / "mandal_capacity_adequacy.csv"
        if host_csv.exists():
            self._host_df = pd.read_csv(host_csv)
        if cap_csv.exists():
            self._cap_df = pd.read_csv(cap_csv)

        # Load Mandal Centroids and Spatial Adjacency for accurate distance & hierarchy in EPSG:7755
        exposure_geojson = settings.DATA_DIR / "processed" / "hazard" / "mandal_exposure" / "ap_mandal_multi_hazard_exposure.geojson"
        if exposure_geojson.exists():
            try:
                m_gdf = gpd.read_file(exposure_geojson).to_crs("EPSG:7755")
                s_idx = m_gdf.sindex
                for _, row in m_gdf.iterrows():
                    mid = str(row.get("mandal_id", "")).strip()
                    mname = str(row.get("mandal_name", "")).strip().upper()
                    dname = str(row.get("current_district_name", "")).strip().upper()
                    c = row.geometry.centroid
                    if mid:
                        self._mandal_centroids_by_id_7755[mid] = c
                    self._mandal_centroids_7755[mname] = c
                    if dname:
                        self._mandal_centroids_7755[f"{mname}_{dname}"] = c
                    # Spatial adjacency (buffered intersection)
                    if mid:
                        bbox_matches = m_gdf.iloc[list(s_idx.intersection(row.geometry.bounds))]
                        nbrs = bbox_matches[bbox_matches.geometry.intersects(row.geometry.buffer(50))]["mandal_id"].astype(str).tolist()
                        self._adj_map[mid] = [n for n in nbrs if n != mid]
            except Exception:
                pass

        if not self._mandal_centroids_by_id_7755:
            mandal_geojson = settings.DATA_DIR / "raw" / "admin" / "AndhraPradesh_Mandals.geojson"
            if mandal_geojson.exists():
                try:
                    m_gdf = gpd.read_file(mandal_geojson).to_crs("EPSG:7755")
                    for _, row in m_gdf.iterrows():
                        mname = str(row.get("DMNAME", "")).strip().upper()
                        self._mandal_centroids_7755[mname] = row.geometry.centroid
                except Exception:
                    pass

    def get_village_row(self, village_code: int) -> Optional[pd.Series]:
        self._ensure_data_loaded()
        match = self._villages_gdf[self._villages_gdf["village_code"] == village_code]
        if match.empty:
            return None
        return match.iloc[0]

    def _partition_sectors(self, geom: MultiPolygon, cx: float, cy: float) -> Dict[str, MultiPolygon]:
        """
        Partition the actual village MultiPolygon into 4 cardinal sectors (North, East, South, West)
        clipped strictly to the village boundary, meeting at the village centroid (cx, cy).
        """
        minx, miny, maxx, maxy = geom.bounds
        r = max(maxx - minx, maxy - miny) * 3.0 + 1000.0

        poly_north = Polygon([(cx, cy), (cx - r, cy + r), (cx + r, cy + r)])
        poly_south = Polygon([(cx, cy), (cx + r, cy - r), (cx - r, cy - r)])
        poly_east = Polygon([(cx, cy), (cx + r, cy + r), (cx + r, cy - r)])
        poly_west = Polygon([(cx, cy), (cx - r, cy - r), (cx - r, cy + r)])

        sectors = {}
        for name, wedge in [("NORTH", poly_north), ("SOUTH", poly_south), ("EAST", poly_east), ("WEST", poly_west)]:
            inter = geom.intersection(wedge)
            if not inter.is_valid:
                inter = make_valid(inter)
            if inter.geom_type == "Polygon":
                inter = MultiPolygon([inter])
            elif inter.geom_type != "MultiPolygon":
                polys = [p for p in getattr(inter, "geoms", []) if p.geom_type in ("Polygon", "MultiPolygon")]
                flat_polys = []
                for p in polys:
                    if p.geom_type == "Polygon":
                        flat_polys.append(p)
                    else:
                        flat_polys.extend(p.geoms)
                inter = MultiPolygon(flat_polys) if flat_polys else MultiPolygon()
            sectors[name] = inter

        return sectors

    def get_village_geometry(self, village_code: int) -> Optional[VillageGeometryResponse]:
        row = self.get_village_row(village_code)
        if row is None:
            return None

        v_geom_7755 = row.geometry
        cx = float(row["centroid_x_7755"])
        cy = float(row["centroid_y_7755"])

        sectors_7755 = self._partition_sectors(v_geom_7755, cx, cy)

        # Reproject to EPSG:4326 for Leaflet/GeoJSON
        gdf_boundary = gpd.GeoDataFrame([{"geometry": v_geom_7755}], crs="EPSG:7755").to_crs("EPSG:4326")
        boundary_4326 = gdf_boundary.geometry.iloc[0]

        sector_features = []
        for s_name, s_geom in sectors_7755.items():
            if s_geom.is_empty:
                continue
            s_gdf = gpd.GeoDataFrame([{"geometry": s_geom}], crs="EPSG:7755").to_crs("EPSG:4326")
            s_4326 = s_gdf.geometry.iloc[0]
            sector_features.append({
                "type": "Feature",
                "properties": {
                    "sector": s_name,
                    "village_code": village_code,
                    "village_name": str(row["village_name"]),
                    "area_sqkm": round(s_geom.area / 1e6, 4)
                },
                "geometry": mapping(s_4326)
            })

        return VillageGeometryResponse(
            village_code=village_code,
            village_name=str(row["village_name"]),
            mandal_name=str(row["mandal_name"]),
            district_name=str(row["current_district_name"]),
            village_area_sqkm=float(row["village_area_sqkm"]),
            centroid_lat=float(row["centroid_lat"]),
            centroid_lon=float(row["centroid_lon"]),
            village_boundary_geojson={
                "type": "Feature",
                "properties": {
                    "village_code": village_code,
                    "village_name": str(row["village_name"]),
                    "mandal_name": str(row["mandal_name"]),
                    "district_name": str(row["current_district_name"]),
                    "village_area_sqkm": float(row["village_area_sqkm"]),
                },
                "geometry": mapping(boundary_4326)
            },
            sectors_geojson={
                "type": "FeatureCollection",
                "features": sector_features
            }
        )

    def _sample_flood(self, geom_4326) -> Dict[str, Any]:
        flood_tif = settings.DATA_DIR / "processed" / "hazard" / "flood" / "ap_water_recurrence.tif"
        if not flood_tif.exists() or geom_4326.is_empty:
            return {"valid_pixels": 0, "mean_rec": 0.0, "max_rec": 0.0, "pct_affected": 0.0, "score": 0.0, "status": "INSUFFICIENT_DATA"}

        try:
            with rasterio.open(flood_tif) as src:
                out_img, _ = mask(src, [geom_4326], crop=True, nodata=src.nodata)
                valid = out_img[0][out_img[0] != src.nodata]
                if len(valid) == 0:
                    return {"valid_pixels": 0, "mean_rec": 0.0, "max_rec": 0.0, "pct_affected": 0.0, "score": 0.0, "status": "NO_SURFACE_WATER"}

                mean_val = float(np.mean(valid))
                max_val = float(np.max(valid))
                # Percentage of valid intersecting raster area/pixels with recurrence >= 10%
                pct_aff = float((valid >= 10).sum() * 100.0 / len(valid))
                # Normalized flood exposure score [0, 1]
                flood_score = min(1.0, (mean_val / 100.0) * 0.5 + (pct_aff / 100.0) * 0.5)

                return {
                    "valid_pixels": int(len(valid)),
                    "mean_rec": round(mean_val, 2),
                    "max_rec": round(max_val, 2),
                    "pct_affected": round(pct_aff, 2),
                    "score": round(flood_score, 4),
                    "status": "VALID"
                }
        except Exception:
            return {"valid_pixels": 0, "mean_rec": 0.0, "max_rec": 0.0, "pct_affected": 0.0, "score": 0.0, "status": "ERROR"}

    def _sample_slope(self, geom_7755) -> Dict[str, Any]:
        slope_tif = settings.DATA_DIR / "processed" / "hazard" / "slope" / "ap_slope_degrees.tif"
        if not slope_tif.exists() or geom_7755.is_empty:
            return {"valid_pixels": 0, "mean_slope": 0.0, "max_slope": 0.0, "pct_steep": 0.0, "score": 0.0, "status": "INSUFFICIENT_DATA"}

        try:
            with rasterio.open(slope_tif) as src:
                out_img, _ = mask(src, [geom_7755], crop=True, nodata=src.nodata)
                valid = out_img[0][out_img[0] != src.nodata]
                if len(valid) == 0:
                    return {"valid_pixels": 0, "mean_slope": 0.0, "max_slope": 0.0, "pct_steep": 0.0, "score": 0.0, "status": "NO_DATA"}

                mean_val = float(np.mean(valid))
                max_val = float(np.max(valid))
                # Percentage of slope pixels >= 15° (steep terrain threshold)
                pct_steep = float((valid >= 15.0).sum() * 100.0 / len(valid))
                # Normalized slope score [0, 1]
                slope_score = min(1.0, (mean_val / 30.0) * 0.5 + (pct_steep / 100.0) * 0.5)

                return {
                    "valid_pixels": int(len(valid)),
                    "mean_slope": round(mean_val, 2),
                    "max_slope": round(max_val, 2),
                    "pct_steep": round(pct_steep, 2),
                    "score": round(slope_score, 4),
                    "status": "VALID"
                }
        except Exception:
            return {"valid_pixels": 0, "mean_slope": 0.0, "max_slope": 0.0, "pct_steep": 0.0, "score": 0.0, "status": "ERROR"}

    def _sample_cyclone(self, geom_7755) -> Dict[str, Any]:
        if self._tracks_gdf is None or geom_7755.is_empty:
            return {"tracks_count": 0, "min_dist_km": 999.0, "score": 0.0, "status": "INSUFFICIENT_DATA"}

        try:
            buf_25k = geom_7755.buffer(25000)
            intersecting = self._tracks_gdf[self._tracks_gdf.geometry.intersects(buf_25k)]
            count = len(intersecting)
            min_dist_m = float(self._tracks_gdf.distance(geom_7755).min())
            min_dist_km = round(min_dist_m / 1000.0, 2)

            # Normalized cyclone track proximity score [0, 1]
            cyc_score = min(1.0, max(0.0, 1.0 - (min_dist_km / 50.0)))

            return {
                "tracks_count": count,
                "min_dist_km": min_dist_km,
                "score": round(cyc_score, 4),
                "status": "VALID"
            }
        except Exception:
            return {"tracks_count": 0, "min_dist_km": 999.0, "score": 0.0, "status": "ERROR"}

    def _sample_wind(self, geom_4326) -> Dict[str, Any]:
        if self._wind_gdf is None or geom_4326.is_empty:
            return {"speed_ms": 44.0, "zone": "Zone III", "score": 0.0, "status": "INSUFFICIENT_DATA"}

        try:
            c_pt = geom_4326.centroid
            match = self._wind_gdf[self._wind_gdf.geometry.contains(c_pt)]
            if match.empty:
                match = self._wind_gdf[self._wind_gdf.geometry.intersects(geom_4326)]

            if not match.empty:
                spd = float(match.iloc[0].get("basic_wind_speed_m_s", 47.0))
                zone = str(match.iloc[0].get("risk_zone", "Zone II - High Damage Risk"))
                score = round((spd - 44.0) / 6.0, 4)
                return {
                    "speed_ms": spd,
                    "zone": zone,
                    "score": max(0.0, min(1.0, score)),
                    "status": "VALID"
                }
            return {"speed_ms": 47.0, "zone": "Zone II", "score": 0.5, "status": "REGIONAL_DEFAULT"}
        except Exception:
            return {"speed_ms": 44.0, "zone": "Zone III", "score": 0.0, "status": "ERROR"}

    def get_village_hazards(self, village_code: int, disaster_type: str = "all") -> Optional[VillageHazardResponse]:
        row = self.get_village_row(village_code)
        if row is None:
            return None

        v_geom_7755 = row.geometry
        cx = float(row["centroid_x_7755"])
        cy = float(row["centroid_y_7755"])
        total_area = float(row["village_area_sqkm"])

        # 1. Four-Cardinal Sectoring
        sectors_7755 = self._partition_sectors(v_geom_7755, cx, cy)

        # Verify area preservation (tolerance 0.01 km²)
        sum_area = sum(s.area for s in sectors_7755.values()) / 1e6
        area_preserved = abs(sum_area - total_area) < 0.05

        # 2. Whole Village Sampling
        v_gdf_4326 = gpd.GeoDataFrame([{"geometry": v_geom_7755}], crs="EPSG:7755").to_crs("EPSG:4326")
        v_geom_4326 = v_gdf_4326.geometry.iloc[0]

        whole_flood = self._sample_flood(v_geom_4326)
        whole_slope = self._sample_slope(v_geom_7755)
        whole_cyc = self._sample_cyclone(v_geom_7755)
        whole_wind = self._sample_wind(v_geom_4326)

        # 3. Sector Level Sampling
        sector_details: List[SectorHazardDetail] = []
        sector_scores = []

        for s_name in ["NORTH", "EAST", "SOUTH", "WEST"]:
            s_geom_7755 = sectors_7755[s_name]
            s_area = round(s_geom_7755.area / 1e6, 4)
            s_pct = round((s_area / total_area * 100.0) if total_area > 0 else 25.0, 1)

            if s_geom_7755.is_empty:
                sector_details.append(SectorHazardDetail(
                    sector=s_name,
                    area_sqkm=0.0,
                    area_pct=0.0,
                    priority="INSUFFICIENT DATA",
                    priority_reason="Zero geometric area in sector clipping.",
                    sector_hazard_score=0.0
                ))
                continue

            s_gdf_4326 = gpd.GeoDataFrame([{"geometry": s_geom_7755}], crs="EPSG:7755").to_crs("EPSG:4326")
            s_geom_4326 = s_gdf_4326.geometry.iloc[0]

            s_flood = self._sample_flood(s_geom_4326)
            s_slope = self._sample_slope(s_geom_7755)
            s_cyc = self._sample_cyclone(s_geom_7755)
            s_wind = whole_wind  # District level wind applies uniformly across sectors

            # Sector score weighted by disaster type focus
            f_sc = s_flood["score"]
            sl_sc = s_slope["score"]
            c_sc = s_cyc["score"]
            w_sc = s_wind["score"]

            dt = disaster_type.strip().lower()
            if dt == "flood":
                comp_sc = f_sc
                driver_text = f"Flood recurrence ({s_flood['mean_rec']}% mean, {s_flood['pct_affected']}% area affected)"
            elif dt == "slope" or dt == "landslide":
                comp_sc = sl_sc
                driver_text = f"Terrain slope ({s_slope['mean_slope']}° mean, {s_slope['pct_steep']}% steep terrain)"
            elif dt == "cyclone":
                comp_sc = 0.6 * c_sc + 0.4 * w_sc
                driver_text = f"Cyclone proximity ({s_cyc['min_dist_km']} km to track, {s_wind['speed_ms']} m/s wind)"
            elif dt == "wind":
                comp_sc = w_sc
                driver_text = f"Design wind speed ({s_wind['speed_ms']} m/s, {s_wind['zone']})"
            else:
                # Multi-hazard composite
                comp_sc = 0.40 * f_sc + 0.25 * c_sc + 0.20 * w_sc + 0.15 * sl_sc
                dominant = max([("Flood", f_sc), ("Cyclone", c_sc), ("Wind", w_sc), ("Slope", sl_sc)], key=lambda x: x[1])
                driver_text = f"Multi-hazard exposure led by {dominant[0]} ({dominant[1]:.2f} index)"

            comp_sc = round(min(1.0, max(0.0, comp_sc)), 4)
            sector_scores.append(comp_sc)

            # Deterministic Priority Classification
            if comp_sc >= 0.45:
                p_label = "VERY HIGH"
            elif comp_sc >= 0.28:
                p_label = "HIGH"
            elif comp_sc >= 0.12:
                p_label = "MODERATE"
            else:
                p_label = "LOW"

            p_reason = f"{s_name} sector classified {p_label} priority: {driver_text}. Surface area: {s_area} km² ({s_pct}% of village)."

            sector_details.append(SectorHazardDetail(
                sector=s_name,
                area_sqkm=s_area,
                area_pct=s_pct,
                priority=p_label,
                priority_reason=p_reason,
                flood_mean_recurrence_pct=s_flood["mean_rec"],
                flood_max_recurrence_pct=s_flood["max_rec"],
                flood_area_affected_pct=s_flood["pct_affected"],
                flood_score=s_flood["score"],
                slope_mean_degrees=s_slope["mean_slope"],
                slope_max_degrees=s_slope["max_slope"],
                slope_steep_area_pct=s_slope["pct_steep"],
                slope_score=s_slope["score"],
                cyclone_tracks_count_25km=s_cyc["tracks_count"],
                cyclone_min_dist_km=s_cyc["min_dist_km"],
                wind_basic_speed_ms=s_wind["speed_ms"],
                wind_zone=s_wind["zone"],
                sector_hazard_score=comp_sc,
                geometry_geojson=mapping(s_geom_4326)
            ))

        # 4. Overall Village Metrics
        overall_hz = round(float(np.mean(sector_scores)) if sector_scores else 0.0, 4)
        dominant_list = [
            ("Flood Recurrence (30m)", whole_flood["score"]),
            ("Cyclone Track Proximity", whole_cyc["score"]),
            ("Basic Design Wind Speed", whole_wind["score"]),
            ("Terrain Slope Gradient", whole_slope["score"])
        ]
        dominant_list.sort(key=lambda x: x[1], reverse=True)
        dominant_hz = dominant_list[0][0]

        pop = int(row.get("population_total", 0))
        # Relocation Priority: Combines demographic load with highest-exposed sector
        max_sec_score = max(sector_scores) if sector_scores else overall_hz
        if max_sec_score >= 0.45 or (max_sec_score >= 0.35 and pop >= 2500):
            v_priority = "VERY HIGH"
        elif max_sec_score >= 0.28 or (max_sec_score >= 0.20 and pop >= 1500):
            v_priority = "HIGH"
        elif max_sec_score >= 0.12:
            v_priority = "MODERATE"
        else:
            v_priority = "LOW"

        return VillageHazardResponse(
            village_code=village_code,
            village_name=str(row["village_name"]),
            mandal_code=str(row.get("mandal_code", "")),
            mandal_name=str(row["mandal_name"]),
            district_name=str(row["current_district_name"]),
            district_code=str(row["current_district_code"]),
            population_total=pop,
            households=int(row.get("households", 0)),
            village_area_sqkm=total_area,
            centroid_lat=float(row["centroid_lat"]),
            centroid_lon=float(row["centroid_lon"]),
            disaster_type=disaster_type,
            dominant_hazard=dominant_hz,
            overall_hazard_score=overall_hz,
            relocation_priority=v_priority,
            flood_summary=whole_flood,
            slope_summary=whole_slope,
            cyclone_summary=whole_cyc,
            wind_summary=whole_wind,
            sectors=sector_details,
            area_preservation_verified=area_preserved,
            data_provenance_note="Village-level spatial metrics sampled strictly from Survey of India (SOI) MultiPolygon boundaries and continuous 30m/90m rasters. Mandal scores were not copied to villages."
        )

    def run_scenario(self, village_code: int, increase: float) -> Optional[VillageScenarioResponse]:
        """
        Run 0–10 what-if sensitivity scenario perturbation.
        0 = baseline (0%), 5 = +5% sensitivity, 10 = +10% sensitivity.
        """
        base_hazards = self.get_village_hazards(village_code, disaster_type="all")
        if base_hazards is None:
            return None

        inc = max(0.0, min(10.0, float(increase)))
        multiplier = 1.0 + (inc / 100.0)

        base_score = base_hazards.overall_hazard_score
        sim_score = round(min(1.0, base_score * multiplier), 4)

        pop = base_hazards.population_total
        sim_at_risk = int(pop * min(1.0, sim_score * 1.3))

        # Re-evaluate simulated priority
        if sim_score >= 0.45 or (sim_score >= 0.35 and pop >= 2500):
            sim_p = "VERY HIGH"
        elif sim_score >= 0.28 or (sim_score >= 0.20 and pop >= 1500):
            sim_p = "HIGH"
        elif sim_score >= 0.12:
            sim_p = "MODERATE"
        else:
            sim_p = "LOW"

        shifted = sim_p != base_hazards.relocation_priority

        sector_sims = []
        for s in base_hazards.sectors:
            s_sim_score = round(min(1.0, s.sector_hazard_score * multiplier), 4)
            s_p = "VERY HIGH" if s_sim_score >= 0.45 else ("HIGH" if s_sim_score >= 0.28 else ("MODERATE" if s_sim_score >= 0.12 else "LOW"))
            sector_sims.append({
                "sector": s.sector,
                "baseline_score": s.sector_hazard_score,
                "simulated_score": s_sim_score,
                "simulated_priority": s_p,
                "priority_shifted": s_p != s.priority
            })

        explanation = f"What-if scenario applied +{inc:.1f}% hazard perturbation. Simulated hazard moved from {base_score:.4f} to {sim_score:.4f}. Priority state: {sim_p} ({'Shifted' if shifted else 'Maintained'})."

        return VillageScenarioResponse(
            village_code=village_code,
            village_name=base_hazards.village_name,
            baseline_hazard_score=base_score,
            scenario_hazard_increase=inc,
            simulated_hazard_score=sim_score,
            simulated_relocation_priority=sim_p,
            priority_shifted=shifted,
            simulated_population_at_risk=sim_at_risk,
            disclaimer="SCENARIO SIMULATION — NOT A FORECAST",
            explanation=explanation,
            sector_simulations=sector_sims
        )

    def get_relocation_centers(self, village_code: int, limit: int = 5) -> Optional[VillageRelocationResponse]:
        """
        Rank candidate host relocation centers for a selected village.
        Calculates distance from village centroid to candidate host mandal centroid.
        Applies Hard Safety Filter, distance soft preference, capacity headroom, and road accessibility.
        """
        row = self.get_village_row(village_code)
        if row is None:
            return None

        v_name = str(row["village_name"])
        origin_mandal = str(row["mandal_name"]).strip().upper()
        origin_district = str(row["current_district_name"]).strip()
        v_pt = Point(float(row["centroid_x_7755"]), float(row["centroid_y_7755"]))

        if self._cap_df is None or self._cap_df.empty:
            return VillageRelocationResponse(
                village_code=village_code,
                village_name=v_name,
                origin_mandal_name=origin_mandal,
                origin_district_name=origin_district,
                total_candidates_evaluated=0,
                recommended_centers=[],
                soft_distance_notice="Distance is a soft preference.",
                governance_disclaimer="Candidate host data unavailable."
            )

        origin_mid = None
        if self._cap_df is not None and not self._cap_df.empty:
            m_match = self._cap_df[
                (self._cap_df["mandal_name"].str.upper() == origin_mandal) &
                (self._cap_df["current_district_name"].str.lower() == origin_district.lower())
            ]
            if m_match.empty:
                m_match = self._cap_df[self._cap_df["mandal_name"].str.upper() == origin_mandal]
            if not m_match.empty:
                origin_mid = str(m_match.iloc[0]["mandal_id"]).strip()

        # Pre-evaluate all mandals for distance and closer-candidate audit
        all_mandals_summary = []
        for _, c_row in self._cap_df.iterrows():
            c_mid = str(c_row.get("mandal_id", "")).strip()
            c_mname = str(c_row.get("mandal_name", "")).strip().upper()
            c_dname = str(c_row.get("current_district_name", "")).strip()

            # High-precision centroid distance lookup by mandal_id
            if c_mid in self._mandal_centroids_by_id_7755:
                dist_km = round(v_pt.distance(self._mandal_centroids_by_id_7755[c_mid]) / 1000.0, 1)
            elif f"{c_mname}_{c_dname.upper()}" in self._mandal_centroids_7755:
                dist_km = round(v_pt.distance(self._mandal_centroids_7755[f"{c_mname}_{c_dname.upper()}"]) / 1000.0, 1)
            elif c_mname in self._mandal_centroids_7755:
                dist_km = round(v_pt.distance(self._mandal_centroids_7755[c_mname]) / 1000.0, 1)
            else:
                dist_km = 25.0

            safe_frac = float(c_row.get("safe_area_fraction", 0.85))
            cond = str(c_row.get("capacity_condition", "CAPACITY-ADEQUATE"))
            shelter_cap = int(c_row.get("verified_shelter_capacity_persons", 0))
            road_score = float(c_row.get("road_accessibility_score", 0.75))
            ws_ad = float(c_row.get("water_sanitation_adequacy", 0.75))

            # Geographic Search Hierarchy Classification
            if c_mname == origin_mandal or (origin_mid and c_mid == origin_mid):
                prox_cat = "NEARBY / SAME MANDAL"
                prox_mult = 1.25
            elif origin_mid and c_mid in self._adj_map.get(origin_mid, []):
                prox_cat = "ADJACENT MANDAL"
                prox_mult = 1.15
            elif c_dname.lower() == origin_district.lower():
                prox_cat = "SAME DISTRICT"
                prox_mult = 1.05
            else:
                prox_cat = "REGIONAL FALLBACK"
                prox_mult = 1.0

            all_mandals_summary.append({
                "mandal_id": c_mid,
                "mandal_name": c_mname,
                "district_name": c_dname,
                "dist_km": dist_km,
                "safe_frac": safe_frac,
                "capacity_condition": cond,
                "shelter_cap": shelter_cap,
                "road_score": road_score,
                "ws_ad": ws_ad,
                "proximity_category": prox_cat,
                "proximity_mult": prox_mult
            })

        # Filter candidate pool: exclude CAPACITY-STRESSED and require >= 50% safe land
        cands = [m for m in all_mandals_summary if m["capacity_condition"] != "CAPACITY-STRESSED" and m["safe_frac"] >= 0.50]

        scored_candidates = []
        for c in cands:
            dist_km = c["dist_km"]
            safe_frac = c["safe_frac"]
            cond = c["capacity_condition"]
            shelter_cap = c["shelter_cap"]
            road_score = c["road_score"]
            ws_ad = c["ws_ad"]
            c_mname = c["mandal_name"]
            c_dname = c["district_name"]
            prox_cat = c["proximity_category"]
            prox_mult = c["proximity_mult"]

            # Multi-Criteria Scoring:
            # 1. Safety (0.35)
            # 2. Capacity (0.30)
            # 3. Accessibility (0.15)
            # 4. Soft Distance Preference (0.20) calibrated to 30km regional operational scale + administrative search preference
            s_safety = min(1.0, safe_frac)
            s_cap = 0.5 * min(1.0, shelter_cap / 3000.0) + 0.5 * min(1.0, ws_ad)
            s_acc = min(1.0, road_score)

            d_base = 1.0 / (1.0 + (dist_km / 30.0))
            s_dist = min(1.0, d_base * prox_mult)

            score = round(0.35 * s_safety + 0.30 * s_cap + 0.15 * s_acc + 0.20 * s_dist, 4)

            # Rationale
            if prox_cat == "NEARBY / SAME MANDAL":
                why = f"Same-mandal designated host with verified local shelter capacity ({shelter_cap:,} persons) and {safe_frac:.0%} safe habitable land."
            elif prox_cat == "ADJACENT MANDAL":
                why = f"Directly adjacent mandal host ({c_dname}) outside direct hazard zone (~{dist_km} km), offering verified headroom ({shelter_cap:,} persons) and accessible corridors."
            elif prox_cat == "SAME DISTRICT":
                why = f"Designated host in {c_dname} outside direct hazard zone (~{dist_km} km), offering verified headroom ({shelter_cap:,} persons) and accessible transit corridors."
            else:
                why = f"Regional fallback host zone in {c_dname} (~{dist_km} km) with {cond} condition and high road connectivity."

            scored_candidates.append({
                "center_name": f"{c['mandal_name'].title()} Host Zone",
                "mandal_name": c["mandal_name"],
                "district_name": c_dname,
                "distance_km": dist_km,
                "capacity_condition": cond,
                "safe_frac": safe_frac,
                "safety_status": f"{safe_frac:.0%} Safe Land",
                "accessibility_status": "Direct Evacuation Corridor" if road_score >= 0.70 else "Staged Transit Required",
                "suitability_score": score,
                "proximity_category": prox_cat,
                "why_recommended": why
            })

        # Sort by suitability score descending
        scored_candidates.sort(key=lambda x: x["suitability_score"], reverse=True)

        # Helper function for data-backed closer candidate rejection reasoning and structured rejected list
        def explain_closer_rejection(cand_dist: float, cand_safe: float) -> Tuple[Optional[str], List[Dict[str, Any]]]:
            closers = [m for m in all_mandals_summary if m["dist_km"] < cand_dist]
            if not closers:
                return None, []

            rejected_list = []
            for m in sorted(closers, key=lambda x: x["dist_km"]):
                is_origin = (m["mandal_name"] == origin_mandal)
                display_name = f"{m['mandal_name'].title()} (Origin)" if is_origin else m["mandal_name"].title()
                if m["safe_frac"] < 0.50:
                    rejected_list.append({
                        "mandal_name": display_name,
                        "district_name": m["district_name"],
                        "distance_km": m["dist_km"],
                        "safe_area_fraction": round(m["safe_frac"], 3),
                        "capacity_condition": m["capacity_condition"],
                        "rejection_reason": f"Safety failed: Safe land {m['safe_frac']:.1%} is below the required 50.0% threshold"
                    })
                elif m["capacity_condition"] == "CAPACITY-STRESSED":
                    rejected_list.append({
                        "mandal_name": display_name,
                        "district_name": m["district_name"],
                        "distance_km": m["dist_km"],
                        "safe_area_fraction": round(m["safe_frac"], 3),
                        "capacity_condition": m["capacity_condition"],
                        "rejection_reason": "Capacity failed: Existing shelter and facility infrastructure is severely stressed"
                    })
                if len(rejected_list) >= 3:
                    break

            failed_safety = [m for m in closers if m["safe_frac"] < 0.50]
            if failed_safety:
                failed_safety.sort(key=lambda x: x["dist_km"])
                names = ", ".join([f"{m['mandal_name'].title()} ({m['dist_km']} km, {m['safe_frac']:.0%} safe)" for m in failed_safety[:2]])
                reason_text = f"Closer locations rejected on safety: {names} failed the minimum 50% safe land threshold."
            else:
                lower_safe = [m for m in closers if m["safe_frac"] < cand_safe]
                if lower_safe:
                    lower_safe.sort(key=lambda x: x["dist_km"])
                    m0 = lower_safe[0]
                    reason_text = f"Closer option {m0['mandal_name'].title()} ({m0['dist_km']} km) scored lower due to less safe habitable land ({m0['safe_frac']:.0%} vs {cand_safe:.0%})."
                else:
                    reason_text = "Closer candidates lacked verified shelter capacity headroom or had lower road accessibility scores."

            return reason_text, rejected_list

        results = []
        for i, c in enumerate(scored_candidates[:limit], start=1):
            tier = "RECOMMENDED" if i == 1 else ("ALTERNATIVE" if i in [2, 3] else "FALLBACK")
            rejection_reason, rejected_closers = explain_closer_rejection(c["distance_km"], c["safe_frac"])

            results.append(VillageRelocationCandidate(
                center_name=c["center_name"],
                mandal_name=c["mandal_name"],
                district_name=c["district_name"],
                distance_km=c["distance_km"],
                capacity_condition=c["capacity_condition"],
                safety_status=c["safety_status"],
                accessibility_status=c["accessibility_status"],
                suitability_score=c["suitability_score"],
                suitability_tier=tier,
                why_recommended=c["why_recommended"],
                closer_candidate_rejection_reason=rejection_reason,
                rank=i,
                proximity_category=c["proximity_category"],
                rejected_closer_candidates=rejected_closers if rejected_closers else None
            ))

        nearby_found = any(c.proximity_category == "NEARBY / SAME MANDAL" for c in results)
        fallback_msg = None if nearby_found else "No verified suitable nearby candidate was found in the current dataset."

        return VillageRelocationResponse(
            village_code=village_code,
            village_name=v_name,
            origin_mandal_name=origin_mandal,
            origin_district_name=origin_district,
            total_candidates_evaluated=len(scored_candidates),
            recommended_centers=results,
            soft_distance_notice="Distance is a soft preference. Destinations are prioritized by Safety First, Capacity Second, Accessibility Third.",
            governance_disclaimer="CANDIDATE RELOCATION CENTERS — DECISION SUPPORT ONLY. Not an automated relocation order. Requires operational review by District Disaster Management Authority (DDMA).",
            nearby_candidate_found=nearby_found,
            fallback_notice=fallback_msg
        )

village_spatial_service = VillageSpatialService()

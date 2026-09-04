# PostgreSQL + PostGIS Schema Planning — Sahayata

This document specifies the target spatial and relational database schema planned for **Sahayata**.

> [!NOTE]
> This schema is prepared for future integration with PostgreSQL (15+) and PostGIS (3.3+). It does not require an active database installation during Phase 0 foundation setup. No synthetic or invented official data is pre-populated.

---

## Spatial Extensions Required
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 1. Administrative Hierarchy

### `states`
```sql
CREATE TABLE states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL, -- e.g. 'AP'
    name VARCHAR(100) NOT NULL,       -- e.g. 'Andhra Pradesh'
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_states_geom ON states USING GIST (geom);
```

### `districts`
```sql
CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_id UUID REFERENCES states(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_districts_geom ON districts USING GIST (geom);
```

### `mandals`
```sql
CREATE TABLE mandals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    district_id UUID REFERENCES districts(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_mandals_geom ON mandals USING GIST (geom);
```

---

## 2. Habitations & Demographics

### `habitations`
```sql
CREATE TABLE habitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mandal_id UUID REFERENCES mandals(id) ON DELETE CASCADE,
    census_village_code VARCHAR(50),
    name VARCHAR(150) NOT NULL,
    centroid GEOMETRY(Point, 4326) NOT NULL,
    boundary GEOMETRY(MultiPolygon, 4326),
    elevation_msl_meters NUMERIC(7,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_habitations_centroid ON habitations USING GIST (centroid);
CREATE INDEX idx_habitations_boundary ON habitations USING GIST (boundary);
```

### `population`
```sql
CREATE TABLE population (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habitation_id UUID REFERENCES habitations(id) ON DELETE CASCADE,
    total_population INTEGER NOT NULL,
    total_households INTEGER,
    males INTEGER,
    females INTEGER,
    data_vintage VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `vulnerability`
```sql
CREATE TABLE vulnerability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habitation_id UUID REFERENCES habitations(id) ON DELETE CASCADE,
    elderly_count INTEGER DEFAULT 0,
    children_count INTEGER DEFAULT 0,
    disabled_count INTEGER DEFAULT 0,
    kutcha_houses INTEGER DEFAULT 0,
    pucca_houses INTEGER DEFAULT 0,
    vulnerability_index NUMERIC(5,4), -- Derived composite
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Hazards & Spatial Layers

### `hazard_layers`
```sql
CREATE TABLE hazard_layers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    hazard_type VARCHAR(50) NOT NULL, -- 'flood', 'cyclone', 'storm_surge'
    return_period_years INTEGER,       -- 10, 25, 50, 100
    source_agency VARCHAR(100),
    raster_path TEXT,
    vector_geom GEOMETRY(MultiPolygon, 4326),
    severity_level VARCHAR(30),        -- 'low', 'moderate', 'high', 'severe'
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_hazard_layers_geom ON hazard_layers USING GIST (vector_geom);
```

---

## 4. Infrastructure & Evacuation Assets

### `shelters`
```sql
CREATE TABLE shelters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    shelter_type VARCHAR(50),          -- 'cyclone_shelter', 'school', 'community_hall'
    location GEOMETRY(Point, 4326) NOT NULL,
    rated_capacity_persons INTEGER NOT NULL,
    has_standby_power BOOLEAN DEFAULT FALSE,
    water_storage_liters INTEGER,
    usable_toilets INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_shelters_location ON shelters USING GIST (location);
```

### `roads`
```sql
CREATE TABLE roads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100),
    road_class VARCHAR(50),            -- 'national_highway', 'state_highway', 'rural_road'
    geom GEOMETRY(MultiLineString, 4326) NOT NULL,
    is_evacuation_route BOOLEAN DEFAULT FALSE,
    flood_inundation_risk BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_roads_geom ON roads USING GIST (geom);
```

### `infrastructure`
```sql
CREATE TABLE infrastructure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    infra_type VARCHAR(50) NOT NULL,   -- 'hospital', 'phc', 'electrical_substation', 'wtp'
    location GEOMETRY(Point, 4326) NOT NULL,
    emergency_contact VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_infra_location ON infrastructure USING GIST (location);
```

---

## 5. Analytical, Capacity & Prioritization Models

### `carrying_capacity`
```sql
CREATE TABLE carrying_capacity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habitation_id UUID REFERENCES habitations(id) ON DELETE CASCADE,
    safe_habitable_area_sqm NUMERIC(10,2),
    shelter_capacity_headroom INTEGER,
    water_supply_liters_per_day NUMERIC(10,2),
    sanitation_facilities_count INTEGER,
    evacuation_throughput_vph INTEGER,
    bottleneck_resource VARCHAR(50),
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `risk_scores`
```sql
CREATE TABLE risk_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habitation_id UUID REFERENCES habitations(id) ON DELETE CASCADE,
    hazard_score NUMERIC(5,4) NOT NULL,
    exposure_score NUMERIC(5,4) NOT NULL,
    vulnerability_score NUMERIC(5,4) NOT NULL,
    composite_risk NUMERIC(5,4) NOT NULL,
    is_red_zone BOOLEAN DEFAULT FALSE,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `relocation_priorities`
```sql
CREATE TABLE relocation_priorities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habitation_id UUID REFERENCES habitations(id) ON DELETE CASCADE,
    priority_rank INTEGER NOT NULL,
    topsis_score NUMERIC(7,6) NOT NULL,
    ahp_weight_profile VARCHAR(50) DEFAULT 'standard',
    urgency_tier VARCHAR(20) NOT NULL, -- 'IMMEDIATE', 'HIGH', 'MODERATE', 'MONITOR'
    explanation_json JSONB,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_relocation_rank ON relocation_priorities(priority_rank);
```

### `scenarios`
```sql
CREATE TABLE scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    hazard_multiplier NUMERIC(4,2) DEFAULT 1.0,
    surge_height_meters NUMERIC(4,2) DEFAULT 0.0,
    shelter_availability_pct NUMERIC(5,2) DEFAULT 100.0,
    parameters JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

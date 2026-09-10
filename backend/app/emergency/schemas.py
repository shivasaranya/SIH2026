from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class AffectedArea(BaseModel):
    model_config = ConfigDict(extra="allow")
    type: str = Field(..., description="'radius' or 'polygon'")
    radiusKm: Optional[float] = Field(None, description="Radius in kilometers if type is radius")
    coordinates: Optional[List[Any]] = Field(None, description="Coordinates list if type is polygon")

class EmergencyDisaster(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    
    id: str = Field(..., description="Unique disaster event ID")
    disasterType: str = Field(..., description="Type of disaster (flood, cyclone, heavy_rainfall, landslide, earthquake, tsunami, forest_fire, urban_fire, drought, other)")
    type: Optional[str] = Field(None, description="Alias for disasterType")
    latitude: float = Field(..., description="WGS84 Latitude")
    longitude: float = Field(..., description="WGS84 Longitude")
    severity: str = Field(..., description="critical | high | medium | low | warning")
    status: str = Field(..., description="active | monitoring | resolved")
    title: Optional[str] = Field(None, description="Short human-readable title")
    description: Optional[str] = Field(None, description="Detailed description")
    location: Optional[str] = Field(None, description="Location description / landmark")
    affectedArea: Optional[Dict[str, Any]] = Field(None, description="Affected area geometry / radius")
    affectedPopulation: Optional[int] = Field(None, description="Estimated affected population")
    startedAt: Optional[str] = Field(None, description="ISO-8601 timestamp when disaster started")
    lastUpdated: Optional[str] = Field(None, description="ISO-8601 timestamp of last update")
    source: Optional[str] = Field("State Emergency Operations Center", description="Data source or verification feed")
    state: str = Field(..., description="State name or identifier")
    district: Optional[str] = Field(None, description="District name or identifier")
    createdAt: Optional[str] = Field(None, description="ISO-8601 creation timestamp")
    updatedAt: Optional[str] = Field(None, description="ISO-8601 update timestamp")

class EmergencyDisasterCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    id: Optional[str] = None
    disasterType: str
    latitude: float
    longitude: float
    severity: str = "critical"
    status: str = "active"
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    affectedArea: Optional[Dict[str, Any]] = None
    affectedPopulation: Optional[int] = None
    startedAt: Optional[str] = None
    lastUpdated: Optional[str] = None
    source: Optional[str] = "State Emergency Operations Center"
    state: str
    district: Optional[str] = None

class EmergencyDisasterListResponse(BaseModel):
    total: int
    state: str
    disasters: List[EmergencyDisaster]
    items: List[EmergencyDisaster]

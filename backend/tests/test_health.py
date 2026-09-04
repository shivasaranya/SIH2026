from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Sahayata" in data["message"]
    assert data["sih_problem"] == "SIH26191"
    assert data["phase"] == "PHASE 0 — PROJECT FOUNDATION"


def test_health_check_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["project"] == "Sahayata"
    assert data["sih_problem"] == "SIH26191"
    assert data["pilot_state"] == "Andhra Pradesh"
    assert "timestamp" in data

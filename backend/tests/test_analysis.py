import os
import uuid
import pandas as pd
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.dataset import Dataset
from app.services.storage import storage_service

def test_get_dataset_analysis_summary(client: TestClient):
    # 1. Upload a dummy CSV file via API
    csv_content = (
        "id,name,age,salary,department\n"
        "1,Alice,30,70000.0,Engineering\n"
        "2,Bob,25,50000.0,Sales\n"
        "3,Charlie,,60000.0,Engineering\n"
        "4,David,35,80000.0,HR\n"
        "5,Eve,28,75000.0,Engineering\n"
    )
    
    upload_response = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("dummy.csv", csv_content.encode("utf-8"), "text/csv")}
    )
    assert upload_response.status_code == 201
    dataset_id = upload_response.json()["id"]

    # 3. Request analysis summary
    response = client.get(f"/api/v1/analysis/{dataset_id}/summary")
    assert response.status_code == 200, response.text
    
    data = response.json()
    assert data["dataset_id"] == str(dataset_id)
    assert data["row_count"] == 5
    assert data["col_count"] == 5
    assert data["duplicate_rows"] == 0
    
    # Missing values check
    assert "age" in data["missing_values"]
    assert data["missing_values"]["age"]["count"] == 1
    
    # Numerical stats check
    assert "salary" in data["numerical_stats"]
    assert data["numerical_stats"]["salary"]["count"] == 5.0
    assert data["numerical_stats"]["salary"]["mean"] == 67000.0
    
    # Categorical stats check
    assert "department" in data["categorical_stats"]
    assert data["categorical_stats"]["department"]["unique_count"] == 3
    assert data["categorical_stats"]["department"]["top_values"]["Engineering"] == 3
    
    # 4. Cleanup via API
    client.delete(f"/api/v1/datasets/{dataset_id}")

def test_get_analysis_not_found(client: TestClient):
    random_id = uuid.uuid4()
    response = client.get(f"/api/v1/analysis/{random_id}/summary")
    assert response.status_code == 404

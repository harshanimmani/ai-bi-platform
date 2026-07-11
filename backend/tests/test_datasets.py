import io
from pathlib import Path
from app.models.dataset import Dataset

def test_upload_dataset_success(client):
    """
    Test uploading a valid CSV file successfully.
    """
    csv_data = "Name,Age,Salary\nAlice,30,85000\nBob,25,60000\nCharlie,35,105000"
    file_bytes = csv_data.encode("utf-8")
    
    response = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("test_employees.csv", io.BytesIO(file_bytes), "text/csv")}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "test_employees.csv"
    assert data["row_count"] == 3
    assert data["col_count"] == 3
    assert "Name" in data["columns_metadata"]
    assert "Age" in data["columns_metadata"]
    assert "Salary" in data["columns_metadata"]
    assert data["storage_path"].startswith("storage\\uploads") or data["storage_path"].startswith("storage/uploads")

    # Verify file exists on local system
    storage_path = Path(data["storage_path"])
    assert storage_path.exists()
    
    # Cleanup file manually if test ends
    storage_path.unlink()
    if storage_path.parent.exists() and storage_path.parent != Path("storage/uploads"):
        storage_path.parent.rmdir()

def test_upload_dataset_invalid_extension(client):
    """
    Test uploading an unsupported file format.
    """
    response = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("test.png", b"fake_png_data", "image/png")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]

def test_dataset_lifecycle_list_retrieve_delete(client):
    """
    Test uploading a file and then running list, fetch data, and delete workflows.
    """
    csv_data = "Date,Sales\n2026-01-01,150.5\n2026-01-02,230.0"
    file_bytes = csv_data.encode("utf-8")
    
    # 1. Upload
    upload_response = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("sales_data.csv", io.BytesIO(file_bytes), "text/csv")}
    )
    assert upload_response.status_code == 201
    dataset = upload_response.json()
    dataset_id = dataset["id"]
    storage_path = Path(dataset["storage_path"])
    assert storage_path.exists()

    # 2. List
    list_response = client.get("/api/v1/datasets/")
    assert list_response.status_code == 200
    dataset_ids = [d["id"] for d in list_response.json()]
    assert dataset_id in dataset_ids

    # 3. Retrieve Metadata
    get_response = client.get(f"/api/v1/datasets/{dataset_id}")
    assert get_response.status_code == 200
    assert get_response.json()["filename"] == "sales_data.csv"

    # 4. Retrieve Raw Data Rows
    data_response = client.get(f"/api/v1/datasets/{dataset_id}/data?limit=5")
    assert data_response.status_code == 200
    records = data_response.json()
    assert len(records) == 2
    assert records[0]["Date"] == "2026-01-01"
    assert float(records[0]["Sales"]) == 150.5

    # 5. Delete
    delete_response = client.delete(f"/api/v1/datasets/{dataset_id}")
    assert delete_response.status_code == 204
    
    # Assert database record no longer exists
    get_after_delete = client.get(f"/api/v1/datasets/{dataset_id}")
    assert get_after_delete.status_code == 404
    
    # Assert file was deleted from local disk
    assert not storage_path.exists()

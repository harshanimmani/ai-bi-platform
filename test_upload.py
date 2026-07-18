import httpx
import sys
import json

base_url = "http://localhost:8000/api/v1/datasets"

# 1. Upload the file
print("Uploading final.csv...")
with open("final.csv", "rb") as f:
    files = {"file": ("final.csv", f, "text/csv")}
    response = httpx.post(f"{base_url}/upload", files=files)
    
if response.status_code != 201:
    print(f"Failed to upload! Status: {response.status_code}")
    print(response.text)
    sys.exit(1)

dataset = response.json()
print("Successfully uploaded. Response:")
print(json.dumps(dataset, indent=2))

# 2. Verify it appears in the list
print("\nFetching datasets list...")
list_response = httpx.get(f"{base_url}/")
if list_response.status_code != 200:
    print(f"Failed to fetch list! Status: {list_response.status_code}")
    print(list_response.text)
    sys.exit(1)

datasets = list_response.json()
print(f"Total datasets found: {len(datasets)}")
found = False
for d in datasets:
    if d["id"] == dataset["id"]:
        found = True
        break

if not found:
    print("Dataset did not appear in the Data Hub list!")
    sys.exit(1)

print("SUCCESS: Dataset was saved and appears in the Data Hub.")

dataset_id = dataset["id"]

api_url = "http://localhost:8000/api/v1"

# 3. Test /summary
print("\nFetching dataset summary...")
summary_res = httpx.get(f"{api_url}/analysis/{dataset_id}/summary")
if summary_res.status_code != 200:
    print(f"Failed to fetch summary! Status: {summary_res.status_code}")
    print(summary_res.text)
    sys.exit(1)
print("SUCCESS: Summary retrieved.")

# 4. Test /preview
print("\nFetching dataset preview...")
preview_res = httpx.get(f"{api_url}/analysis/{dataset_id}/preview?page=1&limit=5")
if preview_res.status_code != 200:
    print(f"Failed to fetch preview! Status: {preview_res.status_code}")
    sys.exit(1)
print(f"SUCCESS: Preview retrieved ({preview_res.json()['total_rows']} total rows).")

# 5. Test /query
print("\nFetching chart query data...")
query_payload = {
    "x_axis": "department",
    "y_axis": "revenue",
    "chart_type": "bar",
    "agg_func": "sum"
}
query_res = httpx.post(f"{api_url}/analysis/{dataset_id}/query", json=query_payload)
if query_res.status_code != 200:
    print(f"Failed to fetch query! Status: {query_res.status_code}")
    print(query_res.text)
    sys.exit(1)
print(f"SUCCESS: Chart Query retrieved (Labels: {query_res.json()['labels']}).")
print("\nALL MODULE 7 ENDPOINTS VERIFIED SUCCESSFULLY!")

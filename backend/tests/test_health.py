def test_health_check(client):
    """
    Test that the health check endpoint returns 200 OK and valid JSON data.
    """
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "healthy"
    assert "environment" in data
    assert "project_name" in data
    assert "debug" in data
    assert "version" in data

def test_root_redirect(client):
    """
    Test that the root endpoint redirects to the docs page.
    """
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/docs"

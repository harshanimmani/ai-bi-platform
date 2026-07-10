from app.models.user import User

def test_database_health_endpoint(client):
    """
    Test that the database health check endpoint returns 200 OK
    and reports connected status.
    """
    response = client.get("/api/v1/database/health")
    assert response.status_code == 200
    
    data = response.json()
    assert data["database"] == "connected"
    assert data["status"] == "healthy"

def test_create_and_read_user(db_session):
    """
    Test that we can create a user in the database and retrieve it using the ORM.
    """
    # Create user
    new_user = User(
        email="test@example.com",
        full_name="Test User",
        password_hash="hashed_password_123"
    )
    db_session.add(new_user)
    db_session.commit()
    db_session.refresh(new_user)
    
    assert new_user.id is not None
    assert new_user.email == "test@example.com"
    assert new_user.full_name == "Test User"
    
    # Read user
    db_user = db_session.query(User).filter(User.email == "test@example.com").first()
    assert db_user is not None
    assert db_user.id == new_user.id

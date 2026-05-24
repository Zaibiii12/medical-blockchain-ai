from fastapi.testclient import TestClient
from app.main import app 

client = TestClient(app)

def test_health_check():
    """Proves the backend server is running."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_chat_endpoint_missing_data():
    """
    QA NEGATIVE TEST: Proves the API validates incoming data.
    If a user forgets the 'ipfs_hash', the API should block it.
    """
    # Payload is missing the required 'ipfs_hash'
    bad_payload = {
        "question": "What is my diagnosis?"
    }
    
    response = client.post("/chat", json=bad_payload)
    
    # 422 is the standard HTTP code for 'Unprocessable Entity' (Validation Error)
    assert response.status_code == 422 
    
    # Verify the error message specifically mentions the missing 'ipfs_hash'
    error_details = response.json()["detail"][0]
    assert error_details["loc"] == ["body", "ipfs_hash"]
    assert error_details["type"] == "missing"
from app.core.token import create_access_token

# Helper function
def get_auth_headers(user_id):
    token = create_access_token({
        "sub": str(user_id),
        "role": "rider"
    })

    return {
        "Authorization": f"Bearer {token}"
    }


# Test cases start here

    # Your existing test code


def test_create_user(client):

    user_data = {
        "name": "Rahul",
        "email": "rahul@gmail.com",
        "phone": "9876543210",
        "role": "rider",
        "age": 26
    }

    response = client.post("/users/", json=user_data)

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Rahul"
    assert data["email"] == "rahul@gmail.com"
    assert data["phone"] == "9876543210"
    assert data["role"] == "rider"
    assert data["age"] == 26
    assert "id" in data



def test_get_user(client):
    create_response = client.post("/users/", json={
        "name": "Rahul",
        "email": "rahul@gmail.com",
        "phone": "9876543210",
        "role": "rider",
        "age": 26
    })

    user_id = create_response.json()["id"]

    response = client.get(
    f"/users/{user_id}",
    headers=get_auth_headers(user_id)
)

    assert response.status_code == 200
    assert response.json()["name"] == "Rahul"


def test_update_user(client):
    create_response = client.post("/users/", json={
        "name": "Rahul",
        "email": "rahul@gmail.com",
        "phone": "9876543210",
        "role": "rider",
        "age": 26
    })

    user_id = create_response.json()["id"]

    response = client.put(
        f"/users/{user_id}",
        json={"name": "Rahul Sharma"}
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Rahul Sharma"


def test_delete_user(client):
    create_response = client.post("/users/", json={
        "name": "Rahul",
        "email": "rahul@gmail.com",
        "phone": "9876543210",
        "role": "rider",
        "age": 26
    })

    user_id = create_response.json()["id"]

    response = client.delete(f"/users/{user_id}")

    assert response.status_code == 200
    assert response.json()["message"] == "User deleted successfully"

    get_response = client.get(
    f"/users/{user_id}",
    headers=get_auth_headers(user_id)
)
    assert get_response.status_code == 401



def test_duplicate_email(client):
    user_data = {
        "name": "Rahul",
        "email": "rahul@gmail.com",
        "phone": "9876543210",
        "role": "rider",
        "age": 26
    }

    client.post("/users/", json=user_data)
    response = client.post("/users/", json=user_data)

    assert response.status_code == 409
    assert response.json()["detail"] == "Email already registered"


def test_get_nonexistent_user(client):

    create_response = client.post("/users/", json={
        "name": "Rahul",
        "email": "rahul@gmail.com",
        "phone": "9876543210",
        "role": "rider",
        "age": 26
    })

    user_id = create_response.json()["id"]

    response = client.get(
        "/users/9999",
        headers=get_auth_headers(user_id)
    )

    assert response.status_code == 404


def test_update_nonexistent_user(client):
    response = client.put(
        "/users/9999",
        json={"name": "Updated User"}
    )

    assert response.status_code == 404


def test_delete_nonexistent_user(client):
    response = client.delete("/users/9999")

    assert response.status_code == 404


def test_duplicate_phone(client):
    first_user = {
        "name": "Rahul",
        "email": "rahul@gmail.com",
        "phone": "9876543210",
        "role": "rider",
        "age": 26   
    }

    second_user = {
        "name": "Amit",
        "email": "amit@gmail.com",
        "phone": "9876543210",
        "role": "driver",
        "age": 28
    }

    client.post("/users/", json=first_user)
    response = client.post("/users/", json=second_user)

    assert response.status_code == 409
    assert response.json()["detail"] == "Phone number already registered"


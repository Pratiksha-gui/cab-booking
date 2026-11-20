
import pytest

from app.models.user import User
from app.core.security import hash_password
from app.core.token import create_access_token


@pytest.fixture
def rider_and_driver(client):
    from app.database import get_db

    db = next(client.app.dependency_overrides[get_db]())

    rider = User(
        name="Test Rider",
        email="rider_test@example.com",
        phone="9000000001",
        role="rider",
        password=hash_password("RiderPass123")
    )

    driver = User(
        name="Test Driver",
        email="driver_test@example.com",
        phone="9000000002",
        role="driver",
        password=hash_password("DriverPass123")
    )

    db.add_all([rider, driver])
    db.commit()

    db.refresh(rider)
    db.refresh(driver)

    rider_token = create_access_token({
        "sub": str(rider.id),
        "role": "rider"
    })

    driver_token = create_access_token({
        "sub": str(driver.id),
        "role": "driver"
    })

    db.close()

    return {
        "rider_id": rider.id,
        "driver_id": driver.id,
        "rider_headers": {
            "Authorization": f"Bearer {rider_token}"
        },
        "driver_headers": {
            "Authorization": f"Bearer {driver_token}"
        }
    }


@pytest.fixture
def ride_payload():
    return {
        "pickup_location": "Pickup Point",
        "drop_location": "Drop Point",
        "pickup_latitude": 12.9716,
        "pickup_longitude": 77.5946,
        "drop_latitude": 12.9352,
        "drop_longitude": 77.6245
    }


def test_create_ride(client, rider_and_driver, ride_payload):
    response = client.post(
        "/rides/",
        json=ride_payload,
        headers=rider_and_driver["rider_headers"]
    )

    assert response.status_code == 201
    assert response.json()["rider_id"] == rider_and_driver["rider_id"]
    assert response.json()["status"] == "requested"


def test_driver_accept_ride(client, rider_and_driver, ride_payload):
    # Rider creates a ride
    create_response = client.post(
        "/rides/",
        json=ride_payload,
        headers=rider_and_driver["rider_headers"]
    )

    ride_id = create_response.json()["id"]

    # Driver accepts the ride
    response = client.post(
        f"/rides/{ride_id}/accept",
        headers=rider_and_driver["driver_headers"]
    )

    assert response.status_code == 200
    assert response.json()["driver_id"] == rider_and_driver["driver_id"]
    assert response.json()["status"] == "accepted"



def test_driver_start_ride(client, rider_and_driver, ride_payload):
    # Rider creates a ride
    create_response = client.post(
        "/rides/",
        json=ride_payload,
        headers=rider_and_driver["rider_headers"]
    )

    ride_id = create_response.json()["id"]

    # Driver accepts the ride
    client.post(
        f"/rides/{ride_id}/accept",
        headers=rider_and_driver["driver_headers"]
    )

    # Driver starts the ride
    response = client.post(
        f"/rides/{ride_id}/start",
        headers=rider_and_driver["driver_headers"]
    )

    assert response.status_code == 200
    assert response.json()["driver_id"] == rider_and_driver["driver_id"]
    assert response.json()["status"] == "started"


def test_driver_complete_ride(client, rider_and_driver, ride_payload):
    # Rider creates a ride
    create_response = client.post(
        "/rides/",
        json=ride_payload,
        headers=rider_and_driver["rider_headers"]
    )

    ride_id = create_response.json()["id"]

    # Driver accepts the ride
    client.post(
        f"/rides/{ride_id}/accept",
        headers=rider_and_driver["driver_headers"]
    )

    # Driver starts the ride
    client.post(
        f"/rides/{ride_id}/start",
        headers=rider_and_driver["driver_headers"]
    )

    # Driver completes the ride
    response = client.post(
        f"/rides/{ride_id}/complete",
        headers=rider_and_driver["driver_headers"]
    )

    assert response.status_code == 200
    assert response.json()["driver_id"] == rider_and_driver["driver_id"]
    assert response.json()["status"] == "completed"


def test_rider_ride_history(client, rider_and_driver, ride_payload):
    # Rider creates a ride
    create_response = client.post(
        "/rides/",
        json=ride_payload,
        headers=rider_and_driver["rider_headers"]
    )

    ride_id = create_response.json()["id"]

    # Rider retrieves ride history
    response = client.get(
        "/rides/",
        headers=rider_and_driver["rider_headers"]
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == ride_id
    assert response.json()[0]["rider_id"] == rider_and_driver["rider_id"]


def test_driver_ride_history(client, rider_and_driver, ride_payload):
    # Rider creates a ride
    create_response = client.post(
        "/rides/",
        json=ride_payload,
        headers=rider_and_driver["rider_headers"]
    )

    ride_id = create_response.json()["id"]

    # Driver accepts the ride
    client.post(
        f"/rides/{ride_id}/accept",
        headers=rider_and_driver["driver_headers"]
    )

    # Driver retrieves ride history
    response = client.get(
        "/rides/",
        headers=rider_and_driver["driver_headers"]
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == ride_id
    assert response.json()[0]["driver_id"] == rider_and_driver["driver_id"]


def test_rider_cannot_accept_ride(client, rider_and_driver, ride_payload):
    # Rider creates a ride
    create_response = client.post(
        "/rides/",
        json=ride_payload,
        headers=rider_and_driver["rider_headers"]
    )

    ride_id = create_response.json()["id"]

    # Rider attempts to accept their own ride
    response = client.post(
        f"/rides/{ride_id}/accept",
        headers=rider_and_driver["rider_headers"]
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "You do not have permission to perform this action"


def test_other_driver_cannot_start_ride(client, rider_and_driver, ride_payload):
    from app.models.user import User
    from app.core.security import hash_password
    from app.core.token import create_access_token

    # Rider creates a ride
    create_response = client.post(
        "/rides/",
        json=ride_payload,
        headers=rider_and_driver["rider_headers"]
    )

    ride_id = create_response.json()["id"]

    # Assigned driver accepts the ride
    client.post(
        f"/rides/{ride_id}/accept",
        headers=rider_and_driver["driver_headers"]
    )

    # Create another driver
    from app.database import get_db
    db = next(client.app.dependency_overrides[get_db]())

    other_driver = User(
        name="Other Driver",
        email="other_driver@example.com",
        phone="9000000003",
        role="driver",
        password=hash_password("DriverPass123")
    )

    db.add(other_driver)
    db.commit()
    db.refresh(other_driver)

    other_driver_token = create_access_token({
        "sub": str(other_driver.id),
        "role": "driver"
    })

    db.close()

    # Another driver attempts to start the ride
    response = client.post(
        f"/rides/{ride_id}/start",
        headers={
            "Authorization": f"Bearer {other_driver_token}"
        }
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Ride cannot be started"

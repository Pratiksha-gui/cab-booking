
import math

BASE_FARE = 50.0
RATE_PER_KM = 15.0


def calculate_distance(
    pickup_latitude: float,
    pickup_longitude: float,
    drop_latitude: float,
    drop_longitude: float
) -> float:

    earth_radius_km = 6371.0

    lat1 = math.radians(pickup_latitude)
    lat2 = math.radians(drop_latitude)

    lat_difference = math.radians(drop_latitude - pickup_latitude)
    lon_difference = math.radians(drop_longitude - pickup_longitude)

    a = (
        math.sin(lat_difference / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(lon_difference / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return round(earth_radius_km * c, 2)


def calculate_fare(distance_km: float) -> float:
    return round(BASE_FARE + (distance_km * RATE_PER_KM), 2)

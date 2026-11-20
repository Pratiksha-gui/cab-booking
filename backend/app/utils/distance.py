
import math


def calculate_distance_km(
    pickup_latitude: float,
    pickup_longitude: float,
    drop_latitude: float,
    drop_longitude: float,
) -> float:

    earth_radius_km = 6371.0

    lat1 = math.radians(pickup_latitude)
    lon1 = math.radians(pickup_longitude)

    lat2 = math.radians(drop_latitude)
    lon2 = math.radians(drop_longitude)

    delta_lat = lat2 - lat1
    delta_lon = lon2 - lon1

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(delta_lon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return round(earth_radius_km * c, 2)

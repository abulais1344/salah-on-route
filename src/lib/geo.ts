export interface GeoPoint {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(first: GeoPoint, second: GeoPoint) {
  const dLat = toRadians(second.latitude - first.latitude);
  const dLng = toRadians(second.longitude - first.longitude);
  const lat1 = toRadians(first.latitude);
  const lat2 = toRadians(second.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function distanceToPathKm(point: GeoPoint, path: GeoPoint[]) {
  if (path.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  if (path.length === 1) {
    return haversineDistanceKm(point, path[0]);
  }

  let shortest = Number.POSITIVE_INFINITY;

  for (let index = 0; index < path.length - 1; index += 1) {
    const segmentDistance = distanceToSegmentKm(point, path[index], path[index + 1]);
    shortest = Math.min(shortest, segmentDistance);
  }

  return shortest;
}

function distanceToSegmentKm(point: GeoPoint, start: GeoPoint, end: GeoPoint) {
  const originLat = (start.latitude + end.latitude + point.latitude) / 3;
  const startXY = projectPoint(start, originLat);
  const endXY = projectPoint(end, originLat);
  const pointXY = projectPoint(point, originLat);

  const dx = endXY.x - startXY.x;
  const dy = endXY.y - startXY.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(pointXY.x - startXY.x, pointXY.y - startXY.y);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((pointXY.x - startXY.x) * dx + (pointXY.y - startXY.y) * dy) /
        (dx * dx + dy * dy),
    ),
  );

  const projectedX = startXY.x + t * dx;
  const projectedY = startXY.y + t * dy;

  return Math.hypot(pointXY.x - projectedX, pointXY.y - projectedY);
}

function projectPoint(point: GeoPoint, originLatitude: number) {
  const x =
    EARTH_RADIUS_KM *
    toRadians(point.longitude) *
    Math.cos(toRadians(originLatitude));
  const y = EARTH_RADIUS_KM * toRadians(point.latitude);

  return { x, y };
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

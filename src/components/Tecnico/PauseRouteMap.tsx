'use client';

import styles from './PauseRouteMap.module.css';

export type PauseLocation = { latitude: number; longitude: number; recorded_at: string };

const MAP_WIDTH = 640;
const MAP_HEIGHT = 320;
const TILE_SIZE = 256;

function project(latitude: number, longitude: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const boundedLatitude = Math.max(-85.05112878, Math.min(85.05112878, latitude));
  const sinLatitude = Math.sin(boundedLatitude * Math.PI / 180);
  return {
    x: (longitude + 180) / 360 * scale,
    y: (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * scale,
  };
}

export default function PauseRouteMap({ points }: { points: PauseLocation[] }) {
  if (!points.length) return <p className={styles.empty}>O técnico ainda não enviou pontos do trajeto.</p>;

  const coordinates = points.map((point) => ({ point, projected: project(point.latitude, point.longitude, 18) }));
  const xValues = coordinates.map(({ projected }) => projected.x);
  const yValues = coordinates.map(({ projected }) => projected.y);
  const bounds = {
    minX: Math.min(...xValues), maxX: Math.max(...xValues),
    minY: Math.min(...yValues), maxY: Math.max(...yValues),
  };
  let zoom = 18;
  for (; zoom > 3; zoom -= 1) {
    const divisor = 2 ** (18 - zoom);
    if ((bounds.maxX - bounds.minX) / divisor <= MAP_WIDTH * 0.72
      && (bounds.maxY - bounds.minY) / divisor <= MAP_HEIGHT * 0.72) break;
  }
  const centerX = (bounds.minX + bounds.maxX) / 2 / 2 ** (18 - zoom);
  const centerY = (bounds.minY + bounds.maxY) / 2 / 2 ** (18 - zoom);
  const startTileX = Math.floor((centerX - MAP_WIDTH / 2) / TILE_SIZE);
  const startTileY = Math.floor((centerY - MAP_HEIGHT / 2) / TILE_SIZE);
  const columns = Math.ceil(MAP_WIDTH / TILE_SIZE) + 1;
  const rows = Math.ceil(MAP_HEIGHT / TILE_SIZE) + 1;
  const tileCount = 2 ** zoom;
  const tileBase = process.env.NEXT_PUBLIC_OSM_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tiles = Array.from({ length: rows * columns }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const tileX = startTileX + column;
    const tileY = startTileY + row;
    if (tileY < 0 || tileY >= tileCount) return null;
    const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
    return {
      key: `${zoom}-${wrappedX}-${tileY}`,
      href: tileBase.replace('{z}', String(zoom)).replace('{x}', String(wrappedX)).replace('{y}', String(tileY)),
      x: column * TILE_SIZE,
      y: row * TILE_SIZE,
    };
  }).filter((tile): tile is NonNullable<typeof tile> => tile !== null);
  const routePoints = coordinates.map(({ projected }) => {
    const divisor = 2 ** (18 - zoom);
    return {
      x: projected.x / divisor - startTileX * TILE_SIZE,
      y: projected.y / divisor - startTileY * TILE_SIZE,
    };
  });
  const route = routePoints.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <figure className={styles.figure}>
      <svg className={styles.map} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="img" aria-label={`Trajeto registrado com ${points.length} posições`}>
        {tiles.map((tile) => <image key={tile.key} href={tile.href} x={tile.x} y={tile.y} width={TILE_SIZE} height={TILE_SIZE} />)}
        {routePoints.length > 1 && <polyline className={styles.routeOutline} points={route} />}
        {routePoints.length > 1 && <polyline className={styles.routeLine} points={route} />}
        <circle className={styles.startPoint} cx={routePoints[0].x} cy={routePoints[0].y} r="7" />
        {routePoints.length > 1 && <circle className={styles.endPoint} cx={routePoints[routePoints.length - 1].x} cy={routePoints[routePoints.length - 1].y} r="7" />}
      </svg>
      <figcaption className={styles.caption}>
        <span>{points.length} posições registradas · {new Date(points[0].recorded_at).toLocaleString('pt-BR')} a {new Date(points[points.length - 1].recorded_at).toLocaleString('pt-BR')}</span>
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>
      </figcaption>
    </figure>
  );
}

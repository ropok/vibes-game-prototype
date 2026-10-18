export const WORLD = Object.freeze({ width: 3200, height: 2400 });
export const ROAD_X = [500, 1600, 2700];
export const ROAD_Y = [500, 1150, 1800, 2150];
export const DEPOT = Object.freeze({ x: 225, y: 2150, name: 'Pos Paket', building: { x: 110, y: 1980, w: 230, h: 130 } });
export const GARAGE = Object.freeze({ x: 875, y: 2150, name: 'Bengkel Siap Jalan', building: { x: 755, y: 1980, w: 240, h: 130 } });
const people = ['Bu Ratna', 'Pak Joko', 'Kak Nisa', 'Pak Budi', 'Bu Wati', 'Mas Arif', 'Bu Sari', 'Kak Dita', 'Pak Hasan', 'Bu Dewi', 'Mas Bayu', 'Bu Tini', 'Pak Agus', 'Kak Rani', 'Bu Yuni', 'Mas Dimas', 'Pak Eko', 'Bu Mira'];
const colors = [0xe97c68, 0xedd18a, 0x68aaa5, 0x91a9cd, 0xc58da5, 0xd89d65];
export const HOMES = ROAD_Y.slice(0, 3).flatMap((roadY, row) => [300, 850, 1300, 1900, 2350, 2900].map((x, col) => ({
  id: `rumah-${row * 6 + col + 1}`, name: people[row * 6 + col], district: ['Taman Teduh', 'Kampung Pelangi', 'Kebun Sore'][row],
  number: row * 6 + col + 1, x, y: roadY - 104, color: colors[(row + col) % colors.length],
  building: { x: x - 83, y: roadY - 252, w: 166, h: 128 },
})));
export const BUILDINGS = [...HOMES.map(home => home.building), DEPOT.building, GARAGE.building];
export const UPGRADE_KEYS = ['speed', 'income', 'helmet', 'jacket'];
export const UPGRADE_INFO = {
  speed: { name: 'Sepatu kilat', icon: '↗', description: '+12% kecepatan per level', color: '#eeac5d' },
  income: { name: 'Tas profesional', icon: '▣', description: '+15% upah per level', color: '#6eb8ac' },
  helmet: { name: 'Helm tangguh', icon: '◒', description: '−15% cedera per level', color: '#8da8d0' },
  jacket: { name: 'Jaket nyaman', icon: '✦', description: '+25 stamina per level', color: '#d994a6' },
};
export const TRAFFIC_ROUTE = [{ x: 500, y: 480 }, { x: 2720, y: 480 }, { x: 2720, y: 1820 }, { x: 500, y: 1820 }];
export const DELIVERY_ORDER = [12, 13, 14, 6, 7, 15, 8, 0, 1, 9, 16, 2, 10, 3, 17, 4, 11, 5];
export const INTERACT_RADIUS = 96;

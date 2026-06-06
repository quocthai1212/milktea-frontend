/** Tọa độ cửa hàng (geocode từ SHOP_ADDRESS trong backend .env) — dùng khi API tạm không phản hồi */
const SHOP_LAT = 10.7771962;
const SHOP_LON = 106.7001655;
const MAX_DELIVERY_KM = 10;
const FEE_PER_KM = 5000;

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function tinhPhiShipClient(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  const distance_km = Math.round(haversineKm(SHOP_LAT, SHOP_LON, lat, lon) * 100) / 100;
  const shipping_fee = Math.round(distance_km * FEE_PER_KM);
  return {
    distance_km,
    shipping_fee,
    fee_per_km: FEE_PER_KM,
    max_distance_km: MAX_DELIVERY_KM,
    within_range: distance_km <= MAX_DELIVERY_KM,
    fallback: true,
  };
}

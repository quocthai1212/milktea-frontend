import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, MapPin, LocateFixed, Search, Loader } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/khachhang/ModalDiaChiGiaoHang.css';

// Tích hợp thêm công cụ hiển thị Toast thông báo nhanh
import { toast, ToastContainer } from 'react-toastify';
// ✅ Đường dẫn chuẩn hóa rút gọn
import "react-toastify/dist/ReactToastify.css"; 
// Nếu dòng trên vẫn lỗi, hãy thử dòng dưới đây:
import 'react-toastify/ReactToastify.css';

// Khắc phục lỗi mất icon Marker mặc định của Leaflet khi build trong môi trường React
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';
const iconGhimMacDinh = new L.Icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Component bổ trợ 1: Điều khiển hiệu ứng camera bay (FlyTo) khi tọa độ state thay đổi
const DieuKhienBanDo = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0 && center[1] !== 0) {
      map.flyTo(center, 16, { animate: true, duration: 1.2 });
    }
  }, [center, map]);
  return null;
};

// Component bổ trợ 2: Lắng nghe sự kiện click chuột trực tiếp lên mặt bản đồ để lấy vị trí
const ThaoTacClickBanDo = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const ModalDiaChiGiaoHang = ({ isOpen, batBuoc, userId, onSuccess, onClose }) => {
  // Đặt tọa độ mặc định ban đầu tại trung tâm tỉnh (Ví dụ: Vĩnh Long)
  const [toaDo, setToaDo] = useState({ latitude: 10.2524, longitude: 105.9723 });
  const [diaChiChu, setDiaChiChu] = useState('');
  const [tuKhoaTimKiem, setTuKhoaTimKiem] = useState('');
  
  // Trạng thái giao diện và thông báo
  const [loadingGeocode, setLoadingGeocode] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const markerRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Định dạng mảng dùng cho thuộc tính center của Leaflet Map Container
  const viTriHienTaiMang = useMemo(() => {
    return [toaDo.latitude, toaDo.longitude];
  }, [toaDo]);

  // 1. Hàm dịch ngược từ Tọa độ GPS thành văn bản Địa chỉ (Reverse Geocoding)
  const dichToaDoRaDiaChiChu = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        setDiaChiChu(data.display_name);
      } else {
        setDiaChiChu(`Vị trí đã chọn (${lat.toFixed(5)}, ${lon.toFixed(5)})`);
      }
    } catch {
      setDiaChiChu(`Vị trí đã chọn (${lat.toFixed(5)}, ${lon.toFixed(5)})`);
    }
  };

  // Tự động dịch ngược vị trí mặc định ban đầu khi vừa mở Modal
  useEffect(() => {
    if (isOpen && !diaChiChu) {
      dichToaDoRaDiaChiChu(toaDo.latitude, toaDo.longitude);
    }
  }, [isOpen]);

  // 2. Xử lý khi khách hàng nhập chữ và ấn nút "Tìm kiếm địa điểm"
  const handleTimKiemDiaChi = async (e) => {
    if (e) e.preventDefault();
    if (!tuKhoaTimKiem.trim()) return;

    setLoadingGeocode(true);
    try {
      let textTimKiemChuan = tuKhoaTimKiem.trim();
      if (!textTimKiemChuan.toLowerCase().includes("việt nam") && !textTimKiemChuan.toLowerCase().includes("vn")) {
        textTimKiemChuan += ", Việt Nam";
      }

      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(textTimKiemChuan)}&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLon = parseFloat(data[0].lon);
        
        setToaDo({ latitude: newLat, longitude: newLon });
        setDiaChiChu(data[0].display_name);
        toast.info("Đã định vị địa điểm trên bản đồ!");
      } else {
        toast.warn("Không tìm thấy địa chỉ. Vui lòng nhập chi tiết hơn!");
      }
    } catch {
      toast.error("Lỗi kết nối dữ liệu bản đồ!");
    } finally {
      setLoadingGeocode(false);
    }
  };

  // 3. Xử lý khi khách hàng bấm trực tiếp vào một điểm trên bản đồ
  const handleMapClick = (lat, lon) => {
    setToaDo({ latitude: lat, longitude: lon });
    dichToaDoRaDiaChiChu(lat, lon);
  };

  // 4. Khối hàm xử lý khi nắm giữ ghim Marker kéo thả trên bản đồ
  const handleKeoGhimMarker = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const newPos = marker.getLatLng();
        setToaDo({ latitude: newPos.lat, longitude: newPos.lng });
        dichToaDoRaDiaChiChu(newPos.lat, newPos.lng);
      }
    },
  };

  // 5. Hàm lấy vị trí GPS hiện tại của thiết bị
  const handleLayDinhViThietBi = () => {
    if (!navigator.geolocation) {
      toast.error("Thiết bị hoặc trình duyệt không hỗ trợ định vị GPS!");
      return;
    }

    setLoadingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setToaDo({ latitude: lat, longitude: lon });
        await dichToaDoRaDiaChiChu(lat, lon);
        setLoadingGPS(false);
        toast.success("Đã tìm thấy vị trí GPS hiện tại của bạn!");
      },
      () => {
        toast.error("Không thể truy cập GPS thiết bị. Vui lòng tìm kiếm thủ công!");
        setLoadingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // 6. Gửi dữ liệu Tọa độ thực tế và Địa chỉ chữ lên Server để lưu vào Cơ sở dữ liệu
  const handleXacNhanLuuCSDL = async () => {
    if (!diaChiChu.trim()) {
      toast.warn("Địa chỉ giao hàng không được phép bỏ trống!");
      return;
    }

    if (!userId) {
      toast.error("Phiên làm việc hết hạn. Vui lòng đăng nhập lại!");
      return;
    }

    setLoadingSubmit(true);

    try {
      const payload = {
        user_id: userId,
        latitude: toaDo.latitude,
        longitude: toaDo.longitude,
        address_text: diaChiChu.trim(),
      };

      const response = await fetch(`${API_URL}/api/khachhang/dia-chi-giao-hang`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        const addr = data.shipping_address;
        
        // 🌟 Kích hoạt Toast thông báo thành công đẹp mắt
        toast.success("🎉 Cập nhật địa chỉ nhận hàng vào CSDL thành công!", {
          position: "top-right",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Đợi 1 giây chạy hiệu ứng toast xong rồi mới đóng modal và đẩy data ra ngoài
        setTimeout(() => {
          onSuccess({
            address_detail: addr?.address_detail || diaChiChu.trim(),
            latitude: addr?.gps_location?.latitude ?? toaDo.latitude,
            longitude: addr?.gps_location?.longitude ?? toaDo.longitude,
          });
        }, 1000);

      } else {
        toast.error(data.message || "Hệ thống từ chối lưu dữ liệu!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối API đến máy chủ Backend!");
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Container cấu hình hiển thị cho Toast */}
      <ToastContainer limit={3} style={{ zIndex: 99999 }} />

      <div className="mdc-overlay" onClick={!batBuoc ? onClose : undefined}>
        <div className="mdc-container" style={{ maxWidth: '680px', width: '92%', padding: '20px' }} onClick={(e) => e.stopPropagation()}>
          
          {!batBuoc && (
            <button type="button" className="mdc-close" onClick={onClose} aria-label="Đóng">
              <X size={20} />
            </button>
          )}

          <h2 className="mdc-title"><MapPin size={22} color="#4f46e5" /> Thiết lập địa chỉ nhận hàng</h2>
          <p className="mdc-subtitle">Tìm kiếm vị trí trên bản đồ hoặc click chọn điểm ghim chính xác để phục vụ tính phí ship.</p>

          {/* --- KHUNG Ô TÌM KIẾM ĐỊA DANH --- */}
          <form onSubmit={handleTimKiemDiaChi} style={{ display: 'flex', gap: '8px', marginBottom: '12px', marginTop: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Nhập số nhà, tên đường, phường hoặc quận cần tìm kiếm..."
                value={tuKhoaTimKiem}
                onChange={(e) => setTuKhoaTimKiem(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
              />
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            <button 
              type="submit" 
              disabled={loadingGeocode || !tuKhoaTimKiem.trim()} 
              style={{ padding: '0 16px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {loadingGeocode ? <Loader size={16} className="mdh-spin" /> : 'Tìm trên bản đồ'}
            </button>
          </form>

          {/* --- KHUNG HIỂN THỊ BẢN ĐỒ --- */}
          <div style={{ width: '100%', height: '260px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative', zIndex: 1 }}>
            <MapContainer center={viTriHienTaiMang} zoom={16} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker
                draggable={true}
                eventHandlers={handleKeoGhimMarker}
                position={viTriHienTaiMang}
                icon={iconGhimMacDinh}
                ref={markerRef}
              />
              <DieuKhienBanDo center={viTriHienTaiMang} />
              <ThaoTacClickBanDo onMapClick={handleMapClick} />
            </MapContainer>

            <button 
              type="button" 
              onClick={handleLayDinhViThietBi}
              disabled={loadingGPS}
              style={{ position: 'absolute', bottom: '16px', right: '16px', zIndex: 1000, padding: '8px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Định vị vị trí hiện tại của tôi"
            >
              {loadingGPS ? <Loader size={18} className="mdh-spin" color="#4f46e5" /> : <LocateFixed size={18} color="#4f46e5" />}
            </button>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '6px 0 12px 2px', fontStyle: 'italic' }}>
            * Mẹo nhỏ: Bạn có thể nhập ô tìm kiếm, bấm chuột trực tiếp lên bản đồ, hoặc kéo giữ Marker để tinh chỉnh vị trí hẻm nhà chuẩn xác.
          </p>

          {/* --- Ô HIỂN THỊ VÀ CHỈNH SỬA VĂN BẢN ĐỊA CHỈ CUỐI CÙNG --- */}
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="mdc-address-input" style={{ fontWeight: '600', fontSize: '0.88rem', color: '#334155', marginBottom: '4px', display: 'block' }}>
              Địa chỉ giao nhận chi tiết (Có thể chỉnh sửa):
            </label>
            <textarea
              id="mdc-address-input"
              value={diaChiChu}
              onChange={(e) => setDiaChiChu(e.target.value)}
              placeholder="Số nhà, ngách, tên ngõ đường, tên khu vực..."
              rows={2}
              className="mdc-textarea"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', lineHeight: '1.45', resize: 'none' }}
            />
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginTop: '4px', textAlign: 'right' }}>
              Tọa độ GPS đồng bộ: {toaDo.latitude.toFixed(6)}, {toaDo.longitude.toFixed(6)}
            </span>
          </div>

          {/* NÚT THỰC THI GỬI LÊN BACKEND LƯU CƠ SỞ DỮ LIỆU */}
          <button
            type="button"
            className="mdc-btn-confirm"
            onClick={handleXacNhanLuuCSDL}
            disabled={loadingSubmit || loadingGeocode || !diaChiChu.trim()}
            style={{ width: '100%', padding: '12px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', transition: 'background-color 0.2s' }}
          >
            {loadingSubmit ? 'Đang cập nhật dữ liệu CSDL...' : 'Xác nhận và lưu địa chỉ giao hàng'}
          </button>

        </div>
      </div>
    </>
  );
};

export default ModalDiaChiGiaoHang;
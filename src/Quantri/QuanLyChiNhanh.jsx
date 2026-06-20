import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/quantri/QuanLyChiNhanh.css'; 

// Tích hợp Toast chuyên nghiệp
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Fix lỗi hiển thị icon ghim Marker Leaflet
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';
const iconGhimMacDinh = new L.Icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const API_URL = import.meta.env.VITE_API_URL;

// Component phụ trợ điều khiển hiệu ứng bay camera bản đồ
const DieuKhienBanDo = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0 && center[1] !== 0) {
      map.flyTo(center, 16, { animate: true, duration: 1.2 });
    }
  }, [center, map]);
  return null;
};

// Component phụ trợ bắt sự kiện click mặt bản đồ
const ThaoTacClickBanDo = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export default function QuanLyChiNhanh() {
  const [danhSachCN, setDanhSachCN] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingGeocode, setLoadingGeocode] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // view | add | edit
  const [selectedBranch, setSelectedBranch] = useState(null);

  const [moXoaModal, setMoXoaModal] = useState(false);
  const [cnCanXoa, setCnCanXoa] = useState(null);

  // Khởi tạo State Tọa độ chi nhánh (Mặc định ở Vĩnh Long)
  const [toaDo, setToaDo] = useState({ latitude: 10.2524, longitude: 105.9723 });
  const markerRef = useRef(null);

  const viTriHienTaiMang = useMemo(() => [toaDo.latitude, toaDo.longitude], [toaDo]);

  // Khởi tạo cấu trúc formData đồng bộ
  const [formData, setFormData] = useState({
    branch_name: '',
    shop_address: '',
    shipping_fee_per_km: 5000,
    max_delivery_km: 20,
    is_active: true
  });

  // ==================== HÀM DỊCH TỌA ĐỘ RA VĂN BẢN (REVERSE GEOCODING) ====================
  const dichToaDoRaDiaChiChu = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        setFormData(prev => ({ ...prev, shop_address: data.display_name }));
      }
    } catch {
      console.warn("Không dịch ngược được vị trí ký tự.");
    }
  };

  // Tìm kiếm địa điểm bằng từ khóa chữ khi click nút kính lúp/bấm Enter ngoài ô địa chỉ
  const handleTimViTriBanDo = async (e) => {
    if (e) e.preventDefault();
    if (!formData.shop_address.trim()) {
      toast.warn("Vui lòng nhập địa chỉ vào ô text trước khi tìm!");
      return;
    }

    setLoadingGeocode(true);
    try {
      let textTimKiemChuan = formData.shop_address.trim();
      if (!textTimKiemChuan.toLowerCase().includes("việt nam")) {
        textTimKiemChuan += ", Việt Nam";
      }

      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(textTimKiemChuan)}&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLon = parseFloat(data[0].lon);
        setToaDo({ latitude: newLat, longitude: newLon });
        setFormData(prev => ({ ...prev, shop_address: data[0].display_name }));
        toast.info("Đã cập nhật vị trí ghim chi nhánh trên bản đồ!");
      } else {
        toast.warn("Không xác định được tọa độ địa chỉ này. Hãy thử nhập chi tiết hơn!");
      }
    } catch {
      toast.error("Lỗi đồng bộ dữ liệu bản đồ!");
    } finally {
      setLoadingGeocode(false);
    }
  };

  const handleMapClick = (lat, lon) => {
    setToaDo({ latitude: lat, longitude: lon });
    dichToaDoRaDiaChiChu(lat, lon);
  };

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

  // ==================== 1. FETCH DANH SÁCH CHI NHÁNH ====================
  const fetchChiNhanh = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/quantri/qt_chinhanh/all`);
      const result = await response.json();
      
      if (result.success) {
        setDanhSachCN(result.data);
      } else {
        toast.error(result.message || 'Không thể lấy danh sách chi nhánh');
      }
    } catch (error) {
      toast.error('Không thể kết nối đến máy chủ Backend!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChiNhanh();
  }, []);

  // ==================== 2. XỬ LÝ MỞ FORM (XEM/THÊM/SỬA) ====================
  const xuLyMoForm = (mode, branch = null) => {
    setModalMode(mode);
    setSelectedBranch(branch);
    if (branch) {
      setFormData({
        branch_name: branch.branch_name || '',
        shop_address: branch.shop_address || '',
        shipping_fee_per_km: branch.shipping_fee_per_km !== undefined ? branch.shipping_fee_per_km : 5000,
        max_delivery_km: branch.max_delivery_km !== undefined ? branch.max_delivery_km : 20,
        is_active: branch.is_active !== undefined ? branch.is_active : true
      });
      // Nếu có sẵn tọa độ từ backend, nạp vào bản đồ (Nếu không có, lấy mặc định)
      if (branch.latitude && branch.longitude) {
        setToaDo({ latitude: branch.latitude, longitude: branch.longitude });
      } else if (branch.gps_location?.latitude) {
        setToaDo({ latitude: branch.gps_location.latitude, longitude: branch.gps_location.longitude });
      } else {
        setToaDo({ latitude: 10.2524, longitude: 105.9723 });
      }
    } else {
      setFormData({ branch_name: '', shop_address: '', shipping_fee_per_km: 5000, max_delivery_km: 20, is_active: true });
      setToaDo({ latitude: 10.2524, longitude: 105.9723 });
    }
    setIsModalOpen(true);
  };

  // ==================== 3. THÊM HOẶC CẬP NHẬT CHI NHÁNH ====================
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      let url = `${API_URL}/api/quantri/qt_chinhanh/add`;
      let method = 'POST';

      if (modalMode === 'edit' && selectedBranch) {
        url = `${API_URL}/api/quantri/qt_chinhanh/update/${selectedBranch._id}`;
        method = 'PUT';
      }

      // Đính kèm luôn tọa độ vào body gửi lên Backend
      const bodyPayload = {
        ...formData,
        latitude: toaDo.latitude,
        longitude: toaDo.longitude
      };

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message || 'Cập nhật dữ liệu thành công!');
        setIsModalOpen(false);
        fetchChiNhanh(); 
      } else {
        toast.error(result.message || 'Thao tác thất bại!');
      }
    } catch (error) {
      toast.error('Lỗi kết nối mạng đến máy chủ!');
    }
  };

  // ==================== 4. XỬ LÝ XÓA CHI NHÁNH ====================
  const kichHoatHoiXoa = (id, name) => {
    setCnCanXoa({ id, name });
    setMoXoaModal(true);
  };

  const handleXacNhanXoaChinhThuc = async () => {
    if (!cnCanXoa) return;
    try {
      const response = await fetch(`${API_URL}/api/quantri/qt_chinhanh/delete/${cnCanXoa.id}`, { 
        method: 'DELETE' 
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || 'Đã xóa chi nhánh.');
        setDanhSachCN(danhSachCN.filter(item => item._id !== cnCanXoa.id));
      } else {
        toast.error(result.message || 'Xóa chi nhánh thất bại!');
      }
    } catch (error) {
      toast.error('Không thể kết nối máy chủ!');
    } finally {
      setMoXoaModal(false);
      setCnCanXoa(null);
    }
  };

  return (
    <div className="qtcn-container" style={{ position: 'relative' }}>
      
      {/* Container Toast nổi ở tầng cao nhất */}
      <ToastContainer limit={3} style={{ zIndex: 99999 }} />
      
      <h2 className="qtcn-main-title">🏢 HỆ THỐNG QUẢN LÝ CHI NHÁNH</h2>
      
      <div className="qtcn-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>📋 DANH SÁCH CHI NHÁNH ({loading ? '...' : danhSachCN.length} cơ sở)</h3>
        <button onClick={() => xuLyMoForm('add')} className="qtcn-btn-add-new" style={{ padding: '10px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          ➕ Thêm Chi Nhánh Mới
        </button>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="qtcn-table-card">
        <table className="qtcn-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Tên chi nhánh</th>
              <th style={{ padding: '12px' }}>Địa chỉ</th>
              <th style={{ padding: '12px' }}>Phí ship / km</th>
              <th style={{ padding: '12px' }}>Khoảng cách tối đa</th>
              <th style={{ padding: '12px' }}>Trạng thái</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  🔄 Đang quét danh sách chi nhánh...
                </td>
              </tr>
            ) : danhSachCN.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  Chưa có chi nhánh nào trong cơ sở dữ liệu.
                </td>
              </tr>
            ) : (
              danhSachCN.map((cn) => (
                <tr key={cn._id} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{cn.branch_name}</td>
                  <td style={{ padding: '12px' }}>{cn.shop_address}</td>
                  <td style={{ padding: '12px' }}>{cn.shipping_fee_per_km?.toLocaleString('vi-VN')} đ</td>
                  <td style={{ padding: '12px' }}>{cn.max_delivery_km} km</td>
                  <td style={{ padding: '12px' }}>
                    {cn.is_active !== false ? '🟢 Hoạt động' : '🔴 Ngưng hoạt động'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={() => xuLyMoForm('view', cn)} style={{ background: '#e2e8f0', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>🔍 Chi tiết</button>
                      <button onClick={() => xuLyMoForm('edit', cn)} style={{ background: '#fef3c7', color: '#d97706', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>✏️ Sửa</button>
                      <button onClick={() => kichHoatHoiXoa(cn._id, cn.branch_name)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>🗑️ Xóa</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- CỬA SỔ POPUP XEM/THÊM/SỬA --- */}
      {isModalOpen && (
        <div className="qtcn-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999, overflowY: 'auto', padding: '20px 0' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', maxWidth: '580px', width: '92%', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <span onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '24px', cursor: 'pointer', zIndex: 10 }}>&times;</span>
            
            {/* Chế độ Xem */}
            {modalMode === 'view' && selectedBranch && (
              <div>
                <h3 style={{ color: '#2563eb', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>🏢 Thông Tin Chi Nhánh Chi Tiết</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '20px 0' }}>
                  <p><strong>Tên chi nhánh:</strong> {selectedBranch.branch_name}</p>
                  <p><strong>Địa chỉ cơ sở:</strong> {selectedBranch.shop_address}</p>
                  <p><strong>Phí giao hàng/km:</strong> {selectedBranch.shipping_fee_per_km?.toLocaleString('vi-VN')} đ</p>
                  <p><strong>Khoảng cách phục vụ tối đa:</strong> {selectedBranch.max_delivery_km} km</p>
                  <p><strong>Trạng thái:</strong> {selectedBranch.is_active !== false ? '🟢 Đang hoạt động' : '🔴 Đang tạm dừng'}</p>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    <strong>Tọa độ GPS:</strong> {toaDo.latitude.toFixed(6)}, {toaDo.longitude.toFixed(6)}
                  </p>
                </div>
                
                {/* Bản đồ tĩnh chế độ chỉ xem */}
                <div style={{ width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', marginBottom: '15px' }}>
                  <MapContainer center={viTriHienTaiMang} zoom={16} style={{ width: '100%', height: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={viTriHienTaiMang} icon={iconGhimMacDinh} />
                  </MapContainer>
                </div>

                <button onClick={() => setIsModalOpen(false)} style={{ width: '100%', padding: '10px', background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Đóng lại</button>
              </div>
            )}

            {/* Chế độ Thêm / Sửa */}
            {(modalMode === 'add' || modalMode === 'edit') && (
              <form onSubmit={handleSubmitForm}>
                <h3 style={{ color: '#059669', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                  {modalMode === 'add' ? '➕ Thêm Chi Nhánh Mới' : '✏️ Cập Nhật Chi Nhánh'}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Tên chi nhánh:</label>
                    <input type="text" required value={formData.branch_name} onChange={(e) => setFormData({...formData, branch_name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="Ví dụ: Chi nhánh Trung Tâm" />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Địa chỉ (Nhập chữ hoặc chọn trên bản đồ):</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input type="text" required value={formData.shop_address} onChange={(e) => setFormData({...formData, shop_address: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="Số nhà, tên đường, khu vực..." />
                      <button type="button" onClick={handleTimViTriBanDo} disabled={loadingGeocode} style={{ padding: '0 12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        {loadingGeocode ? '...' : 'Định vị'}
                      </button>
                    </div>
                  </div>

                  {/* BẢN ĐỒ TƯƠNG TÁC CHỌN VỊ TRÍ CHI NHÁNH */}
                  <div style={{ width: '100%', height: '220px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative' }}>
                    <MapContainer center={viTriHienTaiMang} zoom={15} style={{ width: '100%', height: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right', display: 'block', marginTop: '-6px' }}>
                    Tọa độ GPS chi nhánh: {toaDo.latitude.toFixed(6)}, {toaDo.longitude.toFixed(6)}
                  </span>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Phí ship/km (đ):</label>
                      <input type="number" required value={formData.shipping_fee_per_km} onChange={(e) => setFormData({...formData, shipping_fee_per_km: Number(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Giao tối đa (km):</label>
                      <input type="number" required value={formData.max_delivery_km} onChange={(e) => setFormData({...formData, max_delivery_km: Number(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>

                  {modalMode === 'edit' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                      <input type="checkbox" id="is_active_cn" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} />
                      <label htmlFor="is_active_cn" style={{ fontWeight: '600', cursor: 'pointer' }}>Kích hoạt hoạt động cơ sở</label>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 16px', background: '#cbd5e1', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Hủy bỏ</button>
                  <button type="submit" style={{ padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Lưu thông tin</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- CỬA SỔ XÁC NHẬN XÓA --- */}
      {moXoaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', maxWidth: '450px', width: '100%' }}>
            <h3 style={{ color: '#ef4444', margin: '0 0 12px 0' }}>⚠️ XÁC NHẬN XÓA CHI NHÁNH</h3>
            <p style={{ color: '#475569', lineHeight: '1.5', marginBottom: '20px' }}>
              Bạn có chắc chắn muốn xóa chi nhánh <strong style={{ color: '#ef4444' }}>{cnCanXoa?.name}</strong> khỏi hệ thống? Hành động này không thể phục hồi!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setMoXoaModal(false); setCnCanXoa(null); }} style={{ padding: '8px 16px', background: '#cbd5e1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Hủy</button>
              <button onClick={handleXacNhanXoaChinhThuc} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Vẫn Xóa</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
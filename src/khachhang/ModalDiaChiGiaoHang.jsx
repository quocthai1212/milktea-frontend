import React, { useState } from 'react';
import { X, MapPin, LocateFixed, PencilLine } from 'lucide-react';
import '../css/khachhang/ModalDiaChiGiaoHang.css';

const ModalDiaChiGiaoHang = ({ isOpen, batBuoc, userId, onSuccess, onClose }) => {
  const [toaDoGPS, setToaDoGPS] = useState({ latitude: null, longitude: null });
  const [trangThaiGPS, setTrangThaiGPS] = useState('chua_lay');
  const [diaChiChu, setDiaChiChu] = useState('');
  const [thongBao, setThongBao] = useState({ kieu: '', noiDung: '' });
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  if (!isOpen) return null;

  const handleKichHoatGPS = () => {
    setTrangThaiGPS('dang_quet');
    setThongBao({ kieu: '', noiDung: '' });
    setDiaChiChu('');

    if (!navigator.geolocation) {
      setTrangThaiGPS('thanh_cong');
      setToaDoGPS({ latitude: 0, longitude: 0 });
      setThongBao({ kieu: 'loi', noiDung: 'Thiết bị không hỗ trợ GPS. Vui lòng nhập địa chỉ thủ công!' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setToaDoGPS({ latitude: lat, longitude: lon });
        setTrangThaiGPS('thanh_cong');

        try {
          const res = await fetch(`${API_URL}/api/auth/dich-toa-do?lat=${lat}&lon=${lon}`);
          const data = await res.json();
          setDiaChiChu(data.address || `Tọa độ: ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
        } catch {
          setDiaChiChu(`Tọa độ: ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
        }
      },
      () => {
        setTrangThaiGPS('thanh_cong');
        setToaDoGPS({ latitude: 0, longitude: 0 });
        setDiaChiChu('');
        setThongBao({
          kieu: 'loi',
          noiDung: 'Không lấy được GPS. Vui lòng nhập địa chỉ thủ công bên dưới!',
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleChonThuCong = () => {
    setTrangThaiGPS('thanh_cong');
    setToaDoGPS({ latitude: 0, longitude: 0 });
    setDiaChiChu('');
    setThongBao({ kieu: '', noiDung: '' });
  };

  const handleXacNhan = async () => {
    if (trangThaiGPS !== 'thanh_cong' || !diaChiChu.trim()) {
      setThongBao({ kieu: 'loi', noiDung: 'Vui lòng chọn GPS hoặc nhập địa chỉ giao hàng!' });
      return;
    }

    if (!userId) {
      setThongBao({ kieu: 'loi', noiDung: 'Không xác định được tài khoản. Vui lòng đăng nhập lại!' });
      return;
    }

    setLoading(true);
    setThongBao({ kieu: '', noiDung: '' });

    try {
      const response = await fetch(`${API_URL}/api/khachhang/dia-chi-giao-hang`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          latitude: toaDoGPS.latitude ?? 0,
          longitude: toaDoGPS.longitude ?? 0,
          address_text: diaChiChu.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const addr = data.shipping_address;
        onSuccess({
          address_detail: addr.address_detail,
          latitude: addr.gps_location?.latitude ?? 0,
          longitude: addr.gps_location?.longitude ?? 0,
        });
      } else {
        setThongBao({ kieu: 'loi', noiDung: data.message || 'Không lưu được địa chỉ!' });
      }
    } catch {
      setThongBao({ kieu: 'loi', noiDung: 'Không kết nối được server. Vui lòng thử lại!' });
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = () => {
    if (!batBuoc && onClose) onClose();
  };

  return (
    <div className="mdc-overlay" onClick={handleOverlayClick}>
      <div className="mdc-container" onClick={(e) => e.stopPropagation()}>
        {!batBuoc && (
          <button type="button" className="mdc-close" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        )}

        <h2 className="mdc-title"><MapPin size={22} /> Chọn địa chỉ giao hàng</h2>
        <p className="mdc-subtitle">
          {batBuoc
            ? 'Vui lòng xác nhận địa chỉ để tiếp tục đặt món trên trang chủ.'
            : 'Cập nhật địa chỉ nhận hàng của bạn.'}
        </p>

        {thongBao.noiDung && (
          <div className={thongBao.kieu === 'loi' ? 'mdc-alert-error' : 'mdc-alert-success'}>
            {thongBao.noiDung}
          </div>
        )}

        <div className="mdc-gps-box">
          {trangThaiGPS === 'chua_lay' && (
            <div className="mdc-gps-actions">
              <button type="button" className="mdc-btn-gps" onClick={handleKichHoatGPS}>
                <LocateFixed size={18} /> Định vị GPS tự động
              </button>
              <button type="button" className="mdc-btn-manual" onClick={handleChonThuCong}>
                <PencilLine size={18} /> Nhập địa chỉ thủ công
              </button>
            </div>
          )}

          {trangThaiGPS === 'dang_quet' && (
            <p className="mdc-gps-loading">Đang kết nối vệ tinh và phân tích vị trí...</p>
          )}

          {trangThaiGPS === 'thanh_cong' && (
            <div className="mdc-gps-result">
              <label htmlFor="mdc-address-input">Địa chỉ nhận hàng:</label>
              <textarea
                id="mdc-address-input"
                value={diaChiChu}
                onChange={(e) => setDiaChiChu(e.target.value)}
                placeholder="Số nhà, đường, phường, quận, thành phố..."
                rows={3}
                className="mdc-textarea"
              />
              {toaDoGPS.latitude !== 0 && toaDoGPS.latitude != null && (
                <p className="mdc-coords">
                  Tọa độ: {toaDoGPS.latitude.toFixed(5)}, {toaDoGPS.longitude.toFixed(5)}
                </p>
              )}
              <button type="button" className="mdc-btn-retry" onClick={handleKichHoatGPS}>
                Định vị lại
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="mdc-btn-confirm"
          onClick={handleXacNhan}
          disabled={loading || trangThaiGPS !== 'thanh_cong' || !diaChiChu.trim()}
        >
          {loading ? 'Đang lưu địa chỉ...' : 'Xác nhận địa chỉ giao hàng'}
        </button>
      </div>
    </div>
  );
};

export default ModalDiaChiGiaoHang;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/khachhang/DangKy.css'; // Đảm bảo đường dẫn này trỏ đúng vị trí file CSS dưới đây

const DangKy = () => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [toaDoGPS, setToaDoGPS] = useState({ latitude: null, longitude: null });
  const [trangThaiGPS, setTrangThaiGPS] = useState('chua_lay'); 
  const [diaChiChu, setDiaChiChu] = useState('');
  const [thongBao, setThongBao] = useState({ kieu: '', noiDung: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  const handleKichHoatGPS = () => {
    setTrangThaiGPS('dang_quet');
    setThongBao({ kieu: '', noiDung: '' });
    setDiaChiChu(''); 

    if (navigator.geolocation) {
      const gpsOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          setToaDoGPS({ latitude: lat, longitude: lon });
          setTrangThaiGPS('thanh_cong');

          try {
            const res = await fetch(`${API_URL}/api/auth/dich-toa-do?lat=${lat}&lon=${lon}`);
            const data = await res.json();
            setDiaChiChu(data.address);
          } catch (err) {
            console.error("Lỗi gọi API dịch tọa độ:", err);
            setDiaChiChu(`Tọa độ: ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
          }
        },
        (error) => {
          setTrangThaiGPS('thanh_cong');
          setToaDoGPS({ latitude: 0, longitude: 0 }); 
          setDiaChiChu('');
          setThongBao({ 
            kieu: 'loi', 
            noiDung: '⚠️ Thiết bị không phản hồi GPS. Vui lòng tự gõ địa chỉ của bạn vào ô bên dưới!' 
          });
        },
        gpsOptions
      );
    } else {
      setTrangThaiGPS('thanh_cong');
      setToaDoGPS({ latitude: 0, longitude: 0 });
      setDiaChiChu('');
      alert("Thiết bị không hỗ trợ GPS tự động, vui lòng tự nhập địa chỉ!");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setThongBao({ kieu: '', noiDung: '' });

    if (formData.password !== formData.confirmPassword) {
      setThongBao({ kieu: 'loi', noiDung: '❌ Mật khẩu nhập lại không trùng khớp!' });
      setLoading(false);
      return;
    }

    if (trangThaiGPS !== 'thanh_cong' || !diaChiChu.trim()) {
      setThongBao({ kieu: 'loi', noiDung: '⚠️ Vui lòng định vị vị trí và điền thông tin địa chỉ trước khi đăng ký!' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/dangky`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          latitude: toaDoGPS.latitude,
          longitude: toaDoGPS.longitude,
          address_text: diaChiChu 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setThongBao({ kieu: 'thanhcong', noiDung: '🎉 ' + data.message });
        setTimeout(() => navigate('/login'), 2500); 
      } else {
        setThongBao({ kieu: 'loi', noiDung: data.message || 'Đăng ký thất bại!' });
      }
    } catch (error) {
      setThongBao({ kieu: 'loi', noiDung: '❌ Lỗi: Không thể kết nối tới Server Backend!' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dgky-screen-wrapper">
      <div className="dgky-main-card">
        <h2 className="dgky-main-title">ĐĂNG KÝ TÀI KHOẢN</h2>
        <p className="dgky-main-subtitle">Xác thực vị trí giao hàng tự động qua GPS vệ tinh</p>

        {thongBao.noiDung && (
          <div className={thongBao.kieu === 'thanhcong' ? 'dgky-alert-success' : 'dgky-alert-error'}>
            {thongBao.noiDung}
          </div>
        )}

        <form onSubmit={handleSubmit} className="dgky-core-form">
          <div className="dgky-field-group">
            <label>Địa chỉ Email:</label>
            <input type="email" name="email" className="dgky-custom-input" value={formData.email} onChange={handleChange} placeholder="viDu@email.com" required />
          </div>

          <div className="dgky-field-group">
            <label>Họ và Tên:</label>
            <input type="text" name="full_name" className="dgky-custom-input" value={formData.full_name} onChange={handleChange} placeholder="Nhập họ tên của bạn..." required />
          </div>

          <div className="dgky-field-group">
            <label>Số điện thoại:</label>
            <input type="text" name="phone" className="dgky-custom-input" value={formData.phone} onChange={handleChange} placeholder="Nhập số điện thoại..." />
          </div>

          <div className="dgky-field-group">
            <label>Mật khẩu:</label>
            <input type="password" name="password" className="dgky-custom-input" value={formData.password} onChange={handleChange} placeholder="Mật khẩu bảo mật..." required />
          </div>

          <div className="dgky-field-group">
            <label>Nhập lại mật khẩu:</label>
            <input type="password" name="confirmPassword" className="dgky-custom-input" value={formData.confirmPassword} onChange={handleChange} placeholder="Xác nhận mật khẩu..." required />
          </div>

          {/* KHU VỰC QUÉT GPS TỰ ĐỘNG */}
          <div className="dgky-gps-box">
            <label className="dgky-gps-title">📍 Vị Trí Giao Hàng Hiện Tại:</label>
            
            {trangThaiGPS === 'chua_lay' && (
              <div className="dgky-gps-actions">
                <button type="button" onClick={handleKichHoatGPS} className="dgky-gps-btn-auto">
                  Nhấn Để Định Vị Vị Trí Của Tôi
                </button>
                <button type="button" onClick={() => { setTrangThaiGPS('thanh_cong'); setToaDoGPS({ latitude: 0, longitude: 0 }); }} className="dgky-gps-btn-hand">
                  Hoặc tự gõ địa chỉ thủ công
                </button>
              </div>
            )}

            {trangThaiGPS === 'dang_quet' && (
              <p className="dgky-gps-loading">📡 Đang kết nối vệ tinh và phân tích địa chỉ chữ...</p>
            )}

            {trangThaiGPS === 'thanh_cong' && (
              <div className="dgky-gps-result-zone">
                <p className="dgky-gps-success-msg">
                  ✓ Bạn có thể chỉnh sửa lại ô địa chỉ bên dưới cho đúng:
                </p>
                
                <textarea 
                  value={diaChiChu}
                  onChange={(e) => setDiaChiChu(e.target.value)}
                  placeholder="Nhập chính xác số nhà, tên đường, ấp, xã, huyện, tỉnh tại đây..."
                  required
                  className="dgky-gps-textarea"
                />

                {toaDoGPS.latitude !== 0 && (
                  <p className="dgky-gps-coords">
                    Tọa độ gốc: {toaDoGPS.latitude.toFixed(5)} | {toaDoGPS.longitude.toFixed(5)}
                  </p>
                )}
                
                <button type="button" onClick={handleKichHoatGPS} className="dgky-gps-re-trigger">
                  Định vị lại tự động
                </button>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading || trangThaiGPS !== 'thanh_cong'} className="dgky-submit-btn">
            {loading ? 'Đang khởi tạo tài khoản...' : 'Đăng Ký Ngay'}
          </button>
        </form>

        <div className="dgky-bottom-redirect">
          <p>Đã có tài khoản? <Link to="/login" className="dgky-redirect-link">Đăng nhập tại đây</Link></p>
        </div>
      </div>
    </div>
  );
};

export default DangKy;
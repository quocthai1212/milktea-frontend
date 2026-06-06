import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  LocateFixed,
  LockKeyhole,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  User,
  UserPlus,
} from 'lucide-react';
import '../css/khachhang/DangKy.css';

const DangKy = () => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    password: '',
    confirmPassword: '',
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
        maximumAge: 0,
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
            noiDung: 'Thiết bị không phản hồi GPS. Vui lòng tự nhập địa chỉ bên dưới.',
          });
        },
        gpsOptions
      );
    } else {
      setTrangThaiGPS('thanh_cong');
      setToaDoGPS({ latitude: 0, longitude: 0 });
      setDiaChiChu('');
      setThongBao({ kieu: 'loi', noiDung: 'Thiết bị không hỗ trợ GPS. Vui lòng tự nhập địa chỉ.' });
    }
  };

  const handleNhapThuCong = () => {
    setTrangThaiGPS('thanh_cong');
    setToaDoGPS({ latitude: 0, longitude: 0 });
    setDiaChiChu('');
    setThongBao({ kieu: '', noiDung: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setThongBao({ kieu: '', noiDung: '' });

    if (formData.password !== formData.confirmPassword) {
      setThongBao({ kieu: 'loi', noiDung: 'Mật khẩu nhập lại không trùng khớp!' });
      setLoading(false);
      return;
    }

    if (trangThaiGPS !== 'thanh_cong' || !diaChiChu.trim()) {
      setThongBao({ kieu: 'loi', noiDung: 'Vui lòng định vị hoặc nhập địa chỉ giao hàng trước khi đăng ký!' });
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
          address_text: diaChiChu,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setThongBao({ kieu: 'thanhcong', noiDung: data.message });
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setThongBao({ kieu: 'loi', noiDung: data.message || 'Đăng ký thất bại!' });
      }
    } catch {
      setThongBao({ kieu: 'loi', noiDung: 'Không thể kết nối tới Server Backend!' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page--register">
      <Link to="/" className="auth-back-link">
        <ArrowLeft size={18} />
        Về trang chủ
      </Link>

      <section className="auth-shell auth-shell--register">
        <div className="auth-brand-panel">
          <span className="auth-eyebrow">MilkTea Paradise</span>
        </div>

        <div className="auth-card auth-card--wide">
          <div className="auth-card-head">
            <span className="auth-icon-circle">
              <UserPlus size={22} />
            </span>
            <h2>Đăng ký</h2>
            <p>Điền thông tin tài khoản của bạn</p>
          </div>

          {thongBao.noiDung && (
            <div className={thongBao.kieu === 'thanhcong' ? 'auth-alert auth-alert--success' : 'auth-alert auth-alert--error'}>
              {thongBao.noiDung}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-grid">
              <div className="auth-field">
                <label htmlFor="email">Email</label>
                <div className="auth-input-wrap">
                  <Mail size={18} />
                  <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="nhapemail@example.com" required />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="full_name">Họ và tên</label>
                <div className="auth-input-wrap">
                  <User size={18} />
                  <input id="full_name" type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Nhập họ tên" required />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="phone">Số điện thoại</label>
                <div className="auth-input-wrap">
                  <Phone size={18} />
                  <input id="phone" type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="Nhập số điện thoại" />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="password">Mật khẩu</label>
                <div className="auth-input-wrap">
                  <LockKeyhole size={18} />
                  <input id="password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Nhập mật khẩu" required />
                </div>
              </div>

              <div className="auth-field auth-field--full">
                <label htmlFor="confirmPassword">Nhập lại mật khẩu</label>
                <div className="auth-input-wrap">
                  <LockKeyhole size={18} />
                  <input id="confirmPassword" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Xác nhận mật khẩu" required />
                </div>
              </div>
            </div>

            <div className="auth-location-box">
              <div className="auth-location-head">
                <span className="auth-location-icon">
                  <MapPin size={20} />
                </span>
                <div>
                  <h3>Vị trí giao hàng</h3>
                  <p>Dùng GPS hoặc nhập địa chỉ thủ công.</p>
                </div>
              </div>

              {trangThaiGPS === 'chua_lay' && (
                <div className="auth-location-actions">
                  <button type="button" onClick={handleKichHoatGPS} className="auth-secondary-btn auth-secondary-btn--filled">
                    <LocateFixed size={17} />
                    Định vị vị trí của tôi
                  </button>
                  <button type="button" onClick={handleNhapThuCong} className="auth-secondary-btn">
                    <PencilLine size={17} />
                    Tự nhập địa chỉ
                  </button>
                </div>
              )}

              {trangThaiGPS === 'dang_quet' && (
                <p className="auth-location-loading">
                  <LoaderCircle size={17} className="auth-spin" />
                  Đang xác định vị trí...
                </p>
              )}

              {trangThaiGPS === 'thanh_cong' && (
                <div className="auth-location-result">
                  <p className="auth-location-ok">
                    <CheckCircle2 size={17} />
                    Kiểm tra và chỉnh sửa địa chỉ nếu cần.
                  </p>

                  <textarea
                    value={diaChiChu}
                    onChange={(e) => setDiaChiChu(e.target.value)}
                    placeholder="Nhập số nhà, tên đường, xã/phường, huyện/thành phố, tỉnh..."
                    required
                    className="auth-textarea"
                  />

                  {toaDoGPS.latitude !== 0 && toaDoGPS.latitude !== null && (
                    <p className="auth-coords">
                      Tọa độ: {toaDoGPS.latitude.toFixed(5)} · {toaDoGPS.longitude.toFixed(5)}
                    </p>
                  )}

                  <button type="button" onClick={handleKichHoatGPS} className="auth-link-btn">
                    Định vị lại tự động
                  </button>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading || trangThaiGPS !== 'thanh_cong'} className="auth-submit-btn">
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
              <UserPlus size={18} />
            </button>
          </form>

          <div className="auth-bottom-text">
            <span>Đã có tài khoản?</span>
            <Link to="/login">Đăng nhập</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DangKy;

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

  // 🔥 HÀM BẮT DỮ LIỆU TẬP TRUNG (VALIDATION)
  const validateForm = () => {
    // 1. Kiểm tra Họ và Tên
    const tenChuan = formData.full_name.trim();
    if (tenChuan.length < 2) {
      setThongBao({ kieu: 'loi', noiDung: 'Họ và tên phải chứa ít nhất 2 ký tự!' });
      return false;
    }
    const regexTen = /^[\p{L}\s]+$/u;
    if (!regexTen.test(tenChuan)) {
      setThongBao({ kieu: 'loi', noiDung: 'Họ và tên không được chứa số hoặc ký tự đặc biệt!' });
      return false;
    }

    // 2. Kiểm tra Số điện thoại
    const sdtChuan = formData.phone.trim();
    if (sdtChuan) {
      const regexSDT = /^(03|05|07|08|09)\d{8}$/;
      if (!regexSDT.test(sdtChuan)) {
        setThongBao({ kieu: 'loi', noiDung: 'Số điện thoại không hợp lệ! (Phải gồm 10 số và bắt đầu bằng 03, 05, 07, 08, 09)' });
        return false;
      }
    } else {
      setThongBao({ kieu: 'loi', noiDung: 'Vui lòng cung cấp Số điện thoại để liên hệ giao hàng!' });
      return false;
    }

    // 3. 🎯 Kiểm tra Mật khẩu Mạnh (Tối thiểu 8 ký tự, 1 hoa, 1 thường, 1 số, 1 đặc biệt)
    const matKhau = formData.password;
// 🌟 ĐÚNG CHUẨN: Dấu chấm (.) đứng cuối cùng trước {8,} đại diện cho việc chấp nhận MỌI ký tự
    const regexMatKhauManh = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    
    if (!regexMatKhauManh.test(matKhau)) {
      setThongBao({ 
        kieu: 'loi', 
        noiDung: 'Mật khẩu quá yếu! Phải dài ít nhất 8 ký tự, bao gồm ít nhất: 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt (@$!%*?&)' 
      });
      return false;
    }

    // 4. Kiểm tra Nhập lại Mật khẩu
    if (formData.password !== formData.confirmPassword) {
      setThongBao({ kieu: 'loi', noiDung: 'Mật khẩu nhập lại không trùng khớp!' });
      return false;
    }

    // 5. Kiểm tra Địa chỉ
    if (trangThaiGPS !== 'thanh_cong' || !diaChiChu.trim()) {
      setThongBao({ kieu: 'loi', noiDung: 'Vui lòng định vị hoặc nhập địa chỉ giao hàng trước khi đăng ký!' });
      return false;
    }

    return true; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setThongBao({ kieu: '', noiDung: '' });

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/dangky`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          latitude: toaDoGPS.latitude,
          longitude: toaDoGPS.longitude,
          address_text: diaChiChu.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setThongBao({ kieu: 'thanhcong', noiDung: data.message || 'Đăng ký tài khoản thành công!' });
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setThongBao({ kieu: 'loi', noiDung: data.message || 'Đăng ký thất bại!' });
      }
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
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
                  <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Nhập số điện thoại (10 chữ số)" required />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="password">Mật khẩu</label>
                <div className="auth-input-wrap">
                  <LockKeyhole size={18} />
                  {/* Thay đổi placeholder để gợi ý người dùng */}
                  <input id="password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Mật khẩu bảo mật mạnh" required />
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
                    placeholder="Nhập cụ thể số nhà, tên đường, xã/phường, quận/huyện..."
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
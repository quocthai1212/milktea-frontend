import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
<<<<<<< HEAD
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
=======
import '../css/khachhang/DangKy.css'; // Đảm bảo đường dẫn này trỏ đúng vị trí file CSS dưới đây
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1

const DangKy = () => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    password: '',
<<<<<<< HEAD
    confirmPassword: '',
  });

  const [toaDoGPS, setToaDoGPS] = useState({ latitude: null, longitude: null });
  const [trangThaiGPS, setTrangThaiGPS] = useState('chua_lay');
=======
    confirmPassword: ''
  });

  const [toaDoGPS, setToaDoGPS] = useState({ latitude: null, longitude: null });
  const [trangThaiGPS, setTrangThaiGPS] = useState('chua_lay'); 
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
  const [diaChiChu, setDiaChiChu] = useState('');
  const [thongBao, setThongBao] = useState({ kieu: '', noiDung: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  const handleKichHoatGPS = () => {
    setTrangThaiGPS('dang_quet');
    setThongBao({ kieu: '', noiDung: '' });
<<<<<<< HEAD
    setDiaChiChu('');
=======
    setDiaChiChu(''); 
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1

    if (navigator.geolocation) {
      const gpsOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
<<<<<<< HEAD
        maximumAge: 0,
=======
        maximumAge: 0 
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
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
<<<<<<< HEAD
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
=======
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
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
          });
        },
        gpsOptions
      );
    } else {
      setTrangThaiGPS('thanh_cong');
      setToaDoGPS({ latitude: 0, longitude: 0 });
      setDiaChiChu('');
<<<<<<< HEAD
      setThongBao({ kieu: 'loi', noiDung: 'Thiết bị không hỗ trợ GPS. Vui lòng tự nhập địa chỉ.' });
    }
  };

  const handleNhapThuCong = () => {
    setTrangThaiGPS('thanh_cong');
    setToaDoGPS({ latitude: 0, longitude: 0 });
    setDiaChiChu('');
    setThongBao({ kieu: '', noiDung: '' });
  };

=======
      alert("Thiết bị không hỗ trợ GPS tự động, vui lòng tự nhập địa chỉ!");
    }
  };

>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setThongBao({ kieu: '', noiDung: '' });

    if (formData.password !== formData.confirmPassword) {
<<<<<<< HEAD
      setThongBao({ kieu: 'loi', noiDung: 'Mật khẩu nhập lại không trùng khớp!' });
=======
      setThongBao({ kieu: 'loi', noiDung: '❌ Mật khẩu nhập lại không trùng khớp!' });
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
      setLoading(false);
      return;
    }

    if (trangThaiGPS !== 'thanh_cong' || !diaChiChu.trim()) {
<<<<<<< HEAD
      setThongBao({ kieu: 'loi', noiDung: 'Vui lòng định vị hoặc nhập địa chỉ giao hàng trước khi đăng ký!' });
=======
      setThongBao({ kieu: 'loi', noiDung: '⚠️ Vui lòng định vị vị trí và điền thông tin địa chỉ trước khi đăng ký!' });
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
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
<<<<<<< HEAD
          address_text: diaChiChu,
=======
          address_text: diaChiChu 
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
        }),
      });

      const data = await response.json();

      if (response.ok) {
<<<<<<< HEAD
        setThongBao({ kieu: 'thanhcong', noiDung: data.message });
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setThongBao({ kieu: 'loi', noiDung: data.message || 'Đăng ký thất bại!' });
      }
    } catch {
      setThongBao({ kieu: 'loi', noiDung: 'Không thể kết nối tới Server Backend!' });
=======
        setThongBao({ kieu: 'thanhcong', noiDung: '🎉 ' + data.message });
        setTimeout(() => navigate('/login'), 2500); 
      } else {
        setThongBao({ kieu: 'loi', noiDung: data.message || 'Đăng ký thất bại!' });
      }
    } catch (error) {
      setThongBao({ kieu: 'loi', noiDung: '❌ Lỗi: Không thể kết nối tới Server Backend!' });
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
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
=======
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
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
    </div>
  );
};

<<<<<<< HEAD
export default DangKy;
=======
export default DangKy;
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1

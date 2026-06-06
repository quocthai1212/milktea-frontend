import React, { useState } from 'react';
<<<<<<< HEAD
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LockKeyhole, LogIn, Mail, UserPlus } from 'lucide-react';
=======
import { Link } from 'react-router-dom'; // 👈 Import thẻ Link để chuyển trang không bị load lại web
import { useNavigate } from 'react-router-dom';
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
import '../css/DangNhap.css';

const DangNhap = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [thongBao, setThongBao] = useState({ kieu: '', noiDung: '' });
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setThongBao({ kieu: '', noiDung: '' });
<<<<<<< HEAD

=======
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
    try {
      const response = await fetch(`${API_URL}/api/auth/dangnhap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setThongBao({ kieu: 'thanhcong', noiDung: data.message });
<<<<<<< HEAD
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('role_id', data.role_id);

        if (Number(data.role_id) === 1) {
          navigate('/admin');
        } else if (Number(data.role_id) === 2) {
          navigate('/nhanvien');
        } else if (Number(data.role_id) === 3) {
          if (data.shipping_address?.address_detail) {
            localStorage.setItem(
              'delivery_address',
              JSON.stringify({
                address_detail: data.shipping_address.address_detail,
                latitude: data.shipping_address.gps_location?.latitude ?? 0,
                longitude: data.shipping_address.gps_location?.longitude ?? 0,
              })
            );
            localStorage.removeItem('require_delivery_address');
            navigate('/', { replace: true });
          } else {
            localStorage.removeItem('delivery_address');
            localStorage.setItem('require_delivery_address', '1');
            navigate('/', { replace: true, state: { requireAddress: true } });
          }
        } else {
          navigate('/', { replace: true });
=======
        localStorage.setItem('token', data.token); // Lưu JWT Token
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('role_id', data.role_id);

        console.log('Đăng nhập thành công, ID quyền là:', data.role_id);
        // 2. GIẢ SỬ: Quy ước số 1 là Admin (Bạn có thể đổi số này tùy theo database của bạn)
        if (Number(data.role_id) === 1) {
          // 👑 QUYỀN 1: Quản trị viên tối cao
          navigate('/admin'); 
        } else if (Number(data.role_id) === 2) {
          // 💼 QUYỀN 2: Nhân viên hệ thống
          navigate('/nhanvien'); 
        } else if (Number(data.role_id) === 3) {
          // 🛍️ QUYỀN 3: Khách hàng mua trà sữa
          navigate('/khachhang'); // 🚀 Chuyển hướng về KhachhangDashboard của bạn
        } else {
          // Phòng hờ trường hợp role_id không hợp lệ hoặc rỗng
          navigate('/'); 
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
        }
      } else {
        setThongBao({ kieu: 'loi', noiDung: data.message || 'Đăng nhập thất bại!' });
      }
<<<<<<< HEAD
    } catch {
      setThongBao({ kieu: 'loi', noiDung: 'Không thể kết nối tới Server Backend!' });
=======
    } catch (error) {
      setThongBao({ kieu: 'loi', noiDung: '❌ Lỗi: Không thể kết nối tới Server Backend!' });
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="auth-page">
      <Link to="/" className="auth-back-link">
        <ArrowLeft size={18} />
        Về trang chủ
      </Link>

      <section className="auth-shell auth-shell--login">
        <div className="auth-brand-panel">
          <span className="auth-eyebrow">MilkTea Paradise</span>
        </div>

        <div className="auth-card">
          <div className="auth-card-head">
            <span className="auth-icon-circle">
              <LogIn size={22} />
            </span>
            <h2>Đăng nhập</h2>
            <p>Nhập thông tin tài khoản của bạn</p>
          </div>

          {thongBao.noiDung && (
            <div className={thongBao.kieu === 'thanhcong' ? 'auth-alert auth-alert--success' : 'auth-alert auth-alert--error'}>
              {thongBao.noiDung}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <div className="auth-input-wrap">
                <Mail size={18} />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nhapemail@example.com"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password">Mật khẩu</label>
              <div className="auth-input-wrap">
                <LockKeyhole size={18} />
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-submit-btn">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              <LogIn size={18} />
            </button>
          </form>

          <div className="auth-bottom-text">
            <span>Chưa có tài khoản?</span>
            <Link to="/register">
              <UserPlus size={16} />
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </section>
=======
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">ĐĂNG NHẬP</h2>
        <p className="login-subtitle">Hệ thống Milktea - Xác thực bảo mật JWT</p>

        {thongBao.noiDung && (
          <div className={thongBao.kieu === 'thanhcong' ? 'alert-success' : 'alert-error'}>
            {thongBao.noiDung}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Tên đăng nhập:</label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="login-input"
              placeholder="Nhập tài khoản..."
              required
            />
          </div>

          <div className="input-group">
            <label>Mật khẩu:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="login-input"
              placeholder="Nhập mật khẩu..."
              required
            />
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Đang kiểm tra bảo mật...' : 'Đăng Nhập'}
          </button>
        </form>

        {/* 👈 NÚT BẤM CHUYỂN QUA TRANG ĐĂNG KÝ TÀI KHOẢN */}
        <div className="register-redirect">
          <p>Chưa có tài khoản?</p>
          <Link to="/register" className="redirect-button">Đăng ký tài khoản mới</Link>
        </div>

      </div>
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
    </div>
  );
};

<<<<<<< HEAD
export default DangNhap;
=======
export default DangNhap;
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1

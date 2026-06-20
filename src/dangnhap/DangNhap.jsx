import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LockKeyhole, LogIn, Mail, UserPlus, Eye, EyeOff } from 'lucide-react';
import '../css/DangNhap.css';

const DangNhap = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [thongBao, setThongBao] = useState({ kieu: '', noiDung: '' });
  const [loading, setLoading] = useState(false);
  
  // 🎯 Quản lý ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setThongBao({ kieu: '', noiDung: '' });
    try {
      const response = await fetch(`${API_URL}/api/auth/dangnhap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      // ✅ THÀNH CÔNG (Mã status 200)
      if (response.ok) {
        setThongBao({ kieu: 'thanhcong', noiDung: data.message });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('role_id', data.role_id);

        // Phân quyền điều hướng dựa trên role_id
        if (Number(data.role_id) === 1) {
          navigate('/admin');
        } else if (Number(data.role_id) === 2) {
          navigate('/nhanvien');
        } else if (Number(data.role_id) === 4) {
          navigate('/shipper');
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
        }
      } 
      // ❌ THẤT BẠI (Mã status 400, 401, 403, ...)
      else {
        // 🔥 Khớp mã lỗi 403 từ Backend khi tài khoản dính trạng thái khóa
        if (response.status === 403) {
          setThongBao({ 
            kieu: 'khoa_taikhoan', 
            // Ưu tiên hiển thị câu chữ cảnh báo liên hệ Admin từ Backend trả về
            noiDung: data.message || 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ với người quản trị!' 
          });
        } else {
          // Các lỗi sai mật khẩu (hiển thị số lần còn lại), sai email hệ thống
          setThongBao({ 
            kieu: 'loi', 
            noiDung: data.message || 'Đăng nhập không thành công!' 
          });
        }
      }
    } catch (error) {
      console.error("Lỗi kết nối API đăng nhập:", error);
      setThongBao({ kieu: 'loi', noiDung: 'Không thể kết nối tới Server Backend!' });
    } finally {
      setLoading(false);
    }
  };

  return (
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

          {/* 🔥 Phân nhóm Class hiển thị CSS động dựa trên kiểu lỗi phản hồi */}
          {thongBao.noiDung && (
            <div className={
              thongBao.kieu === 'thanhcong' ? 'auth-alert auth-alert--success' : 
              thongBao.kieu === 'khoa_taikhoan' ? 'auth-alert auth-alert--lock' : 
              'auth-alert auth-alert--error'
            }>
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
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  required
                />
                <span className="toggle-password" onClick={togglePasswordVisibility}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>
            </div>

            <Link to="/quenmk" className="auth-link-btn">
              Quên mật khẩu?
            </Link>

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
    </div>
  );
};

export default DangNhap;
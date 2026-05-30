import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // 👈 Import thẻ Link để chuyển trang không bị load lại web
import { useNavigate } from 'react-router-dom';
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
    try {
      const response = await fetch(`${API_URL}/api/auth/dangnhap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setThongBao({ kieu: 'thanhcong', noiDung: data.message });
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
        }
      } else {
        setThongBao({ kieu: 'loi', noiDung: data.message || 'Đăng nhập thất bại!' });
      }
    } catch (error) {
      setThongBao({ kieu: 'loi', noiDung: '❌ Lỗi: Không thể kết nối tới Server Backend!' });
    } finally {
      setLoading(false);
    }
  };

  return (
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
    </div>
  );
};

export default DangNhap;
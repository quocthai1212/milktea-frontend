import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QuanLyNhanVien from './QuanLyNhanVien';
import QuanLySanPham from './QuanLySanPham';
import '../css/quantri/AdminDashboard.css'; 

export default function AdminDashboard() {
  const [currentTab, setCurrentTab] = useState('dashboard'); 
  const [isMobileOpen, setIsMobileOpen] = useState(false); // 🌟 State kiểm soát đóng/mở Sidebar trên điện thoại
  const navigate = useNavigate();

  // Bảo mật: Nếu không phải Admin, đá văng ra khỏi trang này
  useEffect(() => {
    const role = localStorage.getItem('role_id');
    if (Number(role) !== 1) {
      alert("Bạn không có quyền truy cập trang này!");
      navigate('/login');
    }
  }, [navigate]); 

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Hàm hỗ trợ chuyển tab và tự động đóng menu khi dùng trên điện thoại
  const handleTabChange = (tabName) => {
    setCurrentTab(tabName);
    setIsMobileOpen(false); // Bấm chọn menu xong thì tự thu ngăn kéo lại
  };

  return (
    <div className="admin-layout">
      
      {/* 📱 NÚT BẤM HIỂN THỊ TRÊN DI ĐỘNG (Tự xuất hiện khi màn hình nhỏ < 992px) */}
      <button 
        className="mobile-toggle-btn" 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? '✕ ĐÓNG MENU' : '☰ DANH MỤC QUẢN TRỊ'}
      </button>

      {/* 🌫️ LỚP PHỦ MỜ NỀN WEB (Chỉ hiện khi mở ngăn kéo menu trên mobile, bấm vào là đóng menu) */}
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)}></div>
      )}

      {/* 🧭 MENU BÊN TRÁI (SIDEBAR) - Tự động thêm class "mobile-open" khi biến state bằng true */}
      <div className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <h3>ADMIN MILKTEA</h3>
          <span>Hệ thống quản lý</span>
        </div>
        <hr />
        
        <ul className="admin-menu">
          <li 
            onClick={() => handleTabChange('dashboard')} 
            className={`admin-menu-item ${currentTab === 'dashboard' ? 'active' : ''}`}
          >
            🏠 Tổng quan
          </li>
          <li 
            onClick={() => handleTabChange('nhanvien')} 
            className={`admin-menu-item ${currentTab === 'nhanvien' ? 'active' : ''}`}
          >
            👥 Quản lý nhân viên
          </li>
          <li 
            onClick={() => handleTabChange('sanpham')} 
            className={`admin-menu-item ${currentTab === 'sanpham' ? 'active' : ''}`}
          >
            🧋 Quản lý sản phẩm
          </li>
        </ul>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="admin-btn-logout">
            Đăng xuất
          </button>
        </div>
      </div>

      {/* 🖥️ VÙNG HIỂN THỊ NỘI DUNG BÊN PHẢI (CONTENT) */}
      <div className="admin-content">
        <div className="admin-content-inner">
          {currentTab === 'dashboard' && (
            <div className="welcome-card">
              <h2>Chào mừng quay trở lại, Admin!</h2>
              <p>Chọn các mục bên trái để quản lý hệ thống tiệm trà sữa.</p>
            </div>
          )}

          {/* Các component con tương ứng với tab */}
          {currentTab === 'nhanvien' && <QuanLyNhanVien />}

          {currentTab === 'sanpham' && <QuanLySanPham />}
        </div>
      </div>

    </div>
  );
}
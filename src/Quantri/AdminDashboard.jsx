import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QuanLyNhanVien from './QuanLyNhanVien';
<<<<<<< HEAD
import QuanLyThongke from './QuanLyThongKe';
import QuanLyDanhmuc from './QuanLyDanhMucSanPham';
import QuanLyKhuyenMai from './QuanLyKhuyenMai';

=======
import QuanLySanPham from './QuanLySanPham';
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
import '../css/quantri/AdminDashboard.css'; 

export default function AdminDashboard() {
  const [currentTab, setCurrentTab] = useState('dashboard'); 
<<<<<<< HEAD
  const [isMobileOpen, setIsMobileOpen] = useState(false); 
  const navigate = useNavigate();

  // Kiểm tra quyền Admin
=======
  const [isMobileOpen, setIsMobileOpen] = useState(false); // 🌟 State kiểm soát đóng/mở Sidebar trên điện thoại
  const navigate = useNavigate();

  // Bảo mật: Nếu không phải Admin, đá văng ra khỏi trang này
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
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

<<<<<<< HEAD
  const handleTabChange = (tabName) => {
    setCurrentTab(tabName);
    setIsMobileOpen(false); 
=======
  // Hàm hỗ trợ chuyển tab và tự động đóng menu khi dùng trên điện thoại
  const handleTabChange = (tabName) => {
    setCurrentTab(tabName);
    setIsMobileOpen(false); // Bấm chọn menu xong thì tự thu ngăn kéo lại
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
  };

  return (
    <div className="admin-layout">
      
<<<<<<< HEAD
      {/* 📱 NÚT MENU MOBILE */}
      <button className="mobile-toggle-btn" onClick={() => setIsMobileOpen(!isMobileOpen)}>
        {isMobileOpen ? '✕ ĐÓNG MENU' : '☰ DANH MỤC QUẢN TRỊ'}
      </button>

      {/* 🌫️ LỚP PHỦ NỀN */}
=======
      {/* 📱 NÚT BẤM HIỂN THỊ TRÊN DI ĐỘNG (Tự xuất hiện khi màn hình nhỏ < 992px) */}
      <button 
        className="mobile-toggle-btn" 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? '✕ ĐÓNG MENU' : '☰ DANH MỤC QUẢN TRỊ'}
      </button>

      {/* 🌫️ LỚP PHỦ MỜ NỀN WEB (Chỉ hiện khi mở ngăn kéo menu trên mobile, bấm vào là đóng menu) */}
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)}></div>
      )}

<<<<<<< HEAD
      {/* 🧭 SIDEBAR BIÊN TRÁI (CHỈ CÓ 3 MỤC CHÍNH) */}
=======
      {/* 🧭 MENU BÊN TRÁI (SIDEBAR) - Tự động thêm class "mobile-open" khi biến state bằng true */}
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
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
<<<<<<< HEAD
            onClick={() => handleTabChange('danhmuc')} 
            className={`admin-menu-item ${currentTab === 'danhmuc' ? 'active' : ''}`}
          >
            🧋 Quản lý danh mục
          </li>
          <li 
            onClick={() => handleTabChange('khuyenmai')} 
            className={`admin-menu-item ${currentTab === 'khuyenmai' ? 'active' : ''}`}
          >
            🧋 Quản lý khuyến mãi
=======
            onClick={() => handleTabChange('sanpham')} 
            className={`admin-menu-item ${currentTab === 'sanpham' ? 'active' : ''}`}
          >
            🧋 Quản lý sản phẩm
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
          </li>
        </ul>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="admin-btn-logout">
            Đăng xuất
          </button>
        </div>
      </div>

<<<<<<< HEAD
      {/* 🖥️ VÙNG HIỂN THỊ NỘI DUNG BÊN PHẢI */}
=======
      {/* 🖥️ VÙNG HIỂN THỊ NỘI DUNG BÊN PHẢI (CONTENT) */}
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
      <div className="admin-content">
        <div className="admin-content-inner">
          {currentTab === 'dashboard' && (
            <div className="welcome-card">
              <h2>Chào mừng quay trở lại, Admin!</h2>
              <p>Chọn các mục bên trái để quản lý hệ thống tiệm trà sữa.</p>
            </div>
          )}

<<<<<<< HEAD
          {currentTab === 'nhanvien' && <QuanLyNhanVien />}
          
          {/* 🌟 Tab này sẽ tự kiểm soát việc hiện Danh mục hay Sản phẩm bên trong nó */}
          {currentTab === 'danhmuc' && <QuanLyDanhmuc />}
          
          {currentTab === 'thongke' && <QuanLyThongke />}

          {currentTab === 'khuyenmai' && <QuanLyKhuyenMai />}
=======
          {/* Các component con tương ứng với tab */}
          {currentTab === 'nhanvien' && <QuanLyNhanVien />}

          {currentTab === 'sanpham' && <QuanLySanPham />}
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
        </div>
      </div>

    </div>
  );
}
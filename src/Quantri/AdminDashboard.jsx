import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QuanLyNhanVien from './QuanLyNhanVien';
import QuanLyThongke from './QuanLyThongKe';
import QuanLyDanhmuc from './QuanLyDanhMucSanPham';
import QuanLyKhuyenMai from './QuanLyKhuyenMai';
import QuanLyDonHang from './QuanLyDonHang.jsx';
import QuanLyKhachHang from './QuanLyKhachHang.jsx';
import QuanLyBinhLuan from './QuanLyBinhLuan';
import QuanLyChiNhanh from './QuanLyChiNhanh';


import '../css/quantri/AdminDashboard.css'; 

export default function AdminDashboard() {
  const [currentTab, setCurrentTab] = useState('dashboard'); 
  const [isMobileOpen, setIsMobileOpen] = useState(false); 
  const navigate = useNavigate();

  // Kiểm tra quyền Admin
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

  const handleTabChange = (tabName) => {
    setCurrentTab(tabName);
    setIsMobileOpen(false); 
  };

  return (
    <div className="admin-layout">
      
      {/* 📱 NÚT MENU MOBILE */}
      <button className="mobile-toggle-btn" onClick={() => setIsMobileOpen(!isMobileOpen)}>
        {isMobileOpen ? '✕ ĐÓNG MENU' : '☰ DANH MỤC QUẢN TRỊ'}
      </button>

      {/* 🌫️ LỚP PHỦ NỀN */}
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)}></div>
      )}

      {/* 🧭 SIDEBAR BIÊN TRÁI */}
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

          {/* 🆕 THÊM SỰ KIỆN: Nút chuyển sang Tab Quản lý Đơn hàng */}
          <li 
            onClick={() => handleTabChange('donhang')} 
            className={`admin-menu-item ${currentTab === 'donhang' ? 'active' : ''}`}
          >
            📦 Quản lý đơn hàng
          </li>

          <li 
            onClick={() => handleTabChange('nhanvien')} 
            className={`admin-menu-item ${currentTab === 'nhanvien' ? 'active' : ''}`}
          >
            👥 Quản lý nhân viên
          </li>

          <li 
            onClick={() => handleTabChange('khachhang')} 
            className={`admin-menu-item ${currentTab === 'khachhang' ? 'active' : ''}`}
          >
            🏍️ Quản lý khách hàng
          </li>

          <li 
            onClick={() => handleTabChange('danhmuc')} 
            className={`admin-menu-item ${currentTab === 'danhmuc' ? 'active' : ''}`}
          >
            🧋 Quản lý danh mục
          </li>
          <li 
            onClick={() => handleTabChange('khuyenmai')} 
            className={`admin-menu-item ${currentTab === 'khuyenmai' ? 'active' : ''}`}
          >
            🏷️ Quản lý khuyến mãi
          </li>
          
          <li 
            onClick={() => handleTabChange('binhluan')} 
            className={`admin-menu-item ${currentTab === 'binhluan' ? 'active' : ''}`}
          >
            💬 Quản lý Bình Luận
          </li>
          <li 
            onClick={() => handleTabChange('chinhanh')} 
            className={`admin-menu-item ${currentTab === 'chinhanh' ? 'active' : ''}`}
          >
           🏢 Quản lý chi nhánh
          </li>
          <li 
            onClick={() => handleTabChange('thongke')} 
            className={`admin-menu-item ${currentTab === 'thongke' ? 'active' : ''}`}
          >
            📊 Thống kê doanh thu
          </li>
        </ul>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="admin-btn-logout">
            Đăng xuất
          </button>
        </div>
      </div>

      {/* 🖥️ VÙNG HIỂN THỊ NỘI DUNG BÊN PHẢI */}
      <div className="admin-content">
        <div className="admin-content-inner">
          {currentTab === 'dashboard' && (
            <div className="welcome-card">
              <h2>Chào mừng quay trở lại, Admin!</h2>
              <p>Chọn các mục bên trái để quản lý hệ thống tiệm trà sữa.</p>
            </div>
          )}

          {/* 🆕 THÊM SỰ KIỆN: Render giao diện Quản lý Đơn hàng khi chọn tab */}
          {currentTab === 'donhang' && <QuanLyDonHang />}

          {currentTab === 'nhanvien' && <QuanLyNhanVien />}
          
          {/* 🎯 THÊM SỰ KIỆN: Render giao diện Quản lý Shipper khi bấm tab */}
          {currentTab === 'khachhang' && <QuanLyKhachHang />}
          
          {/* Tab này tự kiểm soát việc hiện Danh mục hay Sản phẩm bên trong nó */}
          {currentTab === 'danhmuc' && <QuanLyDanhmuc />}

          {currentTab === 'binhluan' && <QuanLyBinhLuan />}

          {currentTab === 'chinhanh' && <QuanLyChiNhanh />}
          
          {currentTab === 'thongke' && <QuanLyThongke />}

          {currentTab === 'khuyenmai' && <QuanLyKhuyenMai />}
        </div>
      </div>

    </div>
  );
}
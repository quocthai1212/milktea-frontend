import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // 🎯 Đã thêm lại BrowserRouter tại đây
import Register from './khachhang/DangKy'; 
import DangNhap from './dangnhap/DangNhap';
import Admin from './Quantri/AdminDashboard';
import QT_Nhanvien from './Quantri/QuanLyNhanVien';
import QT_Sanpham from './Quantri/QuanLySanPham';
import Nhanvien from './nhanvien/NhanvienDashboard';
import KhachHang from './khachhang/KhachhangDashboard';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  return (
    // 🎯 Thêm lại thẻ <Router> ở đây để sửa lỗi trắng trang
    <Router>
      <Routes>
        {/* Mặc định tự động dẫn thẳng vào trang Đăng Nhập (/login) */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Các đường dẫn trang */}
        <Route path="/login" element={<DangNhap />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/nhanvien" element={<Nhanvien />} />
        <Route path="/register" element={<Register />} />
        <Route path="/qtnhanvien" element={<QT_Nhanvien />} />
        <Route path="/qtsanpham" element={<QT_Sanpham />} />
        <Route path="/khachhang" element={<KhachHang />} />
      </Routes>
    </Router>
  );
}

export default App;
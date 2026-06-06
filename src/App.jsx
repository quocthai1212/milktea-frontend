import React from 'react';
<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import TrangChu from './TrangChu';
import Register from './khachhang/DangKy';
import DangNhap from './dangnhap/DangNhap';

import Admin from './Quantri/AdminDashboard';
import QT_Nhanvien from './Quantri/QuanLyNhanVien';
import QT_Sanpham from './Quantri/QuanLySanPham';
import QT_Thongke from './Quantri/QuanLyThongKe';
import QT_Danhmuc from './Quantri/QuanLyDanhMucSanPham';
import QT_KhuyenMai from './Quantri/QuanLyKhuyenMai';
import Nhanvien from './nhanvien/NhanvienDashboard';
import KhachHang from './khachhang/KhachhangDashboard';
import PayOSReturn from './khachhang/PayOSReturn';
import PayOSCancel from './khachhang/PayOSCancel';


import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Trang chủ */}
        <Route path="/" element={<TrangChu />} />

        {/* Alias trang chủ */}
        <Route path="/TrangChu" element={<Navigate to="/" replace />} />
        <Route path="/trang-chu" element={<Navigate to="/" replace />} />
        <Route path="/trangchu" element={<Navigate to="/" replace />} />

        {/* Auth */}
        <Route path="/login" element={<DangNhap />} />
        <Route path="/register" element={<Register />} />

        {/* Quản trị */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/qtnhanvien" element={<QT_Nhanvien />} />
        <Route path="/qtsanpham" element={<QT_Sanpham />} />
        <Route path="/qthongke" element={<QT_Thongke />} />
        <Route path="/qt_danhmuc" element={<QT_Danhmuc />} />
        <Route path="/QT_khuyenmai" element={<QT_KhuyenMai />} />

        {/* Nhân viên / khách hàng */}
        <Route path="/nhanvien" element={<Nhanvien />} />
        <Route path="/khachhang" element={<KhachHang />} />
        <Route path="/payos-return" element={<PayOSReturn />} />
        <Route path="/payos-cancel" element={<PayOSCancel />} />

        {/* Route không tồn tại thì quay về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
=======
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
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
      </Routes>
    </Router>
  );
}

<<<<<<< HEAD
export default App;
=======
export default App;
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import TrangChu from './TrangChu';
import Register from './khachhang/DangKy';
import DangNhap from './dangnhap/DangNhap';

import Admin from './Quantri/AdminDashboard';
import QT_Nhanvien from './Quantri/QuanLyNhanVien';
import QT_Shipper from './Quantri/QuanLyShipper';
import QT_Sanpham from './Quantri/QuanLySanPham';
import QT_Thongke from './Quantri/QuanLyThongKe';
import QT_Danhmuc from './Quantri/QuanLyDanhMucSanPham';
import QT_KhuyenMai from './Quantri/QuanLyKhuyenMai';
import Nhanvien from './nhanvien/NhanvienDashboard';
import KhachHang from './khachhang/KhachhangDashboard';
import Shipper from './Shipper/ShipperDashboard';
import PayOSReturn from './khachhang/PayOSReturn';
import PayOSCancel from './khachhang/PayOSCancel';
import QT_Donhang from './Quantri/QuanLyDonHang';

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
        <Route path="/qtshipper" element={<QT_Shipper />} />
        <Route path="/qtdonhang" element={<QT_Donhang />} />
        
        {/* Nhân viên / khách hàng */}
        <Route path="/nhanvien" element={<Nhanvien />} />
        <Route path="/khachhang" element={<KhachHang />} />
        <Route path="/shipper" element={<Shipper />} />
        <Route path="/payos-return" element={<PayOSReturn />} />
        <Route path="/payos-cancel" element={<PayOSCancel />} />

        {/* Route không tồn tại thì quay về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

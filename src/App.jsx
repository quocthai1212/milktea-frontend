import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

import TrangChu from './TrangChu';
import Register from './khachhang/DangKy';
import DangNhap from './dangnhap/DangNhap';

import Admin from './Quantri/AdminDashboard';
import QT_Nhanvien from './Quantri/QuanLyNhanVien';
import QT_Sanpham from './Quantri/QuanLySanPham';
import QT_Thongke from './Quantri/QuanLyThongKe';
import QT_Danhmuc from './Quantri/QuanLyDanhMucSanPham';
import QT_KhuyenMai from './Quantri/QuanLyKhuyenMai';
import QT_Donhang from './Quantri/QuanLyDonHang';
import QT_KhachHang from './Quantri/QuanLyKhachHang';
import QT_BinhLuan from './Quantri/QuanLyBinhLuan';
import QT_ChiNhanh from './Quantri/QuanLyChiNhanh';


import Nhanvien from './nhanvien/NhanvienDashboard';

import KhachHang from './khachhang/KhachhangDashboard';
import QuenPass from './khachhang/QuenMK';
import KhuyenMaiPage from './khachhang/KhuyenMaiPage';
import PayOSReturn from './khachhang/PayOSReturn';
import PayOSCancel from './khachhang/PayOSCancel';

import Shipper from './Shipper/ShipperDashboard';


import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Alias trang chủ */}
        <Route path="/" element={<TrangChu />} />
        <Route path="/TrangChu" element={<TrangChu />} />
        <Route path="/trang-chu" element={<TrangChu />} />
        <Route path="/trangchu" element={<TrangChu />} />

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
        <Route path="/qtdonhang" element={<QT_Donhang />} />
        <Route path="/qt_khachhang" element={<QT_KhachHang />} />
        <Route path="/qt_binhluan" element={<QT_BinhLuan />} />
        <Route path="/qt_chinhanh" element={<QT_ChiNhanh />} />


        
        {/* Nhân viên / khách hàng */}
        <Route path="/nhanvien" element={<Nhanvien />} />

        <Route path="/khachhang" element={<KhachHang />} />
        <Route path="/quenmk" element={<QuenPass />} />
        <Route path="/khkhuyen-mai" element={<KhuyenMaiPage />} />
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

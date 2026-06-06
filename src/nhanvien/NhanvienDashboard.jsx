import React from 'react';
// 🌟 IMPORT FILE CSS VỪA TÁCH TẠI ĐÂY (Kiểm tra lại đường dẫn tương đối cho đúng)
import '../css/nhanvien/NhanvienDashboard.css'; 

const NhanvienDashboard = () => {
  // Lấy thông tin user vừa đăng nhập để hiển thị (nếu cần)
  const user = JSON.parse(localStorage.getItem('user')) || {};

  return (
    <div className="nhanvien-dashboard-container">
      <h2>👋 Xin chào Nhân Viên: {user.full_name || 'Hệ thống'}</h2>
      <p>Chào mừng bạn đã đăng nhập thành công vào không gian làm việc!</p>
    </div>
  );
};

// 🎯 Xuất component để App.jsx có thể import và sử dụng bình thường
export default NhanvienDashboard;
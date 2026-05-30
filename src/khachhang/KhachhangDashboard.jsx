import React, { useEffect, useState } from 'react';
// 🎯 1. IMPORT COMPONENT CHAT AI
import ChatAI from './ChatAI'; 
// 🌟 2. IMPORT FILE CSS VỪA TÁCH TẠI ĐÂY
import '../css/khachhang/KhachhangDashboard.css'; 

const KhachhangDashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Lấy thông tin user đăng nhập thành công từ localStorage
    const storedUser = localStorage.getItem('user_logged_in'); 
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className="dashboard-container">
      {/* --- Giao diện Dashboard Khách Hàng --- */}
      <header className="dashboard-header">
        <h2>👋 Xin chào, {user?.full_name || 'Khách hàng'}!</h2>
        <p>Chào mừng bạn đã quay trở lại hệ thống đặt trà sữa.</p>
      </header>

      <div className="dashboard-content">
        {/* Lịch sử mua hàng, thông tin tài khoản, giỏ hàng... nằm ở đây */}
        <p>Thông tin tài khoản và lịch sử đơn hàng của bạn...</p>
      </div>
      {/* -------------------------------------------- */}

      {/* 🌟 3. NHÚNG CHATBOX AI XUỐNG ĐÁY TRANG */}
      {/* Truyền _id của user vào để Backend lưu nhật ký chat chính xác theo tài khoản khách hàng */}
      <ChatAI customerId={user?._id || user?.id || null} />
    </div>
  );
};

export default KhachhangDashboard;
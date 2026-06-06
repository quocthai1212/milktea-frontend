import React, { useState, useEffect } from 'react';
import { Users, CupSoda, CalendarDays, RefreshCw, BarChart3, DollarSign } from 'lucide-react';
// Nhập file CSS riêng vừa tạo
import '../css/quantri/QuanLyThongKe.css'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const QuanLyThongKe = () => {
  const [tabHienTai, setTabHienTai] = useState('khachhang');
  const [dataThongKe, setDataThongKe] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaiThoiGian, setLoaiThoiGian] = useState('thang');

  const layDuLieuThongKe = async () => {
    setLoading(true);
    try {
      let endpoint = `${API_URL}/api/quantri/thongke/${tabHienTai}`;
      if (tabHienTai === 'thoigian') {
        endpoint += `?kieu=${loaiThoiGian}`;
      }

      const response = await fetch(endpoint);
      const result = await response.json();
      
      if (result.success) {
        setDataThongKe(result.data);
      } else {
        console.error(result.message);
        setDataThongKe([]);
      }
    } catch (error) {
      console.error("Lỗi kết nối API thống kê:", error);
      setDataThongKe([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    layDuLieuThongKe();
  }, [tabHienTai, loaiThoiGian]);

  const tinhTongDoanhThu = () => {
    if (tabHienTai === 'khachhang') return dataThongKe.reduce((sum, item) => sum + item.tongTienChiTieu, 0);
    if (tabHienTai === 'mathang') return dataThongKe.reduce((sum, item) => sum + item.tongDoanhThuMon, 0);
    if (tabHienTai === 'thoigian') return dataThongKe.reduce((sum, item) => sum + item.doanhThu, 0);
    return 0;
  };

  return (
    <div className="tk-container">
      
      {/* TIÊU ĐỀ TRANG CHÍNH */}
      <div className="tk-header">
        <h2 className="tk-title">
          <BarChart3 size={28} color="#4f46e5" /> Thống kê báo cáo hệ thống
        </h2>
        <button onClick={layDuLieuThongKe} className="tk-btn-refresh">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      {/* TABS CHỨC NĂNG CHÍNH */}
      <div className="tk-tabs-row">
        <button 
          className={`tk-tab-btn ${tabHienTai === 'khachhang' ? 'active' : ''}`}
          onClick={() => setTabHienTai('khachhang')}
        >
          <Users size={18} /> Theo tài khoản khách hàng
        </button>
        
        <button 
          className={`tk-tab-btn ${tabHienTai === 'mathang' ? 'active' : ''}`}
          onClick={() => setTabHienTai('mathang')}
        >
          <CupSoda size={18} /> Theo mặt hàng
        </button>
        
        <button 
          className={`tk-tab-btn ${tabHienTai === 'thoigian' ? 'active' : ''}`}
          onClick={() => setTabHienTai('thoigian')}
        >
          <CalendarDays size={18} /> Theo tháng / quý / năm
        </button>
      </div>

      {/* BỘ LỌC PHỤ CHO TAB THỜI GIAN */}
      {tabHienTai === 'thoigian' && (
        <div className="tk-filter-sub">
          <span className="tk-filter-label">Chế độ xem:</span>
          {['thang', 'quy', 'nam'].map((kieu) => (
            <button
              key={kieu}
              onClick={() => setLoaiThoiGian(kieu)}
              className={`tk-filter-btn ${loaiThoiGian === kieu ? 'active' : ''}`}
            >
              {kieu === 'thang' ? 'Theo Tháng' : kieu === 'quy' ? 'Theo Quý' : 'Theo Năm'}
            </button>
          ))}
        </div>
      )}

      {/* THẺ TỔNG DOANH THU SƠ BỘ */}
      <div className="tk-summary-card">
        <div className="tk-icon-box"><DollarSign size={28} /></div>
        <div>
          <span className="tk-summary-label">Tổng doanh thu ước tính trên tab này:</span>
          <h3 className="tk-summary-value">{tinhTongDoanhThu().toLocaleString('vi-VN')} đ</h3>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU HIỂN THỊ */}
      <div className="tk-table-wrapper">
        {loading ? (
          <div className="tk-status-message">Đang tính toán và tải báo cáo từ database thực tế...</div>
        ) : dataThongKe.length === 0 ? (
          <div className="tk-status-message">Chưa có dữ liệu đơn hàng hoàn thành (completed) cho mục này.</div>
        ) : (
          <table className="tk-table">
            <thead>
              <tr>
                {tabHienTai === 'khachhang' && (
                  <>
                    <th>Tên khách hàng</th>
                    <th>Số điện thoại</th>
                    <th>Email tài khoản</th>
                    <th className="text-center">Tổng đơn hàng</th>
                    <th>Tổng tiền tích lũy</th>
                  </>
                )}
                {tabHienTai === 'mathang' && (
                  <>
                    <th>Tên sản phẩm / Món uống</th>
                    <th className="text-center">Số lượng bán ra (Ly)</th>
                    <th>Tổng doanh thu món</th>
                  </>
                )}
                {tabHienTai === 'thoigian' && (
                  <>
                    <th>Mốc thời gian báo cáo</th>
                    <th className="text-center">Số lượng đơn hàng</th>
                    <th>Thu phí giao hàng</th>
                    <th>Tổng doanh thu bán hàng</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {dataThongKe.map((item, index) => (
                <tr key={index}>
                  
                  {/* Dữ liệu Tab Khách Hàng */}
                  {tabHienTai === 'khachhang' && (
                    <>
                      <td><span className="text-bold">{item.full_name}</span></td>
                      <td>{item.phone || 'Chưa cập nhật'}</td>
                      <td className="text-muted">{item.email}</td>
                      <td className="text-center text-bold">{item.tongSoDonHang} đơn</td>
                      <td className="text-success">{item.tongTienChiTieu.toLocaleString('vi-VN')} đ</td>
                    </>
                  )}

                  {/* Dữ liệu Tab Mặt Hàng */}
                  {tabHienTai === 'mathang' && (
                    <>
                      <td><span className="text-bold">{item._id}</span></td>
                      <td className="text-center text-primary">{item.tongSoLuongBan} ly</td>
                      <td className="text-success">{item.tongDoanhThuMon.toLocaleString('vi-VN')} đ</td>
                    </>
                  )}

                  {/* Dữ liệu Tab Thời Gian */}
                  {tabHienTai === 'thoigian' && (
                    <>
                      <td><span className="text-bold">{item.thoiGian}</span></td>
                      <td className="text-center">{item.tongDonHang} đơn</td>
                      <td className="text-muted">+{item.tongTienGiaoHang.toLocaleString('vi-VN')} đ</td>
                      <td className="text-success">{item.doanhThu.toLocaleString('vi-VN')} đ</td>
                    </>
                  )}

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default QuanLyThongKe;
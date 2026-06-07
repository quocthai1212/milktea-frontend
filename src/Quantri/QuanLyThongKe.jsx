import React, { useState, useEffect } from 'react';
import { Users, CupSoda, CalendarDays, RefreshCw, BarChart3, DollarSign, X, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
// Import các component biểu đồ từ thư viện Recharts
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import '../css/quantri/QuanLyThongKe.css'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const QuanLyThongKe = () => {
  const [tabHienTai, setTabHienTai] = useState('khachhang');
  const [dataThongKe, setDataThongKe] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaiThoiGian, setLoaiThoiGian] = useState('thang');

  // State Modal Chi tiết (Drill-down)
  const [modalOpen, setModalOpen] = useState(false);
  const [chiTietTitle, setChiTietTitle] = useState('');
  const [danhSachChiTiet, setDanhSachChiTiet] = useState([]);
  const [loadingChiTiet, setLoadingChiTiet] = useState(false);
  
  // Bộ lọc phụ trong Modal: 'all' (Tất cả), 'completed' (Thành công), 'failed' (Thất bại)
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

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
        setDataThongKe(result.data || []);
      } else {
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

  // Tách hàm gọi API chi tiết đơn để tái sử dụng khi bấm chuyển tab Filter trong Modal
  const tailLaiChiTietDon = async (item, forceStatus = 'all') => {
    setLoadingChiTiet(false);
    let targetId = '';
    let titleStr = '';

    if (tabHienTai === 'khachhang') {
      targetId = item._id;
      titleStr = `Lịch sử đơn hàng của: ${item.full_name || 'Khách vãng lai'}`;
    } else if (tabHienTai === 'mathang') {
      targetId = item._id;
      titleStr = `Các hóa đơn có mua: ${item.tenSanPham}`;
    } else if (tabHienTai === 'thoigian') {
      targetId = item.thoiGian;
      titleStr = `Danh sách đơn hàng thuộc mốc: ${item.thoiGian}`;
    }

    setChiTietTitle(titleStr);

    try {
      setLoadingChiTiet(true);
      const url = `${API_URL}/api/quantri/thongke/chitiet?tab=${tabHienTai}&id=${targetId}&kieuThoiGian=${loaiThoiGian}&statusFilter=${forceStatus}`;
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) setDanhSachChiTiet(result.data || []);
      else setDanhSachChiTiet([]);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu chi tiết:", error);
      setDanhSachChiTiet([]);
    } finally {
      setLoadingChiTiet(false);
    }
  };

  const handleXemChiTiet = (item) => {
    setSelectedItem(item);
    setStatusFilter('all');
    setModalOpen(true);
    tailLaiChiTietDon(item, 'all');
  };

  // Lắng nghe sự thay đổi của bộ lọc trong modal
  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    if (selectedItem) {
      tailLaiChiTietDon(selectedItem, newStatus);
    }
  };

  const tinhTongDoanhThu = () => {
    if (!dataThongKe || dataThongKe.length === 0) return 0;
    if (tabHienTai === 'khachhang') return dataThongKe.reduce((sum, item) => sum + (item.tongTienChiTieu || 0), 0);
    if (tabHienTai === 'mathang') return dataThongKe.reduce((sum, item) => sum + (item.tongDoanhThuMon || 0), 0);
    if (tabHienTai === 'thoigian') return dataThongKe.reduce((sum, item) => sum + (item.doanhThu || 0), 0);
    return 0;
  };

  const BIEUDO_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

  // --- RENDER PHẦN BIỂU ĐỒ NÂNG CẤP (HIỂN THỊ SONG SONG GIAO THẤT BẠI) ---
  const renderBieuDo = () => {
    if (loading || !dataThongKe || dataThongKe.length === 0) return null;

    const dataBieuDoThoiGian = tabHienTai === 'thoigian' ? [...dataThongKe].reverse() : dataThongKe;

    return (
      <div className="tk-chart-card">
        <h3 className="tk-chart-title">📊 Biểu đồ trực quan hóa dữ liệu thống kê</h3>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            {tabHienTai === 'thoigian' ? (
              /* 📈 BIỂU ĐỒ DOANH THU THEO THỜI GIAN */
              <AreaChart data={dataBieuDoThoiGian} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDoanhThu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="thoiGian" stroke="#64748b" style={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" style={{ fontSize: 12 }} tickFormatter={(value) => `${(value/1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value) => [`${value.toLocaleString('vi-VN')} đ`, 'Doanh thu ròng']} />
                <Area type="monotone" dataKey="doanhThu" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorDoanhThu)" />
              </AreaChart>
            ) : tabHienTai === 'khachhang' ? (
              /* 📊 BIỂU ĐỒ CỘT ĐƠN THÀNH CÔNG VS THẤT BẠI THEO KHÁCH HÀNG */
              <BarChart data={dataThongKe.slice(0, 7)} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="full_name" stroke="#64748b" style={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
                <Tooltip />
                <Legend style={{ fontSize: 12 }} />
                <Bar name="Đơn thành công" dataKey="donThanhCong" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar name="Đơn thất bại (Bom)" dataKey="donThatBai" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            ) : (
              /* 🍕 BIỂU ĐỒ HÌNH TRÒN CƠ CẤU MẶT HÀNG */
              <PieChart>
                <Pie
                  data={dataThongKe.slice(0, 6)}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="tongSoLuongBan"
                  nameKey="tenSanPham"
                  label={(entry) => `${entry.tenSanPham} (${entry.tongSoLuongBan} ly)`}
                  style={{ fontSize: 11, fontWeight: 600 }}
                >
                  {dataThongKe.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BIEUDO_COLORS[index % BIEUDO_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Ly`, 'Số lượng bán']} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="tk-container">
      {/* TIÊU ĐỀ TRANG CHÍNH */}
      <div className="tk-header">
        <h2 className="tk-title">
          <BarChart3 size={26} className="tk-title-icon" /> Thống kê & Báo cáo hệ thống chuyên sâu
        </h2>
        <button onClick={layDuLieuThongKe} className="tk-btn-refresh" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'tk-spin' : ''} /> 
          <span>{loading ? 'Đang tải...' : 'Làm mới dữ liệu'}</span>
        </button>
      </div>

      {/* TABS CHỨC NĂNG CHÍNH */}
      <div className="tk-tabs-row">
        <button type="button" className={`tk-tab-btn ${tabHienTai === 'khachhang' ? 'active' : ''}`} onClick={() => setTabHienTai('khachhang')}>
          <Users size={16} /> <span>Theo tài khoản khách hàng</span>
        </button>
        <button type="button" className={`tk-tab-btn ${tabHienTai === 'mathang' ? 'active' : ''}`} onClick={() => setTabHienTai('mathang')}>
          <CupSoda size={16} /> <span>Theo mặt hàng bán chạy</span>
        </button>
        <button type="button" className={`tk-tab-btn ${tabHienTai === 'thoigian' ? 'active' : ''}`} onClick={() => setTabHienTai('thoigian')}>
          <CalendarDays size={16} /> <span>Doanh thu theo thời gian</span>
        </button>
      </div>

      {/* BỘ LỌC PHỤ CHO TAB THỜI GIAN */}
      {tabHienTai === 'thoigian' && (
        <div className="tk-filter-sub">
          <span className="tk-filter-label">Chế độ xem cấu trúc:</span>
          <div className="tk-filter-group">
            {['thang', 'quy', 'nam'].map((kieu) => (
              <button key={kieu} type="button" onClick={() => setLoaiThoiGian(kieu)} className={`tk-filter-btn ${loaiThoiGian === kieu ? 'active' : ''}`}>
                {kieu === 'thang' ? 'Theo Tháng' : kieu === 'quy' ? 'Theo Quý' : 'Theo Năm'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* THỂ TỔNG DOANH THU SƠ BỘ */}
      <div className="tk-summary-card">
        <div className="tk-icon-box"><DollarSign size={24} /></div>
        <div className="tk-summary-text">
          <span className="tk-summary-label">Tổng doanh thu tích lũy ước tính thực tế (Đơn đã completed):</span>
          <h3 className="tk-summary-value">{tinhTongDoanhThu().toLocaleString('vi-VN')} đ</h3>
        </div>
      </div>

      {/* BIỂU ĐỒ */}
      {renderBieuDo()}

      {/* BẢNG DỮ LIỆU HIỂN THỊ CHÍNH */}
      <div className="tk-table-wrapper" style={{ marginTop: '24px' }}>
        {loading ? (
          <div className="tk-status-box text-loading">
            <div className="tk-loading-spinner"></div>
            <p>Đang tiến hành tổng hợp dữ liệu thời gian thực từ database...</p>
          </div>
        ) : !dataThongKe || dataThongKe.length === 0 ? (
          <div className="tk-status-box text-empty">
            <p>📭 Chưa ghi nhận dữ liệu thống kê nào trùng khớp cho mục này.</p>
          </div>
        ) : (
          <table className="tk-table">
            <thead>
              <tr>
                {tabHienTai === 'khachhang' && (
                  <>
                    <th>Tên khách hàng</th>
                    <th>Số điện thoại</th>
                    <th className="text-center">Đơn thành công</th>
                    <th className="text-center">Đơn thất bại (Bom)</th>
                    <th className="text-right">Doanh thu tích lũy</th>
                    <th className="text-center">Hành động</th>
                  </>
                )}
                {tabHienTai === 'mathang' && (
                  <>
                    <th style={{ width: '80px' }}>Hình ảnh</th>
                    <th>Tên sản phẩm / Món uống</th>
                    <th className="text-center">Đã bán</th>
                    <th className="text-center">Bị hủy / Hoàn</th>
                    <th className="text-right">Doanh thu món</th>
                    <th className="text-center">Hành động</th>
                  </>
                )}
                {tabHienTai === 'thoigian' && (
                  <>
                    <th>Mốc thời gian báo cáo</th>
                    <th className="text-center">Đơn thành công</th>
                    <th className="text-center">Đơn thất bại</th>
                    <th className="text-right">Phí giao hàng</th>
                    <th className="text-right">Doanh thu ròng</th>
                    <th className="text-center">Hành động</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {dataThongKe.map((item, index) => (
                <tr key={index}>
                  {tabHienTai === 'khachhang' && (
                    <>
                      <td><span className="tk-highlight-text">{item?.full_name || 'Khách vãng lai'}</span></td>
                      <td><span className="tk-phone-badge">{item?.phone || 'Chưa cập nhật'}</span></td>
                      <td className="text-center">
                        <span className="tk-counter-badge success-bg">{item?.donThanhCong || 0} đơn</span>
                      </td>
                      <td className="text-center">
                        <span className={`tk-counter-badge ${item?.donThatBai > 0 ? 'danger-bg' : 'muted-bg'}`}>
                          {item?.donThatBai || 0} đơn
                        </span>
                      </td>
                      <td className="text-right text-success text-bold">{(item?.tongTienChiTieu || 0).toLocaleString('vi-VN')} đ</td>
                    </>
                  )}

                  {tabHienTai === 'mathang' && (
                    <>
                      <td>
                        <img 
                          src={item?.image_url ? (item.image_url.startsWith('http') ? item.image_url : `${API_URL}/${item.image_url}`) : 'https://placehold.co/50x50?text=No+Image'} 
                          alt={item?.tenSanPham || 'Sản phẩm'} 
                          className="tk-product-img"
                          onError={(e) => { e.target.src = 'https://placehold.co/50x50?text=MilkTea'; }}
                        />
                      </td>
                      <td><span className="tk-highlight-text">{item?.tenSanPham || 'Sản phẩm ẩn'}</span></td>
                      <td className="text-center"><span className="tk-qty-badge success-bg">{item?.tongSoLuongBan || 0} ly</span></td>
                      <td className="text-center">
                        <span className={`tk-qty-badge ${item?.soLuongBiHoan > 0 ? 'danger-bg' : 'muted-bg'}`}>
                          {item?.soLuongBiHoan || 0} ly
                        </span>
                      </td>
                      <td className="text-right text-success text-bold">{(item?.tongDoanhThuMon || 0).toLocaleString('vi-VN')} đ</td>
                    </>
                  )}

                  {tabHienTai === 'thoigian' && (
                    <>
                      <td><span className="tk-time-badge">{item?.thoiGian || 'Không rõ'}</span></td>
                      <td className="text-center">
                        <span className="tk-counter-badge success-bg">{item?.donThanhCong || 0} đơn</span>
                      </td>
                      <td className="text-center">
                        <span className={`tk-counter-badge ${item?.donThatBai > 0 ? 'danger-bg' : 'muted-bg'}`}>
                          {item?.donThatBai || 0} đơn
                        </span>
                      </td>
                      <td className="text-right text-muted">+{ (item?.tongTienGiaoHang || 0).toLocaleString('vi-VN')} đ</td>
                      <td className="text-right text-success text-bold">{(item?.doanhThu || 0).toLocaleString('vi-VN')} đ</td>
                    </>
                  )}

                  <td className="text-center">
                    <button type="button" className="tk-btn-action" onClick={() => handleXemChiTiet(item)}>
                      <Eye size={14} /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL POPUP DRILL-DOWN CHI TIẾT ĐÃ CẢI TIẾN BỘ LỌC ĐƠN THẤT BẠI */}
      {modalOpen && (
        <div className="tk-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="tk-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="tk-modal-header">
              <h4 className="tk-modal-title">{chiTietTitle}</h4>
              <button className="tk-modal-close" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            
            {/* Thanh Tab bộ lọc trạng thái nhỏ ngay trong Modal */}
            <div className="tk-modal-filter-tabs">
              <button className={`tk-m-tab ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => handleStatusFilterChange('all')}>
                Tất cả đơn
              </button>
              <button className={`tk-m-tab text-success ${statusFilter === 'completed' ? 'active' : ''}`} onClick={() => handleStatusFilterChange('completed')}>
                🟢 Giao thành công
              </button>
              <button className={`tk-m-tab text-danger ${statusFilter === 'failed' ? 'active' : ''}`} onClick={() => handleStatusFilterChange('failed')}>
                🔴 Đơn giao thất bại
              </button>
            </div>

            <div className="tk-modal-body">
              {loadingChiTiet ? (
                <div className="tk-modal-loading">
                  <div className="tk-loading-spinner"></div>
                  <p>Đang bóc tách chi tiết dữ liệu đơn hàng...</p>
                </div>
              ) : danhSachChiTiet.length === 0 ? (
                <p className="tk-modal-empty">Không tìm thấy hóa đơn nào trùng khớp với trạng thái lựa chọn.</p>
              ) : (
                <div className="tk-modal-table-container">
                  <table className="tk-modal-table">
                    <thead>
                      <tr>
                        <th>Mã Đơn Hàng</th>
                        <th>Khách Hàng / Shipper</th>
                        <th>Ngày Cập Nhật</th>
                        <th>Chi Tiết Giỏ Hàng</th>
                        <th>Trạng Thái / Lý do bom</th>
                        <th className="text-right">Tổng Tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {danhSachChiTiet.map((don, idx) => (
                        <tr key={don._id || idx} className={`tk-modal-row status-${don.status}`}>
                          <td><span className="tk-code-text">#{don._id?.slice(-8).toUpperCase()}</span></td>
                          <td>
                            <div className="tk-user-info">
                              <strong>👤 {don.customer_id?.full_name || 'Khách ngoại tuyến'}</strong>
                              <span className="text-muted">📞 {don.customer_id?.phone || 'N/A'}</span>
                              {don.shipper_id && (
                                <span className="tk-shipper-tag">🏍️ Tài xế: {don.shipper_id.full_name}</span>
                              )}
                            </div>
                          </td>
                          <td>{new Date(don.updatedAt || don.createdAt).toLocaleDateString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</td>
                          <td>
                            <ul className="tk-modal-items-list">
                              {don.items?.map((mon, mIdx) => (
                                <li key={mIdx}>
                                  🥤 {mon.product_name} <strong className="text-primary">x{mon.quantity}</strong>
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td>
                            {don.status === 'completed' ? (
                              <span className="m-badge badge-success"><CheckCircle size={12} /> Thành công</span>
                            ) : (
                              <div className="tk-failed-wrapper">
                                <span className="m-badge badge-danger"><AlertTriangle size={12} /> Thất bại</span>
                                {don.cancel_reason && (
                                  <p className="tk-cancel-reason-text" title={don.cancel_reason}>
                                    ⚠️ {don.cancel_reason}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>
                          <td className={`text-right text-bold ${don.status === 'completed' ? 'text-success' : 'text-danger-strike'}`}>
                            {don.total_amount?.toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuanLyThongKe;
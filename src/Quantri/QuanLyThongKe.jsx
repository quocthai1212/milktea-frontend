import React, { useState, useEffect } from 'react';
import {
  Users,
  CupSoda,
  CalendarDays,
  RefreshCw,
  BarChart3,
  DollarSign,
  X,
  Eye,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import '../css/quantri/QuanLyThongKe.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const QuanLyThongKe = () => {
  const [tabHienTai, setTabHienTai] = useState('khachhang');
  const [dataThongKe, setDataThongKe] = useState([]);
  const [loading, setLoading] = useState(false);
  // Tổng doanh thu lũy kế (không đổi khi lọc ngày)
  const [tongLuyKe, setTongLuyKe] = useState(0);

  // Chế độ xem cấu trúc: thang / quy / nam
  const [loaiThoiGian, setLoaiThoiGian] = useState('thang');

  // Bộ lọc khoảng ngày
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');

  // Khi có từ ngày hoặc đến ngày thì tự chuyển sang thống kê theo ngày
  // và bỏ chọn chế độ xem cấu trúc ở giao diện
  const dangLocTheoKhoangNgay = Boolean(tuNgay || denNgay);

  // State Modal Chi tiết
  const [modalOpen, setModalOpen] = useState(false);
  const [chiTietTitle, setChiTietTitle] = useState('');
  const [danhSachChiTiet, setDanhSachChiTiet] = useState([]);
  const [loadingChiTiet, setLoadingChiTiet] = useState(false);

  // Bộ lọc phụ trong Modal
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

  const layDuLieuThongKe = async () => {
    setLoading(true);
    try {
      let endpoint = `${API_URL}/api/quantri/thongke/${tabHienTai}`;

      if (tabHienTai === 'thoigian') {
        const kieuThongKe = dangLocTheoKhoangNgay ? 'ngay' : loaiThoiGian;

        const params = new URLSearchParams({
          kieu: kieuThongKe,
        });

        if (tuNgay) params.set('tuNgay', tuNgay);
        if (denNgay) params.set('denNgay', denNgay);

        endpoint += `?${params.toString()}`;
      }

      const response = await fetch(endpoint);
      const result = await response.json();

      if (result.success) {
        setDataThongKe(result.data || []);
      } else {
        setDataThongKe([]);
      }
    } catch (error) {
      console.error('Lỗi kết nối API thống kê:', error);
      setDataThongKe([]);
    } finally {
      setLoading(false);
    }
  };

  const layTongDoanhThuLuyKe = async () => {
    try {
      const url = `${API_URL}/api/quantri/thongke/tongluyke`;
      const resp = await fetch(url);
      const json = await resp.json();
      if (json.success && json.data) {
        setTongLuyKe(json.data.tongDoanhThuLuyKe || 0);
      }
    } catch (err) {
      console.error('Lỗi lấy tổng doanh thu lũy kế:', err);
    }
  };

  const handleRefresh = () => {
    layDuLieuThongKe();
    if (tabHienTai === 'thoigian') layTongDoanhThuLuyKe();
  };

  useEffect(() => {
    layDuLieuThongKe();
    if (tabHienTai === 'thoigian') layTongDoanhThuLuyKe();
  }, [tabHienTai, loaiThoiGian, tuNgay, denNgay]);

  const taiLaiChiTietDon = async (item, forceStatus = 'all') => {
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
      const params = new URLSearchParams({
        tab: tabHienTai,
        id: targetId,
        kieuThoiGian:
          tabHienTai === 'thoigian' && dangLocTheoKhoangNgay
            ? 'ngay'
            : loaiThoiGian,
        statusFilter: forceStatus,
      });

      if (tabHienTai === 'thoigian') {
        if (tuNgay) params.set('tuNgay', tuNgay);
        if (denNgay) params.set('denNgay', denNgay);
      }

      const url = `${API_URL}/api/quantri/thongke/chitiet?${params.toString()}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setDanhSachChiTiet(result.data || []);
      } else {
        setDanhSachChiTiet([]);
      }
    } catch (error) {
      console.error('Lỗi lấy dữ liệu chi tiết:', error);
      setDanhSachChiTiet([]);
    } finally {
      setLoadingChiTiet(false);
    }
  };

  const handleXemChiTiet = (item) => {
    setSelectedItem(item);
    setStatusFilter('all');
    setModalOpen(true);
    taiLaiChiTietDon(item, 'all');
  };

  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    if (selectedItem) {
      taiLaiChiTietDon(selectedItem, newStatus);
    }
  };

  const handleChonCheDoCauTruc = (kieu) => {
    if (dangLocTheoKhoangNgay) return;
    setLoaiThoiGian(kieu);
  };

  const handleXoaLocNgay = () => {
    setTuNgay('');
    setDenNgay('');
  };

  const formatDateDisplay = (isoDate) => {
    if (!isoDate) return '...';
    const parts = isoDate.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('vi-VN');
    } catch (e) {
      return isoDate;
    }
  };

  const BIEUDO_COLORS = [
    '#6366f1',
    '#06b6d4',
    '#10b981',
    '#f59e0b',
    '#ec4899',
    '#8b5cf6',
    '#64748b',
  ];

  const renderBieuDo = () => {
    const hasData = Array.isArray(dataThongKe) && dataThongKe.length > 0;
    if (!loading && !hasData) return null;

    const dataBieuDoThoiGian =
      tabHienTai === 'thoigian' ? [...dataThongKe].reverse() : dataThongKe;

    // Custom Tooltip kính mờ tối thượng (Kính mờ Dark Mode Cyberpunk)
    const CustomTooltipChuyenSau = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'left'
          }}>
            <p style={{ margin: '0 0 6px 0', fontWeight: '700', color: '#94a3b8', fontSize: '12px', letterSpacing: '0.5px' }}>
              {tabHienTai === 'khachhang' ? `👤 KHÁCH HÀNG: ${label}` : tabHienTai === 'mathang' ? `🥤 MÓN: ${label}` : `📅 MỐC: ${label}`}
            </p>
            {payload.map((entry, index) => {
              if (tabHienTai === 'thoigian' && entry.dataKey !== 'doanhThu') return null;
              
              const isMathangBan = tabHienTai === 'mathang' && entry.name.includes('bán');
              return (
                <p key={index} style={{ margin: '4px 0 0 0', fontSize: '13px', color: tabHienTai === 'thoigian' ? '#38bdf8' : entry.color || '#4f46e5', fontWeight: '600' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tabHienTai === 'thoigian' ? '#ec4899' : entry.color || '#4f46e5', marginRight: '6px' }}></span>
                  {entry.name}: <strong style={{ color: '#ffffff' }}>{Number(entry.value).toLocaleString('vi-VN')} {isMathangBan ? 'ly' : 'đ'}</strong>
                </p>
              );
            })}
          </div>
        );
      }
      return null;
    };

    return (
      <div className="tk-chart-card" style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', borderRadius: '20px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid #334155', marginTop: '24px' }}>
        <h3 className="tk-chart-title" style={{ fontSize: '16px', fontWeight: '600', color: '#f8fafc', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🌊</span> {tabHienTai === 'thoigian' ? 'Biểu đồ lượng sóng nhấp nhô không gian chiều sâu (3D Cyber Wave)' : 'Biểu đồ phân tích dữ liệu hoạt động'}
        </h3>

        <div className="tk-chart-box" style={{ position: 'relative', width: '100%', height: '380px' }}>
          {loading && (
            <div className="tk-chart-loading-layer" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(2px)', borderRadius: '12px', position: 'absolute', inset: 0, zIndex: 10 }}>
              <RefreshCw size={18} className="tk-spin" style={{ color: '#38bdf8' }} />
              <span style={{ color: '#94a3b8', fontWeight: '500', fontSize: '14px' }}>Đang cấu trúc dải sóng...</span>
            </div>
          )}

          <ResponsiveContainer width="100%" height="100%">
            {tabHienTai === 'thoigian' ? (
              /* --- TAB THỜI GIAN: BIỂU ĐỒ 3D LƯỢN SÓNG NHẤP NHÔ ĐA SẮC CHUYỂN VỊ --- */
              <AreaChart
                data={dataBieuDoThoiGian}
                margin={{ top: 20, right: 15, left: 10, bottom: 5 }}
              >
                <defs>
                  {/* Lớp Sóng 1 chính: Vàng nắng chuyển Hồng cam nằm ngang */}
                  <linearGradient id="cyberGradientTop" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.85} />
                    <stop offset="50%" stopColor="#ec4899" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.75} />
                  </linearGradient>

                  {/* Lớp Sóng 2 nền mờ phía sau: Hồng Neon */}
                  <linearGradient id="cyberGradientMid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d946ef" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>

                  {/* Lớp Sóng 3 tầng sâu: Xanh Cyan phủ sương */}
                  <linearGradient id="cyberGradientBottom" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity={0.0} />
                  </linearGradient>

                  {/* Bộ lọc tạo hiệu ứng phát sáng Neon cho viền đỉnh sóng */}
                  <filter id="cyberNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor="#ec4899" floodOpacity="0.4" />
                  </filter>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} vertical={false} />
                <XAxis dataKey="thoiGian" stroke="#64748b" style={{ fontSize: 11, fontWeight: '600' }} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="#64748b" style={{ fontSize: 11, fontWeight: '600' }} tickLine={false} axisLine={false} dx={-8} tickFormatter={(val) => `${(Number(val) / 1000000).toFixed(1)}M`} />
                <Tooltip content={<CustomTooltipChuyenSau />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }} />

                {/* TẦNG SÓNG THỨ 3 (SÂU NHẤT): Tạo sương ánh sáng Xanh Cyan */}
                <Area
                  type="monotone"
                  dataKey="doanhThu"
                  stroke="transparent"
                  fill="url(#cyberGradientBottom)"
                  style={{ transform: 'translateY(14px) scaleY(0.96)' }}
                  isAnimationActive={true}
                  animationDuration={1400}
                />

                {/* TẦNG SÓNG THỨ 2 (GIỮA DỊCH TRỤC): Tạo chiều sâu lồi lõm màu Hồng tím */}
                <Area
                  type="monotone"
                  dataKey="doanhThu"
                  stroke="#d946ef"
                  strokeWidth={1}
                  fill="url(#cyberGradientMid)"
                  style={{ transform: 'translateY(7px)' }}
                  isAnimationActive={true}
                  animationDuration={1000}
                />

                {/* TẦNG SÓNG THỨ 1 (TRÊN CÙNG): Đường ruy-băng chính phát sáng rực rỡ */}
                <Area
                  name="Doanh thu ròng"
                  type="monotone"
                  dataKey="doanhThu"
                  stroke="url(#cyberGradientTop)"
                  strokeWidth={5}
                  fill="url(#cyberGradientTop)"
                  fillOpacity={0.12}
                  style={{ filter: 'url(#cyberNeonGlow)' }}
                  isAnimationActive={true}
                  animationDuration={750}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            ) : tabHienTai === 'khachhang' ? (
              /* --- TAB KHÁCH HÀNG: BIỂU ĐỒ CỘT BO TRÒN TRÊN NỀN TỐI --- */
              <BarChart
                data={dataThongKe.slice(0, 7)}
                margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
                barGap={6}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="#334155" opacity={0.2} vertical={false} />
                <XAxis dataKey="full_name" stroke="#64748b" style={{ fontSize: 11, fontWeight: '500' }} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="#64748b" style={{ fontSize: 11, fontWeight: '500' }} tickLine={false} axisLine={false} dx={-8} />
                <Tooltip content={<CustomTooltipChuyenSau />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '15px', fontSize: '12px', fontWeight: '500', color: '#94a3b8' }} />

                <Bar
                  name="Đơn thành công"
                  dataKey="donThanhCong"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  barSize={14}
                  isAnimationActive={true}
                  animationDuration={800}
                />

                <Bar
                  name="Đơn thất bại (Bom)"
                  dataKey="donThatBai"
                  fill="#ef4444"
                  radius={[6, 6, 0, 0]}
                  barSize={14}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </BarChart>
            ) : (
              /* --- TAB MẶT HÀNG: BIỂU ĐỒ TRÒN DONUT KHUYẾT TÂM --- */
              <PieChart>
                <Pie
                  data={dataThongKe.slice(0, 6)}
                  cx="50%"
                  cy="45%"
                  innerRadius={70}
                  outerRadius={105}
                  paddingAngle={5}
                  dataKey="tongSoLuongBan"
                  nameKey="tenSanPham"
                  label={({ tenSanPham, percent }) => `${tenSanPham} (${(percent * 100).toFixed(0)}%)`}
                  style={{ fontSize: 11, fontWeight: '600', fill: '#94a3b8' }}
                  isAnimationActive={true}
                  animationDuration={700}
                >
                  {dataThongKe.slice(0, 6).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={BIEUDO_COLORS[index % BIEUDO_COLORS.length]}
                      style={{ filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.3))', outline: 'none' }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipChuyenSau />} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="tk-container">
      <div className="tk-header">
        <h2 className="tk-title">
          <BarChart3 size={26} className="tk-title-icon" />
          Thống kê & Báo cáo hệ thống chuyên sâu
        </h2>

        <button
          type="button"
          onClick={handleRefresh}
          className="tk-btn-refresh"
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'tk-spin' : ''} />
          <span>{loading ? 'Đang tải...' : 'Làm mới dữ liệu'}</span>
        </button>
      </div>

      <div className="tk-tabs-row">
        <button
          type="button"
          className={`tk-tab-btn ${tabHienTai === 'khachhang' ? 'active' : ''}`}
          onClick={() => setTabHienTai('khachhang')}
        >
          <Users size={16} />
          <span>Theo tài khoản khách hàng</span>
        </button>

        <button
          type="button"
          className={`tk-tab-btn ${tabHienTai === 'mathang' ? 'active' : ''}`}
          onClick={() => setTabHienTai('mathang')}
        >
          <CupSoda size={16} />
          <span>Theo mặt hàng bán chạy</span>
        </button>

        <button
          type="button"
          className={`tk-tab-btn ${tabHienTai === 'thoigian' ? 'active' : ''}`}
          onClick={() => setTabHienTai('thoigian')}
        >
          <CalendarDays size={16} />
          <span>Doanh thu theo thời gian</span>
        </button>
      </div>

      {tabHienTai === 'thoigian' && (
        <div className="tk-filter-sub">
          <span className="tk-filter-label">Chế độ xem cấu trúc:</span>

          <div className="tk-filter-group">
            {['thang', 'quy', 'nam'].map((kieu) => (
              <button
                key={kieu}
                type="button"
                disabled={dangLocTheoKhoangNgay}
                onClick={() => handleChonCheDoCauTruc(kieu)}
                className={`tk-filter-btn ${
                  !dangLocTheoKhoangNgay && loaiThoiGian === kieu
                    ? 'active'
                    : ''
                }`}
                title={
                  dangLocTheoKhoangNgay
                    ? 'Đang lọc theo khoảng ngày nên chế độ Tháng / Quý / Năm tạm thời bị tắt'
                    : ''
                }
              >
                {kieu === 'thang'
                  ? 'Theo Tháng'
                  : kieu === 'quy'
                  ? 'Theo Quý'
                  : 'Theo Năm'}
              </button>
            ))}
          </div>

          <div className="tk-date-range-filter">
            <label>
              <span>Từ ngày</span>
              <input
                type="date"
                value={tuNgay}
                max={denNgay || undefined}
                onChange={(e) => setTuNgay(e.target.value)}
              />
            </label>

            <label>
              <span>Đến ngày</span>
              <input
                type="date"
                value={denNgay}
                min={tuNgay || undefined}
                onChange={(e) => setDenNgay(e.target.value)}
              />
            </label>

            {dangLocTheoKhoangNgay && (
              <button
                type="button"
                className="tk-clear-date-btn"
                onClick={handleXoaLocNgay}
              >
                Xóa lọc ngày
              </button>
            )}
          </div>

          {dangLocTheoKhoangNgay && (
            <span className="tk-date-chart-note">
              Đang lọc theo khoảng ngày. Biểu đồ sẽ thống kê theo từng ngày.
            </span>
          )}
        </div>
      )}

      <div className="tk-summary-row">
        <div className="tk-summary-card">
          <div className="tk-icon-box">
            <DollarSign size={24} />
          </div>

          <div className="tk-summary-text">
            <span className="tk-summary-label">
              Tổng doanh thu tích lũy ước tính thực tế (Đơn đã completed):
            </span>

            <h3 className="tk-summary-value">
              {tongLuyKe.toLocaleString('vi-VN')} đ
            </h3>
          </div>
        </div>

        {/* Bên phải: hiển thị tổng doanh thu trong khoảng ngày được chọn */}
        {tabHienTai === 'thoigian' && dangLocTheoKhoangNgay && (
          <div className="tk-summary-card tk-summary-card--right">
            <div className="tk-icon-box">
              <DollarSign size={24} />
            </div>

            <div className="tk-summary-text">
              <span className="tk-summary-label">
                Tổng doanh thu từ ngày {formatDateDisplay(tuNgay)} đến {formatDateDisplay(denNgay)}:
              </span>

              <h3 className="tk-summary-value">
                {dataThongKe
                  .reduce((s, it) => s + (it.doanhThu || 0), 0)
                  .toLocaleString('vi-VN')}{' '}
                đ
              </h3>
            </div>
          </div>
        )}
      </div>

      {renderBieuDo()}

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
                <tr key={item?._id || item?.thoiGian || index}>
                  {tabHienTai === 'khachhang' && (
                    <>
                      <td>
                        <span className="tk-highlight-text">
                          {item?.full_name || 'Khách vãng lai'}
                        </span>
                      </td>

                      <td>
                        <span className="tk-phone-badge">
                          {item?.phone || 'Chưa cập nhật'}
                        </span>
                      </td>

                      <td className="text-center">
                        <span className="tk-counter-badge success-bg">
                          {item?.donThanhCong || 0} đơn
                        </span>
                      </td>

                      <td className="text-center">
                        <span
                          className={`tk-counter-badge ${
                            item?.donThatBai > 0 ? 'danger-bg' : 'muted-bg'
                          }`}
                        >
                          {item?.donThatBai || 0} đơn
                        </span>
                      </td>

                      <td className="text-right text-success text-bold">
                        {(item?.tongTienChiTieu || 0).toLocaleString('vi-VN')} đ
                      </td>
                    </>
                  )}

                  {tabHienTai === 'mathang' && (
                    <>
                      <td>
                        <img
                          src={
                            item?.image_url
                              ? item.image_url.startsWith('http')
                                ? item.image_url
                                : `${API_URL}/${item.image_url}`
                              : 'https://placehold.co/50x50?text=No+Image'
                          }
                          alt={item?.tenSanPham || 'Sản phẩm'}
                          className="tk-product-img"
                          onError={(e) => {
                            e.target.src =
                              'https://placehold.co/50x50?text=MilkTea';
                          }}
                        />
                      </td>

                      <td>
                        <span className="tk-highlight-text">
                          {item?.tenSanPham || 'Sản phẩm ẩn'}
                        </span>
                      </td>

                      <td className="text-center">
                        <span className="tk-qty-badge success-bg">
                          {item?.tongSoLuongBan || 0} ly
                        </span>
                      </td>

                      <td className="text-center">
                        <span
                          className={`tk-qty-badge ${
                            item?.soLuongBiHoan > 0 ? 'danger-bg' : 'muted-bg'
                          }`}
                        >
                          {item?.soLuongBiHoan || 0} ly
                        </span>
                      </td>

                      <td className="text-right text-success text-bold">
                        {(item?.tongDoanhThuMon || 0).toLocaleString('vi-VN')} đ
                      </td>
                    </>
                  )}

                  {tabHienTai === 'thoigian' && (
                    <>
                      <td>
                        <span className="tk-time-badge">
                          {item?.thoiGian || 'Không rõ'}
                        </span>
                      </td>

                      <td className="text-center">
                        <span className="tk-counter-badge success-bg">
                          {item?.donThanhCong || 0} đơn
                        </span>
                      </td>

                      <td className="text-center">
                        <span
                          className={`tk-counter-badge ${
                            item?.donThatBai > 0 ? 'danger-bg' : 'muted-bg'
                          }`}
                        >
                          {item?.donThatBai || 0} đơn
                        </span>
                      </td>

                      <td className="text-right text-muted">
                        +{(item?.tongTienGiaoHang || 0).toLocaleString('vi-VN')}{' '}
                        đ
                      </td>

                      <td className="text-right text-success text-bold">
                        {(item?.doanhThu || 0).toLocaleString('vi-VN')} đ
                      </td>
                    </>
                  )}

                  <td className="text-center">
                    <button
                      type="button"
                      className="tk-btn-action"
                      onClick={() => handleXemChiTiet(item)}
                    >
                      <Eye size={14} />
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="tk-modal-overlay" onClick={() => setModalOpen(false)}>
          <div
            className="tk-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tk-modal-header">
              <h4 className="tk-modal-title">{chiTietTitle}</h4>

              <button
                type="button"
                className="tk-modal-close"
                onClick={() => setModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="tk-modal-filter-tabs">
              <button
                type="button"
                className={`tk-m-tab ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => handleStatusFilterChange('all')}
              >
                Tất cả đơn
              </button>

              <button
                type="button"
                className={`tk-m-tab text-success ${
                  statusFilter === 'completed' ? 'active' : ''
                }`}
                onClick={() => handleStatusFilterChange('completed')}
              >
                🟢 Giao thành công
              </button>

              <button
                type="button"
                className={`tk-m-tab text-danger ${
                  statusFilter === 'failed' ? 'active' : ''
                }`}
                onClick={() => handleStatusFilterChange('failed')}
              >
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
                <p className="tk-modal-empty">
                  Không tìm thấy hóa đơn nào trùng khớp với trạng thái lựa chọn.
                </p>
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
                        <tr
                          key={don._id || idx}
                          className={`tk-modal-row status-${don.status}`}
                        >
                          <td>
                            <span className="tk-code-text">
                              #{don._id?.slice(-8).toUpperCase()}
                            </span>
                          </td>

                          <td>
                            <div className="tk-user-info">
                              <strong>
                                👤{' '}
                                {don.customer_id?.full_name ||
                                  'Khách ngoại tuyến'}
                              </strong>

                              <span className="text-muted">
                                📞 {don.customer_id?.phone || 'N/A'}
                              </span>

                              {don.shipper_id && (
                                <span className="tk-shipper-tag">
                                  🏍️ Tài xế: {don.shipper_id.full_name}
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            {new Date(
                              don.updatedAt || don.createdAt
                            ).toLocaleDateString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          <td>
                            <ul className="tk-modal-items-list">
                              {don.items?.map((mon, mIdx) => (
                                <li key={mIdx}>
                                  {mon.product_name} x <strong>{mon.quantity}</strong>
                                </li>
                              ))}
                            </ul>
                          </td>

                          <td>
                            {don.status === 'completed' ? (
                              <span className="tk-status-badge success">
                                <CheckCircle size={12} /> Thành công
                              </span>
                            ) : (
                              <span className="tk-status-badge danger">
                                <AlertTriangle size={12} /> Thất bại
                                {don.cancel_reason && ` (${don.cancel_reason})`}
                              </span>
                            )}
                          </td>

                          <td className="text-right text-bold">
                            {(don.total_price || 0).toLocaleString('vi-VN')} đ
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
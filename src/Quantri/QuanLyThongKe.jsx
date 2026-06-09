import React, { useState, useEffect } from 'react';
import { 
  Percent, Search, ClipboardList, 
  CheckCircle2, XCircle, RefreshCw, DollarSign, 
  ChevronDown, Tag, Layers, ArrowUpRight 
} from 'lucide-react';
import '../css/quantri/QuanLyThongKe.css'; // File CSS cấu trúc đổ bóng 3D bên dưới

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const QuanLyThongKeMaGiamGia = () => {
  // --- States quản lý bộ lọc mã ---
  const [dsMaGiamGia, setDsMaGiamGia] = useState([]); // Master list từ API
  const [tuKhoaTimKiem, setTuKhoaTimKiem] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cacMaDaChon, setCacMaDaChon] = useState([]); // Mảng lưu các mã được tích chọn
  const [phanTramHoaHong, setPhanTramHoaHong] = useState(10); // Default 10%

  // --- States quản lý dữ liệu báo cáo ---
  const [loading, setLoading] = useState(false);
  const [tongQuan, setTongQuan] = useState({
    tongSoDon: 0,
    soDonThanhCong: 0,
    soDonThatBai: 0,
    tongDoanhThuThucTe: 0,
    tongTienDaUuDai: 0,
    tienHoaHongNhanDuoc: 0
  });
  const [donApMaThanhCong, setDonApMaThanhCong] = useState([]);
  const [donApMaThatBai, setDonApMaThatBai] = useState([]);
  const [tabDonHang, setTabDonHang] = useState('thanhcong'); // 'thanhcong' hoặc 'thatbai'

  // 1. Fetch danh sách mã giảm giá phục vụ bộ lọc chọn nhiều khi component mount hoặc tìm kiếm
  useEffect(() => {
    const layGợiYMaGiamGia = async () => {
      try {
        const response = await fetch(`${API_URL}/api/quantri/thongke/ma-giam-gia?search=${tuKhoaTimKiem}`);
        const result = await response.json();
        if (result.success) {
          setDsMaGiamGia(result.data || []);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách mã giảm giá:", error);
      }
    };

    const delayDebounce = setTimeout(() => {
      layGợiYMaGiamGia();
    }, 400); // Debounce tránh spam request khi gõ phím

    return () => clearTimeout(delayDebounce);
  }, [tuKhoaTimKiem]);

  // 2. Hàm gọi API bóc tách dữ liệu thống kê tổng hợp báo cáo tài chính
  const xuLyTaiBaoCaoThongKe = async () => {
    if (cacMaDaChon.length === 0) {
      alert("Vui lòng click chọn ít nhất một mã giảm giá từ menu!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/quantri/thongke/ma-giam-gia/bao-cao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codes: cacMaDaChon,
          hoaHongPercent: phanTramHoaHong
        })
      });

      const result = await response.json();
      if (result.success) {
        setTongQuan(result.summary);
        setDonApMaThanhCong(result.chiTietDonHang.apMaThanhCong || []);
        setDonApMaThatBai(result.chiTietDonHang.apMaThatBai || []);
      }
    } catch (error) {
      console.error("Lỗi tải báo cáo:", error);
    } finally {
      setLoading(false);
    }
  };

  // Tự động reload báo cáo khi người dùng thay đổi phần trăm hoa hồng trên cụm mã hiện tại
  useEffect(() => {
    if (cacMaDaChon.length > 0 && tongQuan.tongDoanhThuThucTe > 0) {
      const phanTram = Number(phanTramHoaHong || 0);
      const tienHoaHongMoi = Math.round((tongQuan.tongDoanhThuThucTe * phanTram) / 100);
      setTongQuan(prev => ({
        ...prev,
        tienHoaHongNhanDuoc: tienHoaHongMoi
      }));
    }
  }, [phanTramHoaHong]);

  // Toggle chọn/bỏ chọn một mã
  const handleToggleMa = (code) => {
    if (cacMaDaChon.includes(code)) {
      setCacMaDaChon(cacMaDaChon.filter(item => item !== code));
    } else {
      setCacMaDaChon([...cacMaDaChon, code]);
    }
  };

  // Hàm chuyển đổi nhãn trạng thái tiếng Anh sang tiếng Việt trực quan trên bảng 3D
  const hienThiVietsubStatus = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'pending') return 'Chờ xử lý';
    if (s === 'preparing') return 'Đang pha chế';
    if (s === 'shipping') return 'Đang giao hàng';
    if (s === 'cancelled') return 'Đã hủy đơn';
    if (s === 'failed') return 'Giao thất bại';
    return status;
  };

  return (
    <div className="cube-tk-container">
      {/* HEADER KHÔNG GIAN 3D */}
      <div className="cube-header-3d">
        <div className="cube-title-zone">
          <Layers className="cube-icon-master" />
          <div>
            <h2 className="cube-main-title">BÁO CÁO CHIẾT KHẤU MÃ GIẢM GIÁ</h2>
            <p className="cube-subtitle">Hệ thống phân tích doanh thu ròng & quản lý hoa hồng đa tầng</p>
          </div>
        </div>
      </div>

      {/* KHU VỰC ĐIỀU KHIỂN & BỘ LỌC CHỌN NHIỀU MÃ (3D PANEL) */}
      <div className="cube-panel-filter-3d">
        <div className="cube-filter-grid">
          
          {/* Cụm 1: Hộp chọn Multi-select Mã giảm giá */}
          <div className="cube-input-wrapper">
            <label className="cube-label"><Tag size={14} /> Chọn các mã ưu đãi áp dụng</label>
            <div className="cube-select-custom-container">
              <div className="cube-select-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <div className="cube-tags-selected">
                  {cacMaDaChon.length === 0 ? (
                    <span className="cube-placeholder">Chọn một hoặc nhiều mã...</span>
                  ) : (
                    cacMaDaChon.map(code => (
                      <span key={code} className="cube-tag-badge" onClick={(e) => {
                        e.stopPropagation(); // Ngăn đóng mở menu dropdown liên tục
                        handleToggleMa(code);
                      }}>
                        {code} <span className="cube-tag-close">×</span>
                      </span>
                    ))
                  )}
                </div>
                <ChevronDown size={16} className={`cube-arrow-icon ${dropdownOpen ? 'open' : ''}`} />
              </div>

              {dropdownOpen && (
                <div className="cube-dropdown-menu">
                  <div className="cube-search-box-inside" onClick={(e) => e.stopPropagation()}>
                    <Search size={14} />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm mã nhanh..." 
                      value={tuKhoaTimKiem}
                      onChange={(e) => setTuKhoaTimKiem(e.target.value)}
                    />
                  </div>
                  <div className="cube-options-list">
                    {dsMaGiamGia.map((promo) => (
                      <label key={promo.code} className="cube-option-item" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={cacMaDaChon.includes(promo.code)}
                          onChange={() => handleToggleMa(promo.code)}
                        />
                        <div className="cube-option-text">
                          <span className="promo-code-bold">{promo.code}</span>
                          <span className="promo-desc-sub">Giảm {promo.discount_value?.toLocaleString()}đ</span>
                        </div>
                      </label>
                    ))}
                    {dsMaGiamGia.length === 0 && <p className="cube-no-result">Không thấy mã hợp lệ</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cụm 2: Nhập tỷ lệ hoa hồng đại lý */}
          <div className="cube-input-wrapper" style={{ maxWidth: '200px' }}>
            <label className="cube-label"><Percent size={14} /> Tỷ lệ hoa hồng</label>
            <div className="cube-input-3d-box">
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={phanTramHoaHong}
                onChange={(e) => setPhanTramHoaHong(e.target.value)}
                className="cube-input-field"
              />
              <span className="cube-input-unit">%</span>
            </div>
          </div>

          {/* Cụm 3: Nút bấm Kích hoạt Thống kê */}
          <div className="cube-action-zone">
            <button 
              className="cube-btn-submit-3d" 
              onClick={xuLyTaiBaoCaoThongKe}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'cube-spin' : ''} />
              <span>TRÍCH XUẤT DỮ LIỆU</span>
            </button>
          </div>

        </div>
      </div>

      {/* HỆ THỐNG THẺ THÀNH PHẦN KẾT CẤU KHỐI 3D NỔI (METRICS WIDGET) */}
      <div className="cube-metrics-row">
        <div className="cube-card-metric total-revenue">
          <div className="cube-card-inner">
            <div className="cube-metric-header">
              <span>DOANH THU THỰC TẾ</span>
              <DollarSign className="cube-m-icon" />
            </div>
            <h3 className="cube-metric-value">{tongQuan.tongDoanhThuThucTe?.toLocaleString('vi-VN')} đ</h3>
            <p className="cube-metric-desc">Chỉ tính toán dựa trên các đơn áp mã thành công</p>
          </div>
        </div>

        <div className="cube-card-metric commission-earned">
          <div className="cube-card-inner">
            <div className="cube-metric-header">
              <span>TIỀN HOA HỒNG ({phanTramHoaHong}%)</span>
              <ArrowUpRight className="cube-m-icon" />
            </div>
            <h3 className="cube-metric-value">{tongQuan.tienHoaHongNhanDuoc?.toLocaleString('vi-VN')} đ</h3>
            <p className="cube-metric-desc">Lợi nhuận khấu trừ cấu hình</p>
          </div>
        </div>

        <div className="cube-card-metric discount-given">
          <div className="cube-card-inner">
            <div className="cube-metric-header">
              <span>TỔNG TIỀN GIẢM GIÁ</span>
              <Percent className="cube-m-icon" />
            </div>
            <h3 className="cube-metric-value">{tongQuan.tongTienDaUuDai?.toLocaleString('vi-VN')} đ</h3>
            <p className="cube-metric-desc">Ngân sách hệ thống đã trợ giá</p>
          </div>
        </div>
      </div>

      {/* KHU VỰC BẢNG HIỂN THỊ CHI TIẾT ĐƠN HÀNG PHÂN TÁCH TAB KHÔNG GIAN */}
      <div className="cube-table-container-3d">
        <div className="cube-table-header-tabs">
          <button 
            className={`cube-tab-trigger tab-success ${tabDonHang === 'thanhcong' ? 'active' : ''}`}
            onClick={() => setTabDonHang('thanhcong')}
          >
            <CheckCircle2 size={16} /> 
            <span>Áp mã thành công ({donApMaThanhCong.length})</span>
          </button>
          <button 
            className={`cube-tab-trigger tab-failed ${tabDonHang === 'thatbai' ? 'active' : ''}`}
            onClick={() => setTabDonHang('thatbai')}
          >
            <XCircle size={16} /> 
            <span>Áp mã thất bại/Hủy ({donApMaThatBai.length})</span>
          </button>
        </div>

        <div className="cube-table-responsive-body">
          {loading ? (
            <div className="cube-loading-skeleton">
              <div className="cube-spinner-dual"></div>
              <p>Hệ thống đang truy quét toàn bộ lịch sử hóa đơn liên quan...</p>
            </div>
          ) : (
            <table className="cube-data-table">
              <thead>
                <tr>
                  <th>Mã Đơn</th>
                  <th>Khách Hàng</th>
                  <th className="text-center">Mã Đã Áp</th>
                  <th className="text-right">Tiền Hàng gốc</th>
                  <th className="text-right">Giảm Giá</th>
                  <th className="text-right">Thực Trả</th>
                  <th className="text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {tabDonHang === 'thanhcong' ? (
                  donApMaThanhCong.map((don, i) => (
                    <tr key={don.order_id || i}>
                      <td><strong className="cube-code-text">#{don.order_code}</strong></td>
                      <td>
                        <div className="cube-cell-customer">
                          <span className="c-name">{don.customer_name}</span>
                          <span className="c-phone">{don.phone}</span>
                        </div>
                      </td>
                      <td className="text-center"><span className="cube-table-promo-badge">{don.promotion_code}</span></td>
                      <td className="text-right">{don.products_subtotal?.toLocaleString('vi-VN')} đ</td>
                      <td className="text-right text-discount">-{don.discount_amount?.toLocaleString('vi-VN')} đ</td>
                      <td className="text-right text-grand-total">{don.total_amount?.toLocaleString('vi-VN')} đ</td>
                      <td className="text-center"><span className="cube-status-pill success">Thành công</span></td>
                    </tr>
                  ))
                ) : (
                  donApMaThatBai.map((don, i) => (
                    <tr key={don.order_id || i} className="row-failed-dimmed">
                      <td><strong className="cube-code-text">#{don.order_code}</strong></td>
                      <td>
                        <div className="cube-cell-customer">
                          <span className="c-name">{don.customer_name}</span>
                          <span className="c-phone">{don.phone}</span>
                        </div>
                      </td>
                      <td className="text-center"><span className="cube-table-promo-badge style-failed">{don.promotion_code}</span></td>
                      <td className="text-right">{don.products_subtotal?.toLocaleString('vi-VN')} đ</td>
                      <td className="text-right">-{don.discount_amount?.toLocaleString('vi-VN')} đ</td>
                      <td className="text-right text-strike">{don.total_amount?.toLocaleString('vi-VN')} đ</td>
                      <td className="text-center">
                        <span className={`cube-status-pill ${don.status === 'cancelled' ? 'failed' : 'pending'}`}>
                          {hienThiVietsubStatus(don.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}

                {((tabDonHang === 'thanhcong' && donApMaThanhCong.length === 0) || 
                  (tabDonHang === 'thatbai' && donApMaThatBai.length === 0)) && (
                  <tr>
                    <td colSpan="7" className="cube-empty-row">
                      <ClipboardList size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                      <p>Không có dữ liệu hóa đơn nào được ghi nhận ở trạng thái này.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuanLyThongKeMaGiamGia;
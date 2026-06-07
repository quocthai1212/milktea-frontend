import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, CheckCircle, Truck, PackageCheck, Plus, ShoppingBag, X,
  XCircle, AlertCircle, RefreshCw, LogOut, Clock, User, Phone, MapPin 
} from 'lucide-react';
import '../css/nhanvien/NhanvienDashboard.css';

const API_URL = import.meta.env.VITE_API_URL;

const NhanvienDashboard = () => {
  const navigate = useNavigate();
  const [danhSachDonHang, setDanhSachDonHang] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [thongBao, setThongBao] = useState({ text: '', type: '' });
  const [nhanVien, setNhanVien] = useState(null);
  
  // Các trạng thái phục vụ tính năng Đặt hàng tại quầy (POS Modal)
  const [showPosModal, setShowPosModal] = useState(false);
  const [tenMonPos, setTenMonPos] = useState('');
  const [giaPos, setGiaPos] = useState('');
  const [soLuongPos, setSoLuongPos] = useState(1);
  const [phuongThucThanhToan, setPhuongThucThanhToan] = useState('CASH');

  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-500.wav'));

  // 1. Kiểm tra quyền truy cập của nhân viên
  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(userJson);
    if (user.role_id !== 2 && user.role_id !== 1) { 
      alert('Tài khoản của bạn không có quyền truy cập trang này!');
      navigate('/');
      return;
    }
    setNhanVien(user);
  }, [navigate]);

  // 2. Tải danh sách đơn hàng qua API NHÂN VIÊN
  const taiDanhSachDonHang = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/nhanvien/don-hang`);
      if (!response.ok) throw new Error('Không thể tải danh sách đơn hàng');
      
      const data = await response.json();
      const orders = data.orders || data.data || [];
      
      setDanhSachDonHang((prevOrders) => {
        const sốĐơnPendingCũ = prevOrders.filter(o => o.status === 'pending').length;
        const sốĐơnPendingMới = orders.filter(o => o.status === 'pending').length;
        
        if (sốĐơnPendingMới > sốĐơnPendingCũ && sốĐơnPendingCũ > 0) {
          audioRef.current.play().catch(() => console.log("Chờ tương tác người dùng để phát âm thanh"));
          hienThongBao('🔔 Có đơn hàng mới vừa được gửi lên hệ thống!', 'success');
        }
        return orders;
      });

    } catch (error) {
      console.error("Lỗi lấy đơn hàng:", error);
      hienThongBao('Không thể đồng bộ đơn hàng từ máy chủ', 'danger');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // 3. Cơ chế REAL-TIME POLLING (10 giây quét một lần)
  useEffect(() => {
    taiDanhSachDonHang(false);
    const interval = setInterval(() => {
      taiDanhSachDonHang(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // 4. Cập nhật trạng thái đơn hàng qua API
  const handleCapNhatTrangThai = async (orderId, trangThaiMoi, reason = '') => {
    try {
      const url = trangThaiMoi === 'cancelled' 
        ? `${API_URL}/api/nhanvien/don-hang/huy`
        : `${API_URL}/api/nhanvien/don-hang/cap-nhat-trang-thai`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          status: trangThaiMoi,
          reason: reason,
          staff_id: nhanVien?._id
        })
      });

      const data = await response.json();
      if (data.success) {
        hienThongBao(`Thay đổi trạng thái đơn hàng sang [${dichTrangThai(trangThaiMoi)}] thành công!`, 'success');
        taiDanhSachDonHang(true); 
      } else {
        throw new Error(data.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error(error);
      hienThongBao(`Lỗi: Vui lòng kiểm tra cấu hình Route tại Backend Nhân Viên!`, 'danger');
    }
  };

  // 5. Xử lý gửi đơn đặt hàng tại quầy lên hệ thống (POS)
  const handleTaoDonTaiQuay = async (e) => {
    e.preventDefault();
    if (!tenMonPos || !giaPos || soLuongPos < 1) {
      alert('Vui lòng nhập đầy đủ thông tin tên món và giá tiền hợp lệ!');
      return;
    }

    const tongTien = Number(giaPos) * Number(soLuongPos);

    try {
      const response = await fetch(`${API_URL}/api/nhanvien/don-hang/tai-quay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: nhanVien?._id,
          payment_method: phuongThucThanhToan,
          payment_status: 'PAID', // Đặt tại quầy thông thường mặc định đã thu tiền trực tiếp
          status: 'preparing',    // Đặt tại quầy bỏ qua bước pending, chuyển thẳng xuống pha chế
          total_amount: tongTien,
          items: [
            {
              product_name: tenMonPos,
              quantity: Number(soLuongPos),
              subtotal: tongTien,
              selected_toppings: []
            }
          ],
          shipping_address: {
            customer_name: 'Khách mua tại quầy',
            phone: 'N/A',
            address_detail: 'Nhận trực tiếp tại quầy (POS)'
          }
        })
      });

      const data = await response.json();
      if (data.success || response.ok) {
        hienThongBao('🎉 Tạo đơn hàng thành công! Đã chuyển xuống mục Đang chế biến.', 'success');
        setShowPosModal(false);
        // Reset form
        setTenMonPos('');
        setGiaPos('');
        setSoLuongPos(1);
        taiDanhSachDonHang(true);
      } else {
        alert(data.message || 'Lỗi không thể khởi tạo đơn hàng POS');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối máy chủ khi tạo đơn tại quầy');
    }
  };

  const hienThongBao = (text, type) => {
    setThongBao({ text, type });
    setTimeout(() => setThongBao({ text: '', type: '' }), 4000);
  };

  const handleDangXuat = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const dichTrangThai = (status) => {
    const map = {
      pending: 'Chờ xác nhận',
      preparing: 'Đang pha chế',
      shipping: 'Đang giao hàng',
      completed: 'Đã hoàn thành',
      cancelled: 'Đã hủy đơn'
    };
    return map[status] || status;
  };

  const demSoLuongTheoTrangThai = (status) => {
    return danhSachDonHang.filter(o => o.status === status).length;
  };

  const danhSachHienThi = danhSachDonHang.filter(o => o.status === filterStatus);

  return (
    <div className="nv-dashboard-container">
      {/* THANH TOPBAR */}
      <nav className="nv-topbar">
        <div className="nv-brand">
          <ClipboardList size={24} />
          <h2>MilkTea Paradise - Hệ Thống Nhân Viên Xử Lý Đơn</h2>
          <span className="nv-pulse-dot" title="Hệ thống đang tự động đồng bộ thời gian thực"></span>
        </div>
        
        <div className="nv-user-info">
          {/* ✨ NÚT ĐẶT HÀNG TẠI QUẦY (MỚI THÊM) */}
          <button className="nv-btn-pos" onClick={() => setShowPosModal(true)}>
            <ShoppingBag size={16} /> <span>Đặt hàng tại quầy (POS)</span>
          </button>

          <div className="nv-profile">
            <User size={16} />
            <span>{nhanVien?.full_name || 'Nhân viên'}</span>
            <span className="nv-role-badge">Nhân viên quầy</span>
          </div>
          <button className="nv-btn-refresh" onClick={() => taiDanhSachDonHang(false)} title="Làm mới dữ liệu">
            <RefreshCw size={18} />
          </button>
          <button className="nv-btn-logout" onClick={handleDangXuat}>
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </nav>

      {/* TOAST POPUP */}
      {thongBao.text && (
        <div className={`nv-toast ${thongBao.type}`}>
          <AlertCircle size={18} />
          <span>{thongBao.text}</span>
        </div>
      )}

      {/* ✨ CỬA SỔ POPUP MODAL ĐẶT HÀNG TẠI QUẦY */}
      {showPosModal && (
        <div className="nv-modal-overlay">
          <div className="nv-modal-pos">
            <div className="nv-modal-header">
              <h3><ShoppingBag size={20} /> Khởi tạo đơn đặt hàng nhanh tại quầy</h3>
              <button className="nv-modal-close" onClick={() => setShowPosModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleTaoDonTaiQuay}>
              <div className="nv-form-group">
                <label>Tên sản phẩm / Thức uống:</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Trà sữa Trân châu đường đen size L" 
                  value={tenMonPos} 
                  onChange={(e) => setTenMonPos(e.target.value)}
                  required 
                />
              </div>
              <div className="nv-form-row">
                <div className="nv-form-group">
                  <label>Đơn giá (đđ):</label>
                  <input 
                    type="number" 
                    placeholder="Ví dụ: 45000" 
                    value={giaPos} 
                    onChange={(e) => setGiaPos(e.target.value)}
                    required 
                  />
                </div>
                <div className="nv-form-group">
                  <label>Số lượng:</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={soLuongPos} 
                    onChange={(e) => setSoLuongPos(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="nv-form-group">
                <label>Hình thức thanh toán:</label>
                <select value={phuongThucThanhToan} onChange={(e) => setPhuongThucThanhToan(e.target.value)}>
                  <option value="CASH">💵 Tiền mặt (Cash)</option>
                  <option value="BANK_TRANSFER">💳 Chuyển khoản qua mã QR</option>
                </select>
              </div>

              <div className="nv-pos-total-preview">
                <span>Thành tiền:</span>
                <strong>{((Number(giaPos) || 0) * soLuongPos).toLocaleString()}đ</strong>
              </div>

              <div className="nv-modal-footer">
                <button type="button" className="nv-btn-secondary" onClick={() => setShowPosModal(false)}>Hủy bỏ</button>
                <button type="submit" className="nv-btn-primary">Xác nhận xuất hóa đơn</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="nv-main-layout">
        {/* SIDEBAR TABS */}
        <aside className="nv-sidebar">
          <h3>Trạng thái đơn hàng</h3>
          <div className="nv-tabs-vertical">
            <button className={`nv-tab-item pending ${filterStatus === 'pending' ? 'active' : ''}`} onClick={() => setFilterStatus('pending')}>
              <Clock size={18} />
              <span>Chờ xác nhận</span>
              <span className="nv-badge bg-pending">{demSoLuongTheoTrangThai('pending')}</span>
            </button>
            
            <button className={`nv-tab-item preparing ${filterStatus === 'preparing' ? 'active' : ''}`} onClick={() => setFilterStatus('preparing')}>
              <RefreshCw size={18} />
              <span>Đang chế biến</span>
              <span className="nv-badge bg-preparing">{demSoLuongTheoTrangThai('preparing')}</span>
            </button>

            <button className={`nv-tab-item shipping ${filterStatus === 'shipping' ? 'active' : ''}`} onClick={() => setFilterStatus('shipping')}>
              <Truck size={18} />
              <span>Đang giao hàng</span>
              <span className="nv-badge bg-shipping">{demSoLuongTheoTrangThai('shipping')}</span>
            </button>

            <button className={`nv-tab-item completed ${filterStatus === 'completed' ? 'active' : ''}`} onClick={() => setFilterStatus('completed')}>
              <PackageCheck size={18} />
              <span>Đã hoàn thành</span>
              <span className="nv-badge bg-completed">{demSoLuongTheoTrangThai('completed')}</span>
            </button>

            <button className={`nv-tab-item cancelled ${filterStatus === 'cancelled' ? 'active' : ''}`} onClick={() => setFilterStatus('cancelled')}>
              <XCircle size={18} />
              <span>Đã hủy</span>
              <span className="nv-badge bg-cancelled">{demSoLuongTheoTrangThai('cancelled')}</span>
            </button>
          </div>
        </aside>

        {/* LƯỚI ĐƠN HÀNG CHÍNH */}
        <main className="nv-content-area">
          <div className="nv-content-header">
            <h3>Danh sách: {dichTrangThai(filterStatus)} ({danhSachHienThi.length} đơn)</h3>
            <span className="nv-time-sync">Tự động đồng bộ sau mỗi 10 giây</span>
          </div>

          {loading ? (
            <div className="nv-loading-box">
              <div className="nv-spinner"></div>
              <p>Đang nạp dữ liệu hóa đơn mới nhất...</p>
            </div>
          ) : danhSachHienThi.length === 0 ? (
            <div className="nv-empty-state">
              <ClipboardList size={48} />
              <p>Hiện tại không có đơn hàng nào thuộc danh mục này.</p>
            </div>
          ) : (
            <div className="nv-orders-grid">
              {danhSachHienThi.map((donHang) => (
                <div key={donHang._id} className={`nv-order-card border-${donHang.status}`}>
                  <div className="nv-card-header">
                    <div>
                      <span className="nv-order-id">Mã: #{donHang._id?.slice(-6).toUpperCase()}</span>
                      <span className="nv-order-time">⏱️ {new Date(donHang.createdAt).toLocaleTimeString('vi-VN')}</span>
                    </div>
                    <span className={`nv-status-tag tag-${donHang.status}`}>{dichTrangThai(donHang.status)}</span>
                  </div>

                  <div className="nv-card-customer">
                    <p><User size={14} /> <strong>{donHang.shipping_address?.customer_name || 'Khách vãng lai'}</strong></p>
                    <p><Phone size={14} /> {donHang.shipping_address?.phone || 'Không có số điện thoại'}</p>
                    <p className="nv-address"><MapPin size={14} /> {donHang.shipping_address?.address_detail || 'Nhận tại quầy (POS)'}</p>
                  </div>

                  <div className="nv-card-items">
                    <h5>Chi tiết món ăn ({donHang.items?.length || 0}):</h5>
                    <div className="nv-items-list">
                      {donHang.items?.map((item, idx) => (
                        <div key={idx} className="nv-item-row">
                          <div className="nv-item-main">
                            <span className="nv-item-qty">x{item.quantity}</span>
                            <span className="nv-item-name">{item.product_name}</span>
                          </div>
                          {item.selected_toppings?.length > 0 && (
                            <div className="nv-item-toppings">
                              +{item.selected_toppings.map(t => t.topping_name).join(', ')}
                            </div>
                          )}
                          <span className="nv-item-subtotal">{item.subtotal?.toLocaleString()}đ</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="nv-card-summary">
                    <div className="nv-summary-row">
                      <span>Hình thức: <strong>{donHang.payment_method}</strong></span>
                      <span className={`nv-payment-status paid-${donHang.payment_status?.toLowerCase()}`}>
                        {donHang.payment_status === 'PAID' ? '🟢 Đã thanh toán' : '🔴 Chưa trả tiền'}
                      </span>
                    </div>
                    <div className="nv-summary-total">
                      <span>Tổng thu:</span>
                      <span className="nv-total-amount">{donHang.total_amount?.toLocaleString()}đ</span>
                    </div>
                  </div>

                  <div className="nv-card-actions">
                    {donHang.status === 'pending' && (
                      <>
                        <button className="nv-btn-action accept" onClick={() => handleCapNhatTrangThai(donHang._id, 'preparing')}>
                          <CheckCircle size={15} /> Xác nhận đơn & Pha chế
                        </button>
                        <button className="nv-btn-action cancel" onClick={() => {
                          const lyDo = prompt('Nhập lý do hủy đơn của khách:');
                          if (lyDo !== null && lyDo.trim() !== '') {
                            handleCapNhatTrangThai(donHang._id, 'cancelled', lyDo);
                          }
                        }}>
                          Hủy đơn
                        </button>
                      </>
                    )}

                    {donHang.status === 'preparing' && (
                      <button className="nv-btn-action ship" onClick={() => handleCapNhatTrangThai(donHang._id, 'shipping')}>
                        <Truck size={15} /> Giao hàng cho Shipper
                      </button>
                    )}

                    {(donHang.status === 'shipping' || donHang.status === 'completed' || donHang.status === 'cancelled') && (
                      <div className="nv-closed-history-box">
                        <span className="nv-text-disabled">
                          {donHang.status === 'shipping' 
                            ? '🚚 Đơn hàng đang đi giao (Chỉ xem lịch trình)' 
                            : '🔒 Đơn hàng đã đóng lịch sử xử lý'}
                        </span>
                        {donHang.cancel_reason && (
                          <p className="nv-text-reason">Lý do hủy: {donHang.cancel_reason}</p>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default NhanvienDashboard;
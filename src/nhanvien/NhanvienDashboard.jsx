import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, CheckCircle, Truck, PackageCheck, 
  XCircle, AlertCircle, RefreshCw, LogOut, Clock, User, Phone, MapPin, Package
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
  const [userId, setUserId] = useState('');

  // --- TRẠNG THÁI QUẢN LÝ MODAL HỦY ĐƠN ---
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-500.wav'));

  // 1. Kiểm tra quyền truy cập của nhân viên dựa trên dữ liệu đăng nhập
  useEffect(() => {
    const userJson = localStorage.getItem('user');
    const roleId = localStorage.getItem('role_id'); // Lấy trực tiếp từ key bạn đã lưu
    const storedUserId = localStorage.getItem('userId'); 

    if (!userJson || !roleId) {
      handleDangXuat();
      return;
    }
    
    const user = JSON.parse(userJson);
    
    // Kiểm tra roleId ở đây (roleId lúc này là biến string, nên convert sang Number)
    if (Number(roleId) !== 2 && Number(roleId) !== 1) { 
      alert('Tài khoản của bạn không có quyền truy cập trang này!');
      navigate('/');
      return;
    }
    
    setNhanVien(user);
    setUserId(storedUserId || user._id); // Đảm bảo lấy được ID
  }, [navigate]);

  // 2. Tải danh sách đơn hàng qua API (GetAll)
  const taiDanhSachDonHang = async (isSilent = false, currentUserId = userId) => {
    if (!currentUserId) return;
    if (!isSilent) setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/nhanvien/don-hang`, {
        method: 'GET',
        headers: {
          'X-User-Id': currentUserId,
          'X-Role-Id': nhanVien?.role_id || '',
          'X-Branch-Id': nhanVien?.branch_id?._id || nhanVien?.branch_id || '',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401 || response.status === 403 || response.status === 404) {
        hienThongBao('Phiên làm việc lỗi hoặc tài khoản không hợp lệ, đang đăng xuất...', 'danger');
        setTimeout(() => handleDangXuat(), 2000);
        return;
      }

      if (!response.ok) throw new Error('Không thể tải danh sách đơn hàng');
      
      const data = await response.json();
      const orders = data.orders || data.data || [];
      
      setDanhSachDonHang((prevOrders) => {
        const sốĐơnPendingCũ = prevOrders.filter(o => o?.status === 'pending').length;
        const sốĐơnPendingMới = orders.filter(o => o?.status === 'pending').length;
        
        if (sốĐơnPendingMới > sốĐơnPendingCũ && sốĐơnPendingCũ > 0) {
          audioRef.current.play().catch(() => console.log("Chờ tương tác để phát âm thanh"));
          hienThongBao('🔔 Có đơn hàng trực tuyến mới vừa gửi tới chi nhánh!', 'success');
        }
        return orders;
      });

    } catch (error) {
      console.error("Lỗi lấy đơn hàng:", error);
      hienThongBao('Không thể đồng bộ hóa đơn hàng từ máy chủ chi nhánh', 'danger');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // 3. Cơ chế REAL-TIME POLLING tự động quét đơn mới sau mỗi 10 giây
  useEffect(() => {
    if (userId && nhanVien) {
      taiDanhSachDonHang(false, userId);
      const interval = setInterval(() => {
        taiDanhSachDonHang(true, userId);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [userId, nhanVien]);

  // 4. THỰC HIỆN CẬP NHẬT TRẠNG THÁI QUA MỘT ĐƯỜNG DẪN UPDATE DUY NHẤT
  const handleCapNhatTrangThai = async (orderId, trangThaiMoi, reason = '') => {
    try {
      const response = await fetch(`${API_URL}/api/nhanvien/don-hang/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Role-Id': nhanVien?.role_id || '',
          'X-Branch-Id': nhanVien?.branch_id?._id || nhanVien?.branch_id || ''
        },
        body: JSON.stringify({
          order_id: orderId,
          status: trangThaiMoi,
          reason: reason
        })
      });

      const data = await response.json();
      if (data.success) {
        hienThongBao(`Cập nhật đơn hàng sang [${dichTrangThai(trangThaiMoi)}] thành công!`, 'success');
        taiDanhSachDonHang(true, userId); 
        
        if (trangThaiMoi === 'cancelled') {
          gongModalHuy();
        }
      } else {
        throw new Error(data.message || 'Cập nhật tiến trình thất bại');
      }
    } catch (error) {
      console.error(error);
      hienThongBao(error.message || `Lỗi hệ thống khi cập nhật trạng thái đơn!`, 'danger');
    }
  };

  const moModalHuy = (orderId) => {
    setSelectedOrderId(orderId);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const gongModalHuy = () => {
    setShowCancelModal(false);
    setSelectedOrderId('');
    setCancelReason('');
  };

  const xacNhanHuyDon = (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      hienThongBao('Vui lòng nhập lý do hủy đơn hàng!', 'danger');
      return;
    }
    handleCapNhatTrangThai(selectedOrderId, 'cancelled', cancelReason.trim());
  };

  const hienThongBao = (text, type) => {
    setThongBao({ text, type });
    setTimeout(() => setThongBao({ text: '', type: '' }), 4000);
  };

  const handleDangXuat = () => {
    localStorage.clear(); 
    navigate('/login');
  };

  const dichTrangThai = (status) => {
    const map = {
      pending: 'Chờ xác nhận',
      preparing: 'Đang pha chế',
      ready: 'Chờ shipper lấy',
      shipping: 'Đang giao hàng',
      completed: 'Đã hoàn thành',
      failed: 'Giao thất bại',
      cancelled: 'Đã hủy đơn'
    };
    return map[status] || status;
  };

  const demSoLuongTheoTrangThai = (status) => {
    if (!danhSachDonHang || !Array.isArray(danhSachDonHang)) return 0;
    return danhSachDonHang.filter(o => o?.status === status).length;
  };

  const isTransferPaid = (donHang) => (
    ['PAYOS', 'QR_CODE', 'BANK_TRANSFER'].includes(donHang?.payment_method) && donHang?.payment_status === 'PAID'
  );

  const paymentMethodLabel = (method) => {
    if (method === 'CASH') return 'Tiền mặt (COD)';
    if (method === 'PAYOS') return 'Chuyển khoản PayOS';
    if (method === 'QR_CODE' || method === 'BANK_TRANSFER') return 'Chuyển khoản QR';
    return method || 'N/A';
  };

  const danhSachHienThi = danhSachDonHang.filter(o => o?.status === filterStatus);

  return (
    <div className="nv-dashboard-container">
      {/* THANH TOPBAR */}
      <nav className="nv-topbar">
        <div className="nv-brand">
          <ClipboardList size={24} />
          <h2>MilkTea Paradise - Hệ Thống Xử Lý Đơn Hàng</h2>
          <span className="nv-pulse-dot" title="Đang tự động đồng bộ thời gian thực"></span>
        </div>
        
        <div className="nv-user-info">
          <div className="nv-profile">
            <User size={16} />
            <span>{nhanVien?.full_name || 'Nhân viên'}</span>
            <span className="nv-role-badge">
              {nhanVien?.branch_id?.branch_name ? `CN: ${nhanVien.branch_id.branch_name}` : 'Nhân viên chi nhánh'}
            </span>
          </div>

          <button className="nv-btn-logout" onClick={handleDangXuat}>
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </nav>

      {/* TOAST POPUP THÔNG BÁO */}
      {thongBao.text && (
        <div className={`nv-toast ${thongBao.type}`}>
          {thongBao.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{thongBao.text}</span>
        </div>
      )}

      <div className="nv-main-layout">
        {/* SIDEBAR BÊN TRÁI */}
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
              <span>Đang pha chế</span>
              <span className="nv-badge bg-preparing">{demSoLuongTheoTrangThai('preparing')}</span>
            </button>

            <button className={`nv-tab-item ready ${filterStatus === 'ready' ? 'active' : ''}`} onClick={() => setFilterStatus('ready')}>
              <Package size={18} />
              <span>Đã pha chế xong</span>
              <span className="nv-badge bg-ready">{demSoLuongTheoTrangThai('ready')}</span>
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

            <button className={`nv-tab-item failed ${filterStatus === 'failed' ? 'active' : ''}`} onClick={() => setFilterStatus('failed')}>
              <AlertCircle size={18} />
              <span>Giao thất bại</span>
              <span className="nv-badge bg-failed">{demSoLuongTheoTrangThai('failed')}</span>
            </button>

            <button className={`nv-tab-item cancelled ${filterStatus === 'cancelled' ? 'active' : ''}`} onClick={() => setFilterStatus('cancelled')}>
              <XCircle size={18} />
              <span>Đã hủy đơn</span>
              <span className="nv-badge bg-cancelled">{demSoLuongTheoTrangThai('cancelled')}</span>
            </button>
          </div>
        </aside>

        {/* KHU VỰC HIỂN THỊ CHÍNH */}
        <main className="nv-content-area">
          <div className="nv-content-header">
            <h3>Danh sách: {dichTrangThai(filterStatus)} ({danhSachHienThi.length} đơn)</h3>
            <span className="nv-time-sync">Tự động quét đơn chi nhánh theo chu kỳ 10s</span>
          </div>

          {loading ? (
            <div className="nv-loading-box">
              <div className="nv-spinner"></div>
              <p>Đang nạp dữ liệu hóa đơn mới nhất...</p>
            </div>
          ) : danhSachHienThi.length === 0 ? (
            <div className="nv-empty-state">
              <ClipboardList size={48} />
              <p>Hiện tại không có đơn hàng nào thuộc trạng thái [{dichTrangThai(filterStatus)}] tại chi nhánh.</p>
            </div>
          ) : (
            <div className="nv-orders-grid">
              {danhSachHienThi.map((donHang) => (
                <div key={donHang?._id} className={`nv-order-card border-${donHang?.status}`}>
                  <div className="nv-card-header">
                    <div>
                      <span className="nv-order-id">Mã: #{donHang?._id?.slice(-6).toUpperCase()}</span>
                      <span className="nv-order-time">⏱️ {donHang?.createdAt ? new Date(donHang.createdAt).toLocaleTimeString('vi-VN') : 'N/A'}</span>
                    </div>
                    <span className={`nv-status-tag tag-${donHang?.status}`}>{dichTrangThai(donHang?.status)}</span>
                  </div>

                  {donHang?.branch_id?.branch_name && (
                    <div className="nv-branch-tag">
                      📍 Đơn thuộc chi nhánh: <strong>{donHang.branch_id.branch_name}</strong>
                    </div>
                  )}

                  <div className="nv-card-customer">
                    <p><User size={14} /> <strong>{donHang?.shipping_address?.customer_name || 'Khách đặt trực tuyến'}</strong></p>
                    <p><Phone size={14} /> {donHang?.shipping_address?.phone || 'N/A'}</p>
                    <p className="nv-address"><MapPin size={14} /> {donHang?.shipping_address?.address_detail || 'N/A'}</p>
                  </div>

                  <div className="nv-card-items">
                    <h5>Chi tiết đơn hàng ({donHang?.items?.length || 0}):</h5>
                    <div className="nv-items-list">
                      {donHang?.items?.map((item, idx) => (
                        <div key={idx} className="nv-item-row">
                          <div className="nv-item-main">
                            <span className="nv-item-qty">x{item?.quantity}</span>
                            <span className="nv-item-name">{item?.product_name}</span>
                          </div>
                          {item?.selected_toppings?.length > 0 && (
                            <div className="nv-item-toppings">
                              +{item.selected_toppings.map(t => t?.topping_name).join(', ')}
                            </div>
                          )}
                          <span className="nv-item-subtotal">{item?.subtotal?.toLocaleString()}đ</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="nv-card-summary">
                    <div className="nv-summary-row">
                      <span>Hình thức: <strong>{paymentMethodLabel(donHang?.payment_method)}</strong></span>
                      <span className={`nv-payment-status paid-${donHang?.payment_status?.toLowerCase()}`}>
                        {donHang?.payment_status === 'PAID' ? '🟢 Đã trả tiền' : '🔴 Thanh toán COD'}
                      </span>
                    </div>
                    
                    {donHang?.shipping_fee > 0 && (
                      <div className="nv-summary-row nv-shipping-row">
                        <span>Khoảng cách: {donHang?.distance_km || 0} km</span>
                        <span>Phí ship: {donHang?.shipping_fee?.toLocaleString()}đ</span>
                      </div>
                    )}

                    <div className="nv-summary-total">
                      <span>Tổng thu đơn hàng:</span>
                      <span className="nv-total-amount">{donHang?.total_amount?.toLocaleString()}đ</span>
                    </div>
                  </div>

                  {isTransferPaid(donHang) && donHang?.payment_info && (
                    <div className="nv-transfer-success-box">
                      <div className="nv-transfer-title">
                        <CheckCircle size={14} /> Hệ thống PayOS xác nhận
                      </div>
                      <p><strong>Mã GD:</strong> {donHang.payment_info?.order_code || donHang?.payos_order_code || 'N/A'}</p>
                      <p><strong>Thời gian nhận:</strong> {donHang.payment_info?.paid_at ? new Date(donHang.payment_info.paid_at).toLocaleString('vi-VN') : 'N/A'}</p>
                    </div>
                  )}

                  {/* NÚT TƯƠNG TÁC THỰC HIỆN CÁC CHỨC NĂNG */}
                  <div className="nv-card-actions">
                    {donHang?.status === 'pending' && (
                      <>
                        <button className="nv-btn-action accept" onClick={() => handleCapNhatTrangThai(donHang._id, 'preparing')}>
                          <CheckCircle size={15} /> Nhận đơn & Pha chế
                        </button>
                        <button className="nv-btn-action cancel" onClick={() => moModalHuy(donHang._id)}>
                          Từ chối / Hủy đơn
                        </button>
                      </>
                    )}
                    {donHang?.status === 'preparing' && (
                      <button className="nv-btn-action ready-btn" onClick={() => handleCapNhatTrangThai(donHang._id, 'ready')}>
                        <Package size={15} /> Pha chế xong (Báo tài xế)
                      </button>
                    )}
                    {donHang?.status === 'ready' && (
                      <div className="nv-closed-history-box text-center">
                        <span className="nv-text-disabled">🔔 Đang chờ tài xế đến nhận hàng đi giao...</span>
                        {/* 🌟 HIỂN THỊ THÊM: Nhân viên tiếp nhận */}
                        {donHang?.staff_id?.full_name && (
                          <p style={{ marginTop: '6px', fontSize: '13px', color: '#198754' }}>
                            📋 Nhân viên tiếp nhận: <strong>{donHang.staff_id.full_name}</strong>
                          </p>
                        )}
                      </div>
                    )}
                    {(donHang?.status === 'shipping' || donHang?.status === 'completed' || donHang?.status === 'cancelled' || donHang?.status === 'failed') && (
                      <div className="nv-closed-history-box">
                        <span className="nv-text-disabled">
                          {donHang?.status === 'shipping' && '🚚 Đơn hàng đang được điều phối đi giao hàng'}
                          {donHang?.status === 'completed' && '🔒 Đơn hàng đã hoàn thành thành công'}
                          {donHang?.status === 'failed' && '❌ Tiến trình giao hàng không thành công'}
                          {donHang?.status === 'cancelled' && '🚫 Đơn hàng này đã hủy'}
                        </span>
                        
                        {/* 🌟 HIỂN THỊ THÊM: Nhân viên tiếp nhận gốc */}
                        {donHang?.staff_id?.full_name && (
                          <p style={{ marginTop: '4px', fontSize: '13px', color: '#198754' }}>
                            📋 Nhân viên tiếp nhận: <strong>{donHang.staff_id.full_name}</strong>
                          </p>
                        )}

                        {donHang?.shipper_id?.full_name && (
                          <p className="nv-text-shipper-name" style={{ marginTop: '4px', fontSize: '13px', color: '#0d6efd' }}>
                            👤 Tài xế phụ trách: <strong>{donHang.shipper_id.full_name}</strong>
                          </p>
                        )}

                        {donHang?.cancel_reason && (
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

      {/* MODAL NHẬP LÝ DO HỦY ĐƠN */}
      {showCancelModal && (
        <div className="nv-modal-overlay">
          <div className="nv-modal-box animate-popup">
            <div className="nv-modal-header">
              <h4>Từ chối & Hủy Đơn Hàng</h4>
              <button className="nv-modal-close-x" onClick={gongModalHuy}>&times;</button>
            </div>
            <form onSubmit={xacNhanHuyDon}>
              <div className="nv-modal-body">
                <p>Bạn đang thực hiện hủy đơn hàng có mã rút gọn: <strong>#{selectedOrderId?.slice(-6).toUpperCase()}</strong></p>
                <div className="nv-form-group">
                  <label htmlFor="reasonInput">Lý do hủy đơn bắt buộc <span className="required">*</span></label>
                  <textarea
                    id="reasonInput"
                    placeholder="Ví dụ: Hết nguyên liệu trà sữa, khách yêu cầu thay đổi thông tin..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={4}
                    autoFocus
                  />
                </div>
              </div>
              <div className="nv-modal-footer">
                <button type="button" className="nv-btn-modal cancel-back" onClick={gongModalHuy}>Quay lại</button>
                <button type="submit" className="nv-btn-modal submit-kill">Xác nhận hủy đơn</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NhanvienDashboard;
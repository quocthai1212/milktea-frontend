import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardList, Search, Filter, Eye, Printer, CheckCircle, 
  XCircle, Truck, Package, Clock, AlertTriangle, RefreshCw, User, MapPin, Phone, Building2 
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';
import '../css/quantri/QuanLyDonHang.css'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Bảng ánh xạ dịch trạng thái sang Tiếng Việt để hiển thị giao diện
const STATUS_VI = {
  'pending': 'Chờ duyệt',
  'preparing': 'Đang pha chế',
  'ready': 'Đã pha chế xong',
  'shipping': 'Đang giao hàng',
  'completed': 'Giao hàng thành công',
  'failed': 'Thất bại (Khách BOM)',
  'cancelled': 'Đã hủy đơn'
};

const QuanLyDonHang = () => {
  // --- States quản lý dữ liệu ---
  const [danhSachDonHang, setDanhSachDonHang] = useState([]);
  const [loading, setLoading] = useState(false);
  const [danhSachShipper, setDanhSachShipper] = useState([]);
  const [danhSachChiNhanh, setDanhSachChiNhanh] = useState([]); // 🌟 Lưu danh sách chi nhánh tự động trích xuất

  // --- States Bộ lọc & Tìm kiếm ---
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all'); 

  // --- States Modal Chi tiết & Điều hành ---
  const [modalOpen, setModalOpen] = useState(false);
  const [donHangSelected, setDonHangSelected] = useState(null);
  const [shipperSelected, setShipperSelected] = useState('');
  
  // --- States Modal Xác nhận & Nhập lý do Hủy ---
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState({ donHang: null, trangThaiMoi: '' });
  const [lyDoHuyInput, setLyDoHuyInput] = useState('');

  const componentRef = useRef();

  // --- 👤 Lấy ID Admin từ LocalStorage ---
  const getLoggedInStaffId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user._id || null; 
    } catch (e) {
      console.error("Không thể đọc thông tin cơ sở đăng nhập:", e);
      return null;
    }
  };

  // --- 🔍 Gọi API lấy danh sách đơn hàng & Tự động trích xuất Chi nhánh, Shipper (Khắc phục lỗi 404) ---
  const layDanhSachDonHang = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/quantri/donhang/all?status=${statusFilter}&payment_method=${paymentFilter}&branch_id=${branchFilter}`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        const dataOrders = result.data || [];
        setDanhSachDonHang(dataOrders);

        // Sử dụng Map để lọc trùng lặp dữ liệu
        const mapChiNhanh = new Map();
        const mapShipper = new Map();

        // Duyệt qua tất cả đơn hàng hiện có để gom dữ liệu Chi nhánh và Shipper thực tế
        dataOrders.forEach(don => {
          // Gom chi nhánh hợp lệ từ liên kết populate branch_id
          if (don.branch_id && don.branch_id._id) {
            mapChiNhanh.set(String(don.branch_id._id), don.branch_id);
          }
          // Gom shipper hợp lệ từ liên kết populate shipper_id
          if (don.shipper_id && don.shipper_id._id) {
            mapShipper.set(String(don.shipper_id._id), don.shipper_id);
          }
        });

        // Chỉ cập nhật danh sách thanh lựa chọn khi đang ở chế độ "Tất cả chi nhánh"
        // Để tránh việc thanh chọn bị thu hẹp chỉ còn 1 option khi bấm chọn bộ lọc
        if (branchFilter === 'all') {
          setDanhSachChiNhanh(Array.from(mapChiNhanh.values()));
        }
        setDanhSachShipper(Array.from(mapShipper.values()));

        // Đồng bộ dữ liệu trong Modal xem chi tiết thời gian thực
        if (donHangSelected) {
          const updatedOrder = dataOrders.find(o => o._id === donHangSelected._id);
          if (updatedOrder) {
            setDonHangSelected(updatedOrder);
            setShipperSelected(updatedOrder.shipper_id?._id || '');
          }
        }
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn hàng:", error);
      toast.error("Không thể tải danh sách đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  // Theo dõi sự thay đổi của bộ lọc để tự động Re-fetch dữ liệu chuẩn xác
  useEffect(() => {
    layDanhSachDonHang();
  }, [statusFilter, paymentFilter, branchFilter]);

  // --- ⚙️ Điều phối & Thay đổi trạng thái đơn hàng ---
  const handleCapNhatTrangThai = async (idDonHang, trangThaiMoi, dataBoSung = {}) => {
    try {
      const payload = { status: trangThaiMoi, ...dataBoSung };
      const currentStaffId = getLoggedInStaffId();
      if (currentStaffId) {
        payload.staff_id = currentStaffId;
      }

      const response = await fetch(`${API_URL}/api/quantri/donhang/update-status/${idDonHang}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (result.success) {
        toast.success(result.message || `Chuyển trạng thái thành công!`);
        await layDanhSachDonHang(); 
      } else {
        toast.error(result.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái đơn:", error);
      toast.error("Đã xảy ra lỗi hệ thống khi cập nhật!");
    }
  };

  // --- 🛠️ Mở Modal xác nhận thay đổi trạng thái ---
  const handleThayDoiTrangThaiTaiHang = (donHang, trangThaiMoi) => {
    if (trangThaiMoi === donHang.status) return;
    
    setPendingUpdate({ donHang, trangThaiMoi });
    setLyDoHuyInput(''); 
    setConfirmModalOpen(true); 
  };

  // --- 🛠️ Xác nhận hành động từ Modal Custom ---
  const handleXacNhanCapNhat = async () => {
    const { donHang, trangThaiMoi } = pendingUpdate;
    if (!donHang) return;

    if (['cancelled', 'failed'].includes(trangThaiMoi)) {
      if (!lyDoHuyInput.trim()) {
        toast.warning("Bạn bắt buộc phải nhập lý do!");
        return;
      }
      await handleCapNhatTrangThai(donHang._id, trangThaiMoi, { cancel_reason: lyDoHuyInput });
    } else {
      await handleCapNhatTrangThai(donHang._id, trangThaiMoi);
    }
    
    setConfirmModalOpen(false); 
  };

  // --- 🖨️ In hóa đơn tại chỗ ---
  const handleInDonHang = () => {
    const printContent = componentRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); 
  };

  const handleXemChiTiet = (donHang) => {
    setDonHangSelected(donHang);
    setShipperSelected(donHang.shipper_id?._id || '');
    setModalOpen(true);
  };

  // --- Bộ lọc tìm kiếm nhanh Client-side ---
  const filteredDonHangs = danhSachDonHang.filter(don => {
    const orderIdStr = don._id ? String(don._id).toLowerCase() : '';
    const customerNameStr = (don.shipping_address?.customer_name || don.customer_id?.full_name || '').toLowerCase();
    const customerPhoneStr = don.shipping_address?.phone || don.customer_id?.phone || '';

    return orderIdStr.includes(searchQuery.toLowerCase()) || 
           customerNameStr.includes(searchQuery.toLowerCase()) ||
           customerPhoneStr.includes(searchQuery);
  });

  const isTransferPaid = (donHang) => (
    ['PAYOS'].includes(donHang?.payment_method) && donHang?.payment_status === 'PAID'
  );

  const paymentMethodLabel = (method) => {
    if (method === 'CASH') return 'Tiền mặt';
    if (method === 'PAYOS') return 'Chuyển khoản QR';
    return method || 'N/A';
  };

  return (
    <div className="dh-manager-container">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      {/* HEADER */}
      <div className="dh-header">
        <h2 className="dh-title">
          <ClipboardList size={26} className="dh-title-icon" /> Quản lý & Điều phối Đơn hàng
        </h2>
      </div>

      {/* TOOLBAR TÌM KIẾM & BỘ LỌC ĐA NHIỆM */}
      <div className="dh-toolbar">
        <div className="dh-search-box">
          <Search size={18} className="dh-icon-search" />
          <input 
            type="text" 
            placeholder="Tìm theo Mã đơn ID, tên khách, số điện thoại..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="dh-filters-group">
          {/* 🌟 BỘ LỌC CHI NHÁNH: Đã bọc cơ chế chống crash và nạp dữ liệu động */}
          <div className="dh-filter-item">
            <Building2 size={14} style={{ color: '#4b5563' }} />
            <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
              <option value="all">Tất cả chi nhánh ({danhSachChiNhanh.length})</option>
              {danhSachChiNhanh.length > 0 ? (
                danhSachChiNhanh.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    🏪 {branch.branch_name || 'Chi nhánh ẩn'}
                  </option>
                ))
              ) : (
                <option disabled value="">(Chưa tải được chi nhánh)</option>
              )}
            </select>
          </div>

          <div className="dh-filter-item">
            <Filter size={14} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">⏳ Chờ duyệt</option>
              <option value="preparing">🧋 Đang pha chế</option>
              <option value="ready">📦 Đã pha chế xong</option>
              <option value="shipping">🏍️ Đang đi giao hàng</option>
              <option value="completed">🟢 Giao hàng thành công</option>
              <option value="failed">🔴 Giao hàng thất bại (BOM)</option>
              <option value="cancelled">❌ Đã hủy đơn</option>
            </select>
          </div>

          <div className="dh-filter-item">
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="all">Tất cả phương thức</option>
              <option value="CASH">💵 Tiền mặt (CASH)</option>
              <option value="PAYOS">📱 Chuyển khoản QR</option>
            </select>
          </div>
        </div>
      </div>

      {/* BẢNG HIỂN THỊ ĐƠN HÀNG */}
      <div className="dh-table-wrapper">
        {loading ? (
          <div className="dh-status-box"><div className="dh-spinner"></div> Đang tải danh sách hóa đơn...</div>
        ) : filteredDonHangs.length === 0 ? (
          <div className="dh-status-box empty">📭 Không có dữ liệu đơn hàng nào khớp bộ lọc.</div>
        ) : (
          <table className="dh-table">
            <thead>
              <tr>
                <th>Mã Đơn (ID)</th>
                <th>Khách Hàng</th>
                <th>Cơ Sở / Chi Nhánh</th>
                <th>Thời Gian Đặt</th>
                <th>Thanh Toán</th>
                <th>Nhân Viên Duyệt</th>
                <th>Shipper Đảm Nhận</th>
                <th style={{ width: '160px' }}>Đổi Trạng Thái</th>
                <th className="text-right">Tổng Tiền</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonHangs.map((don) => (
                <tr key={don._id} className={`dh-row-status-${don.status}`}>
                  <td><span className="dh-code-text" title={don._id}>{don._id ? String(don._id).slice(-8).toUpperCase() : 'N/A'}</span></td>
                  <td>
                    <div className="dh-cust-cell">
                      <strong>{don.shipping_address?.customer_name || don.customer_id?.full_name || 'Khách tại quầy'}</strong>
                      <span>{don.shipping_address?.phone || don.customer_id?.phone || 'Không có SĐT'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="dh-branch-badge" style={{ fontSize: '13px', fontWeight: '600', color: '#4f46e5' }}>
                      🏪 {don.branch_id?.branch_name || <span style={{ color: '#9ca3af', fontWeight: 'normal' }}>Chưa phân vị trí</span>}
                    </span>
                  </td>
                  <td>{don.createdAt ? new Date(don.createdAt).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'}) : 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span className={`dh-pay-badge ${don.payment_method}`}>
                        {paymentMethodLabel(don.payment_method)}
                      </span>
                      {/* Nếu là PayOS và đã thanh toán, hiển thị tooltip hoặc tên viết tắt của người chuyển */}
                      {don.payment_method === 'PAYOS' && don.payment_info?.bank_account_name && (
                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: '500' }} title={`STK: ${don.payment_info.bank_account_number}`}>
                          👤 {don.payment_info.bank_account_name.substring(0, 15)}...
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {don.staff_id?.full_name ? (
                      <span className="dh-staff-name" style={{ fontWeight: '500', color: '#374151' }}>
                        👤 {don.staff_id.full_name}
                      </span>
                    ) : (
                      <span className="dh-staff-empty" style={{ fontStyle: 'italic', color: '#9ca3af' }}>
                        {don.status === 'pending' ? '⏳ Chờ tiếp nhận' : '🤖 Hệ thống'}
                      </span>
                    )}
                  </td>
                  <td>
                    {don.shipper_id?.full_name ? (
                      <span className="dh-shipper-assigned">🏍️ {don.shipper_id.full_name}</span>
                    ) : (
                      <span className="dh-shipper-none" style={{ color: ['pending', 'preparing', 'ready'].includes(don.status) ? '#9ca3af' : '#ef4444', fontStyle: 'italic' }}>
                        {['pending', 'preparing', 'ready'].includes(don.status) ? '⏱️ Chưa điều phối' : '❌ Không có'}
                      </span>
                    )}
                  </td>
                  
                  <td>
                    <select 
                      className={`dh-status-select select-status-${don.status}`}
                      value={don.status} 
                      disabled={['completed', 'failed', 'cancelled'].includes(don.status)}
                      onChange={(e) => handleThayDoiTrangThaiTaiHang(don, e.target.value)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: ['completed', 'failed', 'cancelled'].includes(don.status) ? 'not-allowed' : 'pointer',
                        width: '100%',
                        backgroundColor: '#fff'
                      }}
                    >
                      <option value="pending">⏳ Chờ duyệt</option>
                      <option value="preparing">🧋 Đang pha chế</option>
                      <option value="ready">📦 Đã pha chế xong</option>
                      <option value="shipping">🏍️ Đang giao hàng</option>
                      <option value="completed">🟢 Thành công</option>
                      <option value="failed">🔴 Thất bại (BOM)</option>
                      <option value="cancelled">❌ Đã hủy đơn</option>
                    </select>
                  </td>

                  <td className="text-right text-bold text-dark">
                    {(don.total_amount || 0).toLocaleString('vi-VN')} đ
                  </td>
                  <td className="text-center">
                    <button className="dh-btn-view" onClick={() => handleXemChiTiet(don)}>
                      <Eye size={14} /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL POPUP CHI TIẾT & ĐIỀU PHỐI ĐƠN HÀNG */}
      {modalOpen && donHangSelected && (
        <div className="dh-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="dh-modal-content" onClick={(e) => e.stopPropagation()}>
            
            <div className="dh-modal-header">
              <h4>Chi Tiết Hóa Đơn #{String(donHangSelected._id).toUpperCase()}</h4>
              <button className="dh-modal-close" onClick={() => setModalOpen(false)}><XCircle size={20} /></button>
            </div>

            <div className="dh-modal-body">
              <div ref={componentRef} className="dh-print-section">
                <div className="dh-invoice-title">HÓA ĐƠN MILKTEA PARADISE</div>
                <div style={{ textAlign: 'center', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  🏢 {donHangSelected.branch_id?.branch_name || 'Cơ sở Tổng Hệ Thống'}
                </div>
                {donHangSelected.branch_id?.shop_address && (
                  <p className="text-center text-muted text-small" style={{ margin: '0 auto 8px auto', maxWidth: '80%' }}>
                    📍 Địa chỉ: {donHangSelected.branch_id.shop_address}
                  </p>
                )}
                <p className="text-center text-muted text-small">Mã hệ thống: {donHangSelected._id}</p>
                <hr className="dashed-line"/>

                <div className="dh-info-grid">
                  <div>
                    <h5><User size={14}/> Khách hàng</h5>
                    <p><strong>Tên:</strong> {donHangSelected.shipping_address?.customer_name || donHangSelected.customer_id?.full_name || 'Khách vãng lai'}</p>
                    <p><strong>SĐT:</strong> {donHangSelected.shipping_address?.phone || donHangSelected.customer_id?.phone || 'N/A'}</p>
                    <p><strong>Địa chỉ:</strong> {donHangSelected.shipping_address?.address_detail || 'Nhận trực tiếp tại cửa hàng'}</p>
                  </div>
                  <div>
                    <h5><Clock size={14}/> Thông tin đơn</h5>
                    <p><strong>Ngày đặt:</strong> {new Date(donHangSelected.createdAt).toLocaleString('vi-VN')}</p>
                    <p><strong>Hình thức:</strong> {donHangSelected.order_type === 'pos' ? 'Tại quầy (POS)' : 'Đặt trực tuyến (Online)'}</p>
                    <p><strong>Cổng thanh toán:</strong> {paymentMethodLabel(donHangSelected.payment_method)} ({donHangSelected.payment_status})</p>
                    <p><strong>Trạng thái đơn:</strong> <span className="text-bold text-uppercase" style={{color: '#2563eb'}}>{STATUS_VI[donHangSelected.status] || donHangSelected.status}</span></p>
                    
                    <hr style={{ margin: '6px 0', border: 'none', borderTop: '1px dotted #e5e7eb' }} />
                    <p><strong>👤 Nhân viên phụ trách:</strong> {donHangSelected.staff_id?.full_name || (donHangSelected.status === 'pending' ? 'Chờ tiếp nhận...' : 'Hệ thống tự động')}</p>
                    <p><strong>🏍️ Shipper giao hàng:</strong> {donHangSelected.shipper_id?.full_name ? `${donHangSelected.shipper_id.full_name} (${donHangSelected.shipper_id.phone || ''})` : 'Chưa chỉ định tài xế'}</p>
                  </div>
                </div>

                {isTransferPaid(donHangSelected) && (
                  <div className="dh-payment-success-box" style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '14px',
                    marginBottom: '15px'
                  }}>
                    <h5 style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 10px 0', fontSize: '14px', fontWeight: '650' }}>
                      <CheckCircle size={16} /> Đối Soát Giao Dịch QR-PayOS
                    </h5>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: '8px 16px',
                      fontSize: '13px',
                      color: '#374151'
                    }}>
                      <p style={{ margin: 0 }}><strong>👤 Người chuyển:</strong> {donHangSelected.payment_info?.bank_account_name || 'N/A'}</p>
                      <p style={{ margin: 0 }}><strong>💳 Số tài khoản:</strong> {donHangSelected.payment_info?.bank_account_number || 'N/A'}</p>
                      <p style={{ margin: 0 }}><strong>💵 Tiền thực nhận:</strong> <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{(donHangSelected.payment_info?.bank_amount_paid || donHangSelected.total_amount || 0).toLocaleString('vi-VN')} đ</span></p>
                      <p style={{ margin: 0 }}><strong>⏱️ Thời gian:</strong> {donHangSelected.payment_info?.paid_at ? new Date(donHangSelected.payment_info.paid_at).toLocaleString('vi-VN') : 'N/A'}</p>
                      <p style={{ margin: 0, gridColumn: '1 / -1' }}>
                        <strong>📝 Nội dung chuyển khoản:</strong>{' '}
                        <span style={{ 
                          fontFamily: 'monospace', 
                          background: '#e8f5e9', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          color: '#1b5e20', 
                          fontWeight: 'bold',
                          letterSpacing: '0.5px' 
                        }}>
                          {donHangSelected.payment_info?.display_description || 'Không có nội dung'}
                        </span>
                      </p>
                      {/* <p style={{ margin: 0, gridColumn: '1 / -1', fontSize: '12px', color: '#6b7280' }}><strong>🔗 Mã chuẩn chi/Ref:</strong> {donHangSelected.payment_info?.bank_reference || donHangSelected.payos_order_code || 'N/A'}</p> */}
                    </div>
                  </div>
                )}

                <h5>🥤 Danh sách đồ uống</h5>
                <table className="dh-invoice-items-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm / Topping đi kèm</th>
                      <th className="text-center">SL</th>
                      <th className="text-right">Đơn giá</th>
                      <th className="text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donHangSelected.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="text-bold">{item.product_name}</div>
                          {item.selected_toppings && item.selected_toppings.length > 0 && (
                            <div className="text-muted text-small" style={{ paddingLeft: '8px' }}>
                              + Topping: {item.selected_toppings.map(t => `${t.topping_name} (+${t.price}đ)`).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="text-center">x{item.quantity}</td>
                        <td className="text-right">{(item.final_unit_price || item.base_price || 0).toLocaleString('vi-VN')} đ</td>
                        <td className="text-right">{(item.subtotal || ((item.final_unit_price || 0) * item.quantity)).toLocaleString('vi-VN')} đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="dh-invoice-total-block">
                  <p>Tiền hàng: <span>{(donHangSelected.products_subtotal || 0).toLocaleString('vi-VN')} đ</span></p>
                  <p>Giảm giá: <span>-{(donHangSelected.discount_amount || 0).toLocaleString('vi-VN')} đ</span></p>
                  <p>Phí giao hàng ({donHangSelected.distance_km || 0} km): <span>{(donHangSelected.shipping_fee || 0).toLocaleString('vi-VN')} đ</span></p>
                  <h4>TỔNG THANH TOÁN: <span>{(donHangSelected.total_amount || 0).toLocaleString('vi-VN')} đ</span></h4>
                </div>
              </div>
            </div>

            <div className="dh-modal-footer">
              <button className="dh-btn-print" onClick={handleInDonHang}>
                <Printer size={15} /> Xuất & In Hóa Đơn
              </button>
              <button className="dh-btn-close-text" onClick={() => setModalOpen(false)}>Đóng lại</button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL CUSTOM XÁC NHẬN ĐỔI TRẠNG THÁI / NHẬP LÝ DO HỦY */}
      {confirmModalOpen && pendingUpdate.donHang && (
        <div className="dh-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="dh-modal-content" style={{ maxWidth: '450px' }}>
            <div className="dh-modal-header" style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <h4 style={{ color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="#f59e0b" /> Xác nhận thay đổi
              </h4>
            </div>
            <div className="dh-modal-body" style={{ padding: '20px' }}>
              <p style={{ marginBottom: '15px', fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }}>
                Bạn có chắc chắn muốn chuyển đơn hàng <strong>#{String(pendingUpdate.donHang._id).slice(-8).toUpperCase()}</strong> sang trạng thái <br/>
                <span className="dh-pay-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', marginTop: '6px', display: 'inline-block', textTransform: 'none', fontWeight: 'bold' }}>
                  {STATUS_VI[pendingUpdate.trangThaiMoi] || pendingUpdate.trangThaiMoi}
                </span>?
              </p>

              {['cancelled', 'failed'].includes(pendingUpdate.trangThaiMoi) && (
                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Lý do thay đổi trạng thái <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    className="dh-confirm-textarea"
                    placeholder="Vui lòng nhập lý do cụ thể vào đây..."
                    value={lyDoHuyInput}
                    onChange={(e) => setLyDoHuyInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>
              )}
            </div>
            <div className="dh-modal-footer" style={{ gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb' }}>
              <button 
                onClick={() => setConfirmModalOpen(false)}
                style={{ padding: '8px 16px', background: '#e5e7eb', color: '#4b5563', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleXacNhanCapNhat}
                style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuanLyDonHang;
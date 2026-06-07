import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardList, Search, Filter, Eye, Printer, CheckCircle, 
  XCircle, Truck, Package, Clock, AlertTriangle, RefreshCw, User, MapPin, Phone 
} from 'lucide-react';
import '../css/quantri/QuanLyDonHang.css'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const QuanLyDonHang = () => {
  // --- States quản lý dữ liệu ---
  const [danhSachDonHang, setDanhSachDonHang] = useState([]);
  const [loading, setLoading] = useState(false);
  const [danhSachShipper, setDanhSachShipper] = useState([]);

  // --- States Bộ lọc & Tìm kiếm ---
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // --- States Modal Chi tiết & Điều hành ---
  const [modalOpen, setModalOpen] = useState(false);
  const [donHangSelected, setDonHangSelected] = useState(null);
  const [lyDoHuy, setLyDoHuy] = useState('');
  const [shipperSelected, setShipperSelected] = useState('');
  
  const componentRef = useRef();

  // --- 🔍 1. Gọi API lấy danh sách đơn hàng ---
  const layDanhSachDonHang = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/quantri/donhang/all`);
      const result = await response.json();
      if (result.success) {
        setDanhSachDonHang(result.data || []);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 🏍️ 2. Gọi API lấy danh sách tài xế (Shipper) ---
  const layDanhSachShipper = async () => {
    try {
      const response = await fetch(`${API_URL}/api/quantri/qt_shipper/all`);
      const result = await response.json();
      if (result.success) {
        setDanhSachShipper(result.data || []);
      } else if (Array.isArray(result)) {
        setDanhSachShipper(result);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách shipper:", error);
    }
  };

  useEffect(() => {
    layDanhSachDonHang();
    layDanhSachShipper();
  }, []);

  // --- ⚙️ 3. Thay đổi trạng thái đơn hàng & gán Shipper ---
  const handleCapNhatTrangThai = async (idDonHang, trangThaiMoi, dataBoSung = {}) => {
    try {
      const response = await fetch(`${API_URL}/api/quantri/donhang/update-status/${idDonHang}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: trangThaiMoi, ...dataBoSung })
      });
      const result = await response.json();
      if (result.success) {
        alert(`Cập nhật thành công đơn hàng sang trạng thái mới!`);
        setModalOpen(false);
        layDanhSachDonHang(); 
      } else {
        alert(result.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái đơn:", error);
    }
  };

  // --- 🖨️ 4. In hóa đơn tại chỗ ---
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
    setLyDoHuy(donHang.cancel_reason || '');
    setModalOpen(true);
  };

  // --- Bộ lọc dữ liệu Client-side mượt mà ---
  const filteredDonHangs = danhSachDonHang.filter(don => {
    const orderIdStr = don._id ? String(don._id).toLowerCase() : '';
    const customerNameStr = (don.shipping_address?.customer_name || don.customer_id?.full_name || '').toLowerCase();
    const customerPhoneStr = don.shipping_address?.phone || don.customer_id?.phone || '';

    const matchSearch = orderIdStr.includes(searchQuery.toLowerCase()) || 
                        customerNameStr.includes(searchQuery.toLowerCase()) ||
                        customerPhoneStr.includes(searchQuery);
    
    const matchStatus = statusFilter === 'all' ? true : don.status === statusFilter;
    const matchPayment = paymentFilter === 'all' ? true : don.payment_method === paymentFilter;

    return matchSearch && matchStatus && matchPayment;
  });

  const renderBadgeTrangThai = (status) => {
    switch(status) {
      case 'pending': return <span className="dh-badge status-pending"><Clock size={12}/> Chờ duyệt</span>;
      case 'preparing': return <span className="dh-badge status-confirmed"><Package size={12}/> Đang pha chế</span>;
      case 'shipping': return <span className="dh-badge status-shipping"><Truck size={12}/> Đang giao</span>;
      case 'completed': return <span className="dh-badge status-completed"><CheckCircle size={12}/> Thành công</span>;
      case 'failed': return <span className="dh-badge status-failed"><XCircle size={12}/> Thất bại (Bom)</span>;
      case 'cancelled': return <span className="dh-badge status-failed"><XCircle size={12}/> Đã hủy đơn</span>;
      default: return <span className="dh-badge">{status}</span>;
    }
  };

  return (
    <div className="dh-manager-container">
      {/* HEADER */}
      <div className="dh-header">
        <h2 className="dh-title">
          <ClipboardList size={26} className="dh-title-icon" /> Quản lý & Điều phối Đơn hàng
        </h2>
        <button onClick={layDanhSachDonHang} className="dh-btn-refresh" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'dh-spin' : ''} /> 
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* TOOLBAR TÌM KIẾM & BỘ LỌC */}
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
          <div className="dh-filter-item">
            <Filter size={14} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">⏳ Chờ duyệt</option>
              <option value="preparing">🧋 Đang pha chế</option>
              <option value="shipping">🏍️ Đang đi giao hàng</option>
              <option value="completed">🟢 Giao hàng thành công</option>
              <option value="failed">🔴 Thất bại (Khách BOM)</option>
              <option value="cancelled">❌ Đã hủy đơn</option>
            </select>
          </div>

          <div className="dh-filter-item">
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="all">Tất cả phương thức</option>
              <option value="CASH">💵 Tiền mặt (CASH)</option>
              <option value="QR_CODE">📱 Chuyển khoản QR</option>
              <option value="PAYOS">💳 Cổng PayOS</option>
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
                <th>Thời Gian Đặt</th>
                <th>Thanh Toán</th>
                <th>Shipper Đảm Nhận</th>
                <th>Trạng Thái</th>
                <th className="text-right">Tổng Tiền</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonHangs.map((don) => (
                <tr key={don._id} className={`dh-row-status-${don.status}`}>
                  {/* Hiển thị Full ID hoặc 8 ký tự cuối một cách an toàn */}
                  <td><span className="dh-code-text" title={don._id}>{don._id ? String(don._id).slice(-8).toUpperCase() : 'N/A'}</span></td>
                  <td>
                    <div className="dh-cust-cell">
                      <strong>{don.shipping_address?.customer_name || don.customer_id?.full_name || 'Khách tại quầy'}</strong>
                      <span>{don.shipping_address?.phone || don.customer_id?.phone || 'Không có SĐT'}</span>
                    </div>
                  </td>
                  <td>{don.createdAt ? new Date(don.createdAt).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'}) : 'N/A'}</td>
                  <td>
                    <span className={`dh-pay-badge ${don.payment_method}`}>
                      {don.payment_method === 'CASH' ? '💵 Tiền mặt' : don.payment_method === 'QR_CODE' ? '📱 Mã QR' : '💳 PayOS'}
                    </span>
                  </td>
                  <td>
                    {don.shipper_id ? (
                      <span className="dh-shipper-assigned">🏍️ {don.shipper_id.full_name}</span>
                    ) : (
                      <span className="dh-shipper-none">Chưa điều xe</span>
                    )}
                  </td>
                  <td>{renderBadgeTrangThai(don.status)}</td>
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
              {/* VÙNG IN HÓA ĐƠN */}
              <div ref={componentRef} className="dh-print-section">
                <div className="dh-invoice-title">HÓA ĐƠN MILKTEA PARADISE</div>
                <p className="text-center text-muted text-small">Mã hệ thống: {donHangSelected._id}</p>
                <hr className="dashed-line"/>

                <div className="dh-info-grid">
                  <div>
                    <h5><User size={14}/> Khách hàng</h5>
                    <p><strong>Tên:</strong> {donHangSelected.shipping_address?.customer_name || donHangSelected.customer_id?.full_name || 'Khách vãng lai'}</p>
                    <p><strong>SĐT:</strong> {donHangSelected.shipping_address?.phone || donHangSelected.customer_id?.phone || 'N/A'}</p>
                    {/* 🛠️ SỬA LỖI ĐỊA CHỈ: Đọc chính xác từ object shipping_address của Schema */}
                    <p><strong>Địa chỉ:</strong> {donHangSelected.shipping_address?.address_detail || 'Nhận trực tiếp tại cửa hàng'}</p>
                  </div>
                  <div>
                    <h5><Clock size={14}/> Thông tin đơn</h5>
                    <p><strong>Ngày đặt:</strong> {new Date(donHangSelected.createdAt).toLocaleString('vi-VN')}</p>
                    <p><strong>Hình thức:</strong> {donHangSelected.order_type === 'pos' ? 'Tại quầy (POS)' : 'Đặt trực tuyến (Online)'}</p>
                    <p><strong>Cổng thanh toán:</strong> {donHangSelected.payment_method} ({donHangSelected.payment_status})</p>
                    <p><strong>Trạng thái đơn:</strong> {donHangSelected.status.toUpperCase()}</p>
                  </div>
                </div>

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
                    {/* 🛠️ SỬA LỖI ĐỌC SẢN PHẨM: Khớp các biến final_unit_price và subtotal từ OrderItemSchema */}
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

              {/* BỘ ĐIỀU PHỐI DÀNH CHO ADMIN */}
              <div className="dh-admin-controls">
                <h5>⚙️ Trung tâm điều phối đơn hàng</h5>
                
                {/* 1. Chọn tài xế giao hàng */}
                {['pending', 'preparing', 'shipping'].includes(donHangSelected.status) && (
                  <div className="dh-control-group">
                    <label>Chỉ định Nhân viên giao hàng (Shipper):</label>
                    <div className="dh-flex-row">
                      <select value={shipperSelected} onChange={(e) => setShipperSelected(e.target.value)}>
                        <option value="">-- Chọn Shipper đang rảnh --</option>
                        {danhSachShipper.map(ship => (
                          <option key={ship._id} value={ship._id}>🏍️ {ship.full_name} ({ship.phone})</option>
                        ))}
                      </select>
                      <button 
                        className="dh-btn-save-shipper"
                        disabled={!shipperSelected}
                        onClick={() => handleCapNhatTrangThai(donHangSelected._id, 'preparing', { shipper_id: shipperSelected })}
                      >
                        Gán tài xế
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Cập nhật tiến độ luồng xử lý đơn */}
                <div className="dh-control-group">
                  <label>Chuyển đổi trạng thái nhanh:</label>
                  <div className="dh-buttons-status-row">
                    {donHangSelected.status === 'pending' && (
                      <button className="btn-st-confirm" onClick={() => handleCapNhatTrangThai(donHangSelected._id, 'preparing')}>
                        📦 Duyệt & Chuyển vào Pha Chế
                      </button>
                    )}
                    {donHangSelected.status === 'preparing' && (
                      <button className="btn-st-ship" onClick={() => handleCapNhatTrangThai(donHangSelected._id, 'shipping')}>
                        🏍️ Bàn giao cho Shipper đi giao
                      </button>
                    )}
                    {['preparing', 'shipping'].includes(donHangSelected.status) && (
                      <button className="btn-st-complete" onClick={() => handleCapNhatTrangThai(donHangSelected._id, 'completed')}>
                        🟢 Hoàn thành đơn (Đã giao & Nhận tiền)
                      </button>
                    )}
                    
                    {/* Luồng Hủy đơn / Báo BOM */}
                    {!['completed', 'failed', 'cancelled'].includes(donHangSelected.status) && (
                      <div className="dh-bom-input-box">
                        <input 
                          type="text" 
                          placeholder="Nhập lý do hủy hoặc lý do khách BOM..." 
                          value={lyDoHuy} 
                          onChange={(e) => setLyDoHuy(e.target.value)}
                        />
                        <button 
                          className="btn-st-fail" 
                          disabled={!lyDoHuy} 
                          onClick={() => handleCapNhatTrangThai(donHangSelected._id, 'cancelled', { cancel_reason: lyDoHuy })}
                        >
                          ❌ Hủy đơn / Báo BOM
                        </button>
                      </div>
                    )}

                    {['failed', 'cancelled'].includes(donHangSelected.status) && (
                      <div className="dh-alert-failed-box">
                        <AlertTriangle size={16}/> <strong>Đơn đã bị đóng:</strong> {donHangSelected.cancel_reason || 'Hệ thống huỷ tự động'}
                      </div>
                    )}
                  </div>
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
    </div>
  );
};

export default QuanLyDonHang;
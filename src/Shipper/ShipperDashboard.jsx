import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, LogOut, ShoppingBag, DollarSign, CreditCard, X, BarChart2 } from 'lucide-react';
import '../css/shipper/ShipperDashboard.css';

export default function ShipperDashboard() {
  const navigate = useNavigate();
  const [shipperInfo, setShipperInfo] = useState(null);
  const [orders, setOrders] = useState([]);
  const [currentTab, setCurrentTab] = useState('cho_lay'); 
  const [loading, setLoading] = useState(true);

  // 🕒 Bộ lọc thời gian thống kê trong Modal
  const [statsPeriod, setStatsPeriod] = useState('today');
  
  // 📊 Trạng thái ẩn/hiển thị Modal Thống kê
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // Trạng thái Toast thông báo
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Trạng thái Modal xác nhận (Nhận đơn / Giao thành công)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    orderId: null,
    currentStatus: '',
    message: ''
  });

  // Trạng thái Modal giao thất bại
  const [failedModal, setFailedModal] = useState({
    isOpen: false,
    orderId: null,
    lyDo: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Hàm hiển thị thông báo nhanh
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // 1. Kiểm tra quyền truy cập và Khởi tạo thông tin tài xế từ localStorage
  useEffect(() => {
    const role = localStorage.getItem('role_id');
    const userStr = localStorage.getItem('user');
    const savedUserId = localStorage.getItem('userId');
    
    if (Number(role) !== 4 || (!userStr && !savedUserId)) {
      alert("Bạn không có quyền truy cập vào giao diện Tài xế!");
      navigate('/login');
      return;
    }
    
    try {
      let user = {};
      if (userStr) {
        user = JSON.parse(userStr);
      }
      // Đồng bộ định dạng ID khớp với ObjectId của Backend
      user._id = user._id || user.id || savedUserId;
      
      if (user._id) {
        setShipperInfo(user);
      } else {
        setLoading(false);
        showToast("Không tìm thấy thông tin tài xế hợp lệ!", "error");
      }
    } catch (error) {
      console.error("Lỗi đồng bộ dữ liệu tài xế từ localStorage:", error);
      showToast("Lỗi cấu trúc dữ liệu tài xế!", "error");
      setLoading(false);
    }
  }, [navigate]);

  // 🔥 HÀM GỌI API ĐỒNG BỘ DANH SÁCH ĐƠN HÀNG: Chỉ truyền shipper_id
  const fetchShipperOrders = async (shipperId, isSilent = false) => {
    if (!shipperId || shipperId === 'undefined' || shipperId === 'null') {
      setLoading(false);
      return;
    }

    try {
      if (!isSilent) setLoading(true);
      
      const response = await fetch(`${API_URL}/api/shipper/donhang?shipper_id=${shipperId}`); 
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Máy chủ phản hồi mã lỗi: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.success) {
        setOrders(data.data || []);
        // Cập nhật lại branch_id động từ máy chủ trả về nếu cần thiết
        if (data.branch_id && shipperInfo && !shipperInfo.branch_id) {
          setShipperInfo(prev => ({ ...prev, branch_id: data.branch_id }));
        }
      } else {
        if (!isSilent) showToast(data?.message || "Không thể đồng bộ danh sách đơn từ máy chủ!", "error");
      }
    } catch (error) {
      console.error("Lỗi kết nối API danh sách đơn:", error);
      if (!isSilent) showToast(error.message || "Lỗi kết nối dữ liệu từ máy chủ", "error");
    } finally {
      setLoading(false);
    }
  };

  // 2. Cơ chế Tự động làm mới dữ liệu (Polling) mỗi 12 giây
  useEffect(() => {
    if (!shipperInfo || !shipperInfo._id) return;

    fetchShipperOrders(shipperInfo._id, false);

    const intervalId = setInterval(() => {
      fetchShipperOrders(shipperInfo._id, true);
    }, 12000); 

    return () => clearInterval(intervalId);
  }, [shipperInfo?._id]);

  // Mở Modal xác nhận trạng thái đi đơn
  const triggerStatusModal = (orderId, currentStatus) => {
    let confirmMsg = "";
    if (currentStatus === 'cho_lay') {
      confirmMsg = "Bạn xác nhận đã nhận đầy đủ thức uống từ cửa hàng và bắt đầu đi giao?";
    } else if (currentStatus === 'dang_giao') {
      confirmMsg = "Hệ thống sẽ ghi nhận đơn giao thành công và cập nhật trạng thái thanh toán. Bạn chắc chắn?";
    }

    setConfirmModal({
      isOpen: true,
      orderId,
      currentStatus,
      message: confirmMsg
    });
  };

  // Xử lý Thay đổi trạng thái Nhận đơn / Giao thành công
  const handleConfirmStatus = async () => {
    const { orderId, currentStatus } = confirmModal;
    let endpoint = "";
    let method = "POST"; 
    let bodyData = null;

    if (!orderId) {
      showToast("Không tìm thấy mã số định danh của đơn hàng!", "error");
      return;
    }

    if (currentStatus === 'cho_lay') {
      endpoint = `${API_URL}/api/shipper/donhang/nhan/${orderId}`;
      bodyData = JSON.stringify({ shipper_id: shipperInfo?._id });
    } else if (currentStatus === 'dang_giao') {
      endpoint = `${API_URL}/api/shipper/donhang/hoan-thanh/${orderId}`; 
    }

    setConfirmModal({ isOpen: false, orderId: null, currentStatus: '', message: '' });

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: bodyData
      });
      const data = await response.json();
      
      if (data && data.success) {
        showToast(
          currentStatus === 'cho_lay' 
            ? 'Nhận đơn thành công! Chúc bạn lên đường an toàn.' 
            : 'Giao hàng thành công! Đã cộng vào doanh số 🎉', 
          'success'
        );
        fetchShipperOrders(shipperInfo?._id, true);
      } else {
        showToast(data?.message || "Không thể cập nhật trạng thái đơn!", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối máy chủ dữ liệu!", "error");
    }
  };

  // Xử lý báo cáo giao hàng thất bại (Khách bom)
  const handleFailedStatusSubmit = async () => {
    if (!failedModal.lyDo) {
      showToast("Vui lòng lựa chọn lý do giao thất bại cụ thể!", "error");
      return;
    }

    const currentOrderId = failedModal.orderId;
    const lyDoGuiDi = failedModal.lyDo;

    if (!currentOrderId) {
      showToast("Lỗi định tuyến: Không tìm thấy mã đơn hàng!", "error");
      return;
    }

    setFailedModal({ isOpen: false, orderId: null, lyDo: '' });

    try {
      const response = await fetch(`${API_URL}/api/shipper/donhang/that-bai/${currentOrderId}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ly_do_that_bai: lyDoGuiDi })
      });
      const data = await response.json();

      if (data && data.success) {
        showToast("Đã ghi nhận giao thất bại. Hãy mang trà sữa quay đầu hoàn trả lại quán!", "success");
        fetchShipperOrders(shipperInfo?._id, true);
      } else {
        showToast(data?.message || "Gặp lỗi khi xử lý báo đơn thất bại!", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối đến máy chủ dữ liệu!", "error");
    }
  };

  // Đăng xuất xóa bộ nhớ tạm
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // LỘC HIỂN THỊ THEO TIÊU CHÍ PHÒNG THỦ BACKEND
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return orders.filter(order => {
      if (currentTab === 'cho_lay') {
        const isPendingStatus = order.status === 'preparing' || order.status === 'ready';
        const isAvailable = !order.shipper_id || order.shipper_id === null || order.shipper_id === "" || order.shipper_id === shipperInfo?._id;
        return isPendingStatus && isAvailable;
      }
      if (currentTab === 'dang_giao') {
        return order.status === 'shipping' && order.shipper_id === shipperInfo?._id;
      }
      if (currentTab === 'hoan_thanh') {
        return (order.status === 'completed' || order.status === 'failed') && order.shipper_id === shipperInfo?._id;
      }
      return false;
    });
  }, [orders, currentTab, shipperInfo?._id]);

  // Tính toán báo cáo hiệu suất tài xế
  const stats = useMemo(() => {
    if (!Array.isArray(orders)) return { countSuccess: 0, countFailed: 0, revenue: 0, codEarned: 0 };
    
    const now = new Date();
    const todayStr = now.toDateString(); 
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const shipperOrders = orders.filter(o => o.shipper_id === shipperInfo?._id);

    const timeFilteredOrders = shipperOrders.filter(order => {
      if (statsPeriod === 'all') return true;
      const orderDate = new Date(order.updatedAt || order.createdAt || new Date());

      if (statsPeriod === 'today') return orderDate.toDateString() === todayStr;
      if (statsPeriod === 'month') {
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      }
      return true;
    });

    const successOrders = timeFilteredOrders.filter(o => o.status === 'completed');
    const failedOrders = timeFilteredOrders.filter(o => o.status === 'failed');
    
    return {
      countSuccess: successOrders.length,
      countFailed: failedOrders.length,
      revenue: successOrders.reduce((sum, o) => sum + (o.total_price || o.total_amount || 0), 0),
      codEarned: successOrders.filter(o => o.payment_method === 'CASH' || o.payment_method === 'tien_mat').reduce((sum, o) => sum + (o.total_price || o.total_amount || 0), 0)
    };
  }, [orders, statsPeriod, shipperInfo?._id]);
  
  // BADGE ĐẾM SỐ LƯỢNG KHỚP HOÀN HẢO VỚI BACKEND
  const realTimePending = useMemo(() => {
    if (!Array.isArray(orders)) return 0;
    return orders.filter(order => {
      const isPendingStatus = order.status === 'preparing' || order.status === 'ready';
      const isAvailable = !order.shipper_id || order.shipper_id === null || order.shipper_id === "" || order.shipper_id === shipperInfo?._id;
      return isPendingStatus && isAvailable;
    }).length;
  }, [orders, shipperInfo?._id]);

  const realTimeShipping = useMemo(() => {
    if (!Array.isArray(orders)) return 0;
    return orders.filter(o => o.status === 'shipping' && o.shipper_id === shipperInfo?._id).length;
  }, [orders, shipperInfo?._id]);

  return (
    <div className="shipper-layout">
      {/* TOAST THÔNG BÁO NỔI */}
      {toast.show && (
        <div className={`qldm-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* THANH HEAD ĐẦU TRANG */}
      <header className="shipper-header">
        <div className="shipper-info">
          <h2>{shipperInfo?.full_name?.toUpperCase() || 'TÀI XẾ HỆ THỐNG'}</h2>
          <span className="online-badge" style={{ marginTop: '4px', display: 'inline-block' }}>● Đang hoạt động</span>
        </div>
        <button onClick={handleLogout} className="btn-shipper-logout">
          <LogOut size={16} /> <span>Thoát</span>
        </button>
      </header>

      {/* VÙNG CHỨA CHÍNH */}
      <div className="shipper-scroll-content">
        <div className="shipper-container">
          
          {/* NAVIGATION BAR */}
          <nav className="shipper-navigation-bar">
            <div className="shipper-tabs-group">
              <button className={`shipper-tab-btn ${currentTab === 'cho_lay' ? 'active' : ''}`} onClick={() => setCurrentTab('cho_lay')}>
                📥 Chờ lấy <span className="tab-badge">{realTimePending}</span>
              </button>
              <button className={`shipper-tab-btn ${currentTab === 'dang_giao' ? 'active' : ''}`} onClick={() => setCurrentTab('dang_giao')}>
                🚚 Đang đi giao <span className="tab-badge blue">{realTimeShipping}</span>
              </button>
              <button className={`shipper-tab-btn ${currentTab === 'hoan_thanh' ? 'active' : ''}`} onClick={() => setCurrentTab('hoan_thanh')}>
                ✅ Lịch sử đơn
              </button>
            </div>

            <button className="btn-trigger-stats" onClick={() => setIsStatsModalOpen(true)} title="Xem thống kê">
              <BarChart2 size={16} />
              <span className="text-stats-btn">Thống kê</span>
            </button>
          </nav>

          {/* DANH SÁCH ĐƠN HÀNG */}
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Đang đồng bộ dữ liệu hành trình...</p>
            </div>
          ) : (
            <div className="orders-scroll-container">
              <div className="orders-list">
                {filteredOrders.length === 0 ? (
                  <div className="no-orders">
                    <ShoppingBag size={48} style={{ color: '#94a3b8', marginBottom: '12px' }} />
                    <p>Không có đơn hàng nào ở mục này.</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div key={order._id} className={`order-shipper-card status-${order.status}`}>
                      <div className="order-card-header">
                        <span className="order-id">Mã: #{order._id ? order._id.substring(18).toUpperCase() : 'N/A'}</span>
                        <span className={`status-text-badge ${order.status}`}>
                          {order.status === 'preparing' && '⏳ Quán đang làm món'}
                          {order.status === 'ready' && '📦 Quán đã làm xong'}
                          {order.status === 'shipping' && '🚚 Đang đi giao'}
                          {order.status === 'completed' && '✅ Giao thành công'}
                          {order.status === 'failed' && '❌ Giao thất bại'}
                        </span>
                      </div>
                      
                      <div className="order-body">
                        <div className="order-info-grid">
                          <div className="info-row">
                            <span className="info-icon">👤</span>
                            <div className="info-text">
                              <span className="info-label">Khách hàng</span>
                              <strong>{order.customer_id?.full_name || order.shipping_address?.customer_name || 'Khách vãng lai'}</strong>
                            </div>
                          </div>

                          <div className="info-row">
                            <span className="info-icon">📞</span>
                            <div className="info-text">
                              <span className="info-label">Số điện thoại</span>
                              <a href={`tel:${order.customer_id?.phone || order.shipping_address?.phone}`} className="phone-link">
                                {order.customer_id?.phone || order.shipping_address?.phone || 'Chưa cập nhật'}
                              </a>
                            </div>
                          </div>
                        </div>

                        <div className="info-row full-width-row">
                          <span className="info-icon">📍</span>
                          <div className="info-text">
                            <span className="info-label">Địa chỉ nhận hàng</span>
                            <p className="address-text">
                              {typeof order.shipping_address === 'object' && order.shipping_address !== null
                                ? (order.shipping_address.address_detail || 'Chưa có chi tiết địa chỉ')
                                : (order.shipping_address || 'Nhận trực tiếp tại quán')}
                            </p>
                          </div>
                        </div>

                        {order.status === 'failed' && order.cancel_reason && (
                          <div className="info-row full-width-row failed-reason-box">
                            <span className="info-icon">⚠️</span>
                            <div className="info-text">
                              <span className="info-label">Lý do thất bại (Khách bom)</span>
                              <p className="reason-text">{order.cancel_reason}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* 🛒 CHI TIẾT GIỎ HÀNG VÀ HÌNH ẢNH ĐÃ ĐƯỢC NÂNG CẤP XỬ LÝ */}
                        {/* 🛒 CHI TIẾT GIỎ HÀNG VÀ HÌNH ẢNH ĐÃ ĐƯỢC NÂNG CẤP XỬ LÝ */}
                          <div className="shipper-items-box">
                            <div className="items-box-header">
                              <span>🥤 Chi tiết giỏ hàng ({order.items?.length || 0} món)</span>
                            </div>
                            <div className="items-grid-container">
                              {order.items?.map((item, index) => {
                                // 🛠️ ĐỒNG BỘ CHÍNH XÁC: Backend đã map 'avatar' của Product thành trường phẳng 'item.image'
                                // Ta vẫn giữ các điều kiện cũ để phòng hờ (Fallback) nếu bạn gọi API từ route khác chưa chuẩn hóa.
                                const rawImage = item.image || item.product_id?.avatar || item.product_id?.image || item.hinh_anh;
                                
                                console.log("Dữ liệu item thực tế nhận được tại Frontend:", item);
                                let finalImgUrl = "https://placehold.co/60x60?text=MilkTea"; // Ảnh mặc định dự phòng

                                if (rawImage && typeof rawImage === 'string') {
                                  // Nếu là đường dẫn URL tuyệt đối từ bên thứ ba (http:// hoặc https://)
                                  if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
                                    finalImgUrl = rawImage;
                                  } else {
                                    // Nếu chỉ là tên file tĩnh, tiến hành nối với API tĩnh của Backend
                                    // Đảm bảo loại bỏ các ký tự dấu gạch chéo dư thừa nếu có
                                    const cleanImageName = rawImage.startsWith('/') ? rawImage.substring(1) : rawImage;
                                    finalImgUrl = `${API_URL}/uploads/${cleanImageName}`;
                                  }
                                }

                                return (
                                  <div key={item._id || index} className="shipper-item-row">
                                    <img 
                                      src={finalImgUrl} 
                                      alt={item.product_name || item.product_id?.product_name || "Sản phẩm"} 
                                      className="shipper-item-img"
                                      style={{ width: '54px', height: '54px', borderRadius: '8px', objectFit: 'cover' }}
                                      onError={(e) => { 
                                        // Chuyển sang ảnh dự phòng gọn gàng nếu link server lỗi hoặc nhận diện sai định dạng
                                        e.target.onerror = null; 
                                        e.target.src = 'https://placehold.co/60x60?text=MilkTea'; 
                                      }}
                                    />
                                    <div className="shipper-item-details">
                                      <span className="item-name-qty">
                                        {item.product_name || item.product_id?.product_name || "Món Trà Sữa"}{' '}
                                        <strong className="qty-tag">x{item.quantity}</strong>
                                      </span>
                                      {item.selected_toppings?.length > 0 && (
                                        <span className="item-toppings">
                                          + Topping: {item.selected_toppings.map(t => t.topping_name || t.name).join(', ')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        <div className="payment-summary">
                          <div className="pay-block">
                            <nav><DollarSign size={18} /></nav>
                            <span>Thu khách: <strong className="order-price">{(order.total_price || order.total_amount || 0).toLocaleString('vi-VN')} đ</strong></span>
                          </div>
                          <div className={`payment-badge ${['CASH', 'tien_mat'].includes(order.payment_method) ? 'cash' : 'momo'}`}>
                            <nav><CreditCard size={12} /></nav> {order.payment_method === 'CASH' || order.payment_method === 'tien_mat' ? 'TIỀN MẶT' : order.payment_method}
                          </div>
                        </div>
                      </div>

                      <div className="order-actions">
                        {order.status === 'preparing' && (
                          <button 
                            className="btn-action pick waiting-prepare-btn" 
                            disabled 
                            style={{ backgroundColor: '#cbd5e1', color: '#64748b', cursor: 'not-allowed', width: '100%', padding: '12px', fontWeight: 'bold', border: 'none', borderRadius: '8px' }}
                          >
                            ⏳ Quán đang chuẩn bị nước... (Chưa thể nhận)
                          </button>
                        )}

                        {order.status === 'ready' && (
                          <button onClick={() => triggerStatusModal(order._id, 'cho_lay')} className="btn-action pick">
                            ⚡ Nhận đơn ngay
                          </button>
                        )}
                        
                        {order.status === 'shipping' && (
                          <div className="shipper-dual-buttons">
                            <button onClick={() => triggerStatusModal(order._id, 'dang_giao')} className="btn-action done">
                              ✔️ Giao thành công
                            </button>
                            <button onClick={() => setFailedModal({ isOpen: true, orderId: order._id, lyDo: '' })} className="btn-action failed-trigger">
                              ❌ Báo khách bom
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 📊 MODAL POPUP THỐNG KÊ */}
      {isStatsModalOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card stats-popup-card">
            <div className="custom-modal-header unique-stats-header">
              <div className="stats-header-title">
                <BarChart2 size={20} color="#2563eb" />
                <h3>BÁO CÁO HIỆU SUẤT TÀI XẾ</h3>
              </div>
              <button className="close-x-btn" onClick={() => setIsStatsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="stats-modal-tabs">
              <button className={`stats-modal-tab-btn ${statsPeriod === 'today' ? 'active' : ''}`} onClick={() => setStatsPeriod('today')}>Hôm nay</button>
              <button className={`stats-modal-tab-btn ${statsPeriod === 'month' ? 'active' : ''}`} onClick={() => setStatsPeriod('month')}>Tháng này</button>
              <button className={`stats-modal-tab-btn ${statsPeriod === 'all' ? 'active' : ''}`} onClick={() => setStatsPeriod('all')}>Toàn thời gian</button>
            </div>

            <div className="stats-modal-grid">
              <div className="modal-stat-box s-success">
                <span className="box-label">Thành công ✅</span>
                <span className="box-value">{stats.countSuccess} đơn</span>
                <span className="box-sub">Giao hoàn tất</span>
              </div>
              <div className="modal-stat-box s-failed">
                <span className="box-label">Thất bại (Bom) ❌</span>
                <span className="box-value">{stats.countFailed} đơn</span>
                <span className="box-sub">Hủy / Hoàn hàng</span>
              </div>
              <div className="modal-stat-box s-revenue">
                <span className="box-label">Tổng doanh thu 🎉</span>
                <span className="box-value">{stats.revenue.toLocaleString('vi-VN')}đ</span>
                <span className="box-sub">Cả Cash & Momo</span>
              </div>
              <div className="modal-stat-box s-cash">
                <span className="box-label">Tiền mặt (CASH) 💵</span>
                <span className="box-value">{stats.codEarned.toLocaleString('vi-VN')}đ</span>
                <span className="box-sub color-warning">Cần nộp về quán</span>
              </div>
            </div>

            <div className="stats-modal-footer">
              <button className="btn-close-stats" onClick={() => setIsStatsModalOpen(false)}>Đóng bảng thống kê</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN TRẠNG THÁI */}
      {confirmModal.isOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card">
            <div className="custom-modal-header">
              <h3>🔔 XÁC NHẬN TRẠNG THÁI</h3>
            </div>
            <div className="custom-modal-body">
              <p>{confirmModal.message}</p>
            </div>
            <div className="custom-modal-footer">
              <button className="btn-modal-cancel" onClick={() => setConfirmModal({ isOpen: false, orderId: null, currentStatus: '', message: '' })}>Hủy bỏ</button>
              <button className={`btn-modal-confirm ${confirmModal.currentStatus === 'cho_lay' ? 'pick-color' : 'done-color'}`} onClick={handleConfirmStatus}>Đồng ý thực hiện</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BÁO CÁO GIAO HÀNG THẤT BẠI */}
      {failedModal.isOpen && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card failed-card">
            <div className="custom-modal-header failed-header">
              <h3>⚠️ BÁO CÁO GIAO THẤT BẠI</h3>
              <button className="close-x-btn" onClick={() => setFailedModal({ isOpen: false, orderId: null, lyDo: '' })}><X size={18} /></button>
            </div>
            <div className="custom-modal-body">
              <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '12px' }}>Vui lòng xác nhận lý do giao hàng không thành công để đối soát hoàn trả:</p>
              <select className="shipper-reason-select" value={failedModal.lyDo} onChange={(e) => setFailedModal({ ...failedModal, lyDo: e.target.value })}>
                <option value="">-- Chọn lý do bom hàng cụ thể --</option>
                <option value="Khách hàng thuê bao, gọi liên tục nhiều lần không nghe máy">Gọi nhiều lần khách không nghe máy</option>
                <option value="Khách đổi ý từ chối nhận hàng không có lý do thỏa đáng">Khách đổi ý, từ chối nhận hàng (Bom)</option>
                <option value="Sai thông tin số điện thoại hoặc sai lệch vị trí địa chỉ giao">Sai địa chỉ / Sai số điện thoại khách</option>
              </select>
            </div>
            <div className="custom-modal-footer">
              <button className="btn-modal-cancel" onClick={() => setFailedModal({ isOpen: false, orderId: null, lyDo: '' })}>Quay lại</button>
              <button className="btn-modal-confirm bomb-color" onClick={handleFailedStatusSubmit}>Xác nhận hoàn hàng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
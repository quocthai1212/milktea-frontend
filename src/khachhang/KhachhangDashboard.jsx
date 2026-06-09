import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ClipboardList, Pencil, MapPin, Eye, XCircle, Save, User, X, PackageSearch, ShoppingBag, History, Star, CheckCircle } from 'lucide-react';
import TrangChuHeader from '../components/TrangChuHeader';
import ModalDiaChiGiaoHang from './ModalDiaChiGiaoHang';
import '../css/TrangChu.css';
import '../css/khachhang/KhachhangDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatTien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
const formatNgay = (d) =>
  d ? new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const KhachhangDashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [tab, setTab] = useState('theo-doi');
  const [donHang, setDonHang] = useState([]);
  const [hoSo, setHoSo] = useState(null);
  const [diaChi, setDiaChi] = useState(null);
  const [formHoSo, setFormHoSo] = useState({ full_name: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [thongBao, setThongBao] = useState({ kieu: '', noiDung: '' });
  const [donChiTiet, setDonChiTiet] = useState(null);
  const [modalDiaChi, setModalDiaChi] = useState(false);
  const [dangHuy, setDangHuy] = useState(null);
  const [dangLuuHoSo, setDangLuuHoSo] = useState(false);

  // ➕ STATE PHỤC VỤ CHO ĐÁNH GIÁ SẢN PHẨM
  const [modalReview, setModalReview] = useState(false);
  const [selectedReviewProduct, setSelectedReviewProduct] = useState(null); 
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [dangGuiReview, setDangGuiReview] = useState(false);

  // =========================================================================
  // 🔥 ĐOẠN BỔ SUNG: TỰ ĐỘNG ĐÓNG ALERT / TOAST THÔNG BÁO SAU 2 GIÂY
  // =========================================================================
  useEffect(() => {
    if (thongBao.noiDung) {
      const timer = setTimeout(() => {
        setThongBao({ kieu: '', noiDung: '' });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [thongBao.noiDung]);

  const taiDuLieu = useCallback(async (uid) => {
    if (!uid) return;
    setLoading(true);
    try {
      const [resDon, resHoSo] = await Promise.all([
        fetch(`${API_URL}/api/khachhang/don-hang?user_id=${uid}`),
        fetch(`${API_URL}/api/khachhang/ho-so?user_id=${uid}`),
      ]);
      const dataDon = await resDon.json();
      const dataHoSo = await resHoSo.json();

      if (resDon.ok) {
        setDonHang(dataDon.orders || []);
        
        // Cập nhật lại state donChiTiet nếu modal chi tiết đang mở để đồng bộ dữ liệu đánh giá mới
        if (donChiTiet) {
          const updatedDon = (dataDon.orders || []).find(o => o._id === donChiTiet._id);
          if (updatedDon) setDonChiTiet(updatedDon);
        }
      }
      
      if (resHoSo.ok) {
        setHoSo(dataHoSo.user);
        setDiaChi(dataHoSo.shipping_address);
        setFormHoSo({
          full_name: dataHoSo.user?.full_name || '',
          phone: dataHoSo.user?.phone || '',
        });
        localStorage.setItem('user', JSON.stringify({
          ...JSON.parse(localStorage.getItem('user') || '{}'),
          full_name: dataHoSo.user?.full_name,
          email: dataHoSo.user?.email,
        }));
        if (dataHoSo.shipping_address?.address_detail) {
          localStorage.setItem(
            'delivery_address',
            JSON.stringify({
              address_detail: dataHoSo.shipping_address.address_detail,
              latitude: dataHoSo.shipping_address.gps_location?.latitude ?? 0,
              longitude: dataHoSo.shipping_address.gps_location?.longitude ?? 0,
            })
          );
        }
      }
    } catch {
      setThongBao({ kieu: 'loi', noiDung: 'Không kết nối được server!' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const roleId = Number(localStorage.getItem('role_id'));
    const userJson = localStorage.getItem('user');
    if (roleId !== 3 || !userJson) {
      navigate('/login');
      return;
    }
    try {
      const u = JSON.parse(userJson);
      const id = u._id || u.id;
      setUserId(id);
      taiDuLieu(id);
    } catch {
      navigate('/login');
    }
  }, [navigate, taiDuLieu]);

  const donTheoDoi = donHang.filter((d) => ['pending', 'preparing', 'shipping'].includes(d.status));
  const donLichSu = donHang.filter((d) => ['completed', 'cancelled'].includes(d.status));
  const coTheHuy = (status) => ['pending', 'preparing'].includes(status);

  const handleHuyDon = async (orderId) => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    setDangHuy(orderId);
    setThongBao({ kieu: '', noiDung: '' });
    try {
      const res = await fetch(`${API_URL}/api/khachhang/don-hang/huy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, order_id: orderId }),
      });
      const data = await res.json();
      if (res.ok) {
        setThongBao({ kieu: 'thanhcong', noiDung: data.message });
        setDonChiTiet(null);
        taiDuLieu(userId);
      } else {
        setThongBao({ kieu: 'loi', noiDung: data.message || 'Không hủy được đơn!' });
      }
    } catch {
      setThongBao({ kieu: 'loi', noiDung: 'Lỗi kết nối server!' });
    } finally {
      setDangHuy(null);
    }
  };

  const handleLuuHoSo = async (e) => {
    e.preventDefault();
    setDangLuuHoSo(true);
    setThongBao({ kieu: '', noiDung: '' });
    try {
      const res = await fetch(`${API_URL}/api/khachhang/ho-so`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          full_name: formHoSo.full_name,
          phone: formHoSo.phone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setHoSo(data.user);
        setThongBao({ kieu: 'thanhcong', noiDung: data.message });
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...u, full_name: data.user.full_name }));
      } else {
        setThongBao({ kieu: 'loi', noiDung: data.message || 'Lưu thất bại!' });
      }
    } catch {
      setThongBao({ kieu: 'loi', noiDung: 'Lỗi kết nối server!' });
    } finally {
      setDangLuuHoSo(false);
    }
  };

  const handleDiaChiCapNhat = (diaChiMoi) => {
    setDiaChi({
      address_detail: diaChiMoi.address_detail,
      gps_location: { latitude: diaChiMoi.latitude, longitude: diaChiMoi.longitude },
    });
    localStorage.setItem('delivery_address', JSON.stringify(diaChiMoi));
    setModalDiaChi(false);
    setThongBao({ kieu: 'thanhcong', noiDung: 'Đã cập nhật địa chỉ giao hàng!' });
  };

  const handleGuiReview = async (e) => {
    e.preventDefault();
    if (!selectedReviewProduct || selectedReviewProduct.is_reviewed) return;
    setDangGuiReview(true);
    try {
      const res = await fetch(`${API_URL}/api/khachhang/danh-gia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          order_id: selectedReviewProduct.order_id,
          product_id: selectedReviewProduct.product_id,
          rating,
          comment_text: commentText,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setThongBao({ kieu: 'thanhcong', noiDung: 'Đăng bình luận, đánh giá thành công!' });
        setModalReview(false);
        setCommentText('');
        setRating(5);
        taiDuLieu(userId);
      } else {
        setThongBao({ kieu: 'loi', noiDung: data.message || 'Gửi đánh giá thất bại!' });
      }
    } catch {
      setThongBao({ kieu: 'loi', noiDung: 'Lỗi kết nối máy chủ!' });
    } finally {
      setDangGuiReview(false);
    }
  };

  const openModalReview = (orderId, item) => {
    setSelectedReviewProduct({ 
      order_id: orderId, 
      product_id: item.product_id, 
      product_name: item.product_name,
      is_reviewed: !!item.is_reviewed
    });

    if (item.is_reviewed && item.my_review) {
      setRating(item.my_review.rating || 5);
      setCommentText(item.my_review.comment_text || '');
    } else {
      setRating(5);
      setCommentText('');
    }
    setModalReview(true);
  };

  const renderNutDanhGiaMon = (donId, item) => {
    if (item.is_reviewed) {
      return (
        <button
          type="button"
          className="khdh-btn-review-item reviewed"
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            color: '#16a34a',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: '500'
          }}
          onClick={() => openModalReview(donId, item)}
        >
          <CheckCircle size={14} /> Xem lại
        </button>
      );
    }

    return (
      <button
        type="button"
        className="khdh-btn-review-item to-review"
        style={{
          padding: '6px 12px',
          fontSize: '12px',
          backgroundColor: '#fffbeb',
          border: '1px solid #fcd34d',
          borderRadius: '6px',
          color: '#b45309',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: '500'
        }}
        onClick={() => openModalReview(donId, item)}
      >
        <Star size={14} fill="#b45309" /> Đánh giá
      </button>
    );
  };

  const renderDonCard = (don) => {
    const labelHienThi = don.status_detail?.label || don.status;
    const classHienThi = don.status_detail?.className || '';
    const maDon = don._id?.slice(-8).toUpperCase() || '—';
    const tongSoLuongMon = (don.items || []).reduce((acc, item) => acc + (item.quantity || 0), 0);

    return (
      <div key={don._id} className="tc-card khdh-order-card">
        <div className="tc-card-body">
          <div className="khdh-order-head">
            <div>
              <span className="khdh-order-code">#{maDon}</span>
              <span className="khdh-order-date">{formatNgay(don.createdAt)}</span>
            </div>
            <span className={`khdh-status-badge ${classHienThi}`}>{labelHienThi}</span>
          </div>

          <div className="khdh-order-items-preview">
            {(don.items || []).map((item, index) => {
              const hinhAnhUrl = item.product_image 
                ? (item.product_image.startsWith('http') ? item.product_image : `${API_URL}${item.product_image}`)
                : 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=150';

              return (
                <div key={index} className="khdh-preview-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                    <img 
                      src={hinhAnhUrl} 
                      alt={item.product_name} 
                      className="khdh-preview-img" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=150';
                      }}
                    />
                    <div className="khdh-preview-info">
                      <div className="khdh-preview-name-row">
                        <span className="khdh-preview-name">{item.product_name}</span>
                        <span className="khdh-preview-price">{formatTien(item.subtotal)}</span>
                      </div>
                      <div className="khdh-preview-sub-row">
                        <span className="khdh-preview-qty">Số lượng: <strong>{item.quantity}</strong></span>
                        {item.selected_toppings?.length > 0 && (
                          <span className="khdh-preview-toppings">
                            (+ {item.selected_toppings.map(t => t.topping_name).join(', ')})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {don.status === 'completed' && renderNutDanhGiaMon(don._id, item)}
                </div>
              );
            })}
          </div>

          <p className="khdh-order-summary">
            Tổng cộng: {don.items?.length || 0} loại món ({tongSoLuongMon} sản phẩm) · Tổng tiền: <strong>{formatTien(don.total_amount)}</strong>
          </p>

          {don.shipping_address?.address_detail && (
            <p className="khdh-order-addr"><MapPin size={15} /> {don.shipping_address.address_detail}</p>
          )}

          <div className="tc-card-footer khdh-order-footer">
            <button type="button" className="tc-btn-order" onClick={() => setDonChiTiet(don)}>
              <Eye size={16} /> Theo dõi chi tiết
            </button>
            {coTheHuy(don.status) && (
              <button
                type="button"
                className="khdh-btn-cancel"
                disabled={dangHuy === don._id}
                onClick={() => handleHuyDon(don._id)}
              >
                {dangHuy === don._id ? 'Đang hủy...' : <> <XCircle size={16} /> Hủy đơn</>}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTimeline = (don) => {
    const history = don.status_history?.length
      ? [...don.status_history].reverse()
      : [{ status: don.status, status_label: don.status_detail?.label || don.status, updated_at: don.updatedAt || don.createdAt }];

    return (
      <ul className="khdh-timeline">
        {history.map((step, idx) => {
          const tenTrangThai = step.status_label || step.status;
          return (
            <li key={idx} className="khdh-timeline-item">
              <span className="khdh-timeline-dot" />
              <div>
                <strong>{tenTrangThai}</strong>
                <span className="khdh-timeline-time">{formatNgay(step.updated_at)}</span>
                {step.reason && <p className="khdh-timeline-reason">{step.reason}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="tc-wrapper">
      <TrangChuHeader activePage="khachhang" />

      <main className="tc-main-container khdh-main">
        <h3 className="tc-section-title">
          Tài khoản khách hàng
          {hoSo?.full_name && (
            <span className="khdh-greeting"> — Xin chào, {hoSo.full_name}</span>
          )}
        </h3>

        {thongBao.noiDung && (
          <div className={`khdh-alert khdh-alert-${thongBao.kieu === 'thanhcong' ? 'ok' : 'err'}`}>
            {thongBao.noiDung}
          </div>
        )}

        <div className="tc-category-tabs khdh-tabs">
          <button
            type="button"
            className={`tc-tab-item ${tab === 'theo-doi' ? 'active' : ''}`}
            onClick={() => setTab('theo-doi')}
          >
            <Package size={16} /> Theo dõi đơn hàng
          </button>
          <button
            type="button"
            className={`tc-tab-item ${tab === 'lich-su' ? 'active' : ''}`}
            onClick={() => setTab('lich-su')}
          >
            <ClipboardList size={16} /> Lịch sử mua hàng
          </button>
          <button
            type="button"
            className={`tc-tab-item ${tab === 'ho-so' ? 'active' : ''}`}
            onClick={() => setTab('ho-so')}
          >
            <Pencil size={16} /> Thông tin cá nhân
          </button>
        </div>

        {loading ? (
          <p className="tc-empty-state">Đang tải dữ liệu...</p>
        ) : (
          <>
            {tab === 'theo-doi' && (
              <section>
                {donTheoDoi.length === 0 ? (
                  <div className="khdh-empty-state">
                    <div className="khdh-empty-icon" aria-hidden="true">
                      <PackageSearch size={42} />
                    </div>
                    <h5>Chưa có đơn hàng đang xử lý</h5>
                    <button type="button" className="khdh-empty-action" onClick={() => navigate('/')}>
                      <ShoppingBag size={18} /> Đặt món ngay
                    </button>
                  </div>
                ) : (
                  <div className="khdh-order-list">{donTheoDoi.map(renderDonCard)}</div>
                )}
              </section>
            )}

            {tab === 'lich-su' && (
              <section>
                {donLichSu.length === 0 ? (
                  <div className="khdh-empty-state">
                    <div className="khdh-empty-icon" aria-hidden="true">
                      <History size={42} />
                    </div>
                    <h5>Chưa có lịch sử mua hàng</h5>
                    <button type="button" className="khdh-empty-action" onClick={() => navigate('/')}>
                      <ShoppingBag size={18} /> Khám phá menu
                    </button>
                  </div>
                ) : (
                  <div className="khdh-order-list">{donLichSu.map(renderDonCard)}</div>
                )}
              </section>
            )}

            {tab === 'ho-so' && (
              <section className="khdh-profile">
                <div className="tc-card">
                  <div className="tc-card-body">
                    <h4 className="khdh-subtitle">Chỉnh sửa thông tin</h4>
                    <form onSubmit={handleLuuHoSo} className="khdh-form">
                      <div className="khdh-field">
                        <label>Email</label>
                        <input type="email" value={hoSo?.email || ''} disabled className="khdh-input" />
                      </div>
                      <div className="khdh-field">
                        <label>Họ và tên</label>
                        <input
                          type="text"
                          className="khdh-input"
                          value={formHoSo.full_name}
                          onChange={(e) => setFormHoSo({ ...formHoSo, full_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="khdh-field">
                        <label>Số điện thoại</label>
                        <input
                          type="text"
                          className="khdh-input"
                          value={formHoSo.phone}
                          onChange={(e) => setFormHoSo({ ...formHoSo, phone: e.target.value })}
                          placeholder="09xxxxxxxx"
                        />
                      </div>

                      <div className="khdh-field">
                        <label>Địa chỉ giao hàng</label>
                        <div className="khdh-address-box">
                          {diaChi?.address_detail ? (
                            <p className="khdh-address-text"><MapPin size={15} /> {diaChi.address_detail}</p>
                          ) : (
                            <p className="khdh-address-empty">Chưa có địa chỉ giao hàng</p>
                          )}
                          <button
                            type="button"
                            className="tc-btn-order khdh-btn-address"
                            onClick={() => setModalDiaChi(true)}
                          >
                            <><MapPin size={16} /> {diaChi?.address_detail ? 'Đổi địa chỉ' : 'Thêm địa chỉ giao hàng'}</>
                          </button>
                        </div>
                      </div>

                      <button type="submit" className="tc-btn-submit-cart khdh-btn-save" disabled={dangLuuHoSo}>
                        {dangLuuHoSo ? 'Đang lưu...' : <> <Save size={16} /> Lưu thông tin</>}
                      </button>
                    </form>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="tc-footer">
        <p className="mb-1">© 2026 <strong>MilkTea Paradise</strong> — Tài khoản khách hàng</p>
        <p className="tc-footer-sub">Theo dõi đơn hàng · Lịch sử mua · Cập nhật thông tin giao hàng</p>
      </footer>

      {donChiTiet && (
        <div className="tc-modal-overlay" onClick={() => setDonChiTiet(null)}>
          <div className="tc-modal-container khdh-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="tc-modal-close" onClick={() => setDonChiTiet(null)} aria-label="Đóng">
              <X size={20} />
            </button>
            <div className="tc-modal-right" style={{ width: '100%', padding: '24px' }}>
              <div className="khdh-modal-header-block">
                <h2>Đơn #{donChiTiet._id?.slice(-8).toUpperCase()}</h2>
                <span className={`khdh-status-badge ${donChiTiet.status_detail?.className || ''}`}>
                  {donChiTiet.status_detail?.label || donChiTiet.status}
                </span>
              </div>
              <span className="khdh-modal-date">Thời gian đặt: {formatNgay(donChiTiet.createdAt)}</span>
              
              {donChiTiet.shipping_address?.customer_name && (
                <p className="khdh-modal-addr" style={{ marginTop: '12px' }}>
                  <User size={15} /> <strong>{donChiTiet.shipping_address.customer_name}</strong>
                  {donChiTiet.shipping_address.phone && ` · ${donChiTiet.shipping_address.phone}`}
                </p>
              )}
              {donChiTiet.shipping_address?.address_detail && (
                <p className="khdh-modal-addr-text">
                  <MapPin size={14} /> {donChiTiet.shipping_address.address_detail}
                </p>
              )}

              <h3 className="khdh-modal-label">Lịch sử trạng thái đơn</h3>
              <div className="khdh-modal-timeline-container">
                {renderTimeline(donChiTiet)}
              </div>

              <h3 className="khdh-modal-label">Danh sách món đã đặt</h3>
              <div className="khdh-modal-items-list-wrapper">
                {(donChiTiet.items || []).map((item, i) => {
                  const hinhAnhUrl = item.product_image 
                    ? (item.product_image.startsWith('http') ? item.product_image : `${API_URL}${item.product_image}`)
                    : 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=150';

                  return (
                    <div key={i} className="khdh-modal-product-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                        <img 
                          src={hinhAnhUrl} 
                          alt={item.product_name} 
                          className="khdh-modal-product-img" 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=150';
                          }}
                        />
                        <div className="khdh-modal-product-info">
                          <div className="khdh-modal-item-main">
                            <span className="khdh-modal-item-name"><strong>{item.product_name}</strong></span>
                            <span className="khdh-modal-item-subtotal">{formatTien(item.subtotal)}</span>
                          </div>
                          <div className="khdh-modal-item-details">
                            <span>Số lượng: <strong>{item.quantity}</strong></span>
                            {item.selected_toppings?.length > 0 && (
                              <span className="khdh-modal-item-toppings">
                                (+ Topping: {item.selected_toppings.map((t) => t.topping_name).join(', ')})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {donChiTiet.status === 'completed' && renderNutDanhGiaMon(donChiTiet._id, item)}
                    </div>
                  );
                })}
              </div>

              <div className="khdh-modal-pricing-block">
                <div className="khdh-price-row">
                  <span>Tiền hàng (tạm tính):</span>
                  <span>{formatTien(donChiTiet.products_subtotal || (donChiTiet.total_amount - (donChiTiet.shipping_fee || 0) + (donChiTiet.discount_amount || 0)))}</span>
                </div>
                <div className="khdh-price-row khdh-price-discount">
                  <span>Giảm giá mã ưu đãi:</span>
                  <span>-{formatTien(donChiTiet.discount_amount)}</span>
                </div>
                <div className="khdh-price-row">
                  <span>Phí giao hàng {donChiTiet.distance_km ? `(${donChiTiet.distance_km} km)` : ''}:</span>
                  <span>+{formatTien(donChiTiet.shipping_fee)}</span>
                </div>
                <hr className="khdh-price-divider" />
                <div className="khdh-price-row khdh-price-total">
                  <span>Tổng thanh toán:</span>
                  <span className="khdh-total-highlight">{formatTien(donChiTiet.total_amount)}</span>
                </div>
                <div className="khdh-price-row khdh-payment-method">
                  <span>Phương thức:</span>
                  <small className="khdh-badge-method">{donChiTiet.payment_method === 'CASH' ? 'Tiền mặt (CASH)' : 'Chuyển khoản (PayOS)'}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HIỂN THỊ ĐÁNH GIÁ */}
      {modalReview && selectedReviewProduct && (
        <div className="tc-modal-overlay" onClick={() => setModalReview(false)}>
          <div className="tc-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                {selectedReviewProduct.is_reviewed ? 'Đánh giá của bạn' : 'Đánh giá sản phẩm'}
              </h3>
              <button type="button" onClick={() => setModalReview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '8px' }}>
              Món ăn: <strong>{selectedReviewProduct.product_name}</strong>
            </p>

            <div style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '10px' }}>
              {rating} / 5 ⭐
            </div>

            <form onSubmit={handleGuiReview}>
              <div className="star-rating-container" style={{ pointerEvents: selectedReviewProduct.is_reviewed ? 'none' : 'auto', display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '15px' }}>
                {[1, 2, 3, 4, 5].map((index) => {
                  let isFull = index <= rating;
                  let isHalf = !isFull && (index - 0.5) === rating;

                  return (
                    <div key={index} className="star-wrapper" style={{ position: 'relative', cursor: selectedReviewProduct.is_reviewed ? 'default' : 'pointer' }}>
                      <Star
                        size={32}
                        fill={isFull ? '#fbbf24' : isHalf ? 'url(#halfStarGradient)' : 'none'}
                        color={isFull || isHalf ? '#fbbf24' : '#d1d5db'}
                      />

                      {!selectedReviewProduct.is_reviewed && (
                        <>
                          <div 
                            className="star-half left" 
                            style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', zIndex: 2 }}
                            onClick={() => setRating(index - 0.5)} 
                            title={`${index - 0.5} sao`}
                          />
                          <div 
                            className="star-half right" 
                            style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', zIndex: 2 }}
                            onClick={() => setRating(index)} 
                            title={`${index} sao`}
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <svg style={{ width: 0, height: 0, position: 'absolute' }}>
                <defs>
                  <linearGradient id="halfStarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="50%" stopColor="#e5e7eb" stopOpacity="1" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="khdh-field" style={{ marginBottom: '20px', marginTop: '15px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px', fontWeight: '500' }}>
                  Nội dung bình luận
                </label>
                <textarea
                  className="khdh-input"
                  style={{ 
                    width: '100%', 
                    minHeight: '100px', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    border: '1px solid #d1d5db', 
                    resize: 'vertical',
                    backgroundColor: selectedReviewProduct.is_reviewed ? '#f9fafb' : '#fff'
                  }}
                  placeholder={selectedReviewProduct.is_reviewed ? '' : "Chia sẻ cảm nhận của bạn về hương vị ly trà sữa này nhé..."}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={selectedReviewProduct.is_reviewed}
                  required
                />
              </div>

              {!selectedReviewProduct.is_reviewed ? (
                <button
                  type="submit"
                  className="tc-btn-submit-cart"
                  style={{ width: '100%', padding: '12px', fontWeight: '600', borderRadius: '8px' }}
                  disabled={dangGuiReview}
                >
                  {dangGuiReview ? 'Đang gửi đánh giá...' : 'Gửi đánh giá'}
                </button>
              ) : (
                <button
                  type="button"
                  className="khdh-btn-cancel"
                  style={{ width: '100%', padding: '12px', fontWeight: '600', borderRadius: '8px', backgroundColor: '#e5e7eb', color: '#4b5563', border: 'none' }}
                  onClick={() => setModalReview(false)}
                >
                  Đóng cửa sổ
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      <ModalDiaChiGiaoHang
        isOpen={modalDiaChi}
        batBuoc={false}
        userId={userId}
        onSuccess={handleDiaChiCapNhat}
        onClose={() => setModalDiaChi(false)}
      />
    </div>
  );
};

export default KhachhangDashboard;
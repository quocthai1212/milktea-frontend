<<<<<<< HEAD
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ClipboardList, Pencil, MapPin, Eye, XCircle, Save, User, X, PackageSearch, ShoppingBag, History } from 'lucide-react';
import TrangChuHeader from '../components/TrangChuHeader';
import ModalDiaChiGiaoHang from './ModalDiaChiGiaoHang';
import '../css/TrangChu.css';
import '../css/khachhang/KhachhangDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TRANG_THAI = {
  pending: { label: 'Đã đặt', className: 'khdh-status-pending' },
  preparing: { label: 'Đang chuẩn bị', className: 'khdh-status-preparing' },
  shipping: { label: 'Đang giao hàng', className: 'khdh-status-shipping' },
  completed: { label: 'Hoàn thành', className: 'khdh-status-completed' },
  cancelled: { label: 'Đã hủy', className: 'khdh-status-cancelled' },
};

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

      if (resDon.ok) setDonHang(dataDon.orders || []);
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

  const renderDonCard = (don) => {
    const st = TRANG_THAI[don.status] || { label: don.status, className: '' };
    const maDon = don._id?.slice(-8).toUpperCase() || '—';
    return (
      <div key={don._id} className="tc-card khdh-order-card">
        <div className="tc-card-body">
          <div className="khdh-order-head">
            <div>
              <span className="khdh-order-code">#{maDon}</span>
              <span className="khdh-order-date">{formatNgay(don.createdAt)}</span>
            </div>
            <span className={`khdh-status-badge ${st.className}`}>{st.label}</span>
          </div>
          <p className="khdh-order-summary">
            {don.items?.length || 0} món · <strong>{formatTien(don.total_amount)}</strong>
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
      : [{ status: don.status, updated_at: don.updatedAt || don.createdAt }];

    return (
      <ul className="khdh-timeline">
        {history.map((step, idx) => {
          const st = TRANG_THAI[step.status] || { label: step.status };
          return (
            <li key={idx} className="khdh-timeline-item">
              <span className="khdh-timeline-dot" />
              <div>
                <strong>{st.label}</strong>
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
              <h2>Đơn #{donChiTiet._id?.slice(-8).toUpperCase()}</h2>
              <p className="khdh-modal-total">Tổng tiền: {formatTien(donChiTiet.total_amount)}</p>
              {donChiTiet.shipping_fee > 0 && (
                <p className="khdh-modal-ship">
                  Phí ship ({donChiTiet.distance_km} km): {formatTien(donChiTiet.shipping_fee)}
                </p>
              )}
              {donChiTiet.shipping_address?.customer_name && (
                <p className="khdh-modal-addr">
                  <User size={15} /> {donChiTiet.shipping_address.customer_name}
                  {donChiTiet.shipping_address.phone && ` · ${donChiTiet.shipping_address.phone}`}
                </p>
              )}

              <h3 className="khdh-modal-label">Trạng thái đơn hàng</h3>
              {renderTimeline(donChiTiet)}

              <h3 className="khdh-modal-label">Danh sách món</h3>
              <ul className="khdh-item-list">
                {(donChiTiet.items || []).map((item, i) => (
                  <li key={i}>
                    <span>{item.product_name} × {item.quantity}</span>
                    <span>{formatTien(item.subtotal)}</span>
                    {item.selected_toppings?.length > 0 && (
                      <small>+ {item.selected_toppings.map((t) => t.topping_name).join(', ')}</small>
                    )}
                  </li>
                ))}
              </ul>

              {coTheHuy(donChiTiet.status) && (
                <button
                  type="button"
                  className="khdh-btn-cancel khdh-btn-cancel-full"
                  disabled={dangHuy === donChiTiet._id}
                  onClick={() => handleHuyDon(donChiTiet._id)}
                >
                  <><XCircle size={16} /> Hủy đơn hàng này</>
                </button>
              )}
            </div>
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
=======
import React, { useEffect, useState } from 'react';
// 🎯 1. IMPORT COMPONENT CHAT AI
import ChatAI from './ChatAI'; 
// 🌟 2. IMPORT FILE CSS VỪA TÁCH TẠI ĐÂY
import '../css/khachhang/KhachhangDashboard.css'; 

const KhachhangDashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Lấy thông tin user đăng nhập thành công từ localStorage
    const storedUser = localStorage.getItem('user_logged_in'); 
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className="dashboard-container">
      {/* --- Giao diện Dashboard Khách Hàng --- */}
      <header className="dashboard-header">
        <h2>👋 Xin chào, {user?.full_name || 'Khách hàng'}!</h2>
        <p>Chào mừng bạn đã quay trở lại hệ thống đặt trà sữa.</p>
      </header>

      <div className="dashboard-content">
        {/* Lịch sử mua hàng, thông tin tài khoản, giỏ hàng... nằm ở đây */}
        <p>Thông tin tài khoản và lịch sử đơn hàng của bạn...</p>
      </div>
      {/* -------------------------------------------- */}

      {/* 🌟 3. NHÚNG CHATBOX AI XUỐNG ĐÁY TRANG */}
      {/* Truyền _id của user vào để Backend lưu nhật ký chat chính xác theo tài khoản khách hàng */}
      <ChatAI customerId={user?._id || user?.id || null} />
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
    </div>
  );
};

<<<<<<< HEAD
export default KhachhangDashboard;
=======
export default KhachhangDashboard;
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1

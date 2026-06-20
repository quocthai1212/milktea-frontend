import React, { useEffect, useState, useMemo } from 'react';
import { X, Banknote, QrCode, CheckCircle2, LoaderCircle, Store, Ticket } from 'lucide-react';
import '../css/khachhang/ModalDatHang.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatTien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';

const ModalDatHang = ({
  isOpen,
  onClose,
  gioHang = [],
  nguoiDung,
  diaChiGiaoHang,
  userId: propUserId, 
  onSuccess,
}) => {
  const [phiShip, setPhiShip] = useState(null);
  const [loadingPhi, setLoadingPhi] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [customerCash, setCustomerCash] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [thongBao, setThongBao] = useState({ kieu: '', noiDung: '' });
  const [thongTinKhach, setThongTinKhach] = useState(null);

  const [danhSachChiNhanh, setDanhSachChiNhanh] = useState([]);
  const [idChiNhanhChon, setIdChiNhanhChon] = useState('');

  const [danhSachKhuyenMai, setDanhSachKhuyenMai] = useState([]); 
  const [idMaGiamGiaChon, setIdMaGiamGiaChon] = useState(''); 
  const [promotionApDung, setPromotionApDung] = useState(null); 

  const userId = useMemo(() => {
    if (propUserId) return propUserId;
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const u = JSON.parse(userJson);
        return u._id || u.id;
      }
    } catch (e) {
      console.error("Lỗi lấy định danh userId trong ModalDatHang:", e);
    }
    return null;
  }, [propUserId, isOpen]);

  const khachHienThi = useMemo(() => {
    if (thongTinKhach) return thongTinKhach;

    let localUser = null;
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const parsed = JSON.parse(userJson);
        localUser = parsed?.user ? parsed.user : parsed;
      }
    } catch (e) {
      console.error("Lỗi parse thông tin từ localStorage:", e);
    }

    let propUser = null;
    if (nguoiDung) {
      propUser = nguoiDung?.user ? nguoiDung.user : nguoiDung;
    }

    if (propUser || localUser) {
      return {
        _id: propUser?._id || propUser?.id || localUser?._id || localUser?.id,
        full_name: propUser?.full_name || localUser?.full_name || '',
        email: propUser?.email || localUser?.email || '',
        phone: propUser?.phone || propUser?.phoneNumber || localUser?.phone || localUser?.phoneNumber || '',
      };
    }

    return null;
  }, [thongTinKhach, nguoiDung, isOpen]);

  const chiNhanhHienTai = useMemo(() => {
    if (!danhSachChiNhanh.length || !idChiNhanhChon) return null;
    return danhSachChiNhanh.find((cn) => cn._id === idChiNhanhChon) || null;
  }, [danhSachChiNhanh, idChiNhanhChon]);

  const apDungPhiShip = (data, extraThongBao = null) => {
    setPhiShip(data);
    if (!data.within_range) {
      setThongBao({
        kieu: 'loi',
        noiDung: `Địa chỉ cách chi nhánh này ${data.distance_km} km — hệ thống chỉ giao trong phạm vi ${data.max_distance_km} km!`,
      });
    } else if (extraThongBao) {
      setThongBao({ kieu: extraThongBao.kieu || 'warn', noiDung: extraThongBao.noiDung });
    } else {
      setThongBao({ kieu: '', noiDung: '' });
    }
  };

  const tongTienHang = useMemo(
    () => (gioHang || []).reduce((t, item) => t + (item.tongTien ?? 0), 0),
    [gioHang]
  );

  const soTienGiam = useMemo(() => {
    if (!promotionApDung) return 0;
    return Math.min(tongTienHang, promotionApDung.discount_value || 0);
  }, [promotionApDung, tongTienHang]);

  // 🛠️ GIỮ NGUYÊN GIÁ GỐC: Loại bỏ hoàn toàn cơ chế can thiệp làm tròn
  const tongThanhToan = useMemo(() => {
    return Math.max(0, tongTienHang - soTienGiam + (phiShip?.shipping_fee ?? 0));
  }, [tongTienHang, soTienGiam, phiShip]);

  useEffect(() => {
    if (paymentMethod === 'CASH' && tongThanhToan > 0) {
      setCustomerCash(String(tongThanhToan));
    } else {
      setCustomerCash('');
    }
  }, [tongThanhToan, paymentMethod]);

  const tienThoi =
    paymentMethod === 'CASH' && customerCash
      ? Math.max(0, Number(customerCash) - tongThanhToan)
      : 0;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API_URL}/api/quantri/qt_chinhanh/all-orders`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setDanhSachChiNhanh(data.data);
          if (data.data.length > 0) {
            setIdChiNhanhChon(data.data[0]._id);
          }
        }
      })
      .catch((err) => console.error("Lỗi lấy danh sách chi nhánh:", err));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !userId) return; 

    fetch(`${API_URL}/api/khachhang/khuyenmai/checkout-vouchers?user_id=${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setDanhSachKhuyenMai(result.data);
        } else {
          setDanhSachKhuyenMai([]);
        }
      })
      .catch((err) => {
        console.error("Lỗi lấy danh sách khuyến mãi:", err);
        setDanhSachKhuyenMai([]);
      });
  }, [isOpen, userId]);

  useEffect(() => {
    if (!isOpen || !idChiNhanhChon) return;
    
    const lat = diaChiGiaoHang?.latitude;
    const lon = diaChiGiaoHang?.longitude;
    if (!lat || !lon) {
      setThongBao({
        kieu: 'loi',
        noiDung: 'Địa chỉ nhận hàng thiếu tọa độ định vị. Vui lòng thiết lập lại địa chỉ!',
      });
      return;
    }

    setLoadingPhi(true);
    fetch(`${API_URL}/api/khachhang/don-hang/phi-ship?latitude=${lat}&longitude=${lon}&branch_id=${idChiNhanhChon}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setPhiShip(null);
          setThongBao({ kieu: 'loi', noiDung: data.message || 'Không tính được phí ship từ chi nhánh này!' });
          return;
        }
        apDungPhiShip(data);
      })
      .catch(() => {
        setPhiShip(null);
        setThongBao({ kieu: 'loi', noiDung: 'Lỗi đồng bộ tính phí giao hàng từ hệ thống!' });
      })
      .finally(() => setLoadingPhi(false));
  }, [isOpen, diaChiGiaoHang, idChiNhanhChon]);

  useEffect(() => {
    if (!isOpen) return;
    setPaymentMethod('CASH');
    setCustomerCash('');
    setThongBao({ kieu: '', noiDung: '' });
    setPhiShip(null);
    setThongTinKhach(null);
    setIdMaGiamGiaChon('');
    setPromotionApDung(null);
  }, [isOpen]);

  const handleThayDoiMaGiamGia = (e) => {
    const selectedId = e.target.value;
    setIdMaGiamGiaChon(selectedId);

    if (!selectedId) {
      setPromotionApDung(null);
      setThongBao({ kieu: '', noiDung: '' });
      return;
    }

    const promo = danhSachKhuyenMai.find((item) => item._id === selectedId);
    if (promo) {
      if (promo.min_order_value && tongTienHang < promo.min_order_value) {
        setPromotionApDung(null);
        setIdMaGiamGiaChon('');
        setThongBao({ 
          kieu: 'loi', 
          noiDung: `Mã ${promo.code} yêu cầu đơn hàng tối thiểu từ ${formatTien(promo.min_order_value)}!` 
        });
        return;
      }
      setPromotionApDung(promo);
      setThongBao({ kieu: 'ok', noiDung: `Áp dụng thành công mã: ${promo.code}` });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(">>> TIẾN HÀNH ĐẶT HÀNG QUA USER_ID TỰ ĐỘNG KHỚP SĐT <<<");
  
    if (!userId) {
      setThongBao({ kieu: 'loi', noiDung: 'Vui lòng đăng nhập để đặt hàng!' });
      return;
    }
    if (!idChiNhanhChon) {
      setThongBao({ kieu: 'loi', noiDung: 'Vui lòng chọn chi nhánh phục vụ gần bạn nhất!' });
      return;
    }
    if (!phiShip || !phiShip?.within_range) {
      setThongBao({ kieu: 'loi', noiDung: 'Địa chỉ quá xa chi nhánh đã chọn, không thể giao hàng!' });
      return;
    }
  
    const tenKhachHang = khachHienThi?.full_name || diaChiGiaoHang?.customer_name || 'Khách Hàng';
    
    const phiShipGoc = Number(phiShip?.shipping_fee ?? 0);
    const tongTienHangGoc = Number(tongTienHang);
    const soTienGiamGoc = Number(soTienGiam);
    const tongThanhToanGoc = Number(tongThanhToan);
  
    if (paymentMethod === 'CASH' && (Number(customerCash) < tongThanhToanGoc)) {
      setThongBao({ kieu: 'loi', noiDung: `Số tiền đưa phải lớn hơn hoặc bằng ${formatTien(tongThanhToanGoc)}!` });
      return;
    }
  
    setLoadingSubmit(true);
    
    const items = (gioHang || []).map((item) => {
      const pId = item.productId || item.product_id || item._id;
      return {
        product_id: pId,
        product_name: item.tenMon,
        base_price: Number(item.donGia || 0) - (item.toppings || []).reduce((s, t) => s + Number(t.price || 0), 0),
        quantity: parseInt(item.soLuong ?? 1, 10),
        selected_toppings: item.toppings || [],
        final_unit_price: Number(item.donGia || 0),
        subtotal: Number(item.tongTien || 0),
      };
    });
  
    // Gom toàn bộ payload chung vào một nơi để tái sử dụng, tránh viết lặp code
    const orderPayloadBase = {
      order_type: 'online',
      user_id: userId,
      branch_id: idChiNhanhChon,
      items,
      promotion_code: promotionApDung?._id || null, // Lưu ID voucher để trừ lượt dùng trong DB
      discount_amount: soTienGiamGoc,
      products_subtotal: tongTienHangGoc,
      shipping_fee: phiShipGoc,
      distance_km: Number(phiShip?.distance_km ?? 0),
      total_amount: tongThanhToanGoc,
      payment_method: paymentMethod, 
      delivery: {
        address_detail: diaChiGiaoHang?.address_detail || '',
        latitude: Number(diaChiGiaoHang?.latitude || 0),
        longitude: Number(diaChiGiaoHang?.longitude || 0),
        customer_name: tenKhachHang,
      }
    };
  
    try {
      // Trường hợp thanh toán trực tuyến qua PAYOS
      if (paymentMethod === 'PAYOS') {
        const payosRes = await fetch(`${API_URL}/api/payments/payos/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...orderPayloadBase, // 🌟 Kế thừa toàn bộ trường dữ liệu (Đầy đủ cả mã KM, thông tin giao hàng)
            amount: tongThanhToanGoc, // Đảm bảo số tiền khớp chuẩn cho API PayOS nhận diện
            description: `MilkTea${Date.now().toString().slice(-6)}`
          }),
        });
        
        const payosData = await payosRes.json();
        if (payosRes.ok && payosData.checkoutUrl) {
          window.location.href = payosData.checkoutUrl;
          return;
        } else {
          setThongBao({ kieu: 'loi', noiDung: payosData.message || 'Lỗi khởi tạo link PayOS!' });
          return;
        }
      }
  
      // Trường hợp thanh toán tiền mặt khi nhận hàng (CASH)
      const res = await fetch(`${API_URL}/api/khachhang/don-hang`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...orderPayloadBase, 
          customer_cash: Number(customerCash || tongThanhToanGoc) 
        }),
      });
  
      const data = await res.json();
      if (res.ok) {
        onSuccess?.(data.order);
      } else {
        setThongBao({ kieu: 'loi', noiDung: data.message || 'Yêu cầu đặt hàng bị từ chối!' });
      }
    } catch (err) {
      console.error("Lỗi gửi đơn hàng:", err);
      setThongBao({ kieu: 'loi', noiDung: 'Lỗi kết nối server khi đặt hàng!' });
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className={`mdh-overlay ${isOpen ? 'active' : ''}`} style={{ display: isOpen ? 'flex' : 'none' }} onClick={onClose}>
      <div className="mdh-container" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mdh-close" onClick={onClose} aria-label="Đóng"><X size={20} /></button>
        <h2 className="mdh-title">Chi tiết đặt hàng</h2>

        {thongBao.noiDung && (
          <div className={`mdh-alert mdh-alert-${thongBao.kieu === 'loi' ? 'err' : thongBao.kieu === 'warn' ? 'warn' : 'ok'}`}>
            {thongBao.noiDung}
          </div>
        )}

        <section className="mdh-section" style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 8px 0', fontSize: '0.95rem' }}>
            <Store size={16} color="#4f46e5" /> Khu vực chi nhánh phục vụ
          </h3>
          <select
            value={idChiNhanhChon}
            onChange={(e) => {
              setIdChiNhanhChon(e.target.value);
              setPhiShip(null);
            }}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '500', fontSize: '0.9rem', backgroundColor: '#fff' }}
          >
            {danhSachChiNhanh.length === 0 ? (
              <option value="">-- Đang tải danh sách chi nhánh... --</option>
            ) : (
              danhSachChiNhanh.map((cn) => (
                <option key={cn._id} value={cn._id}>
                  {cn.branch_name}
                </option>
              ))
            )}
          </select>
        </section>

        <section className="mdh-section">
          <h3>Sản phẩm</h3>
          <ul className="mdh-item-list">
            {(gioHang || []).map((item) => (
              <li key={item.id || item._id} className="mdh-item">
                <div>
                  <strong>{item.tenMon}</strong>
                  {item.toppings?.length > 0 && <small>+ {item.toppings.map((t) => t.topping_name).join(', ')}</small>}
                  <span className="mdh-item-qty">{formatTien(item.donGia ?? 0)} × {item.soLuong ?? 1}</span>
                </div>
                <span>{formatTien(item.tongTien)}</span>
              </li>
            ))}
          </ul>
          
          <div className="mdh-row"><span>Tạm tính hàng</span><strong>{formatTien(tongTienHang)}</strong></div>

          {promotionApDung && (
            <div className="mdh-row" style={{ color: '#dc2626' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Ticket size={16} /> Ưu đãi giảm giá ({promotionApDung.code})</span>
              <strong>-{formatTien(soTienGiam)}</strong>
            </div>
          )}

          <div className="mdh-row">
            <span>Phí giao hàng {phiShip && <small>({phiShip.distance_km} km)</small>}</span>
            <strong>{loadingPhi ? 'Đang tính...' : formatTien(phiShip?.shipping_fee ?? 0)}</strong>
          </div>
          
          <div className="mdh-row mdh-row-total">
            <span>Tổng thanh toán</span>
            <strong style={{ color: '#4f46e5', fontSize: '1.25rem' }}>{formatTien(tongThanhToan)}</strong>
          </div>
        </section>

        <section className="mdh-section mdh-promo-section" style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Ticket size={16} color="#4f46e5" /> Voucher khuyến mãi khả dụng</h3>
          <div style={{ marginTop: '6px' }}>
            <select
              value={idMaGiamGiaChon}
              onChange={handleThayDoiMaGiamGia}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '600', fontSize: '0.9rem', backgroundColor: '#fff' }}
            >
              <option value="">-- Nhấp vào đây để chọn mã giảm giá của bạn --</option>
              {danhSachKhuyenMai.map((item) => {
                const khongDuDieuKien = item.min_order_value && tongTienHang < item.min_order_value;
                return (
                  <option key={item._id} value={item._id} disabled={khongDuDieuKien}>
                    {item.code} [Giảm {formatTien(item.discount_value)}] {khongDuDieuKien ? ` (Yêu cầu đơn từ ${formatTien(item.min_order_value)})` : ''}
                  </option>
                );
              })}
            </select>

            {promotionApDung?.description && (
              <div style={{ marginTop: '6px', padding: '6px 10px', backgroundColor: '#f8fafc', borderLeft: '3px solid #4f46e5', borderRadius: '4px', fontSize: '0.85rem', color: '#475569' }}>
                <strong>Ưu đãi:</strong> {promotionApDung.description}
              </div>
            )}
          </div>
        </section>

        <section className="mdh-section">
          <h3>Thông tin địa chỉ giao nhận</h3>
          <div className="mdh-info-box">
            {chiNhanhHienTai && (
              <div style={{ borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px', marginBottom: '8px', fontSize: '0.9rem' }}>
                <p style={{ margin: '0 0 4px 0' }}><span style={{ color: '#4f46e5', fontWeight: 'bold' }}>Cửa hàng chuẩn bị:</span> <strong>{chiNhanhHienTai.branch_name}</strong></p>
                <p style={{ margin: '0', color: '#64748b' }}><span>Địa chỉ quán:</span> {chiNhanhHienTai.shop_address || 'Chưa cập nhật địa chỉ'}</p>
              </div>
            )}
            <p><span>Họ tên nhận:</span> {khachHienThi?.full_name || diaChiGiaoHang?.customer_name || '—'}</p>
            <p><span>SĐT:</span> {khachHienThi?.phone || diaChiGiaoHang?.phone || '—'}</p>
            <p><span>Địa chỉ khách:</span> {diaChiGiaoHang?.address_detail || '—'}</p>
          </div>
        </section>

        <section className="mdh-section">
          <h3>Phương thức thanh toán</h3>
          <label className={`mdh-pay-option ${paymentMethod === 'CASH' ? 'active' : ''}`}>
            <input type="radio" name="payment" checked={paymentMethod === 'CASH'} onChange={() => setPaymentMethod('CASH')} />
            <Banknote size={18} /> Thanh toán khi nhận hàng (COD)
          </label>
          <label className={`mdh-pay-option ${paymentMethod === 'PAYOS' ? 'active' : ''}`}>
            <input type="radio" name="payment" checked={paymentMethod === 'PAYOS'} onChange={() => setPaymentMethod('PAYOS')} />
            <QrCode size={18} /> Thanh toán QR payOS
          </label>

          {paymentMethod === 'CASH' && (
            <div className="mdh-cash-box">
              <label htmlFor="customer-cash">Số tiền khách đưa</label>
              <input 
                id="customer-cash" 
                type="number" 
                min={tongThanhToan} 
                value={customerCash} 
                onChange={(e) => setCustomerCash(e.target.value)} 
              />
              {Number(customerCash) >= tongThanhToan && ( 
                <p className="mdh-change">Tiền thối lại: <strong>{formatTien(tienThoi)}</strong></p>
              )}
            </div>
          )}
        </section>

        <button
          type="button"
          className="mdh-btn-submit"
          disabled={loadingSubmit || loadingPhi || !phiShip?.within_range || (gioHang || []).length === 0}
          onClick={handleSubmit}
        >
          {loadingSubmit ? (
            <><LoaderCircle size={18} className="mdh-spin" /> Đang xử lý giao dịch...</>
          ) : (
            <><CheckCircle2 size={18} /> Xác nhận đặt hàng</>
          )}
        </button>
      </div>
    </div>
  );
};

export default ModalDatHang;
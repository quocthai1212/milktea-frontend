import React, { useEffect, useState, useMemo } from 'react';
import { X, Banknote, QrCode, CheckCircle2, LoaderCircle, WalletCards, Ticket } from 'lucide-react';
import { tinhPhiShipClient } from '../utils/tinhPhiShipClient';
import '../css/khachhang/ModalDatHang.css';

const API_URL = import.meta.env.VITE_API_URL;

const formatTien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';

const ModalDatHang = ({
  isOpen,
  onClose,
  gioHang,
  nguoiDung,
  diaChiGiaoHang,
  userId,
  onSuccess,
}) => {
  const [phiShip, setPhiShip] = useState(null);
  const [loadingPhi, setLoadingPhi] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [customerCash, setCustomerCash] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [thongBao, setThongBao] = useState({ kieu: '', noiDung: '' });
  const [thongTinKhach, setThongTinKhach] = useState(null);

  // --- 🛠️ State phục vụ cho tính năng NHẬP MÃ GIẢM GIÁ ---
  const [maGiamGiaNhap, setMaGiamGiaNhap] = useState(''); 
  const [loadingKiemTraMa, setLoadingKiemTraMa] = useState(false); 
  const [promotionApDung, setPromotionApDung] = useState(null); 

  const khachHienThi = thongTinKhach || nguoiDung;

  const apDungPhiShip = (data, extraThongBao = null) => {
    setPhiShip(data);
    if (!data.within_range) {
      setThongBao({
        kieu: 'loi',
        noiDung: `Địa chỉ cách cửa hàng ${data.distance_km} km — chỉ giao trong ${data.max_distance_km} km!`,
      });
    } else if (extraThongBao) {
      setThongBao({ kieu: extraThongBao.kieu || 'warn', noiDung: extraThongBao.noiDung });
    }
  };

  const tongTienHang = useMemo(
    () => gioHang.reduce((t, item) => t + (item.tongTien ?? 0), 0),
    [gioHang]
  );

  // 💡 TỰ ĐỘNG KIỂM TRA LẠI: Nếu khách hàng thay đổi số lượng giỏ hàng khiến tổng tiền nhỏ hơn min_order_value thì hủy mã tự động
  useEffect(() => {
    if (promotionApDung && promotionApDung.min_order_value && tongTienHang < promotionApDung.min_order_value) {
      setPromotionApDung(null);
      setThongBao({
        kieu: 'warn',
        noiDung: `Mã giảm giá đã tự động gỡ do tổng tiền hàng thấp hơn mức tối thiểu ${formatTien(promotionApDung.min_order_value)}!`
      });
    }
  }, [tongTienHang, promotionApDung]);

  // Tính số tiền được giảm giá dựa trên mã được áp dụng thành công
  const soTienGiam = useMemo(() => {
    if (!promotionApDung) return 0;
    return Math.min(tongTienHang, promotionApDung.discount_value || 0);
  }, [promotionApDung, tongTienHang]);

  // Tổng thanh toán cuối cùng
  const tongThanhToan = Math.max(0, tongTienHang - soTienGiam + (phiShip?.shipping_fee ?? 0));

  const tienThoi =
    paymentMethod === 'CASH' && customerCash
      ? Math.max(0, Number(customerCash) - tongThanhToan)
      : 0;

  // Lắng nghe sự kiện nút ESC để đóng modal nhanh
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 🛠️ HÀM XỬ LÝ KIỂM TRA MÃ GIẢM GIÁ KHI NGƯỜI DÙNG BẤM NÚT "ÁP DỤNG"
  const handleApDungMaGiamGia = async () => {
    if (!maGiamGiaNhap.trim()) {
      setThongBao({ kieu: 'loi', noiDung: 'Vui lòng nhập mã giảm giá!' });
      return;
    }

    setLoadingKiemTraMa(true);
    setThongBao({ kieu: '', noiDung: '' });
    setCustomerCash(''); 

    try {
      const res = await fetch(`${API_URL}/api/khachhang/khuyenmai/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: maGiamGiaNhap.trim(),
          total_items_amount: tongTienHang 
        }),
      });

      const result = await res.json();

      if (res.ok && result.success && result.data) {
        const promo = result.data;
        
        if (promo.min_order_value && tongTienHang < promo.min_order_value) {
          setPromotionApDung(null);
          setThongBao({ 
            kieu: 'loi', 
            noiDung: `Mã ${promo.code} yêu cầu đơn hàng tối thiểu từ ${formatTien(promo.min_order_value)}!` 
          });
          return;
        }

        setPromotionApDung(promo);
        setThongBao({ 
          kieu: 'ok', 
          noiDung: `Áp dụng mã thành công: ${promo.code} (Giảm ${formatTien(promo.discount_value)})` 
        });
      } else {
        setPromotionApDung(null);
        setThongBao({ kieu: 'loi', noiDung: result.message || 'Mã giảm giá không tồn tại hoặc đã hết hạn!' });
      }
    } catch (err) {
      console.error("Lỗi áp dụng mã:", err);
      setPromotionApDung(null);
      setThongBao({ kieu: 'loi', noiDung: 'Lỗi kết nối hệ thống kiểm tra mã!' });
    } finally {
      setLoadingKiemTraMa(false);
    }
  };

  const handleHuyMaGiamGia = () => {
    setPromotionApDung(null);
    setMaGiamGiaNhap('');
    setCustomerCash('');
    setThongBao({ kieu: '', noiDung: '' });
  };

  const handleThayDoiPhuongThucThanhToan = (method) => {
    setPaymentMethod(method);
    setCustomerCash('');
  };

  useEffect(() => {
    if (!isOpen || !userId) return;
    fetch(`${API_URL}/api/khachhang/ho-so?user_id=${userId}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data.user) {
          setThongTinKhach({
            full_name: data.user.full_name,
            phone: data.user.phone || '',
          });
        }
      })
      .catch(() => {});
  }, [isOpen, userId]);

  useEffect(() => {
    if (!isOpen) return;
    setPaymentMethod('CASH');
    setCustomerCash('');
    setThongBao({ kieu: '', noiDung: '' });
    setPhiShip(null);
    setThongTinKhach(null);
    setMaGiamGiaNhap('');
    setPromotionApDung(null);

    const lat = diaChiGiaoHang?.latitude;
    const lon = diaChiGiaoHang?.longitude;
    if (!lat || !lon) {
      setThongBao({
        kieu: 'loi',
        noiDung: 'Địa chỉ giao hàng thiếu tọa độ GPS. Vui lòng cập nhật lại địa chỉ!',
      });
      return;
    }

    setLoadingPhi(true);
    fetch(`${API_URL}/api/khachhang/don-hang/phi-ship?latitude=${lat}&longitude=${lon}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          const fallback = tinhPhiShipClient(lat, lon);
          apDungPhiShip(fallback, {
            kieu: 'loi',
            noiDung: data.message || 'Không tính được phí ship từ server!',
          });
          return;
        }
        apDungPhiShip(data);
      })
      .catch(() => {
        const fallback = tinhPhiShipClient(lat, lon);
        apDungPhiShip(fallback, {
          kieu: 'warn',
          noiDung: `Không kết nối backend tại ${API_URL}. Đã ước tính phí tạm — mở terminal chạy: cd milktea-backend-main → npm start`,
        });
      })
      .finally(() => setLoadingPhi(false));
  }, [isOpen, diaChiGiaoHang]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!userId) {
      setThongBao({ kieu: 'loi', noiDung: 'Vui lòng đăng nhập để đặt hàng!' });
      return;
    }
    if (phiShip?.fallback) {
      setThongBao({
        kieu: 'loi',
        noiDung: 'Backend chưa chạy — không thể lưu đơn. Chạy npm start trong thư mục milktea-backend-main.',
      });
      return;
    }
    if (!phiShip?.within_range) {
      setThongBao({ kieu: 'loi', noiDung: 'Không thể đặt hàng: địa chỉ nằm ngoài vùng giao 10 km!' });
      return;
    }
    if (paymentMethod === 'CASH') {
      const tien = Number(customerCash);
      if (!tien || tien < tongThanhToan) {
        setThongBao({
          kieu: 'loi',
          noiDung: `Số tiền khách trả phải ≥ ${formatTien(tongThanhToan)}!`,
        });
        return;
      }
    }

    setLoadingSubmit(true);
    setThongBao({ kieu: '', noiDung: '' });

    const items = gioHang.map((item) => {
      const donGia = item.donGia ?? item.tongTien ?? 0;
      const soLuong = item.soLuong ?? 1;
      const toppings = item.toppings || [];
      const tienTopping = toppings.reduce((s, t) => s + Number(t.price || 0), 0);
      const base_price = donGia - tienTopping;
      return {
        product_id: item.productId || item.product_id,
        product_name: item.tenMon,
        base_price: Math.max(0, base_price),
        quantity: soLuong,
        selected_toppings: toppings,
        final_unit_price: donGia,
        subtotal: item.tongTien ?? donGia * soLuong,
      };
    });

    const delivery = {
      address_detail: diaChiGiaoHang.address_detail,
      latitude: diaChiGiaoHang.latitude,
      longitude: diaChiGiaoHang.longitude,
      customer_name: khachHienThi?.full_name || '',
      phone: khachHienThi?.phone || '',
    };

    // 💡 ĐÃ SỬA: Biến promotion_code truyền đi bắt buộc phải là chuỗi chữ kí tự (String) do người dùng gõ
    const orderPayloadBase = {
      order_type: 'online',
      user_id: userId,
      items,
      promotion_code: promotionApDung ? promotionApDung.code : null, 
      discount_amount: soTienGiam,
      products_subtotal: tongTienHang,
      shipping_fee: phiShip?.shipping_fee ?? 0,
      distance_km: phiShip?.distance_km ?? 0,
      total_amount: tongThanhToan,
      delivery,
    };

    try {
      if (paymentMethod === 'PAYOS') {
        setThongBao({ kieu: 'warn', noiDung: 'Đang tạo mã QR thanh toán...' });
        const payosRes = await fetch(`${API_URL}/api/payments/payos/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...orderPayloadBase,
            amount: tongThanhToan,
            description: `MilkTea DH${Date.now().toString().slice(-6)}`,
            buyerName: khachHienThi?.full_name || '',
            buyerPhone: khachHienThi?.phone || '',
            buyerEmail: khachHienThi?.email || nguoiDung?.email || '',
          }),
        });
        const payosData = await payosRes.json();
        if (!payosRes.ok || !payosData.checkoutUrl) {
          setThongBao({
            kieu: 'loi',
            noiDung: payosData.message || 'Không tạo được mã QR thanh toán. Vui lòng thử lại hoặc chọn thanh toán khi nhận hàng.',
          });
          return;
        }
        window.location.href = payosData.checkoutUrl;
        return;
      }

      const res = await fetch(`${API_URL}/api/khachhang/don-hang`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderPayloadBase,
          payment_method: 'CASH',
          customer_cash: Number(customerCash),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setThongBao({ kieu: 'loi', noiDung: data.message || 'Đặt hàng thất bại!' });
        return;
      }

      onSuccess?.(data.order);
    } catch {
      setThongBao({ kieu: 'loi', noiDung: 'Lỗi kết nối server!' });
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="mdh-overlay" onClick={onClose}>
      <div className="mdh-container" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mdh-close" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>
        <h2 className="mdh-title">Chi tiết đặt hàng</h2>

        {thongBao.noiDung && (
          <div
            className={`mdh-alert mdh-alert-${
              thongBao.kieu === 'loi' ? 'err' : thongBao.kieu === 'warn' ? 'warn' : 'ok'
            }`}
          >
            {thongBao.noiDung}
          </div>
        )}

        {/* PHẦN DANH SÁCH MÓN & GIÁ */}
        <section className="mdh-section">
          <h3>Sản phẩm</h3>
          <ul className="mdh-item-list">
            {gioHang.map((item) => (
              <li key={item.id} className="mdh-item">
                <div>
                  <strong>{item.tenMon}</strong>
                  {item.toppings?.length > 0 && (
                    <small>+ {item.toppings.map((t) => t.topping_name).join(', ')}</small>
                  )}
                  <span className="mdh-item-qty">
                    {formatTien(item.donGia ?? 0)} × {item.soLuong ?? 1}
                  </span>
                </div>
                <span>{formatTien(item.tongTien)}</span>
              </li>
            ))}
          </ul>
          
          <div className="mdh-row">
            <span>Tạm tính hàng</span>
            <strong>{formatTien(tongTienHang)}</strong>
          </div>

          {/* HIỂN THỊ TÊN MÃ VÀ SỐ TIỀN GIẢM */}
          {promotionApDung && (
            <div className="mdh-row" style={{ color: '#dc2626' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Ticket size={16} /> Ưu đãi giảm giá ({promotionApDung.code})
              </span>
              <strong>-{formatTien(soTienGiam)}</strong>
            </div>
          )}

          <div className="mdh-row">
            <span>
              Phí giao hàng
              {phiShip && (
                <small>
                  {' '}
                  ({phiShip.distance_km} km × {formatTien(phiShip.fee_per_km)}/km)
                </small>
              )}
            </span>
            <strong>
              {loadingPhi ? '...' : formatTien(phiShip?.shipping_fee ?? 0)}
            </strong>
          </div>
          
          <div className="mdh-row mdh-row-total">
            <span>Tổng thanh toán</span>
            <strong style={{ color: '#4f46e5', fontSize: '1.3rem' }}>{formatTien(tongThanhToan)}</strong>
          </div>
        </section>

        {/* KHU VỰC NHẬP MÃ GIẢM GIÁ */}
        <section className="mdh-section mdh-promo-section" style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '15px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Ticket size={18} color="#4f46e5" /> Mã khuyến mãi
          </h3>
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Nhập mã giảm giá của bạn..."
              value={maGiamGiaNhap}
              onChange={(e) => setMaGiamGiaNhap(e.target.value)}
              disabled={promotionApDung !== null || loadingKiemTraMa}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.95rem',
                textTransform: 'uppercase', 
                backgroundColor: promotionApDung ? '#f1f5f9' : '#fff'
              }}
            />
            {promotionApDung ? (
              <button
                type="button"
                onClick={handleHuyMaGiamGia}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Hủy mã
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApDungMaGiamGia}
                disabled={loadingKiemTraMa || gioHang.length === 0}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#4f46e5',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {loadingKiemTraMa ? <LoaderCircle size={16} className="mdh-spin" /> : 'Áp dụng'}
              </button>
            )}
          </div>

          {promotionApDung && promotionApDung.description && (
            <div style={{ 
              marginTop: '8px', 
              padding: '8px 12px', 
              backgroundColor: '#f8fafc', 
              borderLeft: '4px solid #10b981',
              borderRadius: '4px',
              fontSize: '0.88rem',
              color: '#475569'
            }}>
              <strong>Mô tả ưu đãi:</strong> {promotionApDung.description}
            </div>
          )}
        </section>

        {/* ĐỊA CHỈ NHẬN HÀNG */}
        <section className="mdh-section">
          <h3>Địa chỉ nhận hàng</h3>
          <div className="mdh-info-box">
            <p>
              <span>Họ tên:</span> {khachHienThi?.full_name || '—'}
            </p>
            <p>
              <span>SĐT:</span> {khachHienThi?.phone || '—'}
            </p>
            <p>
              <span>Địa chỉ:</span> {diaChiGiaoHang?.address_detail || '—'}
            </p>
          </div>
        </section>

        {/* PHƯƠNG THỨC THANH TOÁN */}
        <section className="mdh-section">
          <h3>Phương thức thanh toán</h3>
          <label className={`mdh-pay-option ${paymentMethod === 'CASH' ? 'active' : ''}`}>
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === 'CASH'}
              onChange={() => handleThayDoiPhuongThucThanhToan('CASH')}
            />
            <Banknote size={18} /> Thanh toán khi nhận hàng (COD)
          </label>
          <label className={`mdh-pay-option ${paymentMethod === 'PAYOS' ? 'active' : ''}`}>
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === 'PAYOS'}
              onChange={() => handleThayDoiPhuongThucThanhToan('PAYOS')}
            />
            <QrCode size={18} /> Thanh toán QR payOS
          </label>

          {paymentMethod === 'CASH' && (
            <div className="mdh-cash-box">
              <label htmlFor="customer-cash">Số tiền khách đưa</label>
              <input
                id="customer-cash"
                type="number"
                min={tongThanhToan}
                step={1000}
                value={customerCash}
                onChange={(e) => setCustomerCash(e.target.value)}
              />
              {Number(customerCash) >= tongThanhToan && (
                <p className="mdh-change">Tiền thối lại: <strong>{formatTien(tienThoi)}</strong></p>
              )}
            </div>
          )}

          {paymentMethod === 'PAYOS' && (
            <div className="mdh-qr-box">
              <div className="mdh-qr-icon" aria-hidden="true">
                <WalletCards size={42} />
              </div>
              <p>
                Bạn sẽ được chuyển sang trang payOS để quét VietQR và thanh toán <strong>{formatTien(tongThanhToan)}</strong>.
              </p>
              <p className="mdh-qr-hint">Đơn hàng chỉ được ghi nhận đã thanh toán sau khi payOS xác nhận thành công.</p>
            </div>
          )}
        </section>

        <button
          type="button"
          className="mdh-btn-submit"
          disabled={
            loadingSubmit ||
            loadingPhi ||
            !phiShip?.within_range ||
            phiShip?.fallback ||
            gioHang.length === 0
          }
          onClick={handleSubmit}
        >
          {loadingSubmit ? (
            <>
              <LoaderCircle size={18} className="mdh-spin" />
              {paymentMethod === 'PAYOS' ? 'Đang tạo mã QR thanh toán...' : 'Đang xử lý...'}
            </>
          ) : (
            <> <CheckCircle2 size={18} /> Xác nhận đặt hàng</>
          )}
        </button>
      </div>
    </div>
  );
};

export default ModalDatHang;
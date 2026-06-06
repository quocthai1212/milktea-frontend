import React, { useEffect, useState, useMemo } from 'react';
import { X, Banknote, QrCode, CheckCircle2, LoaderCircle, WalletCards } from 'lucide-react';
import { tinhPhiShipClient } from '../utils/tinhPhiShipClient';
import '../css/khachhang/ModalDatHang.css';

const API_URL = import.meta.env.VITE_API_URL ;

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

  const tongThanhToan = tongTienHang + (phiShip?.shipping_fee ?? 0);
  const tienThoi =
    paymentMethod === 'CASH' && customerCash
      ? Math.max(0, Number(customerCash) - tongThanhToan)
      : 0;

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

    try {
      if (paymentMethod === 'PAYOS') {
        setThongBao({ kieu: 'warn', noiDung: 'Đang tạo mã QR thanh toán...' });
        const payosRes = await fetch(`${API_URL}/api/payments/payos/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            delivery,
            amount: tongThanhToan,
            description: `MilkTea DH${Date.now().toString().slice(-6)}`,
            items: items.map((item) => ({
              name: item.product_name,
              quantity: item.quantity,
              price: item.final_unit_price,
              product_id: item.product_id,
              product_name: item.product_name,
              base_price: item.base_price,
              selected_toppings: item.selected_toppings,
              final_unit_price: item.final_unit_price,
              subtotal: item.subtotal,
            })),
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
          user_id: userId,
          items,
          payment_method: paymentMethod,
          customer_cash: Number(customerCash),
          delivery,
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
            <strong>{formatTien(tongThanhToan)}</strong>
          </div>
        </section>

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

        <section className="mdh-section">
          <h3>Phương thức thanh toán</h3>
          <label className={`mdh-pay-option ${paymentMethod === 'CASH' ? 'active' : ''}`}>
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === 'CASH'}
              onChange={() => setPaymentMethod('CASH')}
            />
            <Banknote size={18} /> Thanh toán khi nhận hàng (COD)
          </label>
          <label className={`mdh-pay-option ${paymentMethod === 'PAYOS' ? 'active' : ''}`}>
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === 'PAYOS'}
              onChange={() => setPaymentMethod('PAYOS')}
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

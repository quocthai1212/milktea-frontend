import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, CircleAlert, Home, LoaderCircle, ReceiptText } from 'lucide-react';
import '../css/khachhang/PayOSStatus.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PayOSReturn = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [message, setMessage] = useState('Đang kiểm tra trạng thái thanh toán...');

  const identifiers = useMemo(() => {
    const orderCode = searchParams.get('orderCode') || searchParams.get('order_code');
    const paymentLinkId = searchParams.get('id') || searchParams.get('paymentLinkId');
    return { orderCode, paymentLinkId };
  }, [searchParams]);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!identifiers.orderCode && !identifiers.paymentLinkId) {
        setPaymentStatus('UNKNOWN');
        setMessage('Không tìm thấy mã thanh toán trong đường dẫn trả về.');
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        if (identifiers.orderCode) params.set('orderCode', identifiers.orderCode);
        if (identifiers.paymentLinkId) params.set('paymentLinkId', identifiers.paymentLinkId);

        const res = await fetch(`${API_URL}/api/payments/payos/status?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Không kiểm tra được trạng thái thanh toán.');
        }

        setPaymentStatus(data.status);
        if (data.status === 'PAID') {
          localStorage.removeItem('milktea_gio_hang');
          window.dispatchEvent(new Event('cart-updated'));
          setMessage('Thanh toán thành công. Đơn hàng của bạn đã được ghi nhận.');
        } else if (data.status === 'CANCELLED') {
          setMessage('Thanh toán đã bị hủy. Giỏ hàng của bạn vẫn được giữ lại.');
        } else if (data.status === 'FAILED') {
          setMessage('Thanh toán chưa hoàn tất. Vui lòng thử lại hoặc chọn thanh toán khi nhận hàng.');
        } else {
          setMessage('Thanh toán đang chờ xác nhận từ payOS. Vui lòng kiểm tra lại sau ít phút.');
        }
      } catch (error) {
        setPaymentStatus('ERROR');
        setMessage(error.message || 'Không kiểm tra được trạng thái thanh toán.');
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [identifiers]);

  const isPaid = paymentStatus === 'PAID';

  return (
    <main className="payos-page">
      <section className="payos-card">
        <div className={`payos-icon ${isPaid ? 'payos-icon-ok' : 'payos-icon-warn'}`}>
          {loading ? <LoaderCircle className="payos-spin" size={38} /> : isPaid ? <CheckCircle2 size={38} /> : <CircleAlert size={38} />}
        </div>
        <h1>{isPaid ? 'Thanh toán thành công' : 'Trạng thái thanh toán'}</h1>
        <p>{message}</p>
        <div className="payos-actions">
          <Link to="/" className="payos-btn payos-btn-primary">
            <Home size={18} /> Về trang chủ
          </Link>
          <Link to="/khachhang" className="payos-btn payos-btn-secondary">
            <ReceiptText size={18} /> Xem đơn hàng
          </Link>
        </div>
      </section>
    </main>
  );
};

export default PayOSReturn;

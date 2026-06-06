import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Home, LoaderCircle, RotateCcw, XCircle } from 'lucide-react';
import '../css/khachhang/PayOSStatus.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PayOSCancel = () => {
  const [searchParams] = useSearchParams();
  const [retrying, setRetrying] = useState(false);
  const [message, setMessage] = useState('');

  const identifiers = useMemo(() => {
    const orderCode = searchParams.get('orderCode') || searchParams.get('order_code');
    const paymentLinkId = searchParams.get('id') || searchParams.get('paymentLinkId');
    return { orderCode, paymentLinkId };
  }, [searchParams]);

  const handleRetryPayment = async () => {
    if (!identifiers.orderCode && !identifiers.paymentLinkId) {
      setMessage('Không tìm thấy mã thanh toán để mở lại trang quét QR.');
      return;
    }

    setRetrying(true);
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/api/payments/payos/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode: identifiers.orderCode,
          paymentLinkId: identifiers.paymentLinkId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.message || 'Không mở lại được trang quét QR.');
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      setMessage(error.message || 'Không mở lại được trang quét QR. Vui lòng đặt hàng lại.');
      setRetrying(false);
    }
  };

  return (
    <main className="payos-page">
      <section className="payos-card">
        <div className="payos-icon payos-icon-warn">
          <XCircle size={38} />
        </div>
        <h1>Thanh toán chưa hoàn tất</h1>
        <p>Bạn đã hủy thanh toán hoặc thanh toán chưa hoàn tất.</p>
        {message && <p className="payos-message">{message}</p>}
        <div className="payos-actions">
          <button
            type="button"
            className="payos-btn payos-btn-primary"
            onClick={handleRetryPayment}
            disabled={retrying}
          >
            {retrying ? <LoaderCircle size={18} className="payos-spin" /> : <RotateCcw size={18} />}
            Thanh toán lại
          </button>
          <Link to="/" className="payos-btn payos-btn-secondary">
            <Home size={18} /> Về trang chủ
          </Link>
        </div>
      </section>
    </main>
  );
};

export default PayOSCancel;

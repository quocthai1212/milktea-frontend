import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Ticket, Clock, CheckCircle, Gift, AlertCircle, Loader2 } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/khachhang/KhuyenMaiPage.css';

import TrangChuHeader from '../components/TrangChuHeader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function KhuyenMaiPage() {
  const [danhSachVoucher, setDanhSachVoucher] = useState([]);
  const [claimedIds, setClaimedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  // 🛠️ BỔ SUNG: Bốc tách an toàn ID người dùng từ localStorage ra để xài
  let userId = null;
  try {
    const userString = localStorage.getItem('user');
    if (userString) {
      const userObj = JSON.parse(userString);
      userId = userObj._id || userObj.id; // Đề phòng cấu trúc backend lưu trường _id hoặc id
    }
  } catch (err) {
    console.error('Lỗi phân tích dữ liệu user từ localStorage:', err);
  }

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      
      // Cấu hình headers truyền token bảo mật
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      // 🔄 CẬP NHẬT: Gắn query parameter user_id lên URL endpoint
      const url = userId 
        ? `${API_URL}/api/khachhang/khuyenmai/all?user_id=${userId}`
        : `${API_URL}/api/khachhang/khuyenmai/all`;

      const response = await axios.get(url, config);

      if (response.data.success) {
        setDanhSachVoucher(response.data.data);
        // Đồng bộ danh sách ID voucher mà người dùng hiện tại đã lấy về ví
        setClaimedIds(response.data.claimedIds || []);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách khuyến mãi:', error);
      toast.error('Không thể kết nối dữ liệu khuyến mãi từ hệ thống!');
    } finally {
      setLoading(false);
    }
  };

  // Lắng nghe sự thay đổi của cả token lẫn userId để tái cấu trúc danh sách voucher tương thích
  useEffect(() => {
    fetchPromotions();
  }, [token, userId]);

  const handleClaimVoucher = async (promotionId) => {
    if (!token) {
      toast.warn('Vui lòng đăng nhập hệ thống để thu thập mã giảm giá này!');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/khachhang/khuyenmai/claim`,
        { 
          promotion_id: promotionId,
          user_id: userId // Gửi kèm userId lên để phần xử lý lưu ví của Backend nhận diện chính xác
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Đã lưu voucher thành công vào ví!');
        setClaimedIds((prev) => [...prev, promotionId]);
        
        // Tùy chọn cập nhật tăng số lượng claimed_count hiển thị trên giao diện trực tiếp
        setDanhSachVoucher(prevList => 
          prevList.map(v => v._id === promotionId ? { ...v, claimed_count: (v.claimed_count || 0) + 1 } : v)
        );
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Nhận mã thất bại, vui lòng thử lại!';
      toast.error(errorMsg);
    }
  };

  const formatGiaTien = (soTien) => {
    return Number(soTien || 0).toLocaleString('vi-VN') + 'đ';
  };

  return (
    <div className="khuyenmai-page">
      <TrangChuHeader />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className="khuyenmai-content">
        <div className="khuyenmai-banner">
          <div className="khuyenmai-banner-icon">
            <Gift size={32} />
          </div>
          <h1>SĂN VOUCHER ƯU ĐÃI KHỦNG</h1>
          <p>
            Thu thập các mã giảm giá siêu hời để tận hưởng những ly trà sữa đậm vị cùng bạn bè tại{' '}
            <strong>MilkTea Paradise</strong>.
          </p>
        </div>

        {loading ? (
          <div className="khuyenmai-loading">
            <Loader2 className="khuyenmai-loading-icon" size={40} />
            <p>Đang tải kho voucher khuyến mãi...</p>
          </div>
        ) : (
          <div className="voucher-grid">
            {danhSachVoucher.length === 0 ? (
              <div className="khuyenmai-empty">
                <AlertCircle size={48} />
                <p>Hiện tại hệ thống chưa phát hành mã giảm giá nào mới!</p>
              </div>
            ) : (
              danhSachVoucher.map((voucher) => {
                const laCollectible = voucher.promotion_type === 'collectible';
                const daNhan = claimedIds.includes(voucher._id);

                return (
                  <div key={voucher._id} className="voucher-item">
                    <div className="voucher-left">
                      <Ticket />
                      <span className="label">Giảm ngay</span>
                      <span className="value">
                        {voucher.discount_value >= 1000
                          ? `${(voucher.discount_value / 1000).toLocaleString()}K`
                          : `${voucher.discount_value}đ`}
                      </span>
                      <div className="punch-holes">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="hole" />
                        ))}
                      </div>
                    </div>

                    <div className="voucher-right">
                      <div>
                        <div className="badge-container">
                          <span className="code-badge">CODE: {voucher.code}</span>
                          <span className={`type-badge ${laCollectible ? 'collectible' : 'public'}`}>
                            {laCollectible ? 'Mã cần lưu ví' : 'Áp dụng tự động'}
                          </span>
                        </div>

                        <h3 className="voucher-title">
                          {voucher.description ||
                            `Giảm giá trực tiếp đơn hàng ${formatGiaTien(voucher.discount_value)}`}
                        </h3>

                        {laCollectible && voucher.usage_limit && (
                          <p className="voucher-limit">
                            Số lượng có hạn: Đã nhận{' '}
                            <strong>{voucher.claimed_count || 0}</strong>/{voucher.usage_limit} lượt
                          </p>
                        )}
                      </div>

                      <div className="voucher-footer">
                        <div className="hsd-text">
                          <Clock />
                          <span>HSD: {new Date(voucher.end_date).toLocaleDateString('vi-VN')}</span>
                        </div>

                        <div>
                          {laCollectible ? (
                            daNhan ? (
                              <button className="btn-claimed" disabled>
                                <CheckCircle size={16} /> Đã lưu
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn-claim"
                                onClick={() => handleClaimVoucher(voucher._id)}
                              >
                                Lưu mã
                              </button>
                            )
                          ) : (
                            <span className="btn-public">Khả dụng ngay</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
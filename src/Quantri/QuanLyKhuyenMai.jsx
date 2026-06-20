import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, AlertTriangle, Loader2, Calendar } from 'lucide-react';
import '../css/quantri/QuanLyKhuyenMai.css';

const QuanLyKhuyenMai = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hienForm, setHienForm] = useState(false);
  const [dangSuaId, setDangSuaId] = useState(null);
  const [moXoaModal, setMoXoaModal] = useState(false);
  const [maCanXoa, setMaCanXoa] = useState(null);

  // 🌟 ĐÃ THÊM: tích hợp trường promotion_type vào state quản lý dữ liệu form
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_value: '',
    start_date: '',
    end_date: '',
    usage_limit: '',
    promotion_type: 'public', // Mặc định ban đầu là công khai
    is_active: true
  });
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const API_URL = import.meta.env.VITE_API_URL || '';

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    taiDanhSach();
  }, []);

  const taiDanhSach = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/quantri/qt_khuyenmai/all`);
      const data = await res.json();
      if (data.success) setPromotions(data.data);
    } catch (err) {
      showToast('❌ Không thể tải danh sách khuyến mãi!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSavePromotion = async (e) => {
    e.preventDefault();
    const url = dangSuaId ? `${API_URL}/api/quantri/qt_khuyenmai/update/${dangSuaId}` : `${API_URL}/api/quantri/qt_khuyenmai/add`;
    const method = dangSuaId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        showToast(dangSuaId ? 'Cập nhật mã giảm giá thành công!' : 'Thêm mã giảm giá mới thành công!', 'success');
        handleResetForm();
        taiDanhSach();
        setHienForm(false);
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối server!', 'error');
    }
  };

  // 🌟 ĐÃ CẬP NHẬT: Đổ dữ liệu promotion_type từ database lên form khi bấm Sửa
  const handleEditClick = (ma) => {
    setDangSuaId(ma._id);
    setFormData({
      code: ma.code,
      description: ma.description || '',
      discount_value: ma.discount_value,
      start_date: ma.start_date.substring(0, 10),
      end_date: ma.end_date.substring(0, 10),
      usage_limit: ma.usage_limit || '',
      promotion_type: ma.promotion_type || 'public',
      is_active: ma.is_active
    });
    setHienForm(true);
  };

  // 🌟 ĐÃ CẬP NHẬT: Trả loại mã về 'public' khi làm mới form
  const handleResetForm = () => {
    setDangSuaId(null);
    setFormData({ 
      code: '', 
      description: '', 
      discount_value: '', 
      start_date: '', 
      end_date: '', 
      usage_limit: '', 
      promotion_type: 'public', 
      is_active: true 
    });
  };

  const formatNgay = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  return (
    <div className="qlkm-container">
      {toast.show && (
        <div className={`qlkm-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 🖼️ THANH ĐẦU TRANG */}
      <div className="qlkm-header-row">
        <div className="qlkm-title-block">
          <h2 className="qlkm-main-title">🎟️ QUẢN LÝ MÃ GIẢM GIÁ</h2>
          <p className="qlkm-sub-title">Cấu hình hệ thống mã ưu đãi công khai ăn ngay hoặc mã thu thập giới hạn giữ chỗ vào ví khách.</p>
        </div>
        <button className="qlkm-btn-add-new" onClick={() => { handleResetForm(); setHienForm(true); }}>
          <Plus size={16} style={{ marginRight: '6px' }} /> Thêm Mã Mới
        </button>
      </div>

      {/* 🎛️ POP-UP FORM NHẬP LIỆU */}
      {hienForm && (
        <div className="qlkm-modal-overlay">
          <div className="qlkm-box-custom qlkm-modal-box-custom">
            <span className="qlkm-close-modal-x" onClick={() => { handleResetForm(); setHienForm(false); }}>&times;</span>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>
              {dangSuaId ? '✏️ CẬP NHẬT MÃ GIẢM GIÁ' : '➕ THÊM MÃ ƯU ĐÃI MỚI'}
            </h3>
            <form onSubmit={handleSavePromotion} autoComplete="off" noValidate>
              
              <div style={{ position: 'absolute', opacity: 0, zIndex: -1, height: 0, overflow: 'hidden' }}>
                <input type="text" name="chrome_fake_user" autoComplete="username" tabIndex="-1" />
                <input type="password" name="chrome_fake_pass" autoComplete="current-password" tabIndex="-1" />
              </div>

              {/* 🌟 ĐÃ THÊM: Cụm lựa chọn loại hình mã áp dụng */}
              <div className="qlkm-form-group" style={{ marginBottom: '16px' }}>
                <label className="qlkm-form-label" style={{ fontWeight: '600' }}>Hình thức áp dụng mã *</label>
                <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                    <input 
                      type="radio" 
                      name="promotion_type" 
                      value="public" 
                      checked={formData.promotion_type === 'public'} 
                      onChange={handleInputChange} 
                    />
                    🌐 Công khai (Ai nhập cũng dùng được)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                    <input 
                      type="radio" 
                      name="promotion_type" 
                      value="collectible" 
                      checked={formData.promotion_type === 'collectible'} 
                      onChange={handleInputChange} 
                    />
                    📥 Thu thập (Phải bấm nhận mới được dùng)
                  </label>
                </div>
              </div>

              {/* Ô VOUCHER */}
              <div className="qlkm-form-group">
                <label className="qlkm-form-label">Mã voucher (Viết liền không dấu) *</label>
                <div className="auth-input-wrap">
                  <input 
                    type="text" 
                    name="code" 
                    value={formData.code} 
                    disabled={dangSuaId !== null} 
                    onChange={handleInputChange} 
                    required 
                    autoComplete="new-password"
                    placeholder="VD: NHAMATVVIP, GIAM30K" 
                  />
                </div>
              </div>

              {/* Ô MỨC GIẢM GIÁ */}
              <div className="qlkm-form-group">
                <label className="qlkm-form-label">Mức giảm giá tiền mặt (VNĐ) *</label>
                <div className="auth-input-wrap">
                  <input 
                    type="number" 
                    name="discount_value" 
                    value={formData.discount_value} 
                    onChange={handleInputChange} 
                    required 
                    autoComplete="new-password"
                    placeholder="Khấu trừ thẳng vào đơn" 
                  />
                </div>
              </div>

              {/* Ô GIỚI HẠN SỐ LƯỢNG (Tự động thay đổi tiêu đề theo loại mã chọn ở trên) */}
              <div className="qlkm-form-group">
                <label className="qlkm-form-label">
                  {formData.promotion_type === 'public' ? 'Giới hạn tổng lượt dùng tối đa' : 'Tổng số lượng phát hành vào ví'} (Để trống = Không giới hạn)
                </label>
                <div className="auth-input-wrap">
                  <input 
                    type="number" 
                    name="usage_limit" 
                    value={formData.usage_limit} 
                    onChange={handleInputChange} 
                    autoComplete="new-password"
                    placeholder={formData.promotion_type === 'public' ? "Số lượt dùng đơn hàng tối đa" : "Số lượng mã cho phép khách ấn nhận"} 
                  />
                </div>
              </div>

              {/* CỤM NGÀY THÁNG */}
              <div className="qlkm-form-row">
                <div className="qlkm-form-group">
                  <label className="qlkm-form-label">Bắt đầu từ ngày *</label>
                  <div className="auth-input-wrap">
                    <input 
                      type="date" 
                      name="start_date" 
                      value={formData.start_date} 
                      onChange={handleInputChange} 
                      required 
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <div className="qlkm-form-group">
                  <label className="qlkm-form-label">Hạn cuối ngày *</label>
                  <div className="auth-input-wrap">
                    <input 
                      type="date" 
                      name="end_date" 
                      value={formData.end_date} 
                      onChange={handleInputChange} 
                      required 
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              {/* Ô MÔ TẢ */}
              <div className="qlkm-form-group" style={{ marginTop: '16px' }}>
                <label className="qlkm-form-label">Mô tả ngắn chiến dịch</label>
                <div className="auth-input-wrap">
                  <input 
                    type="text" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    autoComplete="new-password"
                    placeholder="Hiển thị cho khách khi xem mã..." 
                  />
                </div>
              </div>

              <div className="qlkm-checkbox-group">
                <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                <label htmlFor="is_active" style={{ cursor: 'pointer' }}>Hiển thị kích hoạt áp dụng ngay</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="qlkm-btn-cancel" onClick={() => setHienForm(false)}>Hủy</button>
                <button type="submit" className="qlkm-btn-submit">Lưu cấu hình</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📊 BẢNG DỮ LIỆU HIỂN THỊ CHUẨN */}
      <div className="qlkm-table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px' }}><Loader2 className="animate-spin inline" /> Đang tải dữ liệu...</div>
        ) : (
          <div className="qlkm-table-wrapper">
            <table className="qlkm-table">
              <thead>
                <tr>
                  <th>Mã Giảm Giá / Chương Trình</th>
                  <th>Mức Chiết Khấu</th>
                  <th style={{ width: '240px' }}>Theo Dõi Số Lượng</th>
                  <th>Thời Gian Hiệu Lực</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ width: '160px', textAlign: 'center' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {promotions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                      Chưa có mã giảm giá nào được tạo trên hệ thống.
                    </td>
                  </tr>
                ) : (
                  promotions.map((item) => {
                    const hetHan = new Date(item.end_date) < new Date();
                    const laMaThuThap = item.promotion_type === 'collectible';

                    return (
                      <tr key={item._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="qlkm-badge-code">{item.code}</span>
                            {/* 🌟 ĐÃ THÊM: Huy hiệu trực quan phân biệt hình thức mã */}
                            {laMaThuThap ? (
                              <span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontWeight: '500' }}>📥 Thu thập</span>
                            ) : (
                              <span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: '#f0fdf4', color: '#15803d', borderRadius: '4px', fontWeight: '500' }}>🌐 Công khai</span>
                            )}
                          </div>
                          <div className="qlkm-text-desc">{item.description || <em style={{ color: '#94a3b8' }}>Chưa có mô tả</em>}</div>
                        </td>
                        <td className="qlkm-text-price">-{item.discount_value.toLocaleString()}đ</td>
                        
                        {/* 🌟 CỘT THEO DÕI SỐ LƯỢNG: Tối ưu logic tách biệt cách hiển thị theo loại mã */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                            {laMaThuThap && (
                              <div>
                                <span style={{ color: '#2563eb', fontWeight: '500' }}>📥 Khách đã nhận:</span>{' '}
                                <strong>{item.claimed_count || 0}</strong> / {item.usage_limit === null ? "∞" : item.usage_limit}
                              </div>
                            )}
                            <div>
                              <span style={{ color: '#16a34a', fontWeight: '500' }}>🛒 Thực tế đã dùng:</span>{' '}
                              <strong>{item.used_count || 0}</strong>
                              {!laMaThuThap && item.usage_limit !== null ? ` / ${item.usage_limit}` : ''}
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="qlkm-date-block">
                            <div className="qlkm-date-item"><Calendar size={13}/> Từ: {formatNgay(item.start_date)}</div>
                            <div className="qlkm-date-item"><Calendar size={13}/> Đến: {formatNgay(item.end_date)}</div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {hetHan ? (
                            <span className="qlkm-badge-status expired">Hết hiệu lực</span>
                          ) : item.is_active ? (
                            <span className="qlkm-badge-status active">Đang chạy</span>
                          ) : (
                            <span className="qlkm-badge-status stopped">Đang tạm ẩn</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => handleEditClick(item)} className="qlkm-btn-edit" style={{ marginRight: '8px' }}>Sửa</button>
                          <button onClick={() => { setMaCanXoa({ id: item._id, code: item.code }); setMoXoaModal(true); }} className="qlkm-btn-delete">Xóa</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL XÁC NHẬN XÓA */}
      {moXoaModal && (
        <div className="qlkm-modal-overlay">
          <div className="qlkm-modal-box-custom qlkm-delete-box">
            <div style={{ display: 'flex', gap: '14px' }}>
              <div className="qlkm-delete-icon-wrapper"><AlertTriangle size={22} color="#ef4444" /></div>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>Xác Nhận Xóa Mã?</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Bạn có chắc muốn xóa vĩnh viễn voucher <strong>"{maCanXoa?.code}"</strong>? Hành động này không thể hoàn tác.</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button className="qlkm-btn-cancel" onClick={() => setMoXoaModal(false)}>Hủy</button>
              <button className="qlkm-btn-delete-confirm" onClick={async () => {
                try {
                  const res = await fetch(`${API_URL}/api/quantri/qt_khuyenmai/delete/${maCanXoa.id}`, { method: 'DELETE' });
                  const data = await res.json();
                  if(res.ok) {
                    showToast('Xóa mã giảm giá thành công!', 'success');
                  } else {
                    showToast(data.message || 'Lỗi khi xóa mã!', 'error');
                  }
                } catch (err) {
                  showToast('Lỗi kết nối máy chủ!', 'error');
                } finally {
                  setMoXoaModal(false);
                  taiDanhSach();
                }
              }}>Xóa xuôi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuanLyKhuyenMai;
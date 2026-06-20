import { useState, useEffect } from 'react';
import '../css/quantri/QuanLyNhanVien.css';
import '../css/quantri/QuanLyKhachHang.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function QuanLyKhachHang() {
  const [danhSachKH, setDanhSachKH] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); 
  const [selectedUser, setSelectedUser] = useState(null);

  const [moXoaModal, setMoXoaModal] = useState(false);
  const [khCanXoa, setKhCanXoa] = useState(null);

  // 🔔 State quản lý thông báo góc trên bên phải
  const [toast, setToast] = useState({ hienThi: false, message: '', type: 'success' });

  // Hàm kích hoạt hiển thị Toast và tự động ẩn sau 4 giây
  const hienThongBao = (message, type = 'success') => {
    setToast({ hienThi: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, hienThi: false }));
    }, 2000);
  };

  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', password: '',
    gender: 'Nam', role_id: 3, is_vip: false, is_active: true
  });

  const hienThiHangThanhVien = (is_vip) => {
    if (is_vip) return <span style={{ color: '#d97706', fontWeight: 'bold' }}>⭐ VIP</span>;
    return <span style={{ color: '#64748b' }}>Thường</span>;
  };

  const fetchKhachHang = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/quantri/qt_khachhang/all`);
      const result = await response.json();
      
      if (result.success) {
        setDanhSachKH(result.data);
      } else {
        hienThongBao(result.message || 'Không thể lấy danh sách khách hàng', 'error');
      }
    } catch (error) {
      console.error("Lỗi fetch danh sách khách hàng:", error);
      hienThongBao('Không thể kết nối đến máy chủ Backend!', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKhachHang();                                
  }, []);

  const xuLyMoForm = (mode, user = null) => {
    setModalMode(mode);
    setSelectedUser(user);
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '', 
        gender: user.gender || 'Nam',
        role_id: 3, 
        is_vip: user.is_vip !== undefined ? user.is_vip : false,
        is_active: user.is_active !== undefined ? user.is_active : true
      });
    } else {
      setFormData({ full_name: '', email: '', phone: '', password: '', gender: 'Nam', role_id: 3, is_vip: false, is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      let url = `${API_URL}/api/quantri/qt_khachhang/add`;
      let method = 'POST';

      if (modalMode === 'edit' && selectedUser) {
        url = `${API_URL}/api/quantri/qt_khachhang/update/${selectedUser._id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        hienThongBao(result.message, 'success');
        setIsModalOpen(false);
        fetchKhachHang(); 
      } else {
        hienThongBao(result.message || 'Thao tác thất bại!', 'error');
      }
    } catch (error) {
      hienThongBao('Lỗi kết nối mạng!', 'error');
    }
  };

  const kichHoatHoiXoa = (id, name) => {
    setKhCanXoa({ id, name });
    setMoXoaModal(true);
  };

  const handleXacNhanXoaChinhThuc = async () => {
    if (!khCanXoa) return;
    try {
      const response = await fetch(`${API_URL}/api/quantri/qt_khachhang/delete/${khCanXoa.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        hienThongBao(result.message, 'success');
        setDanhSachKH(danhSachKH.filter(item => item._id !== khCanXoa.id));
      } else {
        hienThongBao(result.message || 'Xóa thất bại!', 'error');
      }
    } catch (error) {
      hienThongBao('Không thể kết nối máy chủ!', 'error');
    } finally {
      setMoXoaModal(false);
      setKhCanXoa(null);
    }
  };

  return (
    <div className="qlnv-container" style={{ position: 'relative' }}>
      
      {/* 🔔 UI TOAST THÔNG BÁO GÓC TRÊN BÊN PHẢI */}
      {toast.hienThi && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
          padding: '14px 24px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
          <span 
            onClick={() => setToast(p => ({ ...p, hienThi: false }))} 
            style={{ marginLeft: '15px', cursor: 'pointer', opacity: 0.7 }}
          >
            &times;
          </span>
        </div>
      )}

      {/* Thêm CSS Keyframe trực tiếp cho Animation mượt mà */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      
      <h2 className="qlnv-main-title">👥 HỆ THỐNG QUẢN LÝ TÀI KHOẢN KHÁCH HÀNG</h2>
      
      <div className="qlnv-header-row">
        <h3 style={{ margin: 0, color: '#1e293b' }}>📋 DANH SÁCH KHÁCH HÀNG ({loading ? '...' : danhSachKH.length} người)</h3>
        <button onClick={() => xuLyMoForm('add')} className="qlnv-btn-add-new">
          ➕ Thêm Khách Hàng Mới
        </button>
      </div>

      <div className="qlnv-table-card">
        <div className="qlnv-table-wrapper">
          <table className="qlnv-table">
            <thead>
              <tr>
                <th>Họ và Tên</th>
                <th>Hạng Thành Viên</th>
                <th>Số điện thoại</th>
                <th>Email / Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    🔄 Đang quét danh sách khách hàng từ database...
                  </td>
                </tr>
              ) : danhSachKH.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Chưa có khách hàng nào trong cơ sở dữ liệu.
                  </td>
                </tr>
              ) : (
                danhSachKH.map((kh) => (
                  <tr key={kh._id}>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{kh.full_name}</td>
                    <td>{hienThiHangThanhVien(kh.is_vip)}</td>
                    <td style={{ color: '#475569' }}>{kh.phone || 'Chưa có SĐT'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="qlnv-badge-attendance" style={{ width: 'fit-content' }}>
                          {kh.email || 'Chưa có email'}
                        </span>
                        <span>{kh.is_active ? '🟢 Đang chạy' : '🔴 Bị khóa'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => xuLyMoForm('view', kh)} className="qlnv-btn-view">🔍 Chi tiết</button>
                        <button onClick={() => xuLyMoForm('edit', kh)} className="qlnv-btn-edit">✏️ Sửa</button>
                        <button onClick={() => kichHoatHoiXoa(kh._id, kh.full_name)} className="qlnv-btn-delete">🗑️ Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Cửa sổ Xem/Thêm/Sửa thông tin khách hàng --- */}
      {isModalOpen && (
        <div className="qlnv-modal-overlay">
          <div className="qlnv-modal-box-custom">
            <span onClick={() => setIsModalOpen(false)} className="qlnv-close-modal-x">&times;</span>
            
            {modalMode === 'view' && selectedUser && (
              <div>
                <h3 style={{ margin: '0 0 15px 0', color: '#2563eb', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>📋 Thông Tin Chi Tiết Khách Hàng</h3>
                <div className="qlnv-view-details-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <p><strong>Họ tên khách hàng:</strong> {selectedUser.full_name}</p>
                  <p><strong>Phân hạng tài khoản:</strong> {hienThiHangThanhVien(selectedUser.is_vip)}</p>
                  <p><strong>Giới tính:</strong> {selectedUser.gender}</p>
                  <p><strong>Tài khoản Email:</strong> {selectedUser.email}</p>
                  <p><strong>Số điện thoại:</strong> {selectedUser.phone || 'Chưa cập nhật'}</p>
                  <p><strong>Trạng thái hoạt động:</strong> {selectedUser.is_active ? '🟢 Tài khoản đang hoạt động' : '🔴 Tài khoản đang bị khóa/chặn'}</p>
                  <p><strong>Số lượng địa chỉ nhận hàng đã lưu:</strong> {selectedUser.shipping_addresses ? selectedUser.shipping_addresses.length : 0} địa chỉ</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} style={{ width: '100%', padding: '10px', background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Đóng lại</button>
              </div>
            )}

            {(modalMode === 'add' || modalMode === 'edit') && (
              <form onSubmit={handleSubmitForm} autoComplete="off" noValidate>
                
                <div style={{ position: 'absolute', opacity: 0, zIndex: -1, height: 0, overflow: 'hidden' }}>
                  <input type="text" name="chrome_fake_user" autoComplete="username" tabIndex="-1" />
                  <input type="password" name="chrome_fake_pass" autoComplete="current-password" tabIndex="-1" />
                </div>

                <h3 style={{ margin: '0 0 15px 0', color: '#059669', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                  {modalMode === 'add' ? '➕ Đăng Ký Tài Khoản Khách Hàng' : '✏️ Cập Nhật Thông Tin Khách Hàng'}
                </h3>
                
                <div className="qlnv-form-row" style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                    <label className="qlnv-form-label">Họ tên khách hàng (*):</label>
                    <div className="auth-input-wrap">
                      <input 
                        type="text" 
                        required 
                        value={formData.full_name} 
                        autoComplete="new-password"
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label className="qlnv-form-label">Giới tính:</label>
                    <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="qlnv-input" style={{ height: '44px', borderRadius: '14px' }}>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="qlnv-form-group" style={{ marginTop: '10px' }}>
                  <label className="qlnv-form-label">Số điện thoại liên hệ:</label>
                  <div className="auth-input-wrap">
                    <input 
                      type="text" 
                      value={formData.phone} 
                      autoComplete="new-password"
                      onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="qlnv-form-group" style={{ marginTop: '10px' }}>
                  <label className="qlnv-form-label">Địa chỉ Email (*):</label>
                  <div className="auth-input-wrap">
                    <input 
                      type="email" 
                      required 
                      disabled={modalMode === 'edit'}
                      value={formData.email} 
                      autoComplete="new-password"
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="qlnv-form-group">
                  <label className="qlnv-form-label">Mật khẩu truy cập {modalMode === 'edit' && '(Bỏ trống nếu không muốn đổi)'}:</label>
                  <div className="auth-input-wrap">
                    <input 
                      type="password" 
                      required={modalMode === 'add'} 
                      value={formData.password} 
                      autoComplete="new-password"
                      onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="qlnv-checkbox-group" style={{ marginTop: '15px' }}>
                  <input type="checkbox" id="is_vip" checked={formData.is_vip} onChange={(e) => setFormData({...formData, is_vip: e.target.checked})} /> 
                  <label htmlFor="is_vip" style={{fontWeight: 'bold', color: '#d97706', cursor: 'pointer'}}>Kích hoạt đặc quyền Thành viên VIP</label>
                </div>

                <div className="qlnv-checkbox-group" style={{ marginTop: '10px' }}>
                  <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} /> 
                  <label htmlFor="is_active" style={{fontWeight: 'bold', color: '#1e293b', cursor: 'pointer'}}>Cho phép tài khoản hoạt động bình thường</label>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 16px', background: '#cbd5e1', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#334155', fontWeight: '600' }}>Hủy bỏ</button>
                  <button type="submit" style={{ padding: '10px 16px', background: '#10b981', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: '600' }}>Lưu thông tin</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- Cửa sổ Xác Nhận Xóa khách hàng vĩnh viễn --- */}
      {moXoaModal && (
        <div className="qlnv-modal-overlay">
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', maxWidth: '450px', width: '100%' }}>
            <h3 style={{ color: '#ef4444', margin: '0 0 12px 0' }}>⚠️ XÁC NHẬN XÓA TÀI KHOẢN KHÁCH HÀNG</h3>
            <p style={{ color: '#475569', lineHeight: '1.5', marginBottom: '20px' }}>
              Bạn có chắc chắn muốn xóa hoàn toàn dữ liệu tài khoản của khách hàng <strong style={{ color: '#ef4444' }}>{khCanXoa?.name}</strong> khỏi hệ thống không? Lịch sử đơn hàng có thể bị ảnh hưởng và hành động này không thể hoàn tác!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setMoXoaModal(false); setKhCanXoa(null); }} style={{ padding: '8px 16px', background: '#cbd5e1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Hủy (Giữ lại)</button>
              <button onClick={handleXacNhanXoaChinhThuc} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Xác Nhận Xóa</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
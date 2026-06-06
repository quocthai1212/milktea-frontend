import { useState, useEffect } from 'react';
import '../css/quantri/QuanLyNhanVien.css'; // 🌟 Đảm bảo đường dẫn này đúng với file CSS riêng của bạn

const API_URL = import.meta.env.VITE_API_URL;

export default function QuanLyNhanVien() {
  const [danhSachNV, setDanhSachNV] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); 
  const [selectedUser, setSelectedUser] = useState(null);

  const [moXoaModal, setMoXoaModal] = useState(false);
  const [nvCanXoa, setNvCanXoa] = useState(null);

  // 🌟 Đã sửa: Bổ sung trường 'username' vào mặc định formData để không bị lỗi database khi tạo mới
  const [formData, setFormData] = useState({
    username: '', full_name: '', email: '', phone: '', password: '',
    cccd: '', birthday: '', gender: 'Nam', role_id: 2,      
    base_salary: 25000, is_active: true
  });

  const fetchNhanVien = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/quantri/qt_nhanvien/all`);
      const result = await response.json();
      
      if (result.success) {
        setDanhSachNV(result.data);
      } else {
        alert(result.message || 'Không thể lấy danh sách nhân viên');
      }
    } catch (error) {
      console.error("Lỗi fetch danh sách:", error);
      alert('Không thể kết nối đến máy chủ Backend!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNhanVien();                                 
  }, []);

  const xuLyMoForm = (mode, user = null) => {
    setModalMode(mode);
    setSelectedUser(user);
    if (user) {
      setFormData({
        username: user.username || '', 
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        cccd: user.cccd || '',
        birthday: user.birthday ? user.birthday.substring(0, 10) : '',
        gender: user.gender || 'Nam',
        role_id: 2,
        base_salary: user.base_salary || 25000,
        is_active: user.is_active !== undefined ? user.is_active : true
      });
    } else {
      setFormData({ username: '', full_name: '', email: '', phone: '', password: '', cccd: '', birthday: '', gender: 'Nam', role_id: 2, base_salary: 25000, is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      let url = `${API_URL}/api/quantri/qt_nhanvien/add`;
      let method = 'POST';

      if (modalMode === 'edit' && selectedUser) {
        url = `${API_URL}/api/quantri/qt_nhanvien/update/${selectedUser._id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setIsModalOpen(false);
        fetchNhanVien(); 
      } else {
        alert(`${result.message}\nChi tiết lỗi từ Database: ${result.error || JSON.stringify(result)}`);
      }
    } catch (error) {
      alert('Lỗi kết nối mạng!');
    }
  };

  const kichHoatHoiXoa = (id, name) => {
    setNvCanXoa({ id, name });
    setMoXoaModal(true);
  };

  const handleXacNhanXoaChinhThuc = async () => {
    if (!nvCanXoa) return;
    try {
      const response = await fetch(`${API_URL}/api/quantri/qt_nhanvien/delete/${nvCanXoa.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setDanhSachNV(danhSachNV.filter(item => item._id !== nvCanXoa.id));
      } else {
        alert(result.message || 'Xóa thất bại!');
      }
    } catch (error) {
      alert('Không thể kết nối máy chủ!');
    } finally {
      setMoXoaModal(false);
      setNvCanXoa(null);
    }
  };

  return (
    <div className="qlnv-container">
      
      <h2 className="qlnv-main-title">👥 HỆ THỐNG QUẢN LÝ NHÂN VIÊN</h2>
      
      <div className="qlnv-header-row">
        <h3 style={{ margin: 0, color: '#1e293b' }}>📋 DANH SÁCH NHÂN VIÊN ({loading ? '...' : danhSachNV.length} người)</h3>
        <button onClick={() => xuLyMoForm('add')} className="qlnv-btn-add-new">
          ➕ Thêm Nhân Viên Mới
        </button>
      </div>

      <div className="qlnv-table-card">
        <div className="qlnv-table-wrapper">
          <table className="qlnv-table">
            <thead>
              <tr>
                <th>Họ và Tên</th>
                <th>Số điện thoại</th>
                <th>Số ngày đã làm</th>
                <th style={{ textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    🔄 Đang quét danh sách nhân viên từ database...
                  </td>
                </tr>
              ) : danhSachNV.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Chưa có nhân viên nào trong cơ sở dữ liệu.
                  </td>
                </tr>
              ) : (
                danhSachNV.map((nv) => (
                  <tr key={nv._id}>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{nv.full_name}</td>
                    <td style={{ color: '#475569' }}>{nv.phone || 'Chưa có SĐT'}</td>
                    <td>
                      <span className="qlnv-badge-attendance">
                        {nv.attendance ? nv.attendance.length : 0} ngày công
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => xuLyMoForm('view', nv)} className="qlnv-btn-view">🔍 Chi tiết</button>
                        <button onClick={() => xuLyMoForm('edit', nv)} className="qlnv-btn-edit">✏️ Sửa</button>
                        <button onClick={() => kichHoatHoiXoa(nv._id, nv.full_name)} className="qlnv-btn-delete">🗑️ Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Cửa sổ Xem/Thêm/Sửa thông tin --- */}
      {isModalOpen && (
        <div className="qlnv-modal-overlay">
          <div className="qlnv-modal-box-custom">
            <span onClick={() => setIsModalOpen(false)} className="qlnv-close-modal-x">&times;</span>
            
            {modalMode === 'view' && selectedUser && (
              <div>
                <h3 style={{ margin: '0 0 15px 0', color: '#2563eb', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>📋 Hồ Sơ Lý Lịch Nhân Viên</h3>
                <div className="qlnv-view-details-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <p><strong>Tên tài khoản:</strong> {selectedUser.username || 'Chưa thiết lập'}</p>
                  <p><strong>Họ tên:</strong> {selectedUser.full_name}</p>
                  <p><strong>Giới tính:</strong> {selectedUser.gender}</p>
                  <p><strong>Ngày sinh:</strong> {selectedUser.birthday ? new Date(selectedUser.birthday).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
                  <p><strong>Số CCCD:</strong> {selectedUser.cccd || 'Chưa cập nhật'}</p>
                  <p><strong>Tài khoản Email:</strong> {selectedUser.email}</p>
                  <p><strong>Số điện thoại:</strong> {selectedUser.phone || 'Chưa cập nhật'}</p>
                  <p><strong>Mức lương/giờ:</strong> {selectedUser.base_salary ? selectedUser.base_salary.toLocaleString('vi-VN') : '25.000'} đ/giờ</p>
                  <p><strong>Trạng thái hoạt động:</strong> {selectedUser.is_active ? '🟢 Đang đi làm' : '🔴 Tài khoản bị khóa'}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} style={{ width: '100%', padding: '10px', background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Đóng lại</button>
              </div>
            )}

            {(modalMode === 'add' || modalMode === 'edit') && (
              <form onSubmit={handleSubmitForm} autoComplete="off" noValidate>
                
                {/* 🚀 BẪY CHROME: Đánh lạc hướng tính năng tự động điền thông tin tài khoản */}
                <div style={{ position: 'absolute', opacity: 0, zIndex: -1, height: 0, overflow: 'hidden' }}>
                  <input type="text" name="chrome_fake_user" autoComplete="username" tabIndex="-1" />
                  <input type="password" name="chrome_fake_pass" autoComplete="current-password" tabIndex="-1" />
                </div>

                <h3 style={{ margin: '0 0 15px 0', color: '#059669', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                  {modalMode === 'add' ? '➕ Thêm Nhân Viên Mới' : '✏️ Chỉnh Sửa Thông Tin'}
                </h3>
                
                {/* TÊN ĐĂNG NHẬP */}
                <div className="qlnv-form-group">
                  <label className="qlnv-form-label">Tên đăng nhập (Username):</label>
                  <div className="auth-input-wrap">
                    <input 
                      type="text" 
                      required 
                      disabled={modalMode === 'edit'} 
                      placeholder="Ví dụ: nguyenvana"
                      value={formData.username} 
                      autoComplete="new-password"
                      onChange={(e) => setFormData({...formData, username: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="qlnv-form-row" style={{ display: 'flex', gap: '12px' }}>
                  {/* HỌ TÊN */}
                  <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                    <label className="qlnv-form-label">Họ tên:</label>
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
                  {/* GIỚI TÍNH */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label className="qlnv-form-label">Giới tính:</label>
                    <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="qlnv-input" style={{ height: '44px', borderRadius: '14px' }}>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="qlnv-form-row" style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  {/* NGÀY SINH */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label className="qlnv-form-label">Ngày sinh:</label>
                    <div className="auth-input-wrap">
                      <input 
                        type="date" 
                        value={formData.birthday} 
                        onChange={(e) => setFormData({...formData, birthday: e.target.value})} 
                      />
                    </div>
                  </div>
                  {/* SỐ CCCD */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label className="qlnv-form-label">Số CCCD:</label>
                    <div className="auth-input-wrap">
                      <input 
                        type="text" 
                        value={formData.cccd} 
                        autoComplete="new-password"
                        onChange={(e) => setFormData({...formData, cccd: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>

                {/* EMAIL */}
                <div className="qlnv-form-group" style={{ marginTop: '10px' }}>
                  <label className="qlnv-form-label">Email liên hệ:</label>
                  <div className="auth-input-wrap">
                    <input 
                      type="email" 
                      required 
                      value={formData.email} 
                      autoComplete="new-password"
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    />
                  </div>
                </div>

                {/* SỐ ĐIỆN THOẠI */}
                <div className="qlnv-form-group">
                  <label className="qlnv-form-label">Số điện thoại:</label>
                  <div className="auth-input-wrap">
                    <input 
                      type="text" 
                      value={formData.phone} 
                      autoComplete="new-password"
                      onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    />
                  </div>
                </div>

                {/* MẬT KHẨU */}
                <div className="qlnv-form-group">
                  <label className="qlnv-form-label">Mật khẩu {modalMode === 'edit' && '(Bỏ trống nếu giữ nguyên)'}:</label>
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

                {/* MỨC LƯƠNG */}
                <div className="qlnv-form-group">
                  <label className="qlnv-form-label">Mức lương/giờ (đ):</label>
                  <div className="auth-input-wrap">
                    <input 
                      type="number" 
                      step="1000" 
                      value={formData.base_salary} 
                      onChange={(e) => setFormData({...formData, base_salary: Number(e.target.value)})} 
                    />
                  </div>
                </div>

                <div className="qlnv-checkbox-group" style={{ marginTop: '12px' }}>
                  <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} /> 
                  <label htmlFor="is_active" style={{fontWeight: 'bold', color: '#1e293b', cursor: 'pointer'}}>Kích hoạt trạng thái hoạt động</label>
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

      {/* --- Cửa sổ Xác Nhận Xóa --- */}
      {moXoaModal && (
        <div className="qlnv-modal-overlay">
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', maxWidth: '450px', width: '100%' }}>
            <h3 style={{ color: '#ef4444', margin: '0 0 12px 0' }}>⚠️ XÁC NHẬN XÓA NHÂN VIÊN</h3>
            <p style={{ color: '#475569', lineHeight: '1.5', marginBottom: '20px' }}>
              Bạn có chắc chắn muốn xóa hoàn toàn nhân viên <strong style={{ color: '#ef4444' }}>{nvCanXoa?.name}</strong> khỏi hệ thống không? Dữ liệu lịch sử chấm công của người này cũng sẽ bị mất!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setMoXoaModal(false); setNvCanXoa(null); }} style={{ padding: '8px 16px', background: '#cbd5e1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Hủy (Giữ lại)</button>
              <button onClick={handleXacNhanXoaChinhThuc} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Vẫn Xóa</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
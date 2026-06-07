import { useState, useEffect } from 'react';
import '../css/quantri/QuanLyNhanVien.css'; // Tái sử dụng file CSS để giao diện đồng bộ

const API_URL = import.meta.env.VITE_API_URL;

export default function QuanLyShipper() {
  const [danhSachShipper, setDanhSachShipper] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); 
  const [selectedShipper, setSelectedShipper] = useState(null);

  const [moXoaModal, setMoXoaModal] = useState(false);
  const [shipperCanXoa, setShipperCanXoa] = useState(null);

  // 🎯 ĐÃ ĐỔI: Mặc định role_id = 4 dành riêng cho Shipper khi tạo mới
  const [formData, setFormData] = useState({
    username: '', full_name: '', email: '', phone: '', password: '',
    cccd: '', birthday: '', gender: 'Nam', role_id: 4,      
    base_salary: 25000, is_active: true
  });

  // 🎯 ĐÃ ĐỔI: Gửi kèm query ?role=4 để Backend nhận biết lọc danh sách shipper
  const fetchShipper = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/quantri/qt_shipper/all?role=4`);
      const result = await response.json();
      
      if (result.success) {
        setDanhSachShipper(result.data);
      } else {
        alert(result.message || 'Không thể lấy danh sách shipper');
      }
    } catch (error) {
      console.error("Lỗi fetch danh sách shipper:", error);
      alert('Không thể kết nối đến máy chủ Backend!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipper();                                
  }, []);

  const xuLyMoForm = (mode, shipper = null) => {
    setModalMode(mode);
    setSelectedShipper(shipper);
    if (shipper) {
      setFormData({
        username: shipper.username || '', 
        full_name: shipper.full_name || '',
        email: shipper.email || '',
        phone: shipper.phone || '',
        password: '',
        cccd: shipper.cccd || '',
        birthday: shipper.birthday ? shipper.birthday.substring(0, 10) : '',
        gender: shipper.gender || 'Nam',
        role_id: 4, // Ép cố định quyền Shipper khi cập nhật
        base_salary: shipper.base_salary || 25000,
        is_active: shipper.is_active !== undefined ? shipper.is_active : true
      });
    } else {
      setFormData({ username: '', full_name: '', email: '', phone: '', password: '', cccd: '', birthday: '', gender: 'Nam', role_id: 4, base_salary: 25000, is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      let url = `${API_URL}/api/quantri/qt_shipper/add`;
      let method = 'POST';

      if (modalMode === 'edit' && selectedShipper) {
        url = `${API_URL}/api/quantri/qt_shipper/update/${selectedShipper._id}`;
        method = 'PUT';
      }

      // Luôn đảm bảo role_id gửi lên backend là quyền shipper (4)
      const dataToSubmit = { ...formData, role_id: 4 };

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit)
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setIsModalOpen(false);
        fetchShipper(); 
      } else {
        alert(`${result.message}\nChi tiết lỗi từ Database: ${result.error || JSON.stringify(result)}`);
      }
    } catch (error) {
      alert('Lỗi kết nối mạng!');
    }
  };

  const kichHoatHoiXoa = (id, name) => {
    setShipperCanXoa({ id, name });
    setMoXoaModal(true);
  };

  const handleXacNhanXoaChinhThuc = async () => {
    if (!shipperCanXoa) return;
    try {
      const response = await fetch(`${API_URL}/api/quantri/qt_shipper/delete/${shipperCanXoa.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setDanhSachShipper(danhSachShipper.filter(item => item._id !== shipperCanXoa.id));
      } else {
        alert(result.message || 'Xóa shipper thất bại!');
      }
    } catch (error) {
      alert('Không thể kết nối máy chủ!');
    } finally {
      setMoXoaModal(false);
      setShipperCanXoa(null);
    }
  };

  return (
    <div className="qlnv-container">
      
      <h2 className="qlnv-main-title">🏍️ HỆ THỐNG QUẢN LÝ SHIPPER / TÀI XẾ</h2>
      
      <div className="qlnv-header-row">
        <h3 style={{ margin: 0, color: '#1e293b' }}>📋 DANH SÁCH SHIPPER ({loading ? '...' : danhSachShipper.length} tài xế)</h3>
        <button onClick={() => xuLyMoForm('add')} className="qlnv-btn-add-new" style={{ background: '#2563eb' }}>
          ➕ Thêm Shipper Mới
        </button>
      </div>

      <div className="qlnv-table-card">
        <div className="qlnv-table-wrapper">
          <table className="qlnv-table">
            <thead>
              <tr>
                <th>Họ và Tên Tài Xế</th>
                <th>Số điện thoại</th>
                <th>Mức lương/giờ</th>
                <th style={{ textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    🔄 Đang quét danh sách shipper từ database...
                  </td>
                </tr>
              ) : danhSachShipper.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Chưa có nhân viên giao hàng (shipper) nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                danhSachShipper.map((shipper) => (
                  <tr key={shipper._id}>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{shipper.full_name}</td>
                    <td style={{ color: '#475569' }}>{shipper.phone || 'Chưa có SĐT'}</td>
                    <td>
                      <span className="qlnv-badge-attendance" style={{ background: '#eff6ff', color: '#2563eb' }}>
                        {shipper.base_salary ? shipper.base_salary.toLocaleString('vi-VN') : '25.000'} đ/giờ
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => xuLyMoForm('view', shipper)} className="qlnv-btn-view">🔍 Chi tiết</button>
                        <button onClick={() => xuLyMoForm('edit', shipper)} className="qlnv-btn-edit">✏️ Sửa</button>
                        <button onClick={() => kichHoatHoiXoa(shipper._id, shipper.full_name)} className="qlnv-btn-delete">🗑️ Xóa</button>
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
            
            {modalMode === 'view' && selectedShipper && (
              <div>
                <h3 style={{ margin: '0 0 15px 0', color: '#2563eb', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>📋 Hồ Sơ Lý Lịch Shipper</h3>
                <div className="qlnv-view-details-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <p><strong>Tên tài khoản:</strong> {selectedShipper.username || 'Chưa thiết lập'}</p>
                  <p><strong>Họ tên shipper:</strong> {selectedShipper.full_name}</p>
                  <p><strong>Giới tính:</strong> {selectedShipper.gender}</p>
                  <p><strong>Ngày sinh:</strong> {selectedShipper.birthday ? new Date(selectedShipper.birthday).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
                  <p><strong>Số CCCD:</strong> {selectedShipper.cccd || 'Chưa cập nhật'}</p>
                  <p><strong>Tài khoản Email:</strong> {selectedShipper.email}</p>
                  <p><strong>Số điện thoại:</strong> {selectedShipper.phone || 'Chưa cập nhật'}</p>
                  <p><strong>Mức lương chạy đơn/giờ:</strong> {selectedShipper.base_salary ? selectedShipper.base_salary.toLocaleString('vi-VN') : '25.000'} đ/giờ</p>
                  <p><strong>Trạng thái hoạt động:</strong> {selectedShipper.is_active ? '🟢 Đang trực nhận đơn' : '🔴 Tài khoản bị khóa'}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} style={{ width: '100%', padding: '10px', background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Đóng lại</button>
              </div>
            )}

            {(modalMode === 'add' || modalMode === 'edit') && (
              <form onSubmit={handleSubmitForm} autoComplete="off" noValidate>
                
                {/* 🚀 BẪY CHROME: Tránh việc trình duyệt tự động điền thông tin */}
                <div style={{ position: 'absolute', opacity: 0, zIndex: -1, height: 0, overflow: 'hidden' }}>
                  <input type="text" name="chrome_fake_user" autoComplete="username" tabIndex="-1" />
                  <input type="password" name="chrome_fake_pass" autoComplete="current-password" tabIndex="-1" />
                </div>

                <h3 style={{ margin: '0 0 15px 0', color: '#2563eb', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                  {modalMode === 'add' ? '➕ Thêm Shipper Mới' : '✏️ Chỉnh Sửa Thông Tin Tài Xế'}
                </h3>
                
                {/* TÊN ĐĂNG NHẬP */}
                <div className="qlnv-form-group">
                  <label className="qlnv-form-label">Tên đăng nhập (Username):</label>
                  <div className="auth-input-wrap">
                    <input 
                      type="text" 
                      required 
                      disabled={modalMode === 'edit'} 
                      placeholder="Ví dụ: shippernam"
                      value={formData.username} 
                      autoComplete="new-password"
                      onChange={(e) => setFormData({...formData, username: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="qlnv-form-row" style={{ display: 'flex', gap: '12px' }}>
                  {/* HỌ TÊN */}
                  <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                    <label className="qlnv-form-label">Họ tên tài xế:</label>
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
                  <label className="qlnv-form-label">Mức lương cơ bản/giờ (đ):</label>
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
                  <label htmlFor="is_active" style={{fontWeight: 'bold', color: '#1e293b', cursor: 'pointer'}}>Kích hoạt trạng thái nhận đơn</label>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 16px', background: '#cbd5e1', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#334155', fontWeight: '600' }}>Hủy bỏ</button>
                  <button type="submit" style={{ padding: '10px 16px', background: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: '600' }}>Lưu thông tin</button>
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
            <h3 style={{ color: '#ef4444', margin: '0 0 12px 0' }}>⚠️ XÁC NHẬN XÓA TÀI XẾ</h3>
            <p style={{ color: '#475569', lineHeight: '1.5', marginBottom: '20px' }}>
              Bạn có chắc chắn muốn xóa hoàn toàn tài xế <strong style={{ color: '#ef4444' }}>{shipperCanXoa?.name}</strong> khỏi hệ thống không? Các dữ liệu đơn hàng liên quan có thể bị ảnh hưởng!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setMoXoaModal(false); setShipperCanXoa(null); }} style={{ padding: '8px 16px', background: '#cbd5e1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Hủy (Giữ lại)</button>
              <button onClick={handleXacNhanXoaChinhThuc} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Vẫn Xóa</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
import { useState, useEffect } from 'react';
import '../css/quantri/QuanLyNhanVien.css'; 

const API_URL = import.meta.env.VITE_API_URL;

export default function QuanLyNhanVien() {
  const [danhSachNV, setDanhSachNV] = useState([]);
  const [danhSachChiNhanh, setDanhSachChiNhanh] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('view'); 
  const [selectedUser, setSelectedUser] = useState(null);

  const [moXoaModal, setMoXoaModal] = useState(false);
  const [nvCanXoa, setNvCanXoa] = useState(null);

  // 🔔 State quản lý Toast thông báo góc trên bên phải
  const [toast, setToast] = useState({ hienThi: false, message: '', type: 'success' });

  // Hàm kích hoạt hiển thị Toast và tự động đóng sau 4 giây
  const hienThongBao = (message, type = 'success') => {
    setToast({ hienThi: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, hienThi: false }));
    }, 4000);
  };

  const [formData, setFormData] = useState({
    username: '', full_name: '', email: '', phone: '', password: '',
    cccd: '', birthday: '', gender: 'Nam', role_id: 2,      
    base_salary: 25000, is_active: true, branch_id: ''
  });

  // Hàm hiển thị tên chức vụ dựa trên mã role_id
  const hienThiChucVu = (role_id) => {
    if (role_id === 2) return <span style={{ color: '#2563eb', fontWeight: 'bold' }}>💼 Nhân viên</span>;
    if (role_id === 4) return <span style={{ color: '#d97706', fontWeight: 'bold' }}>🏍️ Shipper</span>;
    return <span style={{ color: '#64748b' }}>Khác</span>;
  };

  // Fetch danh sách các chi nhánh từ bảng ShippingConfig
  const fetchChiNhanh = async () => {
    try {
      const response = await fetch(`${API_URL}/api/quantri/qt_nhanvien/nhanvienchinhanh/all`); 
      const result = await response.json();
      if (result.success || Array.isArray(result)) {
        setDanhSachChiNhanh(result.data || result);
      }
    } catch (error) {
      console.error("Lỗi fetch danh sách chi nhánh:", error);
    }
  };

  const fetchNhanVien = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/quantri/qt_nhanvien/all`);
      const result = await response.json();
      
      if (result.success) {
        setDanhSachNV(result.data);
      } else {
        hienThongBao(result.message || 'Không thể lấy danh sách nhân sự', 'error');
      }
    } catch (error) {
      console.error("Lỗi fetch danh sách:", error);
      hienThongBao('Không thể kết nối đến máy chủ Backend!', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNhanVien(); 
    fetchChiNhanh();                                                             
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
        password: '', // Luôn để trống trường mật khẩu khi mở form sửa để bảo mật
        cccd: user.cccd || '',
        birthday: user.birthday ? user.birthday.substring(0, 10) : '',
        gender: user.gender || 'Nam',
        role_id: user.role_id || 2, 
        base_salary: user.base_salary || 25000,
        is_active: user.is_active !== undefined ? user.is_active : true,
        branch_id: user.branch_id?._id || user.branch_id || ''
      });
    } else {
      setFormData({ 
        username: '', full_name: '', email: '', phone: '', password: '', 
        cccd: '', birthday: '', gender: 'Nam', role_id: 2, base_salary: 25000, 
        is_active: true, branch_id: '' 
      });
    }
    setIsModalOpen(true);
  };

  // 🔥 TẦNG KIỂM TRA VÀ XỬ LÝ ĐẦU VÀO FORM (VALIDATION)
  const handleSubmitForm = async (e) => {
    e.preventDefault();

    // 1. Kiểm tra các trường bắt buộc không được bỏ trống
    if (!formData.username.trim()) return hienThongBao('Tên đăng nhập không được bỏ trống!', 'error');
    if (!formData.full_name.trim()) return hienThongBao('Họ và tên không được bỏ trống!', 'error');
    if (!formData.email.trim()) return hienThongBao('Email không được bỏ trống!', 'error');
    if (!formData.phone.trim()) return hienThongBao('Số điện thoại không được bỏ trống!', 'error');

    // 2. Validate Username
    const regexUsername = /^[a-z0-9_]{4,20}$/;
    if (!regexUsername.test(formData.username.trim())) {
      return hienThongBao('Username từ 4-20 ký tự, chỉ gồm chữ thường, số và dấu gạch dưới (_), không khoảng trắng!', 'error');
    }

    // 3. Validate Họ Tên
    const regexFullName = /^[\p{L}\s]+$/u;
    if (!regexFullName.test(formData.full_name.trim())) {
      return hienThongBao('Họ và tên chỉ được chứa chữ cái văn bản và khoảng trắng!', 'error');
    }

    // 4. Validate Email chuẩn công nghệ
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regexEmail.test(formData.email.trim())) {
      return hienThongBao('Định dạng địa chỉ Email không hợp lệ!', 'error');
    }

    // 5. Validate Số điện thoại VN
    const regexPhone = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!regexPhone.test(formData.phone.trim())) {
      return hienThongBao('Số điện thoại không hợp lệ (Phải gồm 10 số và bắt đầu bằng đầu số VN như 03, 05, 07, 08, 09)!', 'error');
    }

    // 🛠️ 6. VALIDATE ĐỘ TUỔI (Từ 18 tuổi trở lên đến DƯỚI 50 tuổi)
    if (!formData.birthday) {
      return hienThongBao('Vui lòng chọn ngày tháng năm sinh!', 'error');
    }
    
    const ngayHienTai = new Date();
    const ngaySinhUser = new Date(formData.birthday);
    
    // Tính số tuổi tạm thời dựa trên năm
    let tinhTuoi = ngayHienTai.getFullYear() - ngaySinhUser.getFullYear();
    const thangThucTe = ngayHienTai.getMonth() - ngaySinhUser.getMonth();
    
    // Khấu trừ 1 tuổi nếu chưa đến tháng sinh hoặc chưa qua ngày sinh trong tháng hiện tại
    if (thangThucTe < 0 || (thangThucTe === 0 && ngayHienTai.getDate() < ngaySinhUser.getDate())) {
      tinhTuoi--;
    }

    // Chốt chặn điều kiện: tuổi từ 18 và phải nhỏ hơn 50 (dưới 50 tuổi)
    if (tinhTuoi < 18 || tinhTuoi >= 50) {
      return hienThongBao(`Độ tuổi hiện tại là ${tinhTuoi} tuổi. Hệ thống yêu cầu nhân sự phải từ 18 tuổi đến dưới 50 tuổi!`, 'error');
    }

    // 7. Validate Căn cước công dân
    if (formData.cccd.trim() && !/^\d{12}$/.test(formData.cccd.trim())) {
      return hienThongBao('Mã số CCCD phải bao gồm chính xác 12 chữ số!', 'error');
    }

    // 8. Validate Mật khẩu
    const regexMatKhauManh = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    
    if (modalMode === 'add') {
      if (!formData.password) {
        return hienThongBao('Vui lòng thiết lập mật khẩu cho tài khoản mới!', 'error');
      }
      if (!regexMatKhauManh.test(formData.password)) {
        return hienThongBao('Mật khẩu mới phải từ 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt!', 'error');
      }
    } else if (modalMode === 'edit' && formData.password.length > 0) {
      if (!regexMatKhauManh.test(formData.password)) {
        return hienThongBao('Mật khẩu chỉnh sửa phải từ 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt!', 'error');
      }
    }

    // 9. Validate Lương cơ bản
    if (Number(formData.base_salary) <= 0) {
      return hienThongBao('Mức lương làm việc theo giờ phải lớn hơn 0 đ!', 'error');
    }

    // Gửi API lên Server sau khi tất cả validation vượt qua thành công
    try {
      let url = `${API_URL}/api/quantri/qt_nhanvien/add`;
      let method = 'POST';

      if (modalMode === 'edit' && selectedUser) {
        url = `${API_URL}/api/quantri/qt_nhanvien/update/${selectedUser._id}`;
        method = 'PUT';
      }

      const payload = {
        ...formData,
        username: formData.username.trim(),
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        cccd: formData.cccd.trim() || null,
        branch_id: formData.branch_id === '' ? null : formData.branch_id
      };

      if (modalMode === 'edit' && !formData.password) {
        delete payload.password;
      }

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.success) {
        hienThongBao(result.message, 'success');
        setIsModalOpen(false);
        fetchNhanVien(); 
      } else {
        hienThongBao(result.message || 'Thao tác thất bại!', 'error');
      }
    } catch (error) {
      hienThongBao('Lỗi kết nối mạng đến máy chủ!', 'error');
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
        hienThongBao(result.message, 'success');
        setDanhSachNV(danhSachNV.filter(item => item._id !== nvCanXoa.id));
      } else {
        hienThongBao(result.message || 'Xóa thất bại!', 'error');
      }
    } catch (error) {
      hienThongBao('Không thể kết nối máy chủ!', 'error');
    } finally {
      setMoXoaModal(false);
      setNvCanXoa(null);
    }
  };

  return (
    <div className="qlnv-container" style={{ position: 'relative' }}>
      
      {/* 🔔 UI TOAST THÔNG BÁO XUẤT HIỆN GÓC TRÊN BÊN PHẢI */}
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
          animation: 'slideInNhanVien 0.3s ease-out'
        }}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
          <span 
            onClick={() => setToast(p => ({ ...p, hienThi: false }))} 
            style={{ marginLeft: '15px', cursor: 'pointer', opacity: 0.7, fontSize: '18px' }}
          >
            &times;
          </span>
        </div>
      )}

      <style>{`
        @keyframes slideInNhanVien {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      
      <h2 className="qlnv-main-title">👥 HỆ THỐNG QUẢN LÝ NHÂN SỰ & SHIPPER</h2>
      
      <div className="qlnv-header-row">
        <h3 style={{ margin: 0, color: '#1e293b' }}>📋 DANH SÁCH THÀNH VIÊN ({loading ? '...' : danhSachNV.length} người)</h3>
        <button onClick={() => xuLyMoForm('add')} className="qlnv-btn-add-new">
          ➕ Thêm Nhân Sự/Shipper Mới
        </button>
      </div>

      <div className="qlnv-table-card">
        <div className="qlnv-table-wrapper">
          <table className="qlnv-table">
            <thead>
              <tr>
                <th>Họ và Tên</th>
                <th>Chức vụ</th>
                <th>Cơ sở làm việc</th> 
                <th>Số điện thoại</th>
                <th>Email</th>
                <th style={{ textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    🔄 Đang quét danh sách nhân sự từ database...
                  </td>
                </tr>
              ) : danhSachNV.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Chưa có nhân viên hoặc shipper nào trong cơ sở dữ liệu.
                  </td>
                </tr>
              ) : (
                danhSachNV.map((nv) => (
                  <tr key={nv._id}>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{nv.full_name}</td>
                    <td>{hienThiChucVu(nv.role_id)}</td>
                    <td style={{ fontWeight: '500' }}>
                      {nv.branch_id?.branch_name ? (
                        <span style={{ color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '20px', fontSize: '13px' }}>
                          📍 {nv.branch_id.branch_name}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>
                          🚫 Chưa phân phối
                        </span>
                      )}
                    </td>
                    <td style={{ color: '#475569' }}>{nv.phone || 'Chưa có SĐT'}</td>
                    <td>
                      <span className="qlnv-badge-attendance">
                        {nv.email ? nv.email : 'Chưa có email'}
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
                <h3 style={{ margin: '0 0 15px 0', color: '#2563eb', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>📋 Hồ Sơ Lý Lịch Chi Tiết</h3>
                <div className="qlnv-view-details-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <p><strong>Tên tài khoản:</strong> {selectedUser.username || 'Chưa thiết lập'}</p>
                  <p><strong>Họ tên:</strong> {selectedUser.full_name}</p>
                  <p><strong>Chức vụ:</strong> {hienThiChucVu(selectedUser.role_id)}</p>
                  <p><strong>Cơ sở trực thuộc:</strong> {selectedUser.branch_id?.branch_name ? `📍 ${selectedUser.branch_id.branch_name} (${selectedUser.branch_id.shop_address})` : '🚫 Chưa phân phối chi nhánh (Tự do)'}</p>
                  <p><strong>Giới tính:</strong> {selectedUser.gender}</p>
                  <p><strong>Ngày sinh:</strong> {selectedUser.birthday ? new Date(selectedUser.birthday).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
                  <p><strong>Số CCCD:</strong> {selectedUser.cccd || 'Chưa cập nhật'}</p>
                  <p><strong>Tài khoản Email:</strong> {selectedUser.email}</p>
                  <p><strong>Số điện thoại:</strong> {selectedUser.phone || 'Chưa cập nhật'}</p>
                  <p><strong>Mức lương/giờ:</strong> {selectedUser.base_salary ? selectedUser.base_salary.toLocaleString('vi-VN') : '25.000'} đ/giờ</p>
                  <p><strong>Trạng thái hoạt động:</strong> {selectedUser.is_active ? '🟢 Đang hoạt động' : '🔴 Tài khoản bị khóa'}</p>
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
                  {modalMode === 'add' ? '➕ Thêm Thành Viên Mới' : '✏️ Chỉnh Sửa Thông Tin'}
                </h3>
                
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
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label className="qlnv-form-label" style={{ fontWeight: 'bold', color: '#2563eb' }}>Chức vụ hệ thống:</label>
                    <select 
                      value={formData.role_id} 
                      onChange={(e) => setFormData({...formData, role_id: Number(e.target.value)})} 
                      className="qlnv-input" 
                      style={{ height: '44px', borderRadius: '14px', border: '2px solid #2563eb', fontWeight: '600' }}
                    >
                      <option value={2}>💼 Nhân viên quầy</option>
                      <option value={4}>🏍️ Nhân viên giao hàng</option>
                    </select>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label className="qlnv-form-label" style={{ fontWeight: 'bold', color: '#059669' }}>Cơ sở phân công:</label>
                    <select 
                      value={formData.branch_id} 
                      onChange={(e) => setFormData({...formData, branch_id: e.target.value})} 
                      className="qlnv-input" 
                      style={{ height: '44px', borderRadius: '14px', border: '2px solid #059669', fontWeight: '600' }}
                    >
                      <option value="">🚫 Không phân phối (Tự do/Toàn hệ thống)</option>
                      {danhSachChiNhanh.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          📍 {branch.branch_name} ({branch.shop_address})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="qlnv-form-row" style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Yêu cầu tuổi hiển thị trực tiếp trên Label để người quản trị chú ý */}
                    <label className="qlnv-form-label">Ngày sinh (Yêu cầu từ 18 đến dưới 50 tuổi):</label>
                    <div className="auth-input-wrap">
                      <input 
                        type="date" 
                        value={formData.birthday} 
                        onChange={(e) => setFormData({...formData, birthday: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label className="qlnv-form-label">Số CCCD:</label>
                    <div className="auth-input-wrap">
                      <input 
                        type="text" 
                        placeholder="Nhập 12 số định danh"
                        value={formData.cccd} 
                        autoComplete="new-password"
                        onChange={(e) => setFormData({...formData, cccd: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>

                <div className="qlnv-form-row" style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label className="qlnv-form-label">Email liên hệ:</label>
                    <div className="auth-input-wrap">
                      <input 
                        type="email" 
                        required 
                        placeholder="example@gmail.com"
                        value={formData.email} 
                        autoComplete="new-password"
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label className="qlnv-form-label">Số điện thoại:</label>
                    <div className="auth-input-wrap">
                      <input 
                        type="text" 
                        placeholder="Ví dụ: 0912345678"
                        value={formData.phone} 
                        autoComplete="new-password"
                        onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>

                <div className="qlnv-form-group" style={{ marginTop: '10px' }}>
                  <label className="qlnv-form-label">Mật khẩu {modalMode === 'edit' && '(Bỏ trống nếu giữ nguyên)'}:</label>
                  <div className="auth-input-wrap">
                    <input 
                      type="password" 
                      required={modalMode === 'add'} 
                      placeholder={modalMode === 'add' ? "Tối thiểu 8 ký tự, có viết hoa, số, ký tự đặc biệt" : "••••••••"}
                      value={formData.password} 
                      autoComplete="new-password"
                      onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    />
                  </div>
                </div>

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
            <h3 style={{ color: '#ef4444', margin: '0 0 12px 0' }}>⚠️ XÁC NHẬN XÓA TÀI KHOẢN</h3>
            <p style={{ color: '#475569', lineHeight: '1.5', marginBottom: '20px' }}>
              Bạn có chắc chắn muốn xóa hoàn toàn dữ liệu của <strong style={{ color: '#ef4444' }}>{nvCanXoa?.name}</strong> khỏi hệ thống không? Hành động này không thể hoàn tác!
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
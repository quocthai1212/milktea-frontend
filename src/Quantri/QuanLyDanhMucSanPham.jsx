import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import QuanLySanPham from './QuanLySanPham'; 
import '../css/quantri/QuanLyDanhMucSanPham.css';

const QuanLyDanhMucSanPham = () => {
  const [viewMode, setViewMode] = useState('list'); 
  const [selectedCategory, setSelectedCategory] = useState({ id: null, name: '' });

  const [danhSachDM, setDanhSachDM] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hienForm, setHienForm] = useState(false);
  const [dangSuaId, setDangSuaId] = useState(null);
  const [moXoaModal, setMoXoaModal] = useState(false);
  const [dmCanXoa, setDmCanXoa] = useState(null);

  const [formData, setFormData] = useState({ category_name: '', description: '', is_active: true });
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
      const res = await fetch(`${API_URL}/api/quantri/danhmucsanpham/all`);
      const data = await res.json();
      if (data.success) setDanhSachDM(data.data);
    } catch (err) {
      showToast('❌ Không thể tải danh mục sản phẩm!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (id, name) => {
    setSelectedCategory({ id, name });
    setViewMode('products');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const url = dangSuaId 
      ? `${API_URL}/api/quantri/danhmucsanpham/update/${dangSuaId}` 
      : `${API_URL}/api/quantri/danhmucsanpham/add`;
    const method = dangSuaId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        showToast(dangSuaId ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục mới thành công!', 'success');
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

  const handleEditClick = (dm) => {
    setDangSuaId(dm._id);
    setFormData({ category_name: dm.category_name, description: dm.description || '', is_active: dm.is_active });
    setHienForm(true);
  };

  const handleResetForm = () => {
    setDangSuaId(null);
    setFormData({ category_name: '', description: '', is_active: true });
  };

  if (viewMode === 'products') {
    return (
      <div className="qldm-nested-wrapper">
        <button className="qldm-btn-back" onClick={() => setViewMode('list')}>
          <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Quay lại danh mục
        </button>
        
        <QuanLySanPham 
          categoryId={selectedCategory.id} 
          categoryName={selectedCategory.name} 
          danhSachDM={danhSachDM} 
        />
      </div>
    );
  }

  return (
    <div className="qldm-container">
      {toast.show && (
        <div className={`qldm-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="qldm-header-row">
        <div className="qldm-title-block">
          <h2 className="qldm-main-title">🧋 QUẢN LÝ DANH MỤC SẢN PHẨM</h2>
          <p className="qldm-sub-title">Nhấp vào tên danh mục để quản lý các món nước nằm bên trong nhóm đó.</p>
        </div>
        <button className="qldm-btn-add-new" onClick={() => { handleResetForm(); setHienForm(true); }}>
          <Plus size={16} style={{ marginRight: '6px' }} /> Thêm Danh Mục Mới
        </button>
      </div>

      {hienForm && (
        <div className="qldm-modal-overlay">
          <div className="qldm-modal-box-custom">
            <span className="qldm-close-modal-x" onClick={() => { handleResetForm(); setHienForm(false); }}>&times;</span>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>
              {dangSuaId ? '✏️ CẬP NHẬT DANH MỤC' : '➕ THÊM DANH MỤC MỚI'}
            </h3>
            <form onSubmit={handleSaveCategory} autoComplete="off" noValidate>
              
              <div style={{ position: 'absolute', opacity: 0, zIndex: -1, height: 0, overflow: 'hidden' }}>
                <input type="text" name="chrome_fake_user" autoComplete="username" tabIndex="-1" />
                <input type="password" name="chrome_fake_pass" autoComplete="current-password" tabIndex="-1" />
              </div>

              <div className="qldm-form-group">
                <label className="qldm-form-label">Tên danh mục *</label>
                <div className="auth-input-wrap">
                  <input 
                    type="text" 
                    name="category_name" 
                    value={formData.category_name} 
                    onChange={handleInputChange} 
                    required 
                    autoComplete="new-password"
                    placeholder="VD: Trà Sữa, Cà Phê, Trà Trái Cây..."
                  />
                </div>
              </div>

              <div className="qldm-form-group">
                <label className="qldm-form-label">Mô tả ngắn</label>
                <div className="auth-input-wrap">
                  <input 
                    type="text" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    autoComplete="new-password"
                    placeholder="Ghi chú hiển thị kèm theo nhóm..."
                  />
                </div>
              </div>

              <div className="qldm-checkbox-group">
                <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                <label htmlFor="is_active" className="qldm-form-label" style={{ margin: 0, cursor: 'pointer' }}>Hiển thị công khai</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="qldm-btn-cancel" onClick={() => setHienForm(false)}>Hủy</button>
                <button type="submit" className="qldm-btn-submit">Lưu cấu hình</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="qldm-table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px' }}><Loader2 className="animate-spin inline" /> Đang tải...</div>
        ) : (
          <div className="qldm-table-wrapper">
            <table className="qldm-table">
              <thead>
                <tr>
                  <th>Tên Nhóm Danh Mục (Bấm vào để xem món)</th>
                  <th>Mô Tả Chi Tiết</th>
                  {/* 🌟 ĐÃ CẬP NHẬT: Đổi tiêu đề thành Số Lượng Món */}
                  <th style={{ width: '160px', textAlign: 'center' }}>🥤 Số Lượng Món</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ width: '180px', textAlign: 'center' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {danhSachDM.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                      Chưa có danh mục sản phẩm nào trên hệ thống.
                    </td>
                  </tr>
                ) : (
                  danhSachDM.map((dm) => (
                    <tr key={dm._id}>
                      <td className="qldm-clickable-name" onClick={() => handleCategoryClick(dm._id, dm.category_name)}>
                        📁 {dm.category_name}
                      </td>
                      <td>{dm.description || <em style={{ color: '#94a3b8' }}>Chưa có mô tả</em>}</td>
                      
                      {/* 🌟 ĐÃ CẬP NHẬT: Giao diện hiển thị số lượng món nước tương ứng */}
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          background: dm.product_count > 0 ? '#e0f2fe' : '#f1f5f9', 
                          color: dm.product_count > 0 ? '#0369a1' : '#64748b',
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          fontWeight: '700',
                          fontSize: '13px',
                          display: 'inline-block',
                          minWidth: '60px',
                          border: dm.product_count > 0 ? '1px solid #bae6fd' : '1px solid #e2e8f0'
                        }}>
                          {dm.product_count || 0} món
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <span className={`qldm-badge-status ${dm.is_active ? 'active' : 'hidden-status'}`}>
                          {dm.is_active ? 'Đang hoạt động' : 'Đang ẩn'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => handleEditClick(dm)} className="qldm-btn-edit" style={{ marginRight: '8px' }}>Sửa</button>
                        <button onClick={() => { setDmCanXoa({ id: dm._id, name: dm.category_name }); setMoXoaModal(true); }} className="qldm-btn-delete">Xóa</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {moXoaModal && (
        <div className="qldm-modal-overlay">
          <div className="qldm-modal-box-custom qldm-delete-box">
            <div style={{ display: 'flex', gap: '14px' }}>
              <div className="qldm-delete-icon-wrapper"><AlertTriangle size={22} color="#ef4444" /></div>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>Xác Nhận Xóa?</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Bạn có chắc muốn xóa danh mục <strong>"{dmCanXoa?.name}"</strong>? Hành động này không thể hoàn tác.</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button className="qldm-btn-cancel" onClick={() => setMoXoaModal(false)}>Hủy</button>
              <button className="qldm-btn-delete-confirm" onClick={async () => {
                try {
                  const res = await fetch(`${API_URL}/api/quantri/danhmucsanpham/delete/${dmCanXoa.id}`, { method: 'DELETE' });
                  const data = await res.json();
                  if (data.success) {
                    showToast('Xóa danh mục sản phẩm thành công!', 'success');
                  } else {
                    showToast(data.message || 'Lỗi khi xóa danh mục!', 'error');
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

export default QuanLyDanhMucSanPham;
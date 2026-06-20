import React, { useState, useEffect } from 'react';
import { Plus, Loader2, AlertTriangle, CheckCircle, Trash2, ListPlus, Sliders, Layers, Image, X } from 'lucide-react';
import '../css/quantri/QuanLySanPham.css'; 

const QuanLySanPham = ({ categoryId, categoryName, danhSachDM = [] }) => {
  const [danhSachSP, setDanhSachSP] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hienForm, setHienForm] = useState(false); 
  const [dangSuaId, setDangSuaId] = useState(null); 
  const [moXoaModal, setMoXoaModal] = useState(false);
  const [spCanXoa, setSpCanXoa] = useState(null); 

  const [formData, setFormData] = useState({
    product_name: '', 
    base_price: '', 
    category: categoryId, 
    description: '', 
    is_active: true,
    toppings: [],
    sizes: []
  });

  const [avatarFile, setAvatarFile] = useState(null); 
  const [avatarCu, setAvatarCu] = useState(''); // Lưu URL avatar cũ khi sửa
  const [imagesFiles, setImagesFiles] = useState([]); // Mảng lưu các file ảnh phụ MỚI chọn thêm
  const [danhSachAnhCu, setDanhSachAnhCu] = useState([]); // Mảng lưu các URL ảnh phụ CŨ từ backend

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const API_URL = import.meta.env.VITE_API_URL || '';

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    taiDanhSach();
    resetForm();
  }, [categoryId]);

  const resetForm = () => {
    setFormData({
      product_name: '',
      base_price: '',
      category: categoryId,
      description: '',
      is_active: true,
      toppings: [],
      sizes: []
    });
    setAvatarFile(null);
    setAvatarCu('');
    setImagesFiles([]);
    setDanhSachAnhCu([]);
    const avatarInput = document.getElementById('avatar-input');
    const imagesInput = document.getElementById('images-input');
    if (avatarInput) avatarInput.value = '';
    if (imagesInput) imagesInput.value = '';
  };

  const taiDanhSach = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/quantri/qt_sanpham/all`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("API sản phẩm trả về không phải JSON.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setDanhSachSP(data.data);
      }
    } catch (err) {
      console.error("Lỗi fetch sản phẩm:", err);
    } finally {
      setLoading(false);
    }
  };

  const layToppingDaCoSan = () => {
    const tatCaToppings = [];
    const checkGiaTriTrung = new Set();
    danhSachSP.forEach(sp => {
      if (sp.toppings && Array.isArray(sp.toppings)) {
        sp.toppings.forEach(tp => {
          const keyChuan = String(tp.topping_name).trim().toLowerCase();
          if (!checkGiaTriTrung.has(keyChuan) && tp.topping_name) {
            checkGiaTriTrung.add(keyChuan);
            tatCaToppings.push({ topping_name: tp.topping_name.trim(), price: tp.price || 0 });
          }
        });
      }
    });
    return tatCaToppings;
  };

  const toppingGoiYList = layToppingDaCoSan();
  const danhSachSPDaLoc = danhSachSP.filter(sp => {
    const spCatId = sp.category?._id || sp.category || sp.category_id?._id || sp.category_id;
    return String(spCatId) === String(categoryId);
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleImagesChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // Tính tổng số lượng ảnh gồm cả ảnh phụ cũ còn lại và ảnh mới chọn
      const tongSoAnh = danhSachAnhCu.length + imagesFiles.length + newFiles.length;

      if (tongSoAnh > 10) {
        showToast('Tổng số lượng ảnh phụ (cũ + mới) không được vượt quá 10 ảnh!', 'error');
        // Chỉ lấy thêm vừa đủ để đạt tối đa 10 ảnh
        const soLuongDuocThem = 10 - (danhSachAnhCu.length + imagesFiles.length);
        if (soLuongDuocThem > 0) {
          setImagesFiles([...imagesFiles, ...newFiles.slice(0, soLuongDuocThem)]);
        }
      } else {
        setImagesFiles([...imagesFiles, ...newFiles]);
      }
      e.target.value = '';
    }
  };

  const handleAddToppingRow = () => {
    setFormData({
      ...formData,
      toppings: [...formData.toppings, { topping_id: `tp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, topping_name: '', price: '' }]
    });
  };

  const handleRemoveToppingRow = (idx) => {
    setFormData({ ...formData, toppings: formData.toppings.filter((_, i) => i !== idx) });
  };

  const handleToppingInputChange = (idx, field, value) => {
    const updated = [...formData.toppings];
    updated[idx][field] = field === 'price' ? (value === '' ? '' : Number(value)) : value;
    setFormData({ ...formData, toppings: updated });
  };

  const handleChonToppingCoSan = (tpGoiY) => {
    const biTrung = formData.toppings.some(t => t.topping_name.trim().toLowerCase() === tpGoiY.topping_name.toLowerCase());
    if (biTrung) {
      showToast(`Topping "${tpGoiY.topping_name}" đã tồn tại trong danh sách!`, 'error');
      return;
    }
    setFormData({
      ...formData,
      toppings: [...formData.toppings, { topping_id: `tp_${Date.now()}`, topping_name: tpGoiY.topping_name, price: tpGoiY.price }]
    });
  };

  const handleAddSizeRow = () => {
    setFormData({
      ...formData,
      sizes: [...formData.sizes, { size_name: '', extra_price: '' }]
    });
  };

  const handleRemoveSizeRow = (idx) => {
    setFormData({ ...formData, sizes: formData.sizes.filter((_, i) => i !== idx) });
  };

  const handleSizeInputChange = (idx, field, value) => {
    const updated = [...formData.sizes];
    updated[idx][field] = field === 'extra_price' ? (value === '' ? '' : Number(value)) : value;
    setFormData({ ...formData, sizes: updated });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    if (!formData.product_name || formData.product_name.trim() === "") {
      showToast('Tên sản phẩm không được phép chỉ chứa khoảng trắng!', 'error');
      return;
    }

    if (Number(formData.base_price) <= 0) {
      showToast('Giá bán gốc của món ăn phải lớn hơn 0đ!', 'error');
      return;
    }

    const url = dangSuaId ? `${API_URL}/api/quantri/qt_sanpham/update/${dangSuaId}` : `${API_URL}/api/quantri/qt_sanpham/add`;
    const method = dangSuaId ? 'PUT' : 'POST';

    const toppingsChuanHoa = formData.toppings.map(t => ({ ...t, price: Number(t.price) || 0 }));
    const sizesChuanHoa = formData.sizes.map(s => ({ ...s, extra_price: Number(s.extra_price) || 0 }));

    const dataToSend = new FormData();
    dataToSend.append('category', categoryId);
    dataToSend.append('product_name', formData.product_name);
    dataToSend.append('base_price', formData.base_price);
    dataToSend.append('description', formData.description);
    dataToSend.append('is_active', formData.is_active);
    
    dataToSend.append('toppings', JSON.stringify(toppingsChuanHoa));
    dataToSend.append('sizes', JSON.stringify(sizesChuanHoa));

    // Gửi danh sách các ảnh phụ cũ còn giữ lại lên để backend cập nhật lại mảng dữ liệu cũ
    dataToSend.append('remain_images', JSON.stringify(danhSachAnhCu));

    if (avatarFile) {
      dataToSend.append('avatar', avatarFile);
    }
    
    if (imagesFiles && imagesFiles.length > 0) {
      for (let i = 0; i < imagesFiles.length; i++) {
        dataToSend.append('images', imagesFiles[i]);
      }
    }

    try {
      const res = await fetch(url, { method, body: dataToSend });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Lưu thông tin món thành công!', 'success');
        setHienForm(false);
        setDangSuaId(null);
        resetForm();
        taiDanhSach();
      } else {
        showToast(data.message || 'Có lỗi xảy ra!', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi kết nối đến máy chủ backend!', 'error');
    }
  };

  const handleXoaSanpham = async () => {
    try {
      const res = await fetch(`${API_URL}/api/quantri/qt_sanpham/delete/${spCanXoa.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Đã xóa sản phẩm thành công!', 'success');
        setMoXoaModal(false);
        setSpCanXoa(null);
        taiDanhSach();
      } else {
        showToast(data.message || 'Không thể xóa món!', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi hệ thống khi xóa món!', 'error');
    }
  };

  const layTenDanhMucTheoId = (catId) => {
    const cleanId = catId?._id || catId;
    const timDM = danhSachDM.find(dm => dm._id === cleanId);
    return timDM ? timDM.category_name : categoryName; 
  };

  return (
    <div className="qlsp-container" style={{ padding: 0 }}>
      {toast.show && (
        <div className={`qldm-toast ${toast.type}`} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 99999 }}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span style={{ marginLeft: '8px' }}>{toast.message}</span>
        </div>
      )}

      <div className="qlsp-header-row">
        <div className="qlsp-title-block" style={{ textAlign: 'left' }}>
          <h2 className="qlsp-main-title">📦 DANH SÁCH MÓN: {categoryName.toUpperCase()}</h2>
          <p className="qlsp-sub-title">Hiển thị {danhSachSPDaLoc.length} món nước trong nhóm.</p>
        </div>
        <button className="qlsp-btn-add-new" onClick={() => { 
          setDangSuaId(null); 
          resetForm();
          setHienForm(true); 
        }}>
          <Plus size={16} /> Thêm món mới
        </button>
      </div>

      {hienForm && (
        <div className="qlsp-modal-overlay">
          <div className="qlsp-modal-box-custom" style={{ maxWidth: '650px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <span className="qlsp-close-modal-x" onClick={() => setHienForm(false)}>&times;</span>
            <h3 className="qlsp-modal-form-title">{dangSuaId ? '✏️ CHỈNH SỬA SẢN PHẨM' : '➕ THÊM SẢN PHẨM MỚI'}</h3>
            
            <form onSubmit={handleSaveProduct} autoComplete="off">
              <div className="qlsp-form-group">
                <label className="qlsp-form-label">Tên sản phẩm *</label>
                <div className="auth-input-wrap">
                  <input type="text" name="product_name" value={formData.product_name} onChange={handleInputChange} required className="qlsp-input" />
                </div>
              </div>

              <div className="qlsp-form-group">
                <label className="qlsp-form-label">Giá bán gốc (đ) *</label>
                <div className="auth-input-wrap">
                  <input type="number" name="base_price" value={formData.base_price} onChange={handleInputChange} step="500" required className="qlsp-input" />
                </div>
              </div>

              {/* 📸 KHU VỰC HIỂN THỊ ẢNH CŨ VÀ ẢNH MỚI TRONG FORM */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '15px' }}>
                
                {/* A. Ô Tải và hiển thị ảnh đại diện */}
                <div className="qlsp-form-group" style={{ flex: 1 }}>
                  <label className="qlsp-form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Image size={15} /> Ảnh đại diện (Avatar) {!dangSuaId && '*'}
                  </label>
                  <input type="file" id="avatar-input" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0] || null)} required={!dangSuaId} style={{ fontSize: '13px', width: '100%' }} />
                  
                  {/* Nếu chọn file mới thì xem trước file mới, ngược lại nếu đang sửa thì hiện ảnh cũ */}
                  {avatarFile ? (
                    <div style={{ marginTop: '10px', position: 'relative', width: '90px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px dashed #cbd5e1' }}>
                      <img src={URL.createObjectURL(avatarFile)} alt="Avatar mới" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => { setAvatarFile(null); document.getElementById('avatar-input').value = ''; }} style={{ position: 'absolute', top: '2px', right: '2px', padding: '2px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
                    </div>
                  ) : avatarCu ? (
                    <div style={{ marginTop: '10px', width: '90px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                      <img src={`${API_URL}/${avatarCu}`} alt="Avatar cũ hiện tại" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : null}
                </div>

                {/* B. Ô Tải album ảnh phụ (Hiện tổng số ảnh cũ + mới) */}
                <div className="qlsp-form-group" style={{ flex: 1 }}>
                  <label className="qlsp-form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Image size={15} /> Album ảnh phụ ({danhSachAnhCu.length + imagesFiles.length}/10)
                  </label>
                  <input type="file" id="images-input" accept="image/*" multiple onChange={handleImagesChange} style={{ fontSize: '13px', width: '100%' }} />
                  
                  {/* Hiển thị vùng preview tích hợp cả cũ và mới */}
                  {((danhSachAnhCu && danhSachAnhCu.length > 0) || (imagesFiles && imagesFiles.length > 0)) && (
                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px', border: '1px solid #f1f5f9', padding: '8px', borderRadius: '6px', backgroundColor: '#fafafa' }}>
                      
                      {/* 1. Đổ danh sách các ảnh CŨ đã có từ trước */}
                      {danhSachAnhCu.map((imgUrl, index) => (
                        <div key={`cu-${index}`} style={{ position: 'relative', width: '55px', height: '55px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #0284c7' }}>
                          <img src={`${API_URL}/${imgUrl}`} alt="Cũ" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#0284c7', color: '#fff', fontSize: '8px', textAlignment: 'center', padding: '1px 0', display: 'block', textAlign: 'center' }}>Ảnh cũ</span>
                          <button type="button" onClick={() => setDanhSachAnhCu(danhSachAnhCu.filter((_, i) => i !== index))} style={{ position: 'absolute', top: '1px', right: '1px', padding: '2px', background: 'rgba(220, 38, 38, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px' }}><X size={10} /></button>
                        </div>
                      ))}

                      {/* 2. Đổ danh sách các file ảnh MỚI nhặt thêm vào */}
                      {imagesFiles.map((file, index) => (
                        <div key={`moi-${index}`} style={{ position: 'relative', width: '55px', height: '55px', borderRadius: '6px', overflow: 'hidden', border: '1px dashed #22c55e' }}>
                          <img src={URL.createObjectURL(file)} alt="Mới" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => setImagesFiles(imagesFiles.filter((_, i) => i !== index))} style={{ position: 'absolute', top: '1px', right: '1px', padding: '2px', background: 'rgba(220, 38, 38, 0.85)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px' }}><X size={10} /></button>
                        </div>
                      ))}

                    </div>
                  )}
                </div>
              </div>

              <div className="qlsp-form-group">
                <label className="qlsp-form-label">Mô tả món ăn</label>
                <div className="auth-input-wrap">
                  <input type="text" name="description" value={formData.description} onChange={handleInputChange} className="qlsp-input" />
                </div>
              </div>

              {/* SIZES */}
              <div style={{ backgroundColor: '#f0fdf4', padding: '14px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="qlsp-form-label" style={{ fontWeight: 'bold', color: '#166534', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}><Layers size={16} /> Kích thước ly (Sizes):</label>
                  <button type="button" onClick={handleAddSizeRow} style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px' }}>+ Thêm dòng Size</button>
                </div>
                {formData.sizes.length === 0 ? <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>Mặc định ly thường.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {formData.sizes.map((sz, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <div className="auth-input-wrap" style={{ flex: 2 }}><input type="text" placeholder="Tên Size" value={sz.size_name} onChange={(e) => handleSizeInputChange(idx, 'size_name', e.target.value)} required /></div>
                        <div className="auth-input-wrap" style={{ flex: 1 }}><input type="number" placeholder="Giá thêm" value={sz.extra_price} onChange={(e) => handleSizeInputChange(idx, 'extra_price', e.target.value)} required /></div>
                        <button type="button" onClick={() => handleRemoveSizeRow(idx)} style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '14px', height: '48px' }}><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TOPPINGS */}
              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="qlsp-form-label" style={{ fontWeight: 'bold', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}><Sliders size={15} /> Topping áp dụng:</label>
                  <button type="button" onClick={handleAddToppingRow} style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '4px' }}>+ Tự gõ Topping</button>
                </div>
                {formData.toppings.length === 0 ? <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>Không áp dụng topping.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {formData.toppings.map((tp, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <div className="auth-input-wrap" style={{ flex: 2 }}><input type="text" placeholder="Tên topping" value={tp.topping_name} onChange={(e) => handleToppingInputChange(idx, 'topping_name', e.target.value)} required /></div>
                        <div className="auth-input-wrap" style={{ flex: 1 }}><input type="number" placeholder="Giá" value={tp.price} onChange={(e) => handleToppingInputChange(idx, 'price', e.target.value)} required /></div>
                        <button type="button" onClick={() => handleRemoveToppingRow(idx)} style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '14px', height: '48px' }}><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="qlsp-modal-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '15px' }}>
                <input type="checkbox" id="is_active_sp" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                <label htmlFor="is_active_sp" style={{ fontSize: '13px', cursor: 'pointer' }}>Mở bán công khai</label>
              </div>
              <div className="qlsp-modal-actions">
                <button type="button" onClick={() => setHienForm(false)} className="qlsp-btn-cancel">Hủy</button>
                <button type="submit" className="qlsp-btn-submit">Lưu món</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BẢNG HIỂN THỊ DỮ LIỆU */}
      <div className="qlsp-table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 className="animate-spin inline" /> Đang đồng bộ món...</div>
        ) : (
          <div className="qlsp-table-wrapper">
            <table className="qlsp-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>Ảnh chính</th>
                  <th style={{ width: '150px', textAlign: 'left' }}>Ảnh phụ (Album)</th>
                  <th>Tên Nước Uống / Món Ăn</th>
                  <th>Danh Mục</th>
                  <th>Giá Gốc</th>
                  <th>Kích Thước (Sizes)</th>
                  <th>Toppings Đi Kèm</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {danhSachSPDaLoc.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '30px', color: '#94a3b8', textAlign: 'center' }}>
                      <em>Nhóm danh mục này chưa có sản phẩm nào. Hãy bấm thêm món mới!</em>
                    </td>
                  </tr>
                ) : (
                  danhSachSPDaLoc.map(sp => (
                    <tr key={sp._id}>
                      <td style={{ textAlign: 'center' }}>
                        <img 
                          src={sp.avatar ? `${API_URL}/${sp.avatar}` : 'https://placehold.co/44'} 
                          className="qlsp-img-thumb" 
                          alt="" 
                          style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px' }}
                          onError={(e) => { e.target.src = 'https://placehold.co/44'; }}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {sp.images && sp.images.length > 0 ? (
                            sp.images.map((imgUrl, index) => (
                              <img 
                                key={index}
                                src={`${API_URL}/${imgUrl}`}
                                alt=""
                                style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                onError={(e) => { e.target.src = 'https://placehold.co/30'; }}
                              />
                            ))
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Không có</span>
                          )}
                        </div>
                      </td>
                      <td><strong>{sp.product_name}</strong></td>
                      <td><span className="qlsp-category-badge">{layTenDanhMucTheoId(sp.category)}</span></td>
                      <td className="qlsp-price-color">{sp.base_price?.toLocaleString()}đ</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {sp.sizes && sp.sizes.length > 0 ? (
                            sp.sizes.map((s, idx) => (
                              <span key={idx} style={{ fontSize: '11px', backgroundColor: '#f0fdf4', color: '#166534', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                                {s.size_name} (+{s.extra_price}đ)
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Ly thường</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {sp.toppings && sp.toppings.length > 0 ? (
                            sp.toppings.map((t, idx) => (
                              <span key={idx} style={{ fontSize: '11px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
                                {t.topping_name} (+{t.price}đ)
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Không có</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`qlsp-status ${sp.is_active ? 'active' : 'hidden-status'}`}>{sp.is_active ? 'Mở bán' : 'Ẩn'}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        
                        {/* 🌟 NÚT SỬA ĐÃ ĐƯỢC THÊM ĐỔ DỮ LIỆU ẢNH CŨ */}
                        <button onClick={() => {
                          setDangSuaId(sp._id);
                          setFormData({ 
                            product_name: sp.product_name, 
                            base_price: sp.base_price, 
                            category: categoryId, 
                            description: sp.description || '', 
                            is_active: sp.is_active,
                            toppings: sp.toppings || [],
                            sizes: sp.sizes || []
                          });
                          
                          // Đổ dữ liệu ảnh cũ vào state lưu trữ riêng để xem trước
                          setAvatarCu(sp.avatar || '');
                          setDanhSachAnhCu(sp.images || []); 
                          
                          setAvatarFile(null); 
                          setImagesFiles([]);
                          setHienForm(true);
                        }} className="qlsp-btn-edit" style={{ marginRight: '6px' }}>Sửa</button>

                        <button onClick={() => {
                          setSpCanXoa({ id: sp._id, name: sp.product_name });
                          setMoXoaModal(true);
                        }} className="qlsp-btn-delete">Xóa</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL XÓA */}
      {moXoaModal && (
        <div className="qlsp-modal-overlay">
          <div className="qlsp-modal-box-custom qlsp-delete-box" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ padding: '8px', background: '#fee2e2', borderRadius: '50%' }}><AlertTriangle size={22} color="#ef4444" /></div>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700' }}>Xác nhận xóa món</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Bạn có chắc muốn gỡ bỏ hoàn toàn món <strong style={{ color: '#ef4444' }}>"{spCanXoa?.name}"</strong>?</p>
              </div>
            </div>
            <div className="qlsp-modal-actions" style={{ marginTop: '20px' }}>
              <button className="qlsp-btn-cancel" onClick={() => setMoXoaModal(false)}>Hủy</button>
              <button className="qlsp-btn-delete" style={{ padding: '8px 16px' }} onClick={handleXoaSanpham}>Xóa ngay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuanLySanPham;
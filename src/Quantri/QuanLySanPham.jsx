import React, { useState, useEffect } from 'react';
import { Plus, Loader2, AlertTriangle, CheckCircle, Trash2, ListPlus, Sliders, Layers } from 'lucide-react';
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
    image: '', 
    description: '', 
    is_active: true,
    toppings: [],
    sizes: []
  });
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const API_URL = import.meta.env.VITE_API_URL || '';

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    taiDanhSach();
    setFormData(prev => ({ ...prev, category: categoryId, toppings: [], sizes: [] }));
  }, [categoryId]);

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
    const url = dangSuaId ? `${API_URL}/api/quantri/qt_sanpham/update/${dangSuaId}` : `${API_URL}/api/quantri/qt_sanpham/add`;
    const method = dangSuaId ? 'PUT' : 'POST';

    const toppingsChuanHoa = formData.toppings.map(t => ({ ...t, price: Number(t.price) || 0 }));
    const sizesChuanHoa = formData.sizes.map(s => ({ ...s, extra_price: Number(s.extra_price) || 0 }));

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, toppings: toppingsChuanHoa, sizes: sizesChuanHoa, category: categoryId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Lưu thông tin món thành công!', 'success');
        setHienForm(false);
        setDangSuaId(null);
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
          setFormData({ product_name: '', base_price: '', category: categoryId, image: '', description: '', is_active: true, toppings: [], sizes: [] }); 
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
            
            {/* 🛠️ BỔ SUNG: Chặn tính năng autocomplete từ phía Form */}
            <form onSubmit={handleSaveProduct} autoComplete="off">
              
              {/* 🛠️ THAY ĐỔI: Bọc các thẻ input vào lớp bọc ảo .auth-input-wrap */}
              <div className="qlsp-form-group">
                <label className="qlsp-form-label">Tên sản phẩm *</label>
                <div className="auth-input-wrap">
                  <input type="text" name="sp_txt_title" value={formData.product_name} onChange={(e) => setFormData({...formData, product_name: e.target.value})} required className="qlsp-input" />
                </div>
              </div>

              <div className="qlsp-form-group">
                <label className="qlsp-form-label">Giá bán gốc (đ) *</label>
                <div className="auth-input-wrap">
                  <input type="number" name="sp_num_baseprice" value={formData.base_price} onChange={(e) => setFormData({...formData, base_price: e.target.value})} required className="qlsp-input" />
                </div>
              </div>

              <div className="qlsp-form-group">
                <label className="qlsp-form-label">Đường dẫn ảnh (URL)</label>
                <div className="auth-input-wrap">
                  <input type="text" name="sp_txt_imgurl" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} className="qlsp-input" />
                </div>
              </div>

              <div className="qlsp-form-group">
                <label className="qlsp-form-label">Mô tả món ăn</label>
                <div className="auth-input-wrap">
                  <input type="text" name="sp_txt_desc" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="qlsp-input" />
                </div>
              </div>

              {/* ================= 📐 KHU VỰC 1: CẤU HÌNH KÍCH THƯỚC LY (SIZES) ================= */}
              <div style={{ backgroundColor: '#f0fdf4', padding: '14px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="qlsp-form-label" style={{ fontWeight: 'bold', color: '#166534', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={16} /> Kích thước ly (Sizes) áp dụng:
                  </label>
                  <button 
                    type="button" 
                    onClick={handleAddSizeRow}
                    style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
                  >
                    + Thêm dòng Size
                  </button>
                </div>

                {formData.sizes.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>Mặc định ly thường cố định (Không phân size).</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {formData.sizes.map((sz, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <div className="auth-input-wrap" style={{ flex: 2 }}>
                          <input 
                            type="text" 
                            name={`sz_name_${idx}`}
                            placeholder="Tên Size (VD: M, L...)" 
                            value={sz.size_name} 
                            onChange={(e) => handleSizeInputChange(idx, 'size_name', e.target.value)}
                            required
                          />
                        </div>
                        <div className="auth-input-wrap" style={{ flex: 1 }}>
                          <input 
                            type="number" 
                            name={`sz_price_${idx}`}
                            placeholder="Giá thêm (đ)" 
                            value={sz.extra_price} 
                            onChange={(e) => handleSizeInputChange(idx, 'extra_price', e.target.value)}
                            required
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveSizeRow(idx)}
                          style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '14px', cursor: 'pointer', height: '48px', display: 'flex', alignItems: 'center' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ================= 🍧 KHU VỰC 2: CẤU HÌNH TOPPINGS ĐI KÈM ================= */}
              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '15px' }}>
                {toppingGoiYList.length > 0 && (
                  <div style={{ marginBottom: '12px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px' }}>
                    <label className="qlsp-form-label" style={{ fontWeight: '600', color: '#475569', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ListPlus size={14} /> Chọn nhanh Topping đã có của quán:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {toppingGoiYList.map((tp, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleChonToppingCoSan(tp)}
                          style={{ padding: '4px 8px', fontSize: '11px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '20px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', transition: 'all 0.2s' }}
                        >
                          {tp.topping_name} (+{tp.price}đ)
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="qlsp-form-label" style={{ fontWeight: 'bold', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sliders size={15} /> Topping áp dụng cho món này:
                  </label>
                  <button 
                    type="button" 
                    onClick={handleAddToppingRow}
                    style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
                  >
                    + Tự gõ mới Topping
                  </button>
                </div>

                {formData.toppings.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>Món này chưa áp dụng topping nào.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {formData.toppings.map((tp, idx) => (
                      <div key={tp.topping_id || idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <div className="auth-input-wrap" style={{ flex: 2 }}>
                          <input 
                            type="text" 
                            name={`tp_name_${idx}`}
                            placeholder="Tên topping (VD: Trân châu...)" 
                            value={tp.topping_name} 
                            onChange={(e) => handleToppingInputChange(idx, 'topping_name', e.target.value)}
                            required
                          />
                        </div>
                        <div className="auth-input-wrap" style={{ flex: 1 }}>
                          <input 
                            type="number" 
                            name={`tp_price_${idx}`}
                            placeholder="Giá (đ)" 
                            value={tp.price} 
                            onChange={(e) => handleToppingInputChange(idx, 'price', e.target.value)}
                            required
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveToppingRow(idx)}
                          style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '14px', cursor: 'pointer', height: '48px', display: 'flex', alignItems: 'center' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="qlsp-modal-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '15px' }}>
                <input type="checkbox" id="is_active_sp" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                <label htmlFor="is_active_sp" style={{ fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}>Mở bán công khai</label>
              </div>
              <div className="qlsp-modal-actions">
                <button type="button" onClick={() => setHienForm(false)} className="qlsp-btn-cancel">Hủy</button>
                <button type="submit" className="qlsp-btn-submit">Lưu món</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DANH SÁCH BẢNG HIỂN THỊ DỮ LIỆU */}
      <div className="qlsp-table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}><Loader2 className="animate-spin inline" /> Đang đồng bộ món...</div>
        ) : (
          <div className="qlsp-table-wrapper">
            <table className="qlsp-table">
              <thead>
                <tr>
                  <th style={{ width: '70px', textAlign: 'center' }}>Ảnh</th>
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
                    <td colSpan="8" style={{ padding: '30px', color: '#94a3b8', textAlign: 'center' }}>
                      <em>Nhóm danh mục này chưa có sản phẩm nào. Hãy bấm thêm món mới!</em>
                    </td>
                  </tr>
                ) : (
                  danhSachSPDaLoc.map(sp => (
                    <tr key={sp._id}>
                      <td style={{ textAlign: 'center' }}><img src={sp.image || 'https://placehold.co/44'} className="qlsp-img-thumb" alt="" /></td>
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
                        <button onClick={() => {
                          setDangSuaId(sp._id);
                          setFormData({ 
                            product_name: sp.product_name, 
                            base_price: sp.base_price, 
                            category: categoryId, 
                            image: sp.image || '', 
                            description: sp.description || '', 
                            is_active: sp.is_active,
                            toppings: sp.toppings || [],
                            sizes: sp.sizes || []
                          });
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

      {moXoaModal && (
        <div className="qlsp-modal-overlay">
          <div className="qlsp-modal-box-custom qlsp-delete-box" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div className="qlsp-delete-icon-wrapper" style={{ padding: '8px', background: '#fee2e2', borderRadius: '50%' }}><AlertTriangle size={22} color="#ef4444" /></div>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700' }}>Xác nhận xóa món</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Bạn có chắc muốn gỡ bỏ hoàn toàn món <strong style={{ color: '#ef4444' }}>"{spCanXoa?.name}"</strong> khỏi thực đơn?</p>
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
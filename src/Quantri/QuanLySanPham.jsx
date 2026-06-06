import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { Plus, Loader2, AlertTriangle, CheckCircle, Trash2, ListPlus, Sliders, Layers } from 'lucide-react';
import '../css/quantri/QuanLySanPham.css'; 

const QuanLySanPham = ({ categoryId, categoryName, danhSachDM = [] }) => {
  const [danhSachSP, setDanhSachSP] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hienForm, setHienForm] = useState(false); 
  const [dangSuaId, setDangSuaId] = useState(null); 
  const [moXoaModal, setMoXoaModal] = useState(false);
  const [spCanXoa, setSpCanXoa] = useState(null); 

  // 🌟 Đồng bộ cấu trúc formData: Bổ sung mảng toppings và sizes trống mặc định
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

=======
import '../css/quantri/QuanLySanPham.css'; // 🌟 Tách và nạp file CSS tại đây

const QuanLySanPham = () => {
  // 1. CÁC TRẠNG THÁI (STATE) CỦA HỆ THỐNG
  const [danhSachSP, setDanhSachSP] = useState([]);
  const [loading, setLoading] = useState(false);
  const [thongBao, setThongBao] = useState('');
  const [dangSuaId, setDangSuaId] = useState(null); // null: đang thêm mới, khác null: đang sửa
  const [hienForm, setHienForm] = useState(false); // Trạng thái ẩn/hiện Form nhập liệu

  // STATE ĐỂ LÀM FORM XÁC NHẬN XÓA TỰ CHẾ (CUSTOM MODAL)
  const [moXoaModal, setMoXoaModal] = useState(false);
  const [spCanXoa, setSpCanXoa] = useState(null); // Lưu { id, name } của món sắp xóa

  // 2. STATE LƯU TRỮ FORM SẢN PHẨM
  const [formData, setFormData] = useState({
    product_name: '',
    base_price: '',
    category: 'Trà sữa',
    image: '',
    description: '',
    is_active: true,
    toppings: []
  });

  // 3. STATE TẠM ĐỂ THÊM TỪNG TOPPING VÀO MÓN
  const [toppingTam, setToppingTam] = useState({ topping_name: '', price: '' });

  const API_URL = import.meta.env.VITE_API_URL;

  // Tự động tải danh sách sản phẩm khi vừa mở trang
  useEffect(() => {
    taiDanhSach();
  }, []);

  // 🔍 Gọi API: Lấy danh sách món
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
  const taiDanhSach = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/quantri/qt_sanpham/all`);
<<<<<<< HEAD
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
=======
      const data = await res.json();
      if (data.success) setDanhSachSP(data.data);
    } catch (err) {
      hienThongBao('❌ Không thể kết nối tới server Backend!');
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  // ⚡ Tự động gom danh sách Topping độc bản từ các sản phẩm khác để chọn nhanh
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

  // ================= LOGIC XỬ LÝ SỰ KIỆN TOPPING ĐỘNG =================
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

  // ================= LOGIC XỬ LÝ SỰ KIỆN SIZE ĐỘNG =================
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

  // ================= LƯU SẢN PHẨM (POST / PUT) =================
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const url = dangSuaId ? `${API_URL}/api/quantri/qt_sanpham/update/${dangSuaId}` : `${API_URL}/api/quantri/qt_sanpham/add`;
    const method = dangSuaId ? 'PUT' : 'POST';

    // Chuẩn hóa định dạng số cho mảng trước khi gửi lên API
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
=======
  const hienThongBao = (msg) => {
    setThongBao(msg);
    setTimeout(() => setThongBao(''), 4000);
  };

  // 4. XỬ LÝ NHẬP LIỆU FORM CHÍNH
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // 5. XỬ LÝ THÊM TOPPING VÀO MẢNG
  const handleAddTopping = () => {
    if (!toppingTam.topping_name || !toppingTam.price) {
      alert('Vui lòng điền tên và giá của Topping trước!');
      return;
    }
    const toppingMoi = {
      topping_id: 'tp_' + Date.now(),
      topping_name: toppingTam.topping_name,
      price: Number(toppingTam.price)
    };
    setFormData({
      ...formData,
      toppings: [...formData.toppings, toppingMoi]
    });
    setToppingTam({ topping_name: '', price: '' });
  };

  // Xóa topping khỏi danh sách chờ của món
  const handleRemoveTopping = (id) => {
    setFormData({
      ...formData,
      toppings: formData.toppings.filter(t => t.topping_id !== id)
    });
  };

  // ➕ ✏️ XỬ LÝ LƯU: Thêm mới hoặc Cập nhật
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    
    const url = dangSuaId ? `${API_URL}/api/quantri/qt_sanpham/update/${dangSuaId}` : `${API_URL}/api/quantri/qt_sanpham/add`;
    const method = dangSuaId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        hienThongBao(dangSuaId ? '✅ Cập nhật món thành công!' : '✅ Đã thêm món mới thành công!');
        handleResetForm();
        taiDanhSach();
        setHienForm(false);
      } else {
        hienThongBao('❌ Lỗi: ' + data.message);
      }
    } catch (err) {
      hienThongBao('❌ Lỗi hệ thống, không thể lưu!');
    }
  };

  // 7. BẤM NÚT SỬA MÓN
  const handleEditClick = (sp) => {
    setDangSuaId(sp._id);
    setFormData({
      product_name: sp.product_name,
      base_price: sp.base_price,
      category: sp.category,
      image: sp.image || '',
      description: sp.description || '',
      is_active: sp.is_active,
      toppings: sp.toppings || []
    });
    setHienForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 8. BẤM NÚT XÓA: Kích hoạt hiện Form Xác Nhận
  const kíchHoạtHỏiXóa = (id, name) => {
    setSpCanXoa({ id, name });
    setMoXoaModal(true);
  };

  // 🗑️ THỰC HIỆN XÓA THẬT SỰ
  const handleXacNhanXoaChinhThuc = async () => {
    if (!spCanXoa) return;
    
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
    try {
      const res = await fetch(`${API_URL}/api/quantri/qt_sanpham/delete/${spCanXoa.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
<<<<<<< HEAD
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

      {/* 🌟 FORM ĐƯỢC THIẾT KẾ LẠI RỘNG RÃI, CÓ SCROLL CHỐNG TRÀN */}
      {hienForm && (
        <div className="qlsp-modal-overlay">
          <div className="qlsp-modal-box-custom" style={{ maxWidth: '650px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <span className="qlsp-close-modal-x" onClick={() => setHienForm(false)}>&times;</span>
            <h3 className="qlsp-modal-form-title">{dangSuaId ? '✏️ CHỈNH SỬA SẢN PHẨM' : '➕ THÊM SẢN PHẨM MỚI'}</h3>
            <form onSubmit={handleSaveProduct}>
              <div className="qlsp-form-group">
                <label className="qlsp-form-label">Tên sản phẩm *</label>
                <input type="text" name="product_name" value={formData.product_name} onChange={handleInputChange} required className="qlsp-input" />
              </div>
              <div className="qlsp-form-group">
                <label className="qlsp-form-label">Giá bán gốc (đ) *</label>
                <input type="number" name="base_price" value={formData.base_price} onChange={handleInputChange} required className="qlsp-input" />
              </div>
              <div className="qlsp-form-group">
                <label className="qlsp-form-label">Đường dẫn ảnh (URL)</label>
                <input type="text" name="image" value={formData.image} onChange={handleInputChange} className="qlsp-input" />
              </div>
              <div className="qlsp-form-group">
                <label className="qlsp-form-label">Mô tả món ăn</label>
                <input type="text" name="description" value={formData.description} onChange={handleInputChange} className="qlsp-input" />
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
                        <input 
                          type="text" 
                          placeholder="Tên Size (VD: M, L, XL, Ly 700ml...)" 
                          value={sz.size_name} 
                          onChange={(e) => handleSizeInputChange(idx, 'size_name', e.target.value)}
                          required
                          style={{ flex: 2, padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff' }}
                        />
                        <input 
                          type="number" 
                          placeholder="Giá cộng thêm (đ)" 
                          value={sz.extra_price} 
                          onChange={(e) => handleSizeInputChange(idx, 'extra_price', e.target.value)}
                          required
                          style={{ flex: 1, padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff' }}
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveSizeRow(idx)}
                          style={{ padding: '6px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer' }}
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
                
                {/* Cách chọn nhanh gợi ý */}
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

                {/* Danh sách gõ tay hoặc chỉnh sửa */}
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
                        <input 
                          type="text" 
                          placeholder="Tên topping (VD: Trân châu...)" 
                          value={tp.topping_name} 
                          onChange={(e) => handleToppingInputChange(idx, 'topping_name', e.target.value)}
                          required
                          style={{ flex: 2, padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff' }}
                        />
                        <input 
                          type="number" 
                          placeholder="Giá (đ)" 
                          value={tp.price} 
                          onChange={(e) => handleToppingInputChange(idx, 'price', e.target.value)}
                          required
                          style={{ flex: 1, padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff' }}
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveToppingRow(idx)}
                          style={{ padding: '6px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* ============================================================== */}

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
                  <th>Kích Thước (Sizes)</th> {/* Cột mới bổ sung */}
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
                      
                      {/* HIỂN THỊ KÍCH THƯỚC LY */}
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

                      {/* HIỂN THỊ TOPPING */}
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
                            sizes: sp.sizes || [] // Đổ mảng size từ DB ra form khi sửa
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
=======
        hienThongBao(`🗑️ Đã xóa món [ ${spCanXoa.name} ] thành công!`);
        taiDanhSach();
      }
    } catch (err) {
      hienThongBao('❌ Không thể kết nối server để xóa món!');
    } finally {
      setMoXoaModal(false);
      setSpCanXoa(null);
    }
  };

  const handleResetForm = () => {
    setDangSuaId(null);
    setFormData({ product_name: '', base_price: '', category: 'Trà sữa', image: '', description: '', is_active: true, toppings: [] });
  };

  return (
    <div className="qlsp-container">
      <h2 className="qlsp-main-title">🧋 HỆ THỐNG QUẢN LÝ SẢN PHẨM & TOPPING</h2>
      {thongBao && <div className="qlsp-alert">{thongBao}</div>}

      {/* KHU VỰC ĐIỀU KHIỂN & THANH TIÊU ĐỀ THỰC ĐƠN */}
      <div className="qlsp-header-row">
        <h3 style={{ margin: 0 }}>📋 THỰC ĐƠN HIỆN TẠI ({danhSachSP.length} món)</h3>
        {!hienForm ? (
          <button className="qlsp-btn-add-new" onClick={() => { handleResetForm(); setHienForm(true); }}>
            ➕ Thêm Món Mới
          </button>
        ) : (
          <button className="qlsp-btn-close-form" onClick={() => { handleResetForm(); setHienForm(false); }}>
            ❌ Đóng Form Nhập
          </button>
        )}
      </div>

      <div className="qlsp-vertical-layout">
        {/* KHU VỰC 1: FORM THÊM / SỬA MÓN */}
        {hienForm && (
          <div className="qlsp-form-card">
            <h3 className="qlsp-form-card-title">
              {dangSuaId ? '✏️ CẬP NHẬT THÔNG TIN MÓN' : '➕ ĐIỀN THÔNG TIN MÓN MỚI'}
            </h3>
            <form onSubmit={handleSaveProduct}>
              <div className="qlsp-form-group">
                <label>Tên sản phẩm/nước uống:</label>
                <input type="text" name="product_name" value={formData.product_name} onChange={handleInputChange} required className="qlsp-input" placeholder="Ví dụ: Trà sữa Khoai Môn" />
              </div>

              <div className="qlsp-form-row">
                <div className="qlsp-form-group" style={{ flex: 1 }}>
                  <label>Giá gốc (đ):</label>
                  <input type="number" name="base_price" value={formData.base_price} onChange={handleInputChange} required className="qlsp-input" placeholder="35000" step="1000" />
                </div>
                <div className="qlsp-form-group" style={{ flex: 1 }}>
                  <label>Danh mục nhóm:</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="qlsp-input">
                    <option value="Trà sữa">Trà sữa</option>
                    <option value="Trà trái cây">Trà trái cây</option>
                    <option value="Đá xay">Đá xay</option>
                    <option value="Topping">Topping lẻ</option>
                  </select>
                </div>
              </div>

              <div className="qlsp-form-group">
                <label>Đường dẫn hình ảnh (URL):</label>
                <input type="text" name="image" value={formData.image} onChange={handleInputChange} className="qlsp-input" placeholder="http://link-anh..." />
              </div>

              <div className="qlsp-form-group">
                <label>Mô tả ngắn ngon miệng:</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} className="qlsp-input qlsp-textarea" placeholder="Vị béo ngậy đặc trưng..." />
              </div>

              <div className="qlsp-checkbox-group">
                <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                <label htmlFor="is_active" style={{ fontWeight: 'bold', color: '#2c3e50' }}>Món này đang mở bán (Hiện lên Menu)</label>
              </div>

              <div className="qlsp-topping-section">
                <h4>Nhúng Topping được chọn đi kèm ly này:</h4>
                <div className="qlsp-topping-row-inputs">
                  <input type="text" placeholder="Tên: Trân châu, Thạch..." value={toppingTam.topping_name} onChange={(e) => setToppingTam({ ...toppingTam, topping_name: e.target.value })} className="qlsp-input" />
                  <input type="number" placeholder="Giá lẻ (đ)" step="1000" value={toppingTam.price} onChange={(e) => setToppingTam({ ...toppingTam, price: e.target.value })} className="qlsp-input qlsp-topping-input-width" />
                  <button type="button" onClick={handleAddTopping} className="qlsp-btn-small">+ Gắn</button>
                </div>
                
                <div className="qlsp-topping-list">
                  {formData.toppings.length === 0 ? (
                    <span className="qlsp-topping-empty-text">Chưa gắn topping nào. Chạm nút + Gắn phía trên.</span>
                  ) : (
                    formData.toppings.map((t) => (
                      <span key={t.topping_id} className="qlsp-topping-tag">
                        {t.topping_name} (+{t.price.toLocaleString()}đ)
                        <strong onClick={() => handleRemoveTopping(t.topping_id)} className="qlsp-remove-tag">×</strong>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="qlsp-btn-form-action-group">
                <button type="submit" className="qlsp-btn-primary">{dangSuaId ? 'Cập Nhật Ngay' : 'Lưu Vào Menu'}</button>
                <button type="button" onClick={() => { handleResetForm(); setHienForm(false); }} className="qlsp-btn-secondary">Hủy Bỏ</button>
              </div>
            </form>
          </div>
        )}

        {/* KHU VỰC 2: BẢNG DANH SÁCH SẢN PHẨM HIỆN TẠI */}
        <div className="qlsp-table-card">
          {loading ? (
            <p>Đang quét thực đơn từ database...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="qlsp-table">
                <thead>
                  <tr style={{ backgroundColor: '#2c3e50', color: '#fff' }}>
                    <th>Ảnh</th>
                    <th>Tên Món</th>
                    <th>Phân Loại</th>
                    <th>Giá Gốc</th>
                    <th>Toppings Đi Kèm</th>
                    <th>Trạng Thái</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {danhSachSP.map((sp) => (
                    <tr key={sp._id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td>
                        <img src={sp.image || 'https://placehold.co/50'} alt={sp.product_name} className="qlsp-img-preview" onError={(e) => { e.target.src = 'https://placehold.co/50'; }} />
                      </td>
                      <td><strong>{sp.product_name}</strong></td>
                      <td><span className="qlsp-badge-category">{sp.category}</span></td>
                      <td className="qlsp-td-price">{sp.base_price?.toLocaleString()}đ</td>
                      <td>
                        <div className="qlsp-table-topping-list">
                          {sp.toppings && sp.toppings.length > 0 ? (
                            sp.toppings.map(t => (
                              <span key={t._id || t.topping_id} className="qlsp-table-topping-tag">{t.topping_name}</span>
                            ))
                          ) : (
                            <em className="qlsp-table-topping-empty">Không có</em>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="qlsp-badge-status" style={{ backgroundColor: sp.is_active ? '#2ecc71' : '#95a5a6' }}>
                          {sp.is_active ? 'Đang bán' : 'Tạm ẩn'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleEditClick(sp)} className="qlsp-btn-edit">Sửa</button>
                        <button onClick={() => kíchHoạtHỏiXóa(sp._id, sp.product_name)} className="qlsp-btn-delete">Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ⚠️ FORM MODAL XÁC NHẬN XÓA */}
      {moXoaModal && (
        <div className="qlsp-modal-overlay">
          <div className="qlsp-modal-box">
            <div className="qlsp-modal-header">⚠️ XÁC NHẬN XÓA MÓN ĂN</div>
            <div className="qlsp-modal-body">
              Bạn có chắc chắn muốn xóa món <strong style={{ color: '#e74c3c', fontSize: '16px' }}> {spCanXoa?.name} </strong> khỏi thực đơn hệ thống không? Hành động này không thể hoàn tác!
            </div>
            <div className="qlsp-modal-footer">
              <button className="qlsp-btn-cancel-delete" onClick={() => { setMoXoaModal(false); setSpCanXoa(null); }}>
                Hủy (Giữ lại)
              </button>
              <button className="qlsp-btn-confirm-delete" onClick={handleXacNhanXoaChinhThuc}>
                Vẫn Xóa
              </button>
>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
            </div>
          </div>
        </div>
      )}
<<<<<<< HEAD
=======

>>>>>>> f8d3b219130c8d20d9bb1484738ae75dba8140c1
    </div>
  );
};

export default QuanLySanPham;
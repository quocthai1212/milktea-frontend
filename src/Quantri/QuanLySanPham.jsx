import React, { useState, useEffect } from 'react';
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
  const taiDanhSach = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/quantri/qt_sanpham/all`);
      const data = await res.json();
      if (data.success) setDanhSachSP(data.data);
    } catch (err) {
      hienThongBao('❌ Không thể kết nối tới server Backend!');
    } finally {
      setLoading(false);
    }
  };

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
    
    try {
      const res = await fetch(`${API_URL}/api/quantri/qt_sanpham/delete/${spCanXoa.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
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
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuanLySanPham;
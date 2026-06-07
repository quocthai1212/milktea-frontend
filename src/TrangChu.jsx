import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ListFilter, ShoppingCart, Plus, Rocket, X, Minus, Sparkles } from 'lucide-react';
import ChatAI from './khachhang/ChatAI';
import ModalDiaChiGiaoHang from './khachhang/ModalDiaChiGiaoHang';
import ModalDatHang from './khachhang/ModalDatHang';
import TrangChuHeader, { docDeliveryAddress, docGioHang, isKhachHang, } from './components/TrangChuHeader';
import './css/TrangChu.css';

const API_URL = import.meta.env.VITE_API_URL;

const TrangChu = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // --- HỨNG DỮ LIỆU THỰC TẾ TỪ CƠ SỞ DỮ LIỆU ---
  const [danhSachSP, setDanhSachSP] = useState([]);
  const [danhSachDM, setDanhSachDM] = useState([]); 
  const [loading, setLoading] = useState(true);

  // 🌟 THÊM: Trạng thái lưu trữ và loading bình luận động cho từng sản phẩm
  const [danhSachBinhLuan, setDanhSachBinhLuan] = useState([]);
  const [loadingBinhLuan, setLoadingBinhLuan] = useState(false);

  // Các trạng thái bộ lọc
  const [tuKhoa, setTuKhoa] = useState('');
  const [nhomDaChon, setNhomDaChon] = useState('Tất cả'); 

  // Trạng thái cho Cửa sổ con (Modal) xem chi tiết & chọn Topping nhanh
  const [modalChiTiet, setModalChiTiet] = useState(false);
  const [spXemChiTiet, setSpXemChiTiet] = useState(null);
  const [toppingsDaChon, setToppingsDaChon] = useState([]);
  const [soLuongModal, setSoLuongModal] = useState(1);
  const [thongBaoDatHang, setThongBaoDatHang] = useState('');

  const [nguoiDung, setNguoiDung] = useState(null);
  const [gioHang, setGioHang] = useState(docGioHang);

  const [diaChiGiaoHang, setDiaChiGiaoHang] = useState(() => docDeliveryAddress());
  const [modalDiaChi, setModalDiaChi] = useState(false);
  const [batBuocDiaChi, setBatBuocDiaChi] = useState(false);

  const [showModalDatHang, setShowModalDatHang] = useState(false);
  const [sanPhamDatNgay, setSanPhamDatNgay] = useState(null);
  const [pendingDatNgay, setPendingDatNgay] = useState(null);

  // useEffect lấy dữ liệu từ CSDL thông qua API Backend
  useEffect(() => {
    const layDuLieuTuBackend = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/khachhang/sanpham`); 
        
        if (!response.ok) {
          throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          const dmGiaoDien = data.categories.filter(dm => dm.category_name !== 'Topping');
          setDanhSachDM(dmGiaoDien); 
          setDanhSachSP(data.products); 
        }
      } catch (error) {
        console.error("Lỗi kết nối Backend:", error);
      } finally {
        setLoading(false);
      }
    };
    
    layDuLieuTuBackend();
  }, []);

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        setNguoiDung(JSON.parse(userJson));
      } catch {
        setNguoiDung(null);
      }
    } else {
      setNguoiDung(null);
      setDiaChiGiaoHang(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!nguoiDung || !isKhachHang()) {
      setBatBuocDiaChi(false);
      if (!isKhachHang()) setModalDiaChi(false);
      return;
    }

    const saved = docDeliveryAddress();
    if (saved?.address_detail) {
      setDiaChiGiaoHang(saved);
      localStorage.removeItem('require_delivery_address');
      setBatBuocDiaChi(false);
      setModalDiaChi(false);
      return;
    }

    setDiaChiGiaoHang(null);
    const canRequire =
      location.state?.requireAddress ||
      localStorage.getItem('require_delivery_address') === '1';

    if (canRequire) {
      setBatBuocDiaChi(true);
      setModalDiaChi(true);
    }
  }, [nguoiDung, location.state]);

  useEffect(() => {
    const syncCart = () => {
      setGioHang(docGioHang());
    };

    window.addEventListener('cart-updated', syncCart);
    window.addEventListener('storage', syncCart);

    return () => {
      window.removeEventListener('cart-updated', syncCart);
      window.removeEventListener('storage', syncCart);
    };
  }, []);

  // 🌟 NÂNG CẤP: Chuyển đổi thành hàm async để kích hoạt tải bình luận khi click xem món
  const handleOpenOrderModal = async (sp) => {
    setSpXemChiTiet(sp);
    setToppingsDaChon([]);
    setSoLuongModal(1);
    setModalChiTiet(true);
    
    // Khởi tạo lại trạng thái nạp bình luận mới
    setDanhSachBinhLuan([]);
    setLoadingBinhLuan(true);

    try {
      const response = await fetch(`${API_URL}/api/khachhang/danh-gia/san-pham/${sp._id}`);
      if (!response.ok) {
        throw new Error(`Lỗi HTTP lấy bình luận! Trạng thái: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setDanhSachBinhLuan(data.reviews || []);
      }
    } catch (error) {
      console.error("Lỗi khi tải bình luận sản phẩm:", error);
    } finally {
      setLoadingBinhLuan(false);
    }
  };

  const handleTangGiamSoLuongModal = (delta) => {
    setSoLuongModal((prev) => Math.max(1, prev + delta));
  };

  // Xử lý Checkbox chọn/hủy chọn Topping
  const handleToggleTopping = (topping) => {
    const exists = toppingsDaChon.find(t => t.topping_id === topping.topping_id);
    if (exists) {
      setToppingsDaChon(toppingsDaChon.filter(t => t.topping_id !== topping.topping_id));
    } else {
      setToppingsDaChon([...toppingsDaChon, topping]);
    }
  };

  const tinhDonGiaMotLy = () => {
    if (!spXemChiTiet) return 0;
    const tienTopping = toppingsDaChon.reduce((tong, t) => tong + Number(t.price), 0);
    return spXemChiTiet.base_price + tienTopping;
  };

  const tinhTongTienMonAn = () => tinhDonGiaMotLy() * soLuongModal;

  const taoMonTuModal = () => {
    const donGia = tinhDonGiaMotLy();
    return {
      id: `${spXemChiTiet._id}_${Date.now()}`,
      productId: spXemChiTiet._id,
      tenMon: spXemChiTiet.product_name,
      image: spXemChiTiet.image,
      toppings: [...toppingsDaChon],
      donGia,
      soLuong: soLuongModal,
      tongTien: donGia * soLuongModal,
    };
  };

  const luuGioHang = (next) => {
    setGioHang(next);
    localStorage.setItem('milktea_gio_hang', JSON.stringify(next));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleXacNhanDatMua = () => {
    const monMoi = taoMonTuModal();
    const gioMoiNhat = docGioHang();
    luuGioHang([...gioMoiNhat, monMoi]);

    setModalChiTiet(false);
    setThongBaoDatHang('Đã thêm món vào giỏ hàng!');
    setTimeout(() => setThongBaoDatHang(''), 2500);
  };

  const handleDatHangNgay = () => {
    const monDatNgay = taoMonTuModal();
    setModalChiTiet(false);

    if (!nguoiDung || !isKhachHang()) {
      localStorage.setItem('require_delivery_address', '1');
      navigate('/login');
      return;
    }

    const diaChiMoiNhat = docDeliveryAddress();

    if (!diaChiMoiNhat?.address_detail) {
      setPendingDatNgay(monDatNgay);
      setBatBuocDiaChi(true);
      setModalDiaChi(true);
      setThongBaoDatHang('Vui lòng cập nhật địa chỉ giao hàng trước khi đặt!');
      setTimeout(() => setThongBaoDatHang(''), 3500);
      return;
    }

    if (!diaChiMoiNhat?.latitude || !diaChiMoiNhat?.longitude) {
      setPendingDatNgay(monDatNgay);
      setBatBuocDiaChi(true);
      setModalDiaChi(true);
      setThongBaoDatHang('Địa chỉ cần có tọa độ GPS. Vui lòng cập nhật lại địa chỉ!');
      setTimeout(() => setThongBaoDatHang(''), 3500);
      return;
    }

    setDiaChiGiaoHang(diaChiMoiNhat);
    setSanPhamDatNgay(monDatNgay);
    setShowModalDatHang(true);
  };

  const handleDiaChiThanhCong = (diaChi) => {
    setDiaChiGiaoHang(diaChi);
    localStorage.setItem('delivery_address', JSON.stringify(diaChi));
    localStorage.removeItem('require_delivery_address');
    setModalDiaChi(false);
    setBatBuocDiaChi(false);

    if (pendingDatNgay) {
      setSanPhamDatNgay(pendingDatNgay);
      setPendingDatNgay(null);
      setShowModalDatHang(true);
    }
  };

  const handleDatHangThanhCong = () => {
    if (!sanPhamDatNgay) {
      setGioHang([]);
      localStorage.setItem('milktea_gio_hang', JSON.stringify([]));
      window.dispatchEvent(new Event('cart-updated'));
    }

    setSanPhamDatNgay(null);
    setShowModalDatHang(false);
    setThongBaoDatHang('Đặt hàng thành công!');
    setTimeout(() => setThongBaoDatHang(''), 3500);
  };

  const khachHangId = nguoiDung?._id || nguoiDung?.id || null;

  // Xử lý bộ lọc tìm kiếm và phân loại danh mục
  const danhSachLoc = danhSachSP.filter(sp => {
    const tenMon = sp.product_name ? sp.product_name.toLowerCase() : '';
    const moTa = sp.description ? sp.description.toLowerCase() : '';
    const tuKhoaTim = tuKhoa ? tuKhoa.toLowerCase() : '';

    const khopTuKhoa = tenMon.includes(tuKhoaTim) || moTa.includes(tuKhoaTim);
    
    const idDanhMucCuaSP = sp.category?._id || sp.category;
    const khopCategory = nhomDaChon === 'Tất cả' || idDanhMucCuaSP === nhomDaChon;

    return khopTuKhoa && khopCategory;
  });

  // GIAO DIỆN CHỜ TẢI DỮ LIỆU TỪ CSDL
  if (loading) {
    return (
      <div className="tc-loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '15px' }}>
        <div className="tc-spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #ff4d4f', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: '#666', fontSize: '15px' }}>Đang kết nối CSDL và tải danh sách món...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="tc-wrapper">
      <TrangChuHeader activePage="home" />

      {thongBaoDatHang && (
        <div className="tc-toast-order" role="status">{thongBaoDatHang}</div>
      )}

      {/* KHU VỰC BANNER CHÀO MỪNG */}
      <header className="tc-hero">
        <div className="tc-hero-overlay"></div>
        <div className="tc-hero-content">
          <h1>Hương Vị Đậm Đà - Đậm Đà Tình Thân</h1>
          <p>Trà sữa tươi ngon, giao nhanh, chọn món dễ dàng với trải nghiệm đặt hàng hiện đại.</p>
          <div className="tc-search-box">
            <input
              type="text"
              placeholder="Tìm kiếm món uống thơm ngon tại đây..."
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
            />
            <button className="tc-btn-search"><Search size={17} /> Tìm kiếm</button>
          </div>
        </div>
      </header>

      {/* KHU VỰC THỰC ĐƠN CHÍNH */}
      <main className="tc-main-container">
        
        <div className="tc-category-tabs">
          <button
            className={`tc-tab-item ${nhomDaChon === 'Tất cả' ? 'active' : ''}`}
            onClick={() => setNhomDaChon('Tất cả')}
          >
            <ListFilter size={16} /> Tất cả menu
          </button>

          {danhSachDM.map((dm) => (
            <button
              key={dm._id}
              className={`tc-tab-item ${nhomDaChon === dm._id ? 'active' : ''}`}
              onClick={() => setNhomDaChon(dm._id)} 
            >
              {dm.category_name}
            </button>
          ))}
        </div>

        <h3 className="tc-section-title"><Sparkles size={20} /> Khám phá thực đơn ({danhSachLoc.length} món)</h3>

        {danhSachLoc.length === 0 ? (
          <div className="tc-empty-state">
            <p>Không tìm thấy món nước nào phù hợp với bộ lọc tìm kiếm.</p>
          </div>
        ) : (
          /* Lưới danh sách thẻ sản phẩm */
          <div className="tc-grid">
            {danhSachLoc.map((sp) => (
              <div key={sp._id} className="tc-card">
                {/* 🌟 CHỈNH SỬA: Bọc sự kiện click vào ảnh để bật xem chi tiết */}
                <div className="tc-card-image-wrapper" onClick={() => handleOpenOrderModal(sp)} style={{ cursor: 'pointer' }}>
                  <img src={sp.image} alt={sp.product_name} className="tc-card-img" />
                  <span className="tc-card-badge">{sp.category?.category_name || "Món mới"}</span>
                </div>

                <div className="tc-card-body">
                  {/* 🌟 THÊM MỚI: Hiển thị điểm số sao đánh giá trung bình O(1) từ backend */}
                  <div className="tc-card-rating" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#ffb800', marginBottom: '6px' }}>
                    <span>⭐ {sp.rating_average ? sp.rating_average.toFixed(1) : "5.0"}</span>
                    <span style={{ color: '#888', fontSize: '12px' }}>({sp.review_count || 0} đánh giá)</span>
                  </div>

                  {/* 🌟 CHỈNH SỬA: Click vào tiêu đề cũng mở Modal */}
                  <h4 className="tc-card-title" onClick={() => handleOpenOrderModal(sp)} style={{ cursor: 'pointer' }}>
                    {sp.product_name}
                  </h4>
                  <p className="tc-card-desc">{sp.description}</p>

                  {/* Hiển thị nhanh danh sách topping có sẵn */}
                  <div className="tc-card-toppings-preview">
                    {sp.toppings && sp.toppings.length > 0 ? (
                      sp.toppings.map((t, idx) => (
                        <span key={idx} className="tc-mini-tag">+{t.topping_name}</span>
                      ))
                    ) : (
                      <span className="tc-mini-tag" style={{ background: '#fcfcfc', color: '#ccc' }}>Món nguyên bản</span>
                    )}
                  </div>

                  <div className="tc-card-footer">
                    <div className="tc-card-price">
                      {sp.base_price?.toLocaleString('vi-VN')} <span className="tc-currency">đ</span>
                    </div>
                    <button className="tc-btn-order" onClick={() => handleOpenOrderModal(sp)}>
                      <ShoppingCart size={16} /> Đặt mua
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CỬA SỔ MODAL CHỌN TOPPING & XEM CHI TIẾT BÌNH LUẬN */}
      {modalChiTiet && spXemChiTiet && (
        <div className="tc-modal-overlay" onClick={() => setModalChiTiet(false)}>
          {/* 🌟 CHỈNH SỬA: Bổ sung thanh cuộn dọc (overflowY) cho khung container lớn phòng khi nhiều bình luận */}
          <div className="tc-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto' }}>
            <button className="tc-modal-close" onClick={() => setModalChiTiet(false)} aria-label="Đóng"><X size={20} /></button>

            <div className="tc-modal-content">
              <div className="tc-modal-left">
                <img src={spXemChiTiet.image} alt={spXemChiTiet.product_name} />
              </div>

              <div className="tc-modal-right">
                <span className="tc-modal-category-badge">{spXemChiTiet.category?.category_name || "Món mới"}</span>
                <h2>{spXemChiTiet.product_name}</h2>
                
                <div style={{ color: '#ffb800', marginBottom: '8px', fontSize: '13.5px', fontWeight: '500' }}>
                  ⭐ {spXemChiTiet.rating_average ? spXemChiTiet.rating_average.toFixed(1) : "5.0"} / 5.0
                </div>

                <p className="tc-modal-desc">{spXemChiTiet.description}</p>

                <div className="tc-modal-price-row">
                  <span className="text-label">Giá cốt ly:</span>
                  <span className="text-price">{spXemChiTiet.base_price?.toLocaleString()}đ</span>
                </div>

                {/* Phần chọn Topping nhúng động */}
                <div className="tc-modal-topping-section">
                  <h3>Tùy Chọn Topping Thêm Vào Ly:</h3>
                  {spXemChiTiet.toppings && spXemChiTiet.toppings.length > 0 ? (
                    <div className="tc-modal-topping-grid">
                      {spXemChiTiet.toppings.map((t) => {
                        const isChecked = toppingsDaChon.some(item => item.topping_id === t.topping_id);
                        return (
                          <label key={t.topping_id} className={`tc-topping-checkbox-card ${isChecked ? 'selected' : ''}`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleTopping(t)}
                            />
                            <div className="tc-topping-info">
                              <span className="name">{t.topping_name}</span>
                              <span className="price">+{t.price?.toLocaleString()}đ</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="tc-no-topping-text">Món này ngon nhất khi uống nguyên bản, không kèm topping lẻ.</p>
                  )}
                </div>

                <div className="tc-qty-row">
                  <span className="tc-qty-label">Số lượng:</span>
                  <div className="tc-qty-stepper">
                    <button
                      type="button"
                      className="tc-qty-btn"
                      onClick={() => handleTangGiamSoLuongModal(-1)}
                      disabled={soLuongModal <= 1}
                      aria-label="Giảm số lượng"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="tc-qty-value">{soLuongModal}</span>
                    <button
                      type="button"
                      className="tc-qty-btn"
                      onClick={() => handleTangGiamSoLuongModal(1)}
                      aria-label="Tăng số lượng"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="tc-qty-unit-hint">
                    {tinhDonGiaMotLy().toLocaleString('vi-VN')}đ / ly
                  </span>
                </div>

                <div className="tc-modal-action-footer">
                  <div className="tc-total-price-box">
                    <span className="total-label">TỔNG TIỀN TẠM TÍNH:</span>
                    <span className="total-value">{tinhTongTienMonAn().toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="tc-modal-action-btns">
                    <button type="button" className="tc-btn-submit-cart" onClick={handleXacNhanDatMua}>
                      <Plus size={17} /> Thêm vào giỏ hàng
                    </button>
                    <button type="button" className="tc-btn-order-now" onClick={handleDatHangNgay}>
                      <Rocket size={17} /> Đặt hàng ngay
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* 🌟 THÊM MỚI PHÂN ĐOẠN: HIỂN THỊ CÁC BÌNH LUẬN KHÁCH HÀNG TẠI ĐÁY MODAL */}
            <hr style={{ margin: '20px 0 15px 0', border: '0', borderTop: '1px dashed #eee' }} />
            
            <div className="tc-modal-reviews-section" style={{ padding: '0 10px 15px 10px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#222', marginBottom: '12px' }}>
                Đánh giá đóng góp ({danhSachBinhLuan.length})
              </h3>

              {loadingBinhLuan ? (
                <div style={{ textAlign: 'center', color: '#777', padding: '15px 0', fontSize: '13px' }}>
                  Đang đồng bộ danh sách nhận xét...
                </div>
              ) : danhSachBinhLuan.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto', paddingRight: '5px' }}>
                  {danhSachBinhLuan.map((bl, idx) => (
                    <div key={bl._id || idx} style={{ background: '#f8f9fa', padding: '10px 12px', borderRadius: '6px', border: '1px solid #f1f2f3' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        {/* Đọc trường full_name từ cấu trúc populate của user_id */}
                        <strong style={{ fontSize: '13px', color: '#333' }}>
                          {bl.user_id?.full_name || "Khách hàng hệ thống"}
                        </strong>
                        <span style={{ color: '#ffb800', fontSize: '11px' }}>
                          {"⭐".repeat(bl.rating || 5)}
                        </span>
                      </div>
                      {/* Đọc trường comment_text chính xác từ ReviewSchema */}
                      <p style={{ margin: 0, fontSize: '12.5px', color: '#555', lineHeight: '1.4' }}>
                        {bl.comment_text || "Khách hàng không để lại nội dung bằng văn bản."}
                      </p>
                      {bl.createdAt && (
                        <span style={{ display: 'block', fontSize: '10px', color: '#aaa', marginTop: '4px', textAlign: 'right' }}>
                          {new Date(bl.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#999', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', padding: '15px 0', margin: 0 }}>
                  Chưa có bình luận nào cho sản phẩm này.
                </p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* FOOTER TRANG WEB */}
      <footer className="tc-footer">
        <p className="mb-1">© 2026 <strong>MilkTea Paradise</strong> Đặt món nhanh và tiện lợi.</p>
        <p className="tc-footer-sub">Hệ thống đang hoạt động với dữ liệu đồng bộ thời gian thực.</p>
      </footer>

      <ChatAI customerId={khachHangId} />

      <ModalDiaChiGiaoHang
        isOpen={modalDiaChi}
        batBuoc={batBuocDiaChi}
        userId={khachHangId}
        onSuccess={handleDiaChiThanhCong}
        onClose={() => setModalDiaChi(false)}
      />

      <ModalDatHang
        isOpen={showModalDatHang}
        onClose={() => {
          setShowModalDatHang(false);
          setSanPhamDatNgay(null);
        }}
        gioHang={sanPhamDatNgay ? [sanPhamDatNgay] : gioHang}
        nguoiDung={nguoiDung}
        diaChiGiaoHang={diaChiGiaoHang}
        userId={khachHangId}
        onSuccess={handleDatHangThanhCong}
      />
    </div>
  );
};

export default TrangChu;
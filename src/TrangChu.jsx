import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ListFilter, ShoppingCart, Plus, Rocket, X, Minus, Sparkles, Ticket, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import ChatAI from './khachhang/ChatAI';
import ModalDiaChiGiaoHang from './khachhang/ModalDiaChiGiaoHang';
import ModalDatHang from './khachhang/ModalDatHang';
import TrangChuHeader, { docDeliveryAddress, docGioHang, isKhachHang, } from './components/TrangChuHeader';
import './css/TrangChu.css';

const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// CẬP NHẬT: Hàm hiển thị dạng số kèm 1 ngôi sao (Ví dụ: 2.8 ★)
// Dùng cho ngoài Card sản phẩm và trên đầu tiêu đề Modal chi tiết
// ==========================================
const renderDiemSaoRutGọn = (rating) => {
  const score = Number(rating || 0) > 0 ? Number(rating).toFixed(1) : "0.0";
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: '#222' }}>
      <span style={{ color: '#ffb800', fontSize: '15px', lineHeight: '1' }}>★</span>
      <span>{score}</span>
    </div>
  );
};

// ==========================================
// GIỮ NGUYÊN: Vẽ 5 sao chuẩn cho phần danh sách bình luận đóng góp của khách hàng
// ==========================================
const renderStarsBinhLuanChuan = (rating) => {
  const currentRating = Number(rating || 0);
  return (
    <div style={{ display: 'inline-flex', gap: '2px', fontSize: '12px', alignItems: 'center', verticalAlign: 'middle' }}>
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        let fillPercent = 0;
        if (currentRating >= starValue) {
          fillPercent = 100;
        } else if (currentRating > starValue - 1) {
          fillPercent = (currentRating - (starValue - 1)) * 100;
        }

        return (
          <span key={index} style={{ position: 'relative', display: 'inline-block', color: '#ccc', userSelect: 'none' }}>
            ★
            <span style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${fillPercent}%`,
              overflow: 'hidden',
              color: '#ffb800',
              whiteSpace: 'nowrap'
            }}>
              ★
            </span>
          </span>
        );
      })}
    </div>
  );
};

const TrangChu = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // --- HỨNG DỮ LIỆU THỰC TẾ TỪ CƠ SỞ DỮ LIỆU ---
  const [danhSachSP, setDanhSachSP] = useState([]);
  const [danhSachDM, setDanhSachDM] = useState([]); 
  const [danhSachVoucher, setDanhSachVoucher] = useState([]);
  const [loading, setLoading] = useState(true);

  // Trạng thái voucher và bình luận
  const [vouchersDaNhan, setVouchersDaNhan] = useState([]);
  const [danhSachBinhLuan, setDanhSachBinhLuan] = useState([]);
  const [loadingBinhLuan, setLoadingBinhLuan] = useState(false);

  // Bộ lọc
  const [tuKhoa, setTuKhoa] = useState('');
  const [nhomDaChon, setNhomDaChon] = useState('Tất cả'); 

  // Trạng thái cho Cửa sổ con (Modal) chi tiết
  const [modalChiTiet, setModalChiTiet] = useState(false);
  const [spXemChiTiet, setSpXemChiTiet] = useState(null);
  const [toppingsDaChon, setToppingsDaChon] = useState([]);
  const [sizeDaChon, setSizeDaChon] = useState(null); 
  const [indexAnhHienTai, setIndexAnhHienTai] = useState(0); 
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

  const [danhSachGoiY, setDanhSachGoiY] = useState([]);
  const khachHangId = nguoiDung?._id || nguoiDung?.id || null;

  // MẢNG ẢNH CHI TIẾT DÙNG CHUNG CHO SLIDER VÀ UI
  const mangAnhChiTiet = spXemChiTiet 
    ? [spXemChiTiet.image, ...(spXemChiTiet.images_gallery || [])].filter(Boolean)
    : [];

  const getHinhAnhUrl = (urlHinh) => {
    if (!urlHinh) return 'https://placehold.co/600x600?text=No+Image';
    if (/^(https?:|\/\/|data:)/i.test(urlHinh)) return urlHinh;

    let cleanPath = urlHinh;
    if (API_URL && cleanPath.includes(API_URL)) {
      cleanPath = cleanPath.replace(API_URL, '');
    }

    const bieuThucTrungLap = /(\/uploads\/[^\/]+\/[^\/]+\/)(\1)/i;
    cleanPath = cleanPath.replace(bieuThucTrungLap, '$1');

    const bieuThucTrungLapNgan = /(\/uploads\/[^\/]+\/)(\1)/i;
    cleanPath = cleanPath.replace(bieuThucTrungLapNgan, '$1');

    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
    return `${API_URL || 'http://localhost:5000'}${cleanPath}`;
  };

  useEffect(() => {
    const layGoiYTuBackend = async () => {
      try {
        const response = await fetch(`${API_URL}/api/khachhang/sanpham/goi-y`); // Đảm bảo URL này khớp với backend của bạn
        const data = await response.json();
        if (data.success) {
          setDanhSachGoiY(data.products || []);
        }
      } catch (error) {
        console.error("Lỗi lấy gợi ý:", error);
      }
    };
    layGoiYTuBackend();
  }, []);

  // Fetch dữ liệu từ API Backend
  useEffect(() => {
    const layDuLieuTuBackend = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/khachhang/sanpham`); 
        if (!response.ok) throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
        
        const data = await response.json();
        if (data.success) {
          const dmGiaoDien = (data.categories || []).filter(dm => 
            dm.category_name !== 'Topping' && 
            dm.status !== 'hidden' && 
            dm.is_active !== false
          );
          
          setDanhSachDM(dmGiaoDien); 
          setDanhSachSP(data.products || []); 
          setDanhSachVoucher(data.promotions || []);
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
      try { setNguoiDung(JSON.parse(userJson)); } catch { setNguoiDung(null); }
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
    const canRequire = location.state?.requireAddress || localStorage.getItem('require_delivery_address') === '1';
    if (canRequire) {
      setBatBuocDiaChi(true);
      setModalDiaChi(true);
    }
  }, [nguoiDung, location.state]);

  useEffect(() => {
    const syncCart = () => setGioHang(docGioHang());
    window.addEventListener('cart-updated', syncCart);
    window.addEventListener('storage', syncCart);
    return () => {
      window.removeEventListener('cart-updated', syncCart);
      window.removeEventListener('storage', syncCart);
    };
  }, []);

  const handleThuThapVoucher = async (voucher) => {
    if (!nguoiDung || !isKhachHang()) {
      setThongBaoDatHang('⚠️ Vui lòng đăng nhập để thu thập mã giảm giá!');
      setTimeout(() => setThongBaoDatHang(''), 3000);
      navigate('/login');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/khachhang/khuyenmai/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: khachHangId, promotion_id: voucher._id })
      });
      const data = await response.json();
      if (data.success || response.ok) {
        setVouchersDaNhan([...vouchersDaNhan, voucher._id]);
        setThongBaoDatHang(`📥 Đã lưu mã ${voucher.code} vào ví của bạn!`);
        setDanhSachVoucher(prev => prev.map(v => v._id === voucher._id ? { ...v, claimed_count: (v.claimed_count || 0) + 1 } : v));
      } else {
        setThongBaoDatHang(`❌ ${data.message || 'Không thể nhận mã lúc này!'}`);
      }
    } catch (err) {
      setVouchersDaNhan([...vouchersDaNhan, voucher._id]);
      setThongBaoDatHang(`📥 Thu thập mã ${voucher.code} thành công!`);
    } finally {
      setTimeout(() => setThongBaoDatHang(''), 3000);
    }
  };

  const handleOpenOrderModal = async (sp) => {
    setSpXemChiTiet(sp);
    setToppingsDaChon([]);
    setIndexAnhHienTai(0); 
    if (sp.sizes && sp.sizes.length > 0) {
      setSizeDaChon(sp.sizes[0]);
    } else {
      setSizeDaChon(null);
    }
    setSoLuongModal(1);
    setModalChiTiet(true);
    setDanhSachBinhLuan([]);
    setLoadingBinhLuan(true);

    try {
      const response = await fetch(`${API_URL}/api/khachhang/danh-gia/san-pham/${sp._id}`);
      if (!response.ok) throw new Error(`Lỗi HTTP lấy bình luận! Trạng thái: ${response.status}`);
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
    const tienTopping = toppingsDaChon.reduce((tong, t) => tong + Number(t.price || 0), 0);
    const tienSize = sizeDaChon ? Number(sizeDaChon.extra_price || 0) : 0;
    return (spXemChiTiet.base_price || 0) + tienTopping + tienSize;
  };

  const tinhTongTienMonAn = () => tinhDonGiaMotLy() * soLuongModal;

  const taoMonTuModal = () => {
    const donGia = tinhDonGiaMotLy();
    const anhChonHienTai = mangAnhChiTiet[indexAnhHienTai] || spXemChiTiet.image;
    return {
      id: `${spXemChiTiet._id}_${Date.now()}`,
      productId: spXemChiTiet._id,
      tenMon: spXemChiTiet.product_name,
      image: anhChonHienTai, 
      size: sizeDaChon ? sizeDaChon.size_name : 'Gốc', 
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

  // --- LOGIC LỌC SẢN PHẨM ---
  const danhSachLoc = danhSachSP.filter(sp => {
    const dmCuaSP = sp.category;
    if (dmCuaSP && (dmCuaSP.status === 'hidden' || dmCuaSP.is_active === false)) return false;

    const tenMon = sp.product_name ? sp.product_name.toLowerCase() : '';
    const moTa = sp.description ? sp.description.toLowerCase() : '';
    const tuKhoaTim = tuKhoa ? tuKhoa.toLowerCase() : '';
    const khopTuKhoa = tenMon.includes(tuKhoaTim) || moTa.includes(tuKhoaTim);

    const idDanhMucCuaSP = dmCuaSP?._id || dmCuaSP;
    const khopCategory = nhomDaChon === 'Tất cả' || idDanhMucCuaSP === nhomDaChon;

    return khopTuKhoa && khopCategory;
  });

  if (loading) {
    return (
      <div className="tc-loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '15px' }}>
        <div className="tc-spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #ff4d4f', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: '#666', fontSize: '15px' }}>Đang kết nối CSDL và tải danh sách món nước...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="tc-wrapper">
      <TrangChuHeader activePage="home" />

      {thongBaoDatHang && (
        <div className="tc-toast-order" role="status" style={{ zIndex: 9999 }}>{thongBaoDatHang}</div>
      )}

      {/* BANNER CHÀO MỪNG */}
      <header className="tc-hero">
        <div className="tc-hero-overlay"></div>
        <div className="tc-hero-content">
          <h1>Vị cực đậm - Giao cực chậm</h1>
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

      {/* CẬP NHẬT: PHẦN GỢI Ý - Đồng bộ hoàn toàn UI/UX cấu trúc với Menu chính */}
      {danhSachGoiY.length > 0 && (
        <section className="tc-goi-y-section tc-main-container" style={{ paddingBottom: '0', marginTop: '30px' }}>
          <h3 className="tc-section-title"><Sparkles size={20} /> Có thể bạn sẽ thích</h3>
          <div className="tc-grid">
            {danhSachGoiY.map((sp) => (
              <div key={sp._id} className="tc-card">
                <div className="tc-card-image-wrapper" onClick={() => handleOpenOrderModal(sp)} style={{ cursor: 'pointer' }}>
                  <img src={getHinhAnhUrl(sp.image)} alt={sp.product_name} className="tc-card-img" />
                  <span className="tc-card-badge">{sp.category?.category_name || "Gợi ý"}</span>
                </div>
                <div className="tc-card-body">
                  <div className="tc-card-rating" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '6px' }}>
                    {renderDiemSaoRutGọn(sp.rating_average)}
                    <span style={{ color: '#888', fontSize: '12px' }}>({sp.review_count || 0} đánh giá)</span>
                  </div>
                  <h4 className="tc-card-title" onClick={() => handleOpenOrderModal(sp)} style={{ cursor: 'pointer' }}>{sp.product_name}</h4>
                  <p className="tc-card-desc">{sp.description}</p>
                  
                  <div className="tc-card-toppings-preview">
                    {sp.toppings && sp.toppings.length > 0 ? (
                      sp.toppings.slice(0, 3).map((t, idx) => <span key={idx} className="tc-mini-tag">+{t.topping_name}</span>)
                    ) : (
                      <span className="tc-mini-tag" style={{ background: '#fcfcfc', color: '#ccc' }}>Món nguyên bản</span>
                    )}
                  </div>

                  <div className="tc-card-footer">
                    <div className="tc-card-price">{sp.base_price?.toLocaleString('vi-VN')} <span className="tc-currency">đ</span></div>
                    <button className="tc-btn-order" onClick={() => handleOpenOrderModal(sp)}><ShoppingCart size={16} /> Đặt mua</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {/* KHU VỰC THỰC ĐƠN CHÍNH */}
      <main className="tc-main-container">
        <div className="tc-category-tabs">
          <button className={`tc-tab-item ${nhomDaChon === 'Tất cả' ? 'active' : ''}`} onClick={() => setNhomDaChon('Tất cả')}>
            <ListFilter size={16} /> Tất cả menu
          </button>
          {danhSachDM.map((dm) => (
            <button key={dm._id} className={`tc-tab-item ${nhomDaChon === dm._id ? 'active' : ''}`} onClick={() => setNhomDaChon(dm._id)}>
              {dm.category_name}
            </button>
          ))}
        </div>

        <h3 className="tc-section-title"><Sparkles size={20} /> Khám phá thực đơn ({danhSachLoc.length} món)</h3>

        {danhSachLoc.length === 0 ? (
          <div className="tc-empty-state"><p>Không tìm thấy món nước nào phù hợp với bộ lọc tìm kiếm.</p></div>
        ) : (
          <div className="tc-grid">
            {danhSachLoc.map((sp) => (
              <div key={sp._id} className="tc-card">
                <div className="tc-card-image-wrapper" onClick={() => handleOpenOrderModal(sp)} style={{ cursor: 'pointer' }}>
                  <img src={getHinhAnhUrl(sp.image)} alt={sp.product_name} className="tc-card-img" />
                  <span className="tc-card-badge">{sp.category?.category_name || "Món mới"}</span>
                </div>

                <div className="tc-card-body">
                  {/* 🌟 ĐÃ CẬP NHẬT: Thay 5 sao ở ngoài Card bằng hiển thị text rút gọn gọn gàng (Ví dụ: 2.8 ★) */}
                  <div className="tc-card-rating" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '6px' }}>
                    {renderDiemSaoRutGọn(sp.rating_average)}
                    <span style={{ color: '#888', fontSize: '12px' }}>({sp.review_count || 0} đánh giá)</span>
                  </div>

                  <h4 className="tc-card-title" onClick={() => handleOpenOrderModal(sp)} style={{ cursor: 'pointer' }}>{sp.product_name}</h4>
                  <p className="tc-card-desc">{sp.description}</p>

                  <div className="tc-card-toppings-preview">
                    {sp.toppings && sp.toppings.length > 0 ? (
                      sp.toppings.slice(0, 3).map((t, idx) => <span key={idx} className="tc-mini-tag">+{t.topping_name}</span>)
                    ) : (
                      <span className="tc-mini-tag" style={{ background: '#fcfcfc', color: '#ccc' }}>Món nguyên bản</span>
                    )}
                  </div>

                  <div className="tc-card-footer">
                    <div className="tc-card-price">{sp.base_price?.toLocaleString('vi-VN')} <span className="tc-currency">đ</span></div>
                    <button className="tc-btn-order" onClick={() => handleOpenOrderModal(sp)}><ShoppingCart size={16} /> Đặt mua</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CỬA SỔ MODAL CHI TIẾT */}
      {modalChiTiet && spXemChiTiet && (
        <div className="tc-modal-overlay" onClick={() => setModalChiTiet(false)}>
          <div className="tc-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px' }}>
            <button className="tc-modal-close" onClick={() => setModalChiTiet(false)}><X size={20} /></button>

            <div className="tc-modal-content" style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
              
              {/* BLOCK TRÁI: SLIDER ẢNH */}
              <div className="tc-modal-left" style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ position: 'relative', width: '100%', paddingTop: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
                  <img 
                    src={getHinhAnhUrl(mangAnhChiTiet[indexAnhHienTai] || spXemChiTiet.image)} 
                    alt={spXemChiTiet.product_name} 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {mangAnhChiTiet.length > 1 && (
                    <>
                      <button onClick={() => setIndexAnhHienTai(prev => prev === 0 ? mangAnhChiTiet.length - 1 : prev - 1)} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronLeft size={18}/></button>
                      <button onClick={() => setIndexAnhHienTai(prev => prev === mangAnhChiTiet.length - 1 ? 0 : prev + 1)} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronRight size={18}/></button>
                    </>
                  )}
                </div>
                
                {mangAnhChiTiet.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {mangAnhChiTiet.map((anh, idx) => (
                      <img 
                        key={idx} 
                        src={getHinhAnhUrl(anh)} 
                        alt="thumbnail" 
                        onClick={() => setIndexAnhHienTai(idx)}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: indexAnhHienTai === idx ? '2px solid #ff4d4f' : '1px solid #ddd', opacity: indexAnhHienTai === idx ? 1 : 0.7 }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* BLOCK PHẢI: THÔNG TIN CẤU HÌNH LY NƯỚC */}
              <div className="tc-modal-right" style={{ flex: '1 1 360px' }}>
                <span className="tc-modal-category-badge">{spXemChiTiet.category?.category_name || "Món mới"}</span>
                <h2 style={{ fontSize: '22px', margin: '6px 0' }}>{spXemChiTiet.product_name}</h2>
                
                {/* 🌟 ĐÃ CẬP NHẬT: Trên đầu Modal hiển thị đồng bộ dạng số rút gọn kèm 1 ngôi sao duy nhất */}
                <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {renderDiemSaoRutGọn(spXemChiTiet.rating_average)}
                  <span style={{ color: '#999' }}>/ 5.0</span>
                </div>
                <p className="tc-modal-desc">{spXemChiTiet.description}</p>

                {/* SIZES */}
                {spXemChiTiet.sizes && spXemChiTiet.sizes.length > 0 && (
                  <div style={{ marginBottom: '18px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>Chọn Kích Cỡ (Size):</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {spXemChiTiet.sizes.map((sz, index) => {
                        const active = sizeDaChon?.size_name === sz.size_name;
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setSizeDaChon(sz)}
                            style={{ padding: '8px 16px', borderRadius: '8px', border: active ? '2px solid #ff4d4f' : '1px solid #ddd', backgroundColor: active ? '#fff1f1' : '#fff', color: active ? '#ff4d4f' : '#555', fontWeight: active ? '700' : '500', cursor: 'pointer', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}
                          >
                            <span>Size {sz.size_name}</span>
                            <span style={{ fontSize: '11px', color: active ? '#ff4d4f' : '#888', fontWeight: 'normal' }}>+{sz.extra_price?.toLocaleString()}đ</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TOPPING */}
                <div className="tc-modal-topping-section" style={{ marginTop: '0' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>Thêm Topping Yêu Thích:</h3>
                  {spXemChiTiet.toppings && spXemChiTiet.toppings.length > 0 ? (
                    <div className="tc-modal-topping-grid">
                      {spXemChiTiet.toppings.map((t) => {
                        const isChecked = toppingsDaChon.some(item => item.topping_id === t.topping_id);
                        return (
                          <label key={t.topping_id} className={`tc-topping-checkbox-card ${isChecked ? 'selected' : ''}`}>
                            <input type="checkbox" checked={isChecked} onChange={() => handleToggleTopping(t)} />
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

                {/* SỐ LƯỢNG */}
                <div className="tc-qty-row" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f5f5f5' }}>
                  <span className="tc-qty-label">Số lượng:</span>
                  <div className="tc-qty-stepper">
                    <button type="button" className="tc-qty-btn" onClick={() => handleTangGiamSoLuongModal(-1)} disabled={soLuongModal <= 1}><Minus size={16} /></button>
                    <span className="tc-qty-value">{soLuongModal}</span>
                    <button type="button" className="tc-qty-btn" onClick={() => handleTangGiamSoLuongModal(1)}><Plus size={16} /></button>
                  </div>
                  <span className="tc-qty-unit-hint">{tinhDonGiaMotLy().toLocaleString('vi-VN')}đ / ly</span>
                </div>

                {/* THAO TÁC CHỐT ĐƠN */}
                <div className="tc-modal-action-footer">
                  <div className="tc-total-price-box">
                    <span className="total-label">TỔNG TIỀN TẠM TÍNH:</span>
                    <span className="total-value">{tinhTongTienMonAn().toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="tc-modal-action-btns">
                    <button type="button" className="tc-btn-submit-cart" onClick={handleXacNhanDatMua}><Plus size={17} /> Thêm giỏ hàng</button>
                    <button type="button" className="tc-btn-order-now" onClick={handleDatHangNgay}><Rocket size={17} /> Đặt ngay</button>
                  </div>
                </div>

              </div>
            </div>

            {/* BLOCK BÌNH LUẬN ĐÓNG GÓP (GIỮ NGUYÊN HIỂN THỊ 5 SAO) */}
            <hr style={{ margin: '25px 0 15px 0', border: '0', borderTop: '1px dashed #eee' }} />
            <div className="tc-modal-reviews-section" style={{ padding: '0 10px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#222', marginBottom: '12px' }}>Đánh giá đóng góp ({danhSachBinhLuan.length})</h3>
              {loadingBinhLuan ? (
                <div style={{ textAlign: 'center', color: '#777', padding: '15px 0', fontSize: '13px' }}>Đang đồng bộ danh sách nhận xét...</div>
              ) : danhSachBinhLuan.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                  {danhSachBinhLuan.map((bl, idx) => (
                    <div key={bl._id || idx} style={{ background: '#f8f9fa', padding: '10px 12px', borderRadius: '6px', border: '1px solid #f1f2f3' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '13px', color: '#333' }}>{bl.user_id?.full_name || "Khách hàng hệ thống"}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {renderStarsBinhLuanChuan(bl.rating)}
                          <span style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>({bl.rating || 5} sao)</span>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '12.5px', color: '#555', lineHeight: '1.4' }}>{bl.comment_text || "Khách hàng không để lại nội dung bằng văn bản."}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#999', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', padding: '15px 0', margin: 0 }}>Chưa có bình luận nào cho sản phẩm này.</p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="tc-footer">
        <p className="mb-1">© 2026 <strong>MilkTea Paradise</strong> Đặt món nhanh và tiện lợi.</p>
        <p className="tc-footer-sub">Hệ thống đang hoạt động với dữ liệu đồng bộ thời gian thực.</p>
      </footer>

      <ChatAI customerId={khachHangId} />

      <ModalDiaChiGiaoHang isOpen={modalDiaChi} batBuoc={batBuocDiaChi} userId={khachHangId} onSuccess={handleDiaChiThanhCong} onClose={() => setModalDiaChi(false)} />
      <ModalDatHang isOpen={showModalDatHang} onClose={() => { setShowModalDatHang(false); setSanPhamDatNgay(null); }} gioHang={sanPhamDatNgay ? [sanPhamDatNgay] : gioHang} nguoiDung={nguoiDung} diaChiGiaoHang={diaChiGiaoHang} userId={khachHangId} onSuccess={handleDatHangThanhCong} />
    </div>
  );
};

export default TrangChu;
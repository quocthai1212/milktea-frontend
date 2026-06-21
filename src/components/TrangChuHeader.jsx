import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Tags, Info, MapPin, User, LogIn, LogOut, ShoppingCart, X, Minus, Plus, Rocket, CupSoda } from 'lucide-react';
import ModalDiaChiGiaoHang from '../khachhang/ModalDiaChiGiaoHang';
import ModalDatHang from '../khachhang/ModalDatHang';

const API_URL = import.meta.env.VITE_API_URL;

// 🌟 HÀM XỬ LÝ ĐƯỜNG DẪN HÌNH ẢNH TỪ BACKEND ĐỂ HIỂN THỊ TRÊN GIỎ HÀNG
export const getHinhAnhUrl = (urlHinh) => {
  if (!urlHinh) return 'https://placehold.co/600x600?text=No+Image';
  
  if (/^(https?:|\/\/|data:)/i.test(urlHinh)) {
    return urlHinh;
  }

  let cleanPath = urlHinh;
  if (API_URL && cleanPath.includes(API_URL)) {
    cleanPath = cleanPath.replace(API_URL, '');
  }

  const bieuThucTrungLap = /(\/uploads\/[^\/]+\/[^\/]+\/)(\1)/i;
  cleanPath = cleanPath.replace(bieuThucTrungLap, '$1');

  const bieuThucTrungLapNgan = /(\/uploads\/[^\/]+\/)(\1)/i;
  cleanPath = cleanPath.replace(bieuThucTrungLapNgan, '$1');

  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }

  const gocBackend = API_URL || 'http://localhost:5000';
  return `${gocBackend}${cleanPath}`;
};

const docDeliveryAddress = () => {
  try {
    const raw = localStorage.getItem('delivery_address');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const chuanHoaItemGio = (item) => {
  const donGia = item.donGia ?? item.tongTien ?? 0;
  const soLuong = Math.max(1, item.soLuong ?? 1);
  return { ...item, donGia, soLuong, tongTien: donGia * soLuong };
};

const docGioHang = () => {
  try {
    const raw = localStorage.getItem('milktea_gio_hang');
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.map(chuanHoaItemGio) : [];
  } catch {
    return [];
  }
};

const isKhachHang = () => Number(localStorage.getItem('role_id')) === 3;

const TrangChuHeader = ({ activePage = 'home' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const gioHangRef = useRef(null);

  const [nguoiDung, setNguoiDung] = useState(null);
  const [gioHang, setGioHang] = useState(docGioHang);
  const [moGioHang, setMoGioHang] = useState(false);
  const [diaChiGiaoHang, setDiaChiGiaoHang] = useState(docDeliveryAddress);
  const [modalDiaChi, setModalDiaChi] = useState(false);
  const [modalDatHang, setModalDatHang] = useState(false);
  const [thongBaoGio, setThongBaoGio] = useState('');

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
    }
    setDiaChiGiaoHang(docDeliveryAddress());
    setGioHang(docGioHang());
  }, [location.pathname]);

  useEffect(() => {
    const syncCart = () => setGioHang(docGioHang());
    window.addEventListener('cart-updated', syncCart);
    return () => window.removeEventListener('cart-updated', syncCart);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (gioHangRef.current && !gioHangRef.current.contains(e.target)) {
        setMoGioHang(false);
      }
    };
    if (moGioHang) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moGioHang]);

  const tinhTongGioHang = () =>
    gioHang.reduce((tong, item) => tong + (item.tongTien ?? 0), 0);

  const tinhTongSoLuongGio = () =>
    gioHang.reduce((tong, item) => tong + (item.soLuong ?? 1), 0);

  const luuGioHang = (next) => {
    setGioHang(next);
    localStorage.setItem('milktea_gio_hang', JSON.stringify(next));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleTangGiamSoLuongGio = (id, delta) => {
    const next = gioHang.map((item) => {
      if (item.id !== id) return item;
      const donGia = item.donGia ?? item.tongTien;
      const soLuong = Math.max(1, (item.soLuong ?? 1) + delta);
      return { ...item, donGia, soLuong, tongTien: donGia * soLuong };
    });
    luuGioHang(next);
  };

  const handleDatHangTuGio = () => {
    if (gioHang.length === 0) return;

    if (!nguoiDung || !isKhachHang()) {
      setMoGioHang(false);
      navigate('/login');
      return;
    }

    if (!diaChiGiaoHang?.address_detail) {
      setMoGioHang(false);
      setModalDiaChi(true);
      setThongBaoGio('Vui lòng cập nhật địa chỉ giao hàng trước khi đặt!');
      setTimeout(() => setThongBaoGio(''), 4000);
      return;
    }

    if (!diaChiGiaoHang?.latitude || !diaChiGiaoHang?.longitude) {
      setMoGioHang(false);
      setModalDiaChi(true);
      setThongBaoGio('Địa chỉ cần có tọa độ GPS. Vui lòng cập nhật lại địa chỉ!');
      setTimeout(() => setThongBaoGio(''), 4000);
      return;
    }

    setMoGioHang(false);
    setModalDatHang(true);
  };

  const handleDatHangThanhCong = () => {
    luuGioHang([]);
    setModalDatHang(false);
    setMoGioHang(false);
    setThongBaoGio('Đặt hàng thành công!');
    setTimeout(() => setThongBaoGio(''), 3500);
  };

  const handleXoaKhoiGio = (id) => {
    luuGioHang(gioHang.filter((item) => item.id !== id));
  };

  const handleDangXuat = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role_id');
    localStorage.removeItem('user_logged_in');
    localStorage.removeItem('delivery_address');
    localStorage.removeItem('require_delivery_address');
    localStorage.removeItem('milktea_gio_hang');
    setGioHang([]);
    window.dispatchEvent(new Event('cart-updated'));
    navigate('/');
    window.location.reload();
  };

  const handleDiaChiThanhCong = (diaChi) => {
    setDiaChiGiaoHang(diaChi);
    localStorage.setItem('delivery_address', JSON.stringify(diaChi));
    setModalDiaChi(false);
  };

  const khachHangId = nguoiDung?._id || nguoiDung?.id || null;
  const tongSoLuong = tinhTongSoLuongGio();

  return (
    <>
      {thongBaoGio && (
        <div className="tc-toast-order tc-toast-order--header" role="status">
          {thongBaoGio}
        </div>
      )}
      <nav className="tc-navbar">
        <div className="tc-nav-container">
          <Link to="/" className="tc-logo">
            <CupSoda size={24} className="tc-logo-icon" />
            <span><span className="tc-logo-highlight">MilkTea</span> Paradise</span>
          </Link>

          <div className="tc-nav-right">
            {nguoiDung && isKhachHang() && diaChiGiaoHang?.address_detail && (
              <button
                type="button"
                className="tc-nav-address"
                onClick={() => setModalDiaChi(true)}
                title={diaChiGiaoHang.address_detail}
              >
                <MapPin size={16} className="tc-nav-address-icon" />
                <span className="tc-nav-address-text">{diaChiGiaoHang.address_detail}</span>
              </button>
            )}

            <div className="tc-nav-links">
              <Link to="/" className={activePage === 'home' ? 'active' : ''}>
                <Home size={16} /> Trang chủ
              </Link>
              <Link 
                to="/khkhuyen-mai" 
                className={activePage === 'promotions' ? 'active' : ''}
              >
                <Tags size={16} /> Khuyến mãi
              </Link>
             
            </div>

            <div className="tc-nav-actions">
              {nguoiDung ? (
                <>
                  {isKhachHang() && (
                    <Link
                      to="/khachhang"
                      className={`tc-nav-user ${activePage === 'khachhang' ? 'active' : ''}`}
                      title="Tài khoản khách hàng"
                    >
                      <User size={16} className="tc-nav-user-icon" />
                      <span className="tc-nav-user-name">
                        {nguoiDung.full_name || nguoiDung.email || 'Tài khoản'}
                      </span>
                    </Link>
                  )}
                  {!isKhachHang() && (
                    <span className="tc-nav-user tc-nav-user-static">
                      <User size={16} className="tc-nav-user-icon" />
                      <span className="tc-nav-user-name">
                        {nguoiDung.full_name || nguoiDung.email}
                      </span>
                    </span>
                  )}
                  <button type="button" className="tc-btn-nav-logout" onClick={handleDangXuat}>
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </>
              ) : (
                <Link to="/login" className="tc-btn-nav-login">
                  <LogIn size={16} className="tc-nav-action-icon" />
                  Đăng nhập
                </Link>
              )}

              <div className="tc-cart-wrapper" ref={gioHangRef}>
                <button
                  type="button"
                  className="tc-btn-nav-cart"
                  onClick={() => setMoGioHang((prev) => !prev)}
                  aria-expanded={moGioHang}
                  aria-label="Giỏ hàng"
                >
                  <ShoppingCart size={17} className="tc-nav-action-icon" />
                  Giỏ hàng
                  {tongSoLuong > 0 && <span className="tc-cart-badge">{tongSoLuong}</span>}
                </button>

                {moGioHang && (
                  <div className="tc-cart-dropdown">
                    <div className="tc-cart-dropdown-header">
                      <h4>Giỏ hàng của bạn</h4>
                      <span className="tc-cart-count">
                        {gioHang.length} dòng · {tongSoLuong} ly
                      </span>
                    </div>

                    {gioHang.length === 0 ? (
                      <p className="tc-cart-empty">
                        Chưa có món nào.{' '}
                        {activePage !== 'home' && (
                          <Link to="/" onClick={() => setMoGioHang(false)}>
                            Về trang chủ đặt món
                          </Link>
                        )}
                      </p>
                    ) : (
                      <>
                        <ul className="tc-cart-list">
                          {gioHang.map((item) => (
                            <li key={item.id} className="tc-cart-item">
                              {/* 🌟 FIX LỖI: Bọc item.image vào hàm xử lý đường dẫn ảnh từ Backend */}
                              <img src={getHinhAnhUrl(item.image)} alt={item.tenMon} className="tc-cart-item-img" />
                              <div className="tc-cart-item-info">
                                <span className="tc-cart-item-name">{item.tenMon}</span>
                                {item.toppings?.length > 0 && (
                                  <span className="tc-cart-item-topping">
                                    +{item.toppings.map((t) => t.topping_name).join(', ')}
                                  </span>
                                )}
                                <span className="tc-cart-item-price">
                                  {(item.donGia ?? item.tongTien).toLocaleString('vi-VN')}đ ×{' '}
                                  {item.soLuong ?? 1} = {item.tongTien.toLocaleString('vi-VN')}đ
                                </span>
                                <div className="tc-qty-stepper tc-qty-stepper--cart">
                                  <button
                                    type="button"
                                    className="tc-qty-btn tc-qty-btn--sm"
                                    onClick={() => handleTangGiamSoLuongGio(item.id, -1)}
                                    disabled={(item.soLuong ?? 1) <= 1}
                                    aria-label="Giảm"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="tc-qty-value tc-qty-value--sm">
                                    {item.soLuong ?? 1}
                                  </span>
                                  <button
                                    type="button"
                                    className="tc-qty-btn tc-qty-btn--sm"
                                    onClick={() => handleTangGiamSoLuongGio(item.id, 1)}
                                    aria-label="Tăng"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="tc-cart-item-remove"
                                onClick={() => handleXoaKhoiGio(item.id)}
                                aria-label="Xóa món"
                              >
                                <X size={16} />
                              </button>
                            </li>
                          ))}
                        </ul>
                        <div className="tc-cart-footer">
                          <div className="tc-cart-total">
                            <span>Tổng cộng ({tongSoLuong} ly):</span>
                            <strong>{tinhTongGioHang().toLocaleString('vi-VN')}đ</strong>
                          </div>
                          <button
                            type="button"
                            className="tc-btn-checkout"
                            onClick={handleDatHangTuGio}
                          >
                            <Rocket size={17} /> Đặt hàng
                          </button>
                          {!nguoiDung && (
                            <p className="tc-cart-login-hint">
                              <Link to="/login" onClick={() => setMoGioHang(false)}>
                                Đăng nhập
                              </Link>{' '}
                              để thanh toán nhanh hơn
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <ModalDiaChiGiaoHang
        isOpen={modalDiaChi}
        batBuoc={false}
        userId={khachHangId}
        onSuccess={handleDiaChiThanhCong}
        onClose={() => setModalDiaChi(false)}
      />

      <ModalDatHang
        isOpen={modalDatHang}
        onClose={() => setModalDatHang(false)}
        gioHang={gioHang}
        nguoiDung={nguoiDung}
        diaChiGiaoHang={diaChiGiaoHang}
        userId={khachHangId}
        onSuccess={handleDatHangThanhCong}
      />
    </>
  );
};

export default TrangChuHeader;
export { docDeliveryAddress, docGioHang, chuanHoaItemGio, isKhachHang };

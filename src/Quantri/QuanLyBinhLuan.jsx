import { useState, useEffect } from 'react';
import '../css/quantri/QuanLyBinhLuan.css';

// 🌟 IMPORT CÁC THÀNH PHẦN CỦA CHART.JS
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Đăng ký các module hệ thống của Chart.js bắt buộc phải có
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function QuanLyBinhLuan() {
  const [danhSachBL, setDanhSachBL] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBL, setSelectedBL] = useState(null);

  // States phục vụ chỉnh sửa bình luận
  const [isEditing, setIsEditing] = useState(false);
  const [editCommentText, setEditCommentText] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editStatus, setEditStatus] = useState('approved'); 

  // States quản lý từ khóa cấm (Bad Words)
  const [danhSachTuCam, setDanhSachTuCam] = useState([]);
  const [tuCamMoi, setTuCamMoi] = useState('');

  // States đóng mở các modal xác nhận hành động
  const [moXoaModal, setMoXoaModal] = useState(false);
  const [blCanXoa, setBlCanXoa] = useState(null);

  const [moKhoaUserModal, setMoKhoaUserModal] = useState(false);
  const [userCanKhoa, setUserCanKhoa] = useState(null);

  // States phục vụ lưu trữ dữ liệu thống kê cảm xúc AI
  const [thongKeAI, setThongKeAI] = useState({
    tongSoBinhLuan: 0,
    soLuongChiTiet: { positive: 0, negative: 0, neutral: 0, unknown: 0 },
    tyLePhanTram: { positive: 0, negative: 0, neutral: 0, unknown: 0 },
    topSanPhamBiChe: []
  });

  // Hệ thống Toast thông báo (Tự ẩn sau 4 giây)
  const [toast, setToast] = useState({ hienThi: false, message: '', type: 'success' });

  const hienThongBao = (message, type = 'success') => {
    setToast({ hienThi: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, hienThi: false })), 4000);
  };

  // 1. LẤY DANH SÁCH BÌNH LUẬN
  const fetchBinhLuan = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/quantri/qt_binhluan/all`);
      const result = await response.json();
      if (result.success) {
        setDanhSachBL(result.data);
      } else {
        hienThongBao(result.message || 'Không thể lấy dữ liệu bình luận', 'error');
      }
    } catch (error) {
      console.error(error);
      hienThongBao('Lỗi kết nối đến máy chủ Backend!', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. LẤY DANH SÁCH TỪ KHÓA CẤM
  const fetchTuCam = async () => {
    try {
      const response = await fetch(`${API_URL}/api/quantri/qt_binhluan/badwords/all`);
      const result = await response.json();
      if (result.success) {
        setDanhSachTuCam(result.data);
      }
    } catch (error) {
      console.error('Không thể lấy danh sách từ cấm:', error);
    }
  };

  // 3. Gọi API lấy thống kê phân tích cảm xúc từ Backend
  const fetchThongKeAI = async () => {
    try {
      const response = await fetch(`${API_URL}/api/quantri/qt_binhluan/sentiment-stats`);
      const result = await response.json();
      if (result.success && result.data) {
        setThongKeAI(result.data);
      }
    } catch (error) {
      console.error('Lỗi tải thống kê cảm xúc AI:', error);
    }
  };

  useEffect(() => {
    fetchBinhLuan();
    fetchTuCam();
    fetchThongKeAI(); 
  }, []);

  // 3. THÊM TỪ KHÓA CẤM MỚI
  const handleThemTuCam = async (e) => {
    e.preventDefault();
    if (!tuCamMoi.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/quantri/qt_binhluan/badwords/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: tuCamMoi }),
      });
      const result = await response.json();

      if (result.success) {
        hienThongBao(result.message, 'success');
        setTuCamMoi('');
        fetchTuCam();
      } else {
        hienThongBao(result.message, 'error');
      }
    } catch (error) {
      hienThongBao('Lỗi hệ thống, không thể thêm từ khóa cấm!', 'error');
    }
  };

  // 4. XÓA TỪ KHÓA CẤM
  const handleXoaTuCam = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/quantri/qt_binhluan/badwords/delete/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        hienThongBao(result.message, 'success');
        setDanhSachTuCam(danhSachTuCam.filter((item) => item._id !== id));
      } else {
        hienThongBao(result.message, 'error');
      }
    } catch (error) {
      hienThongBao('Lỗi hệ thống, không thể xóa từ khóa!', 'error');
    }
  };

  // 5. KHÓA HOẶC MỞ KHÓA TÀI KHOẢN USER
  const handleXacNhanKhoaUser = async () => {
    if (!userCanKhoa || !userCanKhoa.id) return;
    try {
      const targetTrangThai = !userCanKhoa.trangThaiHienTai;

      const response = await fetch(`${API_URL}/api/quantri/qt_binhluan/lock/${userCanKhoa.id}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: targetTrangThai })
      });
      const result = await response.json();
      
      if (result.success) {
        hienThongBao(result.message, 'success');
        
        setDanhSachBL(prevDanhSach => 
          prevDanhSach.map(bl => {
            if (bl.user_id && bl.user_id._id === userCanKhoa.id) {
              return {
                ...bl,
                user_id: { ...bl.user_id, is_active: targetTrangThai },
                status: targetTrangThai ? 'approved' : 'hidden'
              };
            }
            return bl;
          })
        );
        fetchThongKeAI(); 
      } else {
        hienThongBao(result.message, 'error');
      }
    } catch (error) {
      hienThongBao('Lỗi kết nối máy chủ không thể thực hiện thao tác!', 'error');
    } finally {
      setMoKhoaUserModal(false);
      setUserCanKhoa(null);
    }
  };

  // 6. XÓA BÌNH LUẬN KHỎI HỆ THỐNG
  const handleXacNhanXoaChinhThuc = async () => {
    if (!blCanXoa || !blCanXoa.id) return;
    try {
      const response = await fetch(`${API_URL}/api/quantri/qt_binhluan/delete/${blCanXoa.id}`, { 
        method: 'DELETE' 
      });
      const result = await response.json();
      if (result.success) {
        hienThongBao(result.message, 'success');
        setDanhSachBL(danhSachBL.filter((item) => item._id !== blCanXoa.id));
        fetchThongKeAI(); 
      } else {
        hienThongBao(result.message, 'error');
      }
    } catch (error) {
      hienThongBao('Lỗi kết nối máy chủ không thể xóa bình luận!', 'error');
    } finally {
      setMoXoaModal(false);
      setBlCanXoa(null);
    }
  };

  // 7. LƯU CẬP NHẬT CHỈNH SỬA BÌNH LUẬN
  const handleLuuChinhSua = async () => {
    if (!selectedBL) return;
    try {
      const response = await fetch(`${API_URL}/api/quantri/qt_binhluan/update/${selectedBL._id}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment_text: editCommentText,
          rating: Number(editRating),
          status: editStatus 
        }),
      });
      const result = await response.json();

      if (result.success) {
        hienThongBao(result.message, 'success');
        
        setDanhSachBL(prevDanhSach => 
          prevDanhSach.map(item => 
            item._id === selectedBL._id 
              ? { ...item, comment_text: editCommentText.trim(), rating: Number(editRating), status: editStatus }
              : item
          )
        );
        
        setIsModalOpen(false);
        setIsEditing(false);
        fetchThongKeAI(); 
      } else {
        hienThongBao(result.message, 'error');
      }
    } catch (error) {
      hienThongBao('Lỗi kết nối máy chủ, sửa thất bại!', 'error');
    }
  };

  const renderBadgeTrangThai = (bl) => {
    if (bl.status === 'hidden') {
      return <span className="qlbl-badge qlbl-badge-hidden">⚫ Ẩn</span>;
    }
    if (bl.user_id?.is_active === false) {
      return <span className="qlbl-badge qlbl-badge-user-locked">🚫 User Bị Khóa</span>;
    }
    return <span className="qlbl-badge qlbl-badge-approved">🟢 Hiển thị</span>;
  };

  const renderTagCamXucAI = (aiSentiment) => {
    const label = aiSentiment?.label || 'unknown';
    switch (label) {
      case 'positive':
        return <span className="ai-tag tag-positive">🟢 Tích cực</span>;
      case 'negative':
        return <span className="ai-tag tag-negative">🔴 Tiêu cực</span>;
      case 'neutral':
        return <span className="ai-tag tag-neutral">⚪ Trung tính</span>;
      default:
        return <span className="ai-tag tag-unknown">🟡 Không rõ</span>;
    }
  };

  // 🌟 ĐỔI MỚI: CẤU HÌNH DỮ LIỆU ĐỂ VẼ BIỂU ĐỒ (CHART DATA)
  const pieChartData = {
    labels: ['Tích cực (%)', 'Trung tính (%)', 'Tiêu cực (%)', 'Không xác định (%)'],
    datasets: [
      {
        data: [
          thongKeAI.tyLePhanTram.positive,
          thongKeAI.tyLePhanTram.neutral,
          thongKeAI.tyLePhanTram.negative,
          thongKeAI.tyLePhanTram.unknown,
        ],
        backgroundColor: ['#10b981', '#64748b', '#ef4444', '#f59e0b'], // Mã màu chuẩn UI hiện đại
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const barChartData = {
    labels: ['Tích cực', 'Trung tính', 'Tiêu cực', 'Không rõ'],
    datasets: [
      {
        label: 'Số lượng bình luận',
        data: [
          thongKeAI.soLuongChiTiet.positive,
          thongKeAI.soLuongChiTiet.neutral,
          thongKeAI.soLuongChiTiet.negative,
          thongKeAI.soLuongChiTiet.unknown,
        ],
        backgroundColor: ['rgba(16, 185, 129, 0.85)', 'rgba(100, 116, 139, 0.85)', 'rgba(239, 68, 68, 0.85)', 'rgba(245, 158, 11, 0.85)'],
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="qlbl-container">
      {/* 🔔 HỆ THỐNG TOAST THÔNG BÁO */}
      {toast.hienThi && (
        <div className={`qlbl-toast ${toast.type === 'success' ? 'success' : 'error'}`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
          <span className="qlbl-toast-close" onClick={() => setToast((p) => ({ ...p, hienThi: false }))}>
            &times;
          </span>
        </div>
      )}

      <h2 className="qlbl-main-title">💬 QUẢN LÝ BÌNH LUẬN & BIỂU ĐỒ AI PHÂN TÍCH</h2>

      {/* 🌟 GIAO DIỆN MỚI: KHU VỰC CHART DASHBOARD SIÊU ĐẸP */}
      <div className="ai-dashboard-section">
        <h3 className="ai-dashboard-title">📈 Hệ Thống Phân Tích Sắc Thái Bình Luận (Mô hình Trực Quan Gemini AI)</h3>
        <p className="ai-dashboard-subtitle">Tổng số đánh giá đã thu thập được: <strong>{thongKeAI.tongSoBinhLuan}</strong> bình luận</p>
        
        <div className="charts-flex-container">
          {/* Biểu đồ tròn */}
          <div className="chart-box-wrapper">
            <h4 className="chart-box-title">Pie Chart - Tỷ lệ phần trăm cảm xúc</h4>
            <div className="chart-canvas-container">
              <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Biểu đồ cột */}
          <div className="chart-box-wrapper">
            <h4 className="chart-box-title">Bar Chart - Số lượng bình luận thực tế</h4>
            <div className="chart-canvas-container">
              <Bar 
                data={barChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } } // Ẩn label dataset cho gọn
                }} 
              />
            </div>
          </div>
        </div>

        {/* Hộp Cảnh báo các món nước bị chê nhiều nhất */}
        {thongKeAI.topSanPhamBiChe && thongKeAI.topSanPhamBiChe.length > 0 && (
          <div className="ai-warning-box">
            <div className="ai-warning-header">⚠️ CẢNH BÁO CHẤT LƯỢNG: Các món nhận nhiều phản hồi Tiêu Cực nhất</div>
            <div className="ai-warning-list">
              {thongKeAI.topSanPhamBiChe.map((mon, index) => (
                <div key={mon._id} className="ai-warning-item">
                  <span className="ai-warning-index">#{index + 1}</span>
                  <span className="ai-warning-name">📦 Món: <strong>{mon.tenSanPham}</strong></span>
                  <span className="ai-warning-count">{mon.soLuongTieuCuc} lượt chê tiêu cực</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 🛠️ BỘ KHUNG NHẬP TỪ KHÓA CẤM */}
      <div className="qlbl-badwords-section">
        <div className="qlbl-section-title">🛡️ Cấu Hình Bộ Lọc Chặn Từ Ngữ Xấu</div>
        <form onSubmit={handleThemTuCam} className="qlbl-badwords-form auth-input-wrap">
          <input
            type="text"
            placeholder="Nhập từ khóa cần cấm (VD: lừa đảo, rác, fake...)"
            value={tuCamMoi}
            onChange={(e) => setTuCamMoi(e.target.value)}
          />
          <button type="submit" className="qlnv-btn-add-new" style={{ padding: '6px 14px', borderRadius: '8px' }}>
            + Cấm
          </button>
        </form>

        <div className="qlbl-badwords-list">
          {danhSachTuCam.length === 0 ? (
            <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
              Chưa thiết lập từ khóa cấm nào. Hệ thống đang mở tự do.
            </span>
          ) : (
            danhSachTuCam.map((item) => (
              <span key={item._id} className="qlbl-word-tag">
                {item.word}
                <button type="button" onClick={() => handleXoaTuCam(item._id)} className="qlbl-btn-remove-tag">
                  &times;
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* 📊 BẢNG DANH SÁCH BÌNH LUẬN */}
      <div className="qlbl-table-card">
        <div className="qlbl-table-wrapper">
          <table className="qlbl-table">
            <thead>
              <tr>
                <th>Khách hàng / Sản phẩm</th>
                <th>Nội dung đánh giá</th>
                <th>Phân tích AI</th> 
                <th>Trạng thái hiển thị</th>
                <th style={{ textAlign: 'center' }}>Hành động xử lý</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    🔄 Đang kết nối CSDL và tải bình luận...
                  </td>
                </tr>
              ) : danhSachBL.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Chưa có bình luận nào trên hệ thống.
                  </td>
                </tr>
              ) : (
                danhSachBL.map((bl) => (
                  <tr key={bl._id}>
                    <td>
                      <span className="qlbl-info-user">{bl.user_id?.full_name || 'Khách ẩn danh'}</span>
                      <span className="qlbl-info-product">📦 {bl.product_id?.product_name || 'Sản phẩm đã xóa'}</span>
                    </td>
                    <td>
                      <div className="qlbl-stars">{'⭐'.repeat(Math.round(bl.rating))} ({bl.rating} sao)</div>
                      <div className="qlbl-comment-text">
                        {bl.comment_text || <span className="qlbl-comment-empty">(Chỉ chấm điểm sao)</span>}
                      </div>
                    </td>
                    <td>{renderTagCamXucAI(bl.ai_sentiment)}</td>
                    <td>{renderBadgeTrangThai(bl)}</td>
                    <td>
                      <div className="qlbl-actions-group">
                        <button
                          className="qlbl-btn-view"
                          onClick={() => {
                            setSelectedBL(bl);
                            setEditCommentText(bl.comment_text || '');
                            setEditRating(bl.rating);
                            setEditStatus(bl.status || 'approved'); 
                            setIsEditing(false);
                            setIsModalOpen(true);
                          }}
                        >
                          🔍 Chi tiết / Sửa
                        </button>

                        {bl.user_id?.is_active !== false ? (
                          <button
                            className="qlbl-btn-lock"
                            onClick={() => {
                              setUserCanKhoa({ id: bl.user_id?._id, name: bl.user_id?.full_name, trangThaiHienTai: true });
                              setMoKhoaUserModal(true);
                            }}
                          >
                            🔒 Khóa User
                          </button>
                        ) : (
                          <button 
                            className="qlbl-btn-unlock"
                            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                            onClick={() => {
                              setUserCanKhoa({ id: bl.user_id?._id, name: bl.user_id?.full_name, trangThaiHienTai: false });
                              setMoKhoaUserModal(true);
                            }}
                          >
                            🔓 Mở Khóa
                          </button>
                        )}

                        <button
                          className="qlbl-btn-delete"
                          onClick={() => {
                            setBlCanXoa({ id: bl._id, name: bl.user_id?.full_name });
                            setMoXoaModal(true);
                          }}
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- CỬA SỔ POP-UP CHI TIẾT & CHỈNH SỬA BÌNH LUẬN --- */}
      {isModalOpen && selectedBL && (
        <div className="qlbl-modal-overlay">
          <div className="qlbl-modal-box">
            <h3 className="qlbl-modal-title detail">
              {isEditing ? "✏️ Chỉnh Sửa Đánh Giá" : "📋 Nội Dung Đánh Giá Chi Tiết"}
            </h3>
            <p><strong>Khách hàng:</strong> {selectedBL.user_id?.full_name || 'Không rõ'} ({selectedBL.user_id?.email || 'N/A'})</p>
            <p><strong>Sản phẩm:</strong> {selectedBL.product_id?.product_name}</p>
            
            <div style={{ marginBottom: '12px' }}>
              <strong>Số điểm chấm:</strong>{" "}
              {isEditing ? (
                <select 
                  value={editRating} 
                  onChange={(e) => setEditRating(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', marginLeft: '5px' }}
                >
                  {[5, 4, 3, 2, 1].map(num => <option key={num} value={num}>{num} Sao {'★'.repeat(num)}</option>)}
                </select>
              ) : (
                <>
                  <span style={{ color: '#f59e0b' }}>{'⭐'.repeat(Math.round(selectedBL.rating))}</span> ({selectedBL.rating} sao)
                </>
              )}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <strong>Trạng thái hiển thị:</strong>{" "}
              {isEditing ? (
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', marginLeft: '5px', fontWeight: 'bold' }}
                >
                  <option value="approved">🟢 Hiển thị</option>
                  <option value="hidden">⚫ Ẩn</option>
                </select>
              ) : (
                <span style={{ marginLeft: '5px' }}>{renderBadgeTrangThai(selectedBL)}</span>
              )}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <strong>Kết quả AI nhận diện:</strong>{" "}
              {renderTagCamXucAI(selectedBL.ai_sentiment)}
              <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '10px' }}>(Điểm số: {selectedBL.ai_sentiment?.score || 0})</span>
            </div>
            
            <div className="qlbl-detail-quote" style={{ marginBottom: '15px' }}>
              <strong>Nội dung văn bản:</strong>
              {isEditing ? (
                <textarea
                  rows="4"
                  value={editCommentText}
                  onChange={(e) => setEditCommentText(e.target.value)}
                  style={{ width: '100%', marginTop: '8px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  placeholder="Nhập nội dung chỉnh sửa..."
                />
              ) : (
                <p style={{ marginTop: '5px', margin: 0 }}>{selectedBL.comment_text || "(Người dùng không viết bình luận)"}</p>
              )}
            </div>

            {((selectedBL.review_images && selectedBL.review_images.length > 0) || (selectedBL.images && selectedBL.images.length > 0)) && (
              <div style={{ marginBottom: '15px' }}>
                <strong>🖼️ Hình ảnh thực tế đính kèm:</strong>
                <div className="qlbl-image-grid">
                  {(selectedBL.review_images || selectedBL.images).map((img, i) => (
                    <img key={i} src={img} alt="review" className="qlbl-attached-img" />
                  ))}
                </div>
              </div>
            )}

            <div className="qlbl-modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
              {isEditing ? (
                <>
                  <button className="qlbl-btn-cancel" onClick={() => setIsEditing(false)}>Hủy sửa</button>
                  <button className="qlnv-btn-add-new" style={{ borderRadius: '6px', padding: '8px 16px' }} onClick={handleLuuChinhSua}>
                    💾 Lưu thay đổi
                  </button>
                </>
              ) : (
                <>
                  <button className="qlbl-btn-close" style={{ margin: 0 }} onClick={() => setIsModalOpen(false)}>Đóng</button>
                  <button className="qlnv-btn-add-new" style={{ borderRadius: '6px', padding: '8px 16px', margin: 0, backgroundColor: '#3b82f6' }} onClick={() => setIsEditing(true)}>
                    ✏️ Sửa nội dung
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL XÁC NHẬN XÓA BÌNH LUẬN --- */}
      {moXoaModal && (
        <div className="qlbl-modal-overlay">
          <div className="qlbl-modal-box qlbl-modal-box-alert">
            <h3 className="qlbl-modal-title danger">⚠️ XÁC NHẬN XÓA BÌNH LUẬN</h3>
            <p style={{ fontSize: '15px', lineHeight: '1.5', margin: 0 }}>
              Bạn có chắc muốn xóa vĩnh viễn đánh giá này của khách hàng <strong style={{ color: '#ef4444' }}>{blCanXoa?.name || 'Khách ẩn'}</strong>? Thao tác này sẽ gỡ bỏ dữ liệu hoàn toàn khỏi hệ thống.
            </p>
            <div className="qlbl-modal-actions">
              <button className="qlbl-btn-cancel" onClick={() => setMoXoaModal(false)}>Hủy</button>
              <button className="qlbl-btn-confirm-danger" onClick={handleXacNhanXoaChinhThuc}>Xác Nhận Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL XÁC NHẬN KHÓA / MỞ KHÓA USER --- */}
      {moKhoaUserModal && (
        <div className="qlbl-modal-overlay">
          <div className="qlbl-modal-box qlbl-modal-box-alert">
            <h3 className={`qlbl-modal-title ${userCanKhoa?.trangThaiHienTai ? 'warning' : 'success'}`}>
              {userCanKhoa?.trangThaiHienTai ? '🔒 XÁC NHẬN KHÓA TÀI KHOẢN' : '🔓 XÁC NHẬN MỞ KHÓA TÀI KHOẢN'}
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.5', margin: 0 }}>
              {userCanKhoa?.trangThaiHienTai ? (
                <>Bạn có chắc muốn thực hiện hành động khóa tài khoản của thành viên <strong>{userCanKhoa?.name}</strong>? Sau khi bị khóa, thành viên này không thể đăng tải thêm bất kỳ đánh giá hay bình luận nào.</>
              ) : (
                <>Bạn có chắc muốn <strong>mở khóa hoạt động</strong> cho tài khoản của thành viên <strong>{userCanKhoa?.name}</strong>? Người dùng này sẽ khôi phục lại quyền bình luận sản phẩm.</>
              )}
            </p>
            <div className="qlbl-modal-actions">
              <button className="qlbl-btn-cancel" onClick={() => setMoKhoaUserModal(false)}>Hủy</button>
              <button 
                className={userCanKhoa?.trangThaiHienTai ? "qlbl-btn-confirm-warning" : "qlnv-btn-add-new"} 
                style={!userCanKhoa?.trangThaiHienTai ? { borderRadius: '6px', padding: '8px 16px', margin: 0 } : {}}
                onClick={handleXacNhanKhoaUser}
              >
                {userCanKhoa?.trangThaiHienTai ? "Đồng Ý Khóa" : "Xác Nhận Mở Khóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, KeyRound, Mail, ShieldCheck, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const QuenMK = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Trạng thái ẩn/hiện mắt độc lập cho 2 ô mật khẩu mới
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [step, setStep] = useState(1); 
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const showAlert = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    // 1. Gửi mã OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!email) return showAlert('error', 'Vui lòng nhập địa chỉ email!');

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/khachhang/quenmk/gui-otp', { email });
            if (response.data.success) {
                showAlert('success', response.data.message);
                setStep(2); 
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Không thể gửi OTP. Vui lòng thử lại!';
            showAlert('error', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // 2. Xác nhận đổi mật khẩu
    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        // Kiểm tra các trường rỗng
        if (!otp || !newPassword || !confirmPassword) {
            return showAlert('error', 'Vui lòng điền đầy đủ tất cả các trường!');
        }

        // Kiểm tra độ dài mã OTP
        if (otp.length !== 6) {
            return showAlert('error', 'Mã OTP phải bao gồm 6 chữ số!');
        }

        // 🛠️ KIỂM TRA ĐỘ MẠNH MẬT KHẨU (1 hoa, 1 thường, 1 số, 1 đặc biệt, >= 8 ký tự)
        const regexMatKhauManh = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
        if (!regexMatKhauManh.test(newPassword)) {
            return showAlert(
                'error', 
                'Mật khẩu phải từ 8 ký tự trở lên, chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt (@$!%*?&).'
            );
        }

        // Kiểm tra mật khẩu xác nhận trùng khớp
        if (newPassword !== confirmPassword) {
            return showAlert('error', 'Mật khẩu xác nhận không trùng khớp!');
        }

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/khachhang/quenmk/xac-nhan', {
                email,
                otp,
                newPassword
            });

            if (response.data.success) {
                showAlert('success', 'Đổi mật khẩu thành công! Hệ thống đang chuyển hướng...');
                setEmail(''); setOtp(''); setNewPassword(''); setConfirmPassword('');
                setTimeout(() => {
                    navigate('/login'); 
                }, 2000);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Xác nhận thất bại. Vui lòng kiểm tra lại OTP!';
            showAlert('error', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* Nút Quay lại góc trái */}
            <Link to="/login" className="auth-back-link">
                <ArrowLeft size={16} /> Về trang đăng nhập
            </Link>

            <section className="auth-shell">
                {/* TRÁI: KHỐI BRAND PANEL */}
                <div className="auth-brand-panel"></div>

                {/* PHẢI: KHỐI XỬ LÝ FORM */}
                <div className="auth-card">
                    <div className="auth-card-head">
                        <span className="auth-icon-circle">
                            {step === 1 ? <KeyRound size={20} /> : <ShieldCheck size={20} />}
                        </span>
                        <h2>{step === 1 ? 'Quên mật khẩu?' : 'Đặt lại mật khẩu'}</h2>
                        <p>
                            {step === 1 
                                ? "Nhập tài khoản email để nhận mã xác thực OTP khôi phục." 
                                : `Mã xác thực gồm 6 chữ số vừa được gửi tới hòm thư: ${email}`}
                        </p>
                    </div>

                    {/* Alert hiển thị thông báo lỗi / thành công */}
                    {message.text && (
                        <div className={`auth-alert ${message.type === 'success' ? 'auth-alert--success' : 'auth-alert--error'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* BƯỚC 1: FORM NHẬP EMAIL */}
                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="auth-form">
                            <div className="auth-field">
                                <label htmlFor="email">Địa chỉ Email</label>
                                <div className="auth-input-wrap">
                                    <Mail size={18} />
                                    <input 
                                        id="email"
                                        type="email" 
                                        placeholder="nhapemail@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="auth-submit-btn">
                                {loading ? 'Đang gởi mã...' : 'Gửi mã OTP ➜'}
                            </button>
                        </form>
                    )}

                    {/* BƯỚC 2: FORM ĐỔI MẬT KHẨU CÓ CÀI ĐẶT CON MẮT */}
                    {step === 2 && (
                        <form onSubmit={handleResetPassword} className="auth-form">
                            <div className="auth-field">
                                <label>Mã xác thực OTP</label>
                                <div className="auth-input-wrap">
                                    <ShieldCheck size={18} />
                                    <input 
                                        type="text" 
                                        maxLength="6"
                                        placeholder="Nhập 6 số OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        style={{ letterSpacing: '2px', fontWeight: 'bold' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="auth-field">
                                <label>Mật khẩu mới</label>
                                <div className="auth-input-wrap">
                                    <Lock size={18} />
                                    <input 
                                        type={showNewPassword ? "text" : "password"} 
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        style={{ paddingRight: '45px' }}
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        className="auth-eye-btn"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {/* 💡 Gợi ý trực quan giúp người dùng nhập đúng chuẩn mật khẩu */}
                                <span style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px', display: 'block' }}>
                                    Mật khẩu gồm ít nhất 8 ký tự (gồm chữ HOA, thường, số và kí tự đặc biệt).
                                </span>
                            </div>

                            <div className="auth-field">
                                <label>Xác nhận mật khẩu mới</label>
                                <div className="auth-input-wrap">
                                    <Lock size={18} />
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"} 
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        style={{ paddingRight: '45px' }}
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        className="auth-eye-btn"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="auth-button-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button type="submit" disabled={loading} className="auth-submit-btn">
                                    {loading ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
                                    <CheckCircle2 size={18} style={{ marginLeft: '8px' }} />
                                </button>
                                <button 
                                    type="button" 
                                    className="auth-secondary-btn"
                                    onClick={() => setStep(1)}
                                >
                                    ← Quay lại nhập Email
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </section>
        </div>
    );
};

export default QuenMK;
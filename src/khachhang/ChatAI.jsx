import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  MessageCircle,
  X,
  Send,
  Sparkles,
  LoaderCircle,
} from 'lucide-react';
import '../css/khachhang/ChatAI.css';

const ChatAI = ({ customerId = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef(null);

  const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    let savedSessionId = localStorage.getItem('milktea_chat_session_id');
    if (!savedSessionId) {
      savedSessionId = 'ss_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('milktea_chat_session_id', savedSessionId);
    }
    setSessionId(savedSessionId);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setMessages((prev) => [...prev, { sender: 'customer', text: userText, timestamp: new Date() }]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_URL}/api/khachhang/tu-van`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          customer_id: customerId,
          text: userText
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [...prev, {
          sender: data.sender,
          text: data.text,
          timestamp: data.timestamp
        }]);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Lỗi kết nối API Chatbox:", error);
      setMessages((prev) => [...prev, {
        sender: 'ai',
        text: 'Trợ lý ảo của quán đang bận xử lý đơn hàng một chút, bạn vui lòng gửi lại câu hỏi sau vài giây nhé!'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chatai-wrapper">
      {/* 🔮 NÚT BONG BÓNG TRÒ CHUYỆN */}
      <button onClick={() => setIsOpen(!isOpen)} className="chatai-floating-button">
        {isOpen ? (
          <>
            <X size={18} />
            Đóng Chat
          </>
        ) : (
          <>
            <MessageCircle size={18} />
            Trợ lý Trà Sữa AI
          </>
        )}
      </button>

      {/* 📜 KHUNG GIAO DIỆN HỘP CHAT CHÍNH */}
      {isOpen && (
        <div className="chatai-window">
          {/* Thanh Header Hộp Chat */}
          <div className="chatai-header">
            <div className="chatai-header-title">
              <Bot size={18} />
              Trợ Lý Quán Trà Sữa AI
            </div>
            <div className="chatai-header-subtitle">
              Tư vấn thực đơn và topping tự động
            </div>
          </div>

          {/* Vùng Nội Dung Hiển Thị Tin Nhắn */}
          <div className="chatai-message-container">
            {messages.length === 0 && (
              <div className="chatai-welcome-text">
                <Sparkles size={18} />
                <span>
                  Xin chào! Mình là trợ lý ảo AI. Bạn cần hỏi về các món nước, giá tiền hoặc topping đi kèm thì nhắn mình tư vấn.
                </span>
              </div>
            )}

            {messages.map((msg, index) => {
              const isCustomer = msg.sender === 'customer';
              return (
                <div
                  key={index}
                  className={`chatai-message-row ${isCustomer ? 'customer' : 'ai'}`}
                >
                  <div className={`chatai-bubble ${isCustomer ? 'customer' : 'ai'}`}>
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            })}

            {/* Hiển thị dòng chữ chờ khi AI đang xử lý */}
            {isTyping && (
              <div className="chatai-message-row ai">
                <div className="chatai-bubble typing">
                  <LoaderCircle size={15} className="chatai-spin" />
                  Trợ lý AI đang gõ phản hồi...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Ô Nhập Văn Bản & Nút Gửi */}
          <form onSubmit={handleSendMessage} className="chatai-form">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Hỏi về món ăn, giá tiền, topping..."
              className="chatai-input"
              disabled={isTyping}
            />
            <button
              type="submit"
              className="chatai-btn-send"
              disabled={isTyping || !inputValue.trim()}
              aria-label="Gửi tin nhắn"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatAI;
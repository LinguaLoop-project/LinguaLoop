/* LinguaLoop — Dữ liệu mẫu dùng chung cho Giảng viên & Admin */
'use strict';
const DATA = {
  // --- Admin Specific Mock Data ---
  adminStats: {
    totalUsers: 14205,
    newUsers7d: 845,
    dau: 2314,
    activePro: 1540,
    conversionRate: 11.2,
    mrr: 68500000,
    pendingReports: 24,
    pendingDecks: 8
  },
  users: [
    { id: 1, name: 'Nguyễn Minh Anh', email: 'minhanh@gmail.com', role: 'student', plan: 'pro', verified: true, status: 'active', joined: '12/01/2026', lastActive: '29/09/2026' },
    { id: 2, name: 'Hoàng Tuấn', email: 'tuan.hoang22@yahoo.com', role: 'student', plan: 'free', verified: true, status: 'active', joined: '15/05/2026', lastActive: '28/09/2026' },
    { id: 3, name: 'Lê Thanh', email: 'thanhle_teacher@school.edu.vn', role: 'instructor', plan: 'pro', verified: true, status: 'active', joined: '01/11/2025', lastActive: '29/09/2026' },
    { id: 4, name: 'Phạm Đức', email: 'ducphan01@gmail.com', role: 'student', plan: 'free', verified: false, status: 'disabled', joined: '20/09/2026', lastActive: '20/09/2026' },
    { id: 5, name: 'Bùi Thị Châu', email: 'chau.bui99@gmail.com', role: 'student', plan: 'free', verified: true, status: 'active', joined: '05/08/2026', lastActive: '25/09/2026' }
  ],
  userPlans: [
    { user: 'Nguyễn Minh Anh', email: 'minhanh@gmail.com', plan: 'Pro 12 tháng', price: '399.000đ', activated: '15/01/2026', expires: '15/01/2027', status: 'active' },
    { user: 'Lê Thanh', email: 'thanhle_teacher@school.edu.vn', plan: 'Tặng Pro', price: '0đ', activated: '01/11/2025', expires: '01/11/2030', status: 'active' },
    { user: 'Trần Văn B', email: 'tranb@gmail.com', plan: 'Pro 1 tháng', price: '49.000đ', activated: '10/08/2026', expires: '10/09/2026', status: 'cancelled' }
  ],
  reports: [
    { id: 'R-1001', entityType: 'Câu', entityName: 'Câu #12 — Airport Check-in', reason: 'Sai bản dịch', user: 'minhanh_03', date: '29/09/2026', status: 'open', duplicates: 2 },
    { id: 'R-1002', entityType: 'Bộ từ', entityName: 'TOEIC Essential 1000', reason: 'Sai nội dung', user: 'hoangtuan22', date: '28/09/2026', status: 'reviewing', duplicates: 1 },
    { id: 'R-1003', entityType: 'Câu', entityName: 'Câu #7 — Weather Talk', reason: 'Lỗi âm thanh', user: 'chau.bui99', date: '27/09/2026', status: 'done', duplicates: 5 },
    { id: 'R-1004', entityType: 'Bài học', entityName: 'Job Interview Q&A', reason: 'Phản cảm', user: 'guest404', date: '25/09/2026', status: 'rejected', duplicates: 1 }
  ],
  pendingDecks: [
    { id: 1, name: 'IELTS Academic Vocab', author: 'minhanh_03', groups: 12, cards: 240, tags: ['IELTS', 'Advanced'], date: '29/09/2026' },
    { id: 2, name: 'Tiếng Anh chuyên ngành IT', author: 'dev_student', groups: 5, cards: 85, tags: ['IT', 'Công việc'], date: '28/09/2026' }
  ],
  planLimits: [
    { feature: 'Lượt chấm phát âm shadowing', free: '5', pro: '200' },
    { feature: 'Gợi ý AI cá nhân hoá', free: '0 (Khoá)', pro: '100' },
    { feature: 'Video khẩu hình âm vị', free: '0 (Khoá)', pro: 'Không giới hạn' },
    { feature: 'Hồ sơ điểm yếu đầy đủ', free: '0 (Chỉ tóm tắt)', pro: 'Không giới hạn' }
  ],
  errorCategories: [
    { code: 'MISSING_FUNCTION_WORD', skill: 'Nghe chép', name: 'Bỏ sót từ chức năng', desc: 'Sót mạo từ, giới từ, trợ động từ', active: true },
    { code: 'WRONG_SUFFIX', skill: 'Nghe chép', name: 'Sai đuôi từ (-s, -ed, -ing)', desc: 'Thiết hoặc dư hậu tố', active: true },
    { code: 'PHONEME_SUBSTITUTION', skill: 'Phát âm', name: 'Thay thế âm vị', desc: 'Đọc âm này thành âm khác', active: true },
    { code: 'PHONEME_OMISSION', skill: 'Phát âm', name: 'Rụng âm (mất âm cuối)', desc: 'Bỏ sót âm cuối của từ', active: true }
  ],
  auditLog: [
    { action: 'update', type: 'Người dùng', name: 'Khoá tài khoản ducphan01', actor: 'Admin Tâm', time: '29/09/2026 14:32', diff: null },
    { action: 'publish', type: 'Bộ từ', name: 'Duyệt bộ IELTS Academic', actor: 'Admin Nam', time: '29/09/2026 11:15', diff: null },
    { action: 'delete', type: 'Bài học', name: 'Gỡ bài Job Interview (Spam)', actor: 'Admin Tâm', time: '28/09/2026 16:00', diff: null }
  ]
};

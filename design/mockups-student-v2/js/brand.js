/* Nhận diện thương hiệu: logo và mascot Loopi */
'use strict';
const MASCOT_STATES = [
  ['hello', 'Chào', 'Màn Hôm nay, trạng thái trống, lúc chờ'],
  ['listening', 'Đang nghe', 'Đang chấm phát âm, đang phân tích bài kiểm tra'],
  ['speaking', 'Đang nói', 'Shadowing: lúc người học đang ghi âm'],
  ['correct', 'Đúng rồi', 'Trả lời đúng, nghe chép từ 80 điểm'],
  ['encourage', 'Động viên', 'Trả lời sai, điểm thấp, không có kết quả'],
  ['celebrate', 'Ăn mừng', 'Xong phiên học, lên streak, xong bộ thẻ'],
];
function renderBrand() {
  $('#mIntro').innerHTML = `${mascot('hello', 180, 1)}<div><div class="overline">Loopi</div><h2>Bong bóng thoại nhỏ biết nghe</h2>
    <p class="muted" style="margin-top:8px">Thân là quả cầu tím có đuôi bong bóng thoại (giống logo), ăng-ten xoắn thành vòng lặp và một ngôi sao 4 cánh lấy từ bộ vật thể 3D. Tính cách: tò mò, kiên nhẫn, không bao giờ chê người học. Loopi chỉ xuất hiện ở khoảnh khắc cảm xúc (chào, đúng, sai, ăn mừng) và ở cạnh vùng đang luyện, không đè lên nội dung người học đang đọc.</p>
    <ul class="tips small" style="margin-top:12px"><li>Asset gốc: <code>docs/design/loopi-mascot/</code> (SVG, PNG 512px, component <code>Mascot.tsx</code>).</li><li>Mỗi trạng thái có animation vào riêng (pop, nhảy, lắc, xoay) rồi trôi nhẹ, tắt khi người dùng bật giảm chuyển động.</li><li>Kích thước nhỏ nhất 40px. Nhỏ hơn thì dùng logo mark.</li></ul></div>`;
  $('#mStates').innerHTML = MASCOT_STATES.map(([k, n, w]) => `<button class="card lift m-card" data-mstate="${k}">${mascot(k, 112, 1)}<b>${n}</b><span class="small muted">${w}</span></button>`).join('');
}


Shell.click((t) => {
  const ms = t.closest('[data-mstate]'); if (ms) { ms.innerHTML = ms.innerHTML; return true; }
});

renderBrand();

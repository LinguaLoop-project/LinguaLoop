/**
 * LinguaLoop — data.js (Học viên)
 * Dữ liệu mẫu khớp schema V1/V2, dùng chung cho mọi trang. Không gọi backend.
 * Nạp SAU shell.js (dùng store, sess, icon từ shell.js).
 */
'use strict';

/* ─── Kế hoạch hôm nay, âm vị, nghe chép, shadowing, từ điển ─── */
const PLAN = [
  { id: 'srs',   icon: 'cards',      title: 'Ôn 8 thẻ từ vựng đến hạn', why: '8 thẻ sắp quên hôm nay', min: 4, go: 'vocab', tab: 'review' },
  { id: 'drill', icon: 'target',     title: 'Sửa âm /θ/ qua câu có “think, third”', why: 'Bạn đọc /θ/ thành /t/ 7 lần tuần này', min: 5, go: 'shadowing' },
  { id: 'dict',  icon: 'headphones', title: 'Nghe chép “Ordering Coffee” · 3 câu', why: 'Bạn hay bỏ sót từ chức năng (31%)', min: 6, go: 'dictation' },
];

// 44 âm vị (V2 seed). rate = % lỗi, null = chưa đủ dữ liệu (< 5 cơ hội)
const PH = [
  ['iː','vowel','see',8],['ɪ','vowel','sit',16,'iː'],['e','vowel','bed',11],['æ','vowel','cat',22,'e'],['ʌ','vowel','cup',9],['ɑː','vowel','car',6],
  ['ɒ','vowel','hot',10],['ɔː','vowel','saw',7],['ʊ','vowel','book',13],['uː','vowel','food',5],['ɜː','vowel','bird',17,'ơ'],['ə','vowel','about',12],
  ['eɪ','diphthong','day',9],['aɪ','diphthong','my',4],['ɔɪ','diphthong','boy',null],['aʊ','diphthong','now',6],['əʊ','diphthong','go',14],
  ['ɪə','diphthong','near',null],['eə','diphthong','hair',null],['ʊə','diphthong','tour',null],
  ['p','consonant','pen',5],['b','consonant','bad',9],['t','consonant','tea',12],['d','consonant','did',14],['k','consonant','cat',8],['g','consonant','get',6],
  ['f','consonant','fish',7],['v','consonant','van',28,'—'],['θ','consonant','think',42,'t'],['ð','consonant','this',35,'d'],['s','consonant','see',10],
  ['z','consonant','zoo',20,'s'],['ʃ','consonant','she',18,'s'],['ʒ','consonant','vision',null],['h','consonant','hat',4],['tʃ','consonant','chair',11],
  ['dʒ','consonant','jam',15,'z'],['m','consonant','man',3],['n','consonant','no',6],['ŋ','consonant','sing',9],['l','consonant','leg',19,'n'],
  ['r','consonant','red',16,'z'],['j','consonant','yes',5],['w','consonant','wet',8],
].map(([s, kind, ex, rate, prod]) => ({ s, kind, ex, rate, prod }));
const PH_DETAIL = {
  'θ': { tip: 'Đặt nhẹ đầu lưỡi giữa hai hàm răng rồi thổi hơi. Nếu lưỡi chạm lợi trên là bạn đang đọc thành /t/.', pairs: ['thin – tin', 'three – tree', 'thank – tank'], trend: [55, 53, 50, 51, 47, 45, 44, 42], n: '19/45' },
  'ð': { tip: 'Lưỡi giữa hai hàm răng như /θ/ nhưng rung cổ họng. Đừng đọc thành “đ” của tiếng Việt.', pairs: ['they – day', 'then – den'], trend: [44, 42, 41, 40, 38, 37, 36, 35], n: '14/40' },
  'v': { tip: 'Răng trên chạm môi dưới và giữ rung ở cuối từ (five, I\'ve). Người Việt hay bỏ hẳn âm này.', pairs: ['five – fi', 'save – safe'], trend: [36, 35, 33, 31, 30, 29, 29, 28], n: '9/32' },
};
const DICT_STATS = [
  { name: 'Từ chức năng (the, a, to…)', rate: 31, o: 22, s: 6, m: 3, ex: 'I<b>\'d</b> like <b>a</b> large…' },
  { name: 'Đuôi -s / -ed / -ing', rate: 24, o: 8, s: 12, m: 4, ex: 'ice → ice<b>d</b>' },
  { name: 'Tên riêng', rate: 15, o: 5, s: 6, m: 4, ex: 'Da Nang → danang' },
  { name: 'Từ nội dung', rate: 12, o: 3, s: 5, m: 4, ex: 'oat → out' },
  { name: 'Số', rate: 9, o: 2, s: 6, m: 1, ex: 'fifteen → fifty' },
];

const DICT_SENTENCES = [
  { t: "I'd like a large iced latte with oat milk, please.", vi: 'Cho tôi một ly latte đá cỡ lớn với sữa yến mạch nhé.' },
  { t: 'Could I get that to go?', vi: 'Cho tôi mang đi được không?' },
  { t: "That'll be five dollars and twenty cents.", vi: 'Của bạn hết năm đô hai mươi xu.' },
];
const FUNCTION_WORDS = new Set(("a an the to of in on at for from with by and but or so if i you he she it we they me him her us them my your his its our their " +
  "is am are was were be been being do does did have has had can could will would shall should may might must that this these those " +
  "i'd i'm it's that'll that's don't can't won't i've you're").split(' '));
const NUMBER_WORDS = new Set('zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand'.split(' '));
const CAT_NAME = { // error_categories.name_vi (V2 seed)
  function_omitted: 'Bỏ sót từ chức năng', function_substituted: 'Nhầm từ chức năng', function_misspelled: 'Sai chính tả từ chức năng',
  content_omitted: 'Bỏ sót từ nội dung', content_substituted: 'Nhầm từ nội dung', content_misspelled: 'Sai chính tả từ nội dung',
  inflected_omitted: 'Bỏ sót từ biến đổi', inflected_substituted: 'Sai đuôi từ (-s, -ed, -ing)', inflected_misspelled: 'Sai chính tả dạng biến đổi',
  number_omitted: 'Bỏ sót số', number_substituted: 'Nghe nhầm số', number_misspelled: 'Viết sai số',
  proper_omitted: 'Bỏ sót tên riêng', proper_substituted: 'Nghe nhầm tên riêng', proper_misspelled: 'Viết sai tên riêng',
};
const OUTCOME_TONE = { omitted: 't-bad', substituted: 't-warn', misspelled: 't-info' };

const SHADOW = {
  words: ['I', 'think', 'this', 'is', 'the', 'third', 'time', "I've", 'been', 'here.'],
  text: "I think this is the third time I've been here.",
  scores: [95, 41, 88, 93, 90, 63, 91, 70, 87, 92],
  overall: { total: 72, acc: 68, flu: 81, comp: 100, pros: 64 },
  errors: [
    { i: 1, w: 'think', ipa: '/θɪŋk/', score: 41, ph: [['θ', 32, 't'], ['ɪ', 86], ['ŋ', 90], ['k', 64]], tip: PH_DETAIL['θ'].tip, pair: 'thin – tin' },
    { i: 5, w: 'third', ipa: '/θɜːd/', score: 63, ph: [['θ', 55, null], ['ɜː', 80], ['d', 62]], tip: 'Âm /θ/ đã khá hơn ở từ này, giữ đầu lưỡi thò ra lâu hơn một chút.', pair: 'three – tree' },
    { i: 7, w: "I've", ipa: '/aɪv/', score: 70, ph: [['aɪ', 92], ['v', 18, '—']], tip: PH_DETAIL['v'].tip, pair: 'save – safe' },
  ],
  ai: [
    ['Điểm tốt', 'Bạn giữ nhịp câu tự nhiên, không ngắt quãng giữa “the third time”.'],
    ['1 · think, third', 'Âm /θ/ đang bị đọc thành /t/. Hãy thò đầu lưỡi ra giữa răng và thổi hơi trước khi mở miệng cho nguyên âm.'],
    ['2 · I\'ve been', 'Bạn bỏ âm /v/ cuối. Nối liền thành /aɪv‿bɪn/, môi dưới chạm răng trên khi chuyển sang “been”.'],
    ['Gợi ý', 'Luyện 5 phút cặp thin – tin, rồi đọc lại câu này.'],
  ],
};

// img: icon Phosphor dùng cho ảnh placeholder · family/coll/syn/ant/mem: dữ liệu mẫu cho cột phải thẻ tra từ
const DICT = {
  present: { cefr: 'B1', uk: '/ˈpreznt/', us: '/ˈprezənt/', img: 'gift', pos: {
      'Tính từ': [['có mặt, hiện diện', 'being in a particular place', 'How many people were present at the meeting?', 'Có bao nhiêu người có mặt tại cuộc họp?'],
                  ['hiện tại, hiện nay', 'existing or happening now', 'the present situation', 'tình hình hiện tại']],
      'Danh từ': [['món quà', 'a thing that you give to somebody', 'a birthday present', 'một món quà sinh nhật']],
      'Động từ': [['trình bày, giới thiệu', 'to show or explain something to a group', "I'd like to present our new plan.", 'Tôi xin trình bày kế hoạch mới.']] },
    ipaByPos: { 'Động từ': ['/prɪˈzent/', '/prɪˈzent/'] }, forms: { 'Động từ': ['presents', 'presented', 'presenting'] },
    family: [['presence', 'Danh từ'], ['presentation', 'Danh từ'], ['presenter', 'Danh từ'], ['presently', 'Trạng từ']],
    coll: ['present at a meeting', 'the present day', 'a birthday present', 'present a plan'], syn: ['attending', 'current', 'gift'], ant: ['absent', 'past'], mem: [62, '2 ngày nữa', 3],
    inLessons: [['Everyone was present for the final exam.', 'Campus Life · B1', 'student'], ["I'd like to present our new plan.", 'Business Meeting · B2', 'briefcase']] },
  schedule: { cefr: 'B1', uk: '/ˈʃedjuːl/', us: '/ˈskedʒuːl/', img: 'calendar-blank', pos: {
      'Danh từ': [['lịch trình, thời gian biểu', 'a plan that lists times of events', 'The flight is on schedule.', 'Chuyến bay đúng lịch.']],
      'Động từ': [['lên lịch', 'to arrange for something to happen', 'The meeting is scheduled for Monday.', 'Cuộc họp được lên lịch vào thứ Hai.']] },
    forms: { 'Động từ': ['schedules', 'scheduled', 'scheduling'] }, family: [['reschedule', 'Động từ'], ['scheduler', 'Danh từ']],
    coll: ['on schedule', 'behind schedule', 'a busy schedule', 'schedule a meeting'], syn: ['timetable', 'plan', 'arrange'], ant: ['cancel'], mem: [48, 'Hôm nay', 2],
    inLessons: [['The flight to Da Nang has been delayed.', 'Airport · B1', 'airplane-tilt']] },
  go: { cefr: 'A1', uk: '/ɡəʊ/', us: '/ɡoʊ/', img: 'person-simple-walk', pos: { 'Động từ': [['đi', 'to move from one place to another', 'Could I get that to go?', 'Cho tôi mang đi được không?']] },
    forms: { 'Động từ': ['goes', 'went', 'gone', 'going'] }, family: [['going', 'Danh từ'], ['outgoing', 'Tính từ']],
    coll: ['go to work', 'go on holiday', 'to go', 'go wrong'], syn: ['leave', 'travel', 'move'], ant: ['come', 'stay'], mem: [90, '12 ngày nữa', 6],
    inLessons: [['Could I get that to go?', 'Ordering Coffee · A2', 'coffee']] },
  reliable: { cefr: 'B1', uk: '/rɪˈlaɪəbl/', us: '/rɪˈlaɪəbl/', img: 'handshake', pos: { 'Tính từ': [['đáng tin cậy', 'that can be trusted', 'She is a very reliable friend.', 'Cô ấy là người bạn rất đáng tin cậy.']] },
    family: [['rely', 'Động từ'], ['reliability', 'Danh từ'], ['reliably', 'Trạng từ']], coll: ['reliable source', 'reliable friend', 'highly reliable'], syn: ['dependable', 'trustworthy'], ant: ['unreliable'], mem: [35, 'Hôm nay', 1] },
  through: { cefr: 'A2', uk: '/θruː/', us: '/θruː/', img: 'path', pos: { 'Giới từ': [['xuyên qua, thông qua', 'from one end or side to the other', 'We drove through the tunnel.', 'Chúng tôi lái xe xuyên qua đường hầm.']] },
    family: [['throughout', 'Giới từ']], coll: ['go through', 'through the window', 'all through the night'], syn: ['via', 'across'], ant: [], mem: [55, 'Hôm nay', 1] },
  borrow: { cefr: 'A2', uk: '/ˈbɒrəʊ/', us: '/ˈbɑːroʊ/', img: 'hand-coins', pos: { 'Động từ': [['mượn', 'to take something and promise to return it', 'Can I borrow your pen?', 'Mình mượn bút của bạn được không?']] }, forms: { 'Động từ': ['borrowed', 'borrowing'] },
    family: [['borrower', 'Danh từ'], ['borrowing', 'Danh từ']], coll: ['borrow money', 'borrow a book', 'borrow from'], syn: ['take on loan'], ant: ['lend'], mem: [70, '3 ngày nữa', 2] },
  although: { cefr: 'B1', uk: '/ɔːlˈðəʊ/', us: '/ɔːlˈðoʊ/', img: 'scales', pos: { 'Liên từ': [['mặc dù', 'despite the fact that', 'Although it rained, we went out.', 'Mặc dù trời mưa, chúng tôi vẫn ra ngoài.']] },
    family: [], coll: ['although it was late', 'although I know'], syn: ['though', 'even though'], ant: [], mem: [40, 'Hôm nay', 1] },
  delay: { cefr: 'B1', uk: '/dɪˈleɪ/', us: '/dɪˈleɪ/', img: 'clock-countdown', pos: { 'Động từ': [['trì hoãn, làm chậm', 'to make somebody late', 'Our flight was delayed.', 'Chuyến bay của chúng tôi bị hoãn.']], 'Danh từ': [['sự chậm trễ', 'a period of time when something is late', 'a two-hour delay', 'chậm hai tiếng']] }, forms: { 'Động từ': ['delayed', 'delaying'] },
    family: [['delayed', 'Tính từ']], coll: ['flight delay', 'without delay', 'delay a decision'], syn: ['postpone', 'hold up'], ant: ['hurry'], mem: [58, 'Hôm nay', 2] },
  latte: { cefr: 'B1', uk: '/ˈlɑːteɪ/', us: '/ˈlɑːteɪ/', img: 'coffee', pos: { 'Danh từ': [['cà phê latte (cà phê sữa kiểu Ý)', 'coffee made with hot milk', 'A large iced latte, please.', 'Cho một ly latte đá lớn.']] },
    family: [], coll: ['iced latte', 'oat milk latte', 'a large latte'], syn: [], ant: [], mem: [80, '5 ngày nữa', 3],
    inLessons: [["I'd like a large iced latte with oat milk, please.", 'Ordering Coffee · A2', 'coffee']] },
  thin: { cefr: 'A2', uk: '/θɪn/', us: '/θɪn/', img: 'ruler', pos: { 'Tính từ': [['mỏng, gầy', 'having a small distance between two sides', 'a thin slice of bread', 'một lát bánh mì mỏng']] },
    family: [['thinly', 'Trạng từ'], ['thinness', 'Danh từ']], coll: ['thin slice', 'thin air', 'a thin line'], syn: ['slim', 'slender'], ant: ['thick'], mem: [66, '2 ngày nữa', 2] },
};
const FORM_INDEX = {}; // biến thể → từ gốc (dictionary_word_forms)
Object.entries(DICT).forEach(([w, d]) => Object.values(d.forms || {}).flat().forEach(f => FORM_INDEX[f] = w));
const firstVi = (w) => Object.values(DICT[w].pos)[0][0][0];

/* ─── Thư viện bài học: chủ đề → bài học → câu (bảng topics, lessons, user_lesson_progress) ─── */
const TOPICS = [
  { slug: 'daily', name: 'Giao tiếp hằng ngày', en: 'Daily conversation', icon: 'chats-circle', total: 148, desc: 'Hội thoại ngắn ở quán cà phê, cửa hàng, nơi làm việc. Hợp để bắt đầu.' },
  { slug: 'travel', name: 'Du lịch', en: 'Travel', icon: 'airplane-tilt', total: 64, desc: 'Sân bay, khách sạn, hỏi đường, gọi món khi đi nước ngoài.' },
  { slug: 'movie', name: 'Trích đoạn phim', en: 'Movie clips', icon: 'film-slate', total: 157, desc: 'Trailer và cảnh phim ngắn, giọng tự nhiên, tốc độ thật.' },
  { slug: 'business', name: 'Công việc', en: 'Business English', icon: 'briefcase', total: 52, desc: 'Phỏng vấn, họp, email, thuyết trình.' },
  { slug: 'news', name: 'Tin tức BBC · VOA', en: 'News', icon: 'newspaper', total: 96, desc: 'Bản tin ngắn và thành ngữ trong một phút.' },
  { slug: 'ielts', name: 'Luyện thi IELTS', en: 'IELTS', icon: 'exam', total: 71, desc: 'Listening theo đề Cambridge và mẫu Speaking.' },
  { slug: 'songs', name: 'Bài hát', en: 'Songs', icon: 'music-notes', total: 43, desc: 'Nghe chép lời bài hát tiếng Anh quen thuộc.' },
  { slug: 'science', name: 'Khoa học & tự nhiên', en: 'Science', icon: 'leaf', total: 38, desc: 'Phóng sự ngắn về động vật, cơ thể, vũ trụ.' },
];
// slug, topic, title, title_vi, cefr, source, duration, views, is_pro, % nghe chép, % shadowing (null = chưa học), số câu, thêm cách đây (ngày), icon
const LESSONS = [
  ['ordering-coffee', 'daily', 'Ordering Coffee at Starbucks', 'Gọi cà phê ở Starbucks', 'A2', 'youtube', '01:12', 48210, false, 33, null, 12, 40, 'coffee'],
  ['talking-about-job', 'daily', 'Talking About Your Job', 'Nói về công việc của bạn', 'B1', 'youtube', '05:25', 38373, false, 100, 100, 34, 90, 'user-circle'],
  ['letter-to-mom', 'daily', 'A Letter to Mom', 'Lá thư gửi mẹ', 'A2', 'youtube', '02:24', 137353, false, null, null, 20, 120, 'heart'],
  ['dolphin-debate', 'daily', 'A Dolphin Show Debate', 'Tranh luận về show cá heo', 'B1', 'audio', '01:12', 23107, true, null, null, 11, 12, 'fish'],
  ['small-talk', 'daily', 'Small Talk With a Neighbour', 'Nói chuyện phiếm với hàng xóm', 'A2', 'audio', '01:40', 19804, false, null, null, 15, 6, 'house-line'],
  ['airport-checkin', 'travel', 'At the Airport Check-in', 'Làm thủ tục ở sân bay', 'B1', 'youtube', '02:05', 31877, false, null, 60, 18, 30, 'airplane-takeoff'],
  ['hotel-booking', 'travel', 'Booking a Hotel Room', 'Đặt phòng khách sạn', 'A2', 'youtube', '01:48', 27550, false, 100, null, 14, 55, 'bed'],
  ['lost-luggage', 'travel', 'Reporting Lost Luggage', 'Báo mất hành lý', 'B1', 'audio', '02:10', 12004, true, null, null, 16, 9, 'suitcase-rolling'],
  ['hoi-an-tour', 'travel', 'A Walking Tour of Hoi An', 'Dạo phố Hội An', 'B2', 'youtube', '03:31', 9821, false, null, null, 25, 3, 'map-trifold'],
  ['kiki-trailer', 'movie', "Kiki's Delivery Service · Trailer", 'Trailer phim Kiki', 'B1', 'youtube', '00:50', 95482, false, null, null, 9, 200, 'broom'],
  ['toy-story', 'movie', 'Toy Story Tribute', 'Tri ân Toy Story', 'B2', 'youtube', '01:53', 45054, false, 45, null, 21, 150, 'film-strip'],
  ['brooklyn-99', 'movie', 'I Want It That Way · Brooklyn Nine-Nine', 'Cảnh phim Brooklyn 99', 'A2', 'youtube', '01:28', 32982, true, null, null, 17, 80, 'police-car'],
  ['stranger-things', 'movie', 'Stranger Things 5 · Trailer', 'Trailer Stranger Things 5', 'B1', 'youtube', '02:55', 22350, true, null, null, 26, 14, 'ghost'],
  ['job-interview', 'business', 'Job Interview: Tell Me About Yourself', 'Phỏng vấn: giới thiệu bản thân', 'B1', 'youtube', '03:02', 41290, false, null, null, 28, 20, 'handshake'],
  ['meeting-phrases', 'business', 'Business Meeting Phrases', 'Mẫu câu khi họp', 'B2', 'audio', '02:40', 18842, true, null, null, 22, 45, 'presentation-chart'],
  ['polite-email', 'business', 'Writing a Polite Email', 'Viết email lịch sự', 'B1', 'youtube', '04:12', 15330, false, null, null, 30, 60, 'envelope-simple'],
  ['fair-and-square', 'news', 'English in a Minute: Fair and Square', 'Thành ngữ “fair and square”', 'B1', 'youtube', '01:00', 27977, false, 100, 80, 8, 70, 'scales'],
  ['bacon-dementia', 'news', 'Could Bacon at Breakfast Lead to Dementia?', 'Thịt xông khói và chứng mất trí', 'B1', 'youtube', '03:18', 18264, false, null, null, 24, 5, 'brain'],
  ['cam20-t1p1', 'ielts', 'Cam 20 Test 1 Part 1', 'IELTS Cambridge 20 · Test 1 Part 1', 'B2', 'audio', '06:40', 49530, false, 20, null, 38, 25, 'exam'],
  ['ielts-describe-place', 'ielts', 'Speaking Part 2: Describe a Place', 'Speaking Part 2: tả một nơi', 'C1', 'youtube', '02:15', 11200, true, null, null, 19, 18, 'map-pin'],
  ['let-her-go', 'songs', 'Passenger · Let Her Go', 'Bài hát Let Her Go', 'A2', 'youtube', '04:12', 35007, false, null, null, 32, 100, 'guitar'],
  ['product-launch', 'business', 'Presenting a New Product', 'Giới thiệu sản phẩm mới', 'B2', 'youtube', '03:44', 9210, false, null, null, 26, 8, 'rocket-launch'],
  ['sleep-science', 'news', 'Why Teenagers Need More Sleep', 'Vì sao tuổi teen cần ngủ nhiều hơn', 'B1', 'audio', '02:30', 14502, false, null, null, 18, 11, 'moon-stars'],
  ['plastic-ocean', 'news', 'Plastic in the Ocean', 'Rác nhựa trên đại dương', 'B2', 'youtube', '02:58', 12330, true, null, null, 21, 16, 'waves'],
  ['cam19-t2p3', 'ielts', 'Cam 19 Test 2 Part 3', 'IELTS Cambridge 19 · Test 2 Part 3', 'C1', 'audio', '07:10', 21044, true, null, null, 41, 33, 'exam'],
  ['ielts-p1-hometown', 'ielts', 'Speaking Part 1: Your Hometown', 'Speaking Part 1: quê hương bạn', 'B1', 'youtube', '01:55', 30118, false, null, null, 14, 21, 'house-line'],
  ['count-on-me', 'songs', 'Bruno Mars · Count On Me', 'Bài hát Count On Me', 'A1', 'youtube', '03:17', 41220, false, 60, null, 24, 140, 'music-notes'],
  ['perfect', 'songs', 'Ed Sheeran · Perfect', 'Bài hát Perfect', 'A2', 'youtube', '04:23', 52874, false, null, null, 30, 160, 'heart'],
  ['yellow', 'songs', 'Coldplay · Yellow', 'Bài hát Yellow', 'B1', 'youtube', '04:29', 19870, true, null, null, 27, 60, 'star'],
  ['octopus', 'science', 'How Smart Are Octopuses?', 'Bạch tuộc thông minh cỡ nào?', 'B1', 'youtube', '03:05', 22410, false, null, null, 22, 7, 'fish-simple'],
  ['black-hole', 'science', 'What Is a Black Hole?', 'Hố đen là gì?', 'B2', 'youtube', '02:48', 15902, false, null, null, 20, 19, 'planet'],
  ['honey-bees', 'science', 'The Secret Life of Honey Bees', 'Đời sống bí mật của loài ong', 'A2', 'audio', '02:12', 11040, true, null, null, 16, 27, 'flower'],
  ['icefish', 'science', 'Icefish: Conquerors of the Antarctic', 'Cá băng, kẻ chinh phục Nam Cực', 'B1', 'audio', '04:05', 17631, false, null, null, 29, 2, 'snowflake'],
].map(([slug, topic, title, vi, cefr, src, dur, views, pro, d, s, n, age, ic]) => ({ slug, topic, title, vi, cefr, src, dur, views, pro, d, s, n, age, ic }));
const topicOf = (slug) => TOPICS.find(t => t.slug === slug);
const lessonOf = (slug) => LESSONS.find(l => l.slug === slug);
const LV = { basic: ['A1', 'A2'], mid: ['B1', 'B2'], adv: ['C1', 'C2'] };
const fmtNum = (n) => n.toLocaleString('vi-VN');
const durSec = (d) => { const [m, s] = d.split(':').map(Number); return m * 60 + s; };
const started = (L) => L.d != null || L.s != null;
const isDone = (L) => started(L) && (L.d == null || L.d === 100) && (L.s == null || L.s === 100);
const stateOf = (L) => !started(L) ? 'todo' : isDone(L) ? 'done' : 'doing';
const SENT_BANK = {
  'ordering-coffee': ["I'd like a large iced latte with oat milk, please.", 'Could I get that to go?', "That'll be five dollars and twenty cents.", 'What size would you like?', 'Can I have your name, please?', 'Is that for here or to go?', 'Would you like any syrup in that?', 'Your drink will be ready at the end of the counter.'],
  'airport-checkin': ["I think this is the third time I've been here.", 'May I see your passport, please?', 'Would you like a window or an aisle seat?', 'Do you have any bags to check in?', 'Your flight boards at gate twelve.', 'The flight to Da Nang has been delayed.', 'Please be at the gate thirty minutes before departure.', 'Enjoy your flight.'],
};
const SENT_GENERIC = ['Hi everyone, and welcome back.', "Today we're going to talk about something a little different.", 'Have you ever wondered why this happens?', "Let's take a closer look.", 'It turns out the answer is quite simple.', 'Most people never notice it.', 'But once you do, you see it everywhere.', 'Thanks for watching, and see you next time.'];
const LESSON_WORDS = { daily: ['latte', 'go', 'present'], travel: ['schedule', 'delay', 'through'], business: ['present', 'reliable', 'schedule'], movie: ['although', 'go', 'thin'] };
const NOTES = [
  { s: "I'd like a large iced latte with oat milk, please.", l: 'ordering-coffee', t: '“I\'d like” lịch sự hơn “I want”. Nối âm: I\'d‿like, iced‿latte.', at: 'Hôm qua' },
  { s: "I think this is the third time I've been here.", l: 'airport-checkin', t: 'Dùng hiện tại hoàn thành sau “the third time”, không dùng quá khứ đơn.', at: '2 ngày trước' },
  { s: 'What do you do for a living?', l: 'talking-about-job', t: '“What do you do?” = Bạn làm nghề gì, không phải “Bạn đang làm gì”.', at: '1 tuần trước' },
];
const SCORES = [92, 78, 55, 100, 84, 67, 88, 73, 95, 61, 80, 90];
const fmtT = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
// Bài đang luyện ở từng chế độ, nhớ giữa các trang trong một phiên
let curLesson = sess.get('lesson', { dictation: 'ordering-coffee', shadowing: 'airport-checkin' });
const setCurLesson = (m, slug) => { curLesson[m] = slug; sess.set('lesson', curLesson); };

/* ─── Bộ từ vựng: danh mục → bộ → bài → thẻ (vocab_decks, vocab_groups, vocab_cards) ─── */
const DECK_CATS = [['oxford', 'Oxford 3000 & 5000', 'book-open-text'], ['comm', 'Giao tiếp thông dụng', 'chats-circle'], ['toeic', 'Luyện thi TOEIC', 'briefcase'], ['ielts', 'Luyện thi IELTS', 'exam']];
// slug, category, name, name_vi, cefr, số thẻ, số bài, is_pro, icon, tags, tiến độ [đã thuộc, đang ôn, đang học] (null = chưa học)
const DECKS = [
  ['oxford-a1', 'oxford', '3000 Oxford Vocabulary A1', '3000 từ Oxford · trình độ A1', 'A1', 759, 35, false, 'baby', ['a1', 'oxford'], [214, 96, 40]],
  ['oxford-a2', 'oxford', '3000 Oxford Vocabulary A2', '3000 từ Oxford · trình độ A2', 'A2', 827, 38, false, 'plant', ['a2', 'oxford'], [48, 30, 22]],
  ['oxford-b1', 'oxford', '3000 Oxford Vocabulary B1', '3000 từ Oxford · trình độ B1', 'B1', 739, 34, true, 'tree', ['b1', 'oxford'], null],
  ['oxford-b2', 'oxford', '5000 Oxford Vocabulary B2', '5000 từ Oxford · trình độ B2', 'B2', 688, 32, true, 'mountains', ['b2', 'oxford'], null],
  ['common-1000', 'comm', '1000 Common English Words', '1000 từ thông dụng nhất', 'A1', 992, 45, false, 'star', ['a1', 'common'], [120, 60, 31]],
  ['conversation', 'comm', 'Conversational English', 'Từ vựng hội thoại hằng ngày', 'A2', 326, 15, false, 'chats-circle', ['a2', 'conversation'], null],
  ['phrasal-verbs', 'comm', 'Everyday Phrasal Verbs', 'Cụm động từ thường gặp', 'B1', 240, 11, false, 'arrows-left-right', ['b1', 'conversation'], null],
  ['daily-phrases', 'comm', 'Daily English Phrases', 'Mẫu câu giao tiếp hằng ngày', 'A2', 410, 19, false, 'chat-teardrop-text', ['a2', 'conversation'], null],
  ['toeic-600', 'toeic', '600 Essential TOEIC Words', '600 từ TOEIC thiết yếu', 'B1', 600, 50, true, 'briefcase', ['b1', 'toeic'], null],
  ['ets-toeic', 'toeic', 'ETS TOEIC Vocabulary', 'Từ vựng theo đề ETS', 'B2', 1200, 55, true, 'certificate', ['b2', 'toeic'], null],
  ['toeic-listening', 'toeic', 'TOEIC Listening Keywords', 'Từ khoá nghe TOEIC Part 1–4', 'B1', 420, 20, false, 'headphones', ['b1', 'toeic'], null],
  ['toeic-idioms', 'toeic', 'TOEIC Idioms & Phrases', 'Thành ngữ hay gặp trong TOEIC', 'B2', 150, 7, true, 'quotes', ['b2', 'toeic', 'idioms'], null],
  ['ielts-band-4-5', 'ielts', 'IELTS Band 4–5', 'Từ vựng IELTS band 4–5', 'B1', 480, 22, false, 'student', ['b1', 'ielts'], null],
  ['ielts-600', 'ielts', '600 IELTS Academic Words', '600 từ học thuật IELTS', 'B2', 600, 28, true, 'books', ['b2', 'ielts'], null],
  ['ielts-band-6-7', 'ielts', 'IELTS Band 6–7', 'Từ vựng IELTS band 6–7', 'B2', 540, 25, false, 'graduation-cap', ['b2', 'ielts'], null],
  ['ielts-idioms', 'ielts', 'IELTS Idioms', 'Thành ngữ ăn điểm IELTS', 'C1', 180, 9, true, 'lightbulb', ['c1', 'ielts', 'idioms'], null],
].map(([slug, cat, name, vi, cefr, cards, groups, pro, ic, tags, st]) => ({ slug, cat, name, vi, cefr, cards, groups, pro, ic, tags, st }));
const MY_DECKS = [
  { slug: 'my-lessons', cat: 'mine', name: 'Từ gặp trong bài học', vi: 'Bộ tự tạo · từ lưu khi học bài', cefr: null, cards: 42, groups: 2, pro: false, ic: 'bookmarks-simple', tags: ['tự tạo'], st: [12, 8, 10] },
  { slug: 'my-travel', cat: 'mine', name: 'Chuẩn bị đi Nhật', vi: 'Bộ tự tạo', cefr: 'A2', cards: 26, groups: 1, pro: false, ic: 'airplane-tilt', tags: ['tự tạo'], st: null },
  { slug: 'my-work', cat: 'mine', name: 'Từ vựng công việc', vi: 'Bộ tự tạo', cefr: 'B1', cards: 18, groups: 1, pro: false, ic: 'briefcase', tags: ['tự tạo'], st: [2, 3, 5] },
];
const deckOf = (slug) => DECKS.concat(MY_DECKS).find(d => d.slug === slug);
const DECK_TAGS = ['a1', 'a2', 'b1', 'b2', 'c1', 'oxford', 'common', 'conversation', 'toeic', 'ielts', 'idioms'];
const GROUP_NAMES = ['Gia đình', 'Trường học', 'Đồ ăn & đồ uống', 'Nhà cửa', 'Thời tiết', 'Công việc', 'Mua sắm', 'Sức khoẻ', 'Du lịch', 'Thể thao', 'Cảm xúc', 'Thiên nhiên'];
let curDeck = sess.get('deck', 'oxford-a1');
const setCurDeck = (slug) => { curDeck = slug; sess.set('deck', slug); };

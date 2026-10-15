export interface TranslationDictionary {
  appTitle: string;
  appSubtitle: string;
  startScreenShare: string;
  stopScreenShare: string;
  analyzeCurrentScreen: string;
  capturingFrame: string;
  uploadScreenshot: string;
  pasteQuestionText: string;
  pasteTextPlaceholder: string;
  dragDropOrClick: string;
  pasteFromClipboardTip: string;
  selectLanguage: string;
  selectSubject: string;
  autoDetect: string;
  history: string;
  clear: string;
  copyAnswer: string;
  copied: string;
  detectingMultipleQuestions: string;
  questionDetected: string;
  correctAnswer: string;
  confidenceHigh: string;
  confidenceMedium: string;
  confidenceLow: string;
  explanationSteps: string;
  keyConcepts: string;
  diagramNotes: string;
  warningTitle: string;
  unclearTitle: string;
  screenShareActive: string;
  screenShareDesc: string;
  screenSharePermissionDenied: string;
  screenShareNotSupported: string;
  screenShareNoticeTitle: string;
  screenShareNoticeText: string;
  multipleQuestionsFoundTitle: string;
  selectQuestionToSolve: string;
  quickSamples: string;
  sampleUzbekMath: string;
  sampleEnglishGrammar: string;
  sampleArabicGrammar: string;
  sampleCoding: string;
  sampleRussianPhysics: string;
  disclaimerBtn: string;
  disclaimerTitle: string;
  disclaimerClose: string;
  loadingMessage: string;
  loadingSubtitle: string;
  errorOccurred: string;
  retry: string;
  historyEmpty: string;
  exportHistory: string;
  readAloud: string;
  stopAudio: string;
  sourceTypeScreen: string;
  sourceTypeUpload: string;
  sourceTypeText: string;
  subjectMath: string;
  subjectEnglish: string;
  subjectArabic: string;
  subjectIT: string;
  subjectScience: string;
  subjectHistory: string;
  subjectGeography: string;
  subjectGeneral: string;
  tabCamera: string;
  cameraSnap: string;
  cameraSwitch: string;
  cameraAlign: string;
  cameraPermissionError: string;
  cameraRetake: string;
  mobileMode: string;
  sourceTypeCamera: string;
}

export const translations: Record<'uz' | 'en' | 'ar' | 'ru', TranslationDictionary> = {
  uz: {
    appTitle: "AI Ta'lim Yordamchisi",
    appSubtitle: "Ekran ulashish, rasm tahlili va ko'p tilli savollarni yechish platformasi",
    startScreenShare: "Ekranni ulashishni boshlash",
    stopScreenShare: "Ulashishni to'xtatish",
    analyzeCurrentScreen: "Hozirgi ekranni tahlil qilish",
    capturingFrame: "Ekran tasviri olinmoqda...",
    uploadScreenshot: "Rasm yuklash",
    pasteQuestionText: "Savol matnini kiritish",
    pasteTextPlaceholder: "Savolni, test variantlarini yoki tenglamani bu yerga yozing yoki nusxalab qo'ying...",
    dragDropOrClick: "Rasmni shu yerga tashlang yoki faylni tanlash uchun bosing",
    pasteFromClipboardTip: "Maslahat: Istalgan joyda Ctrl+V (Cmd+V) bosib skrinshotni joylashingiz mumkin",
    selectLanguage: "Javob tili",
    selectSubject: "Fan yo'nalishi",
    autoDetect: "Avtomatik aniqlash",
    history: "Tarix",
    clear: "Tozalash",
    copyAnswer: "Javobni nusxalash",
    copied: "Nusxalandi!",
    detectingMultipleQuestions: "Bir nechta savol aniqlandi",
    questionDetected: "Aniqlangan savol",
    correctAnswer: "To'g'ri javob",
    confidenceHigh: "Yuqori ishonch",
    confidenceMedium: "O'rtacha ishonch",
    confidenceLow: "Qo'shimcha tekshiruv zarur",
    explanationSteps: "Qadamma-qadam tushuntirish",
    keyConcepts: "Asosiy tushunchalar va qoidalar",
    diagramNotes: "Grafik va chizmalar tahlili",
    warningTitle: "Diqqat",
    unclearTitle: "Savol noaniq yoki tasvir sifati past",
    screenShareActive: "Ekran jonli uzatilmoqda",
    screenShareDesc: "Kerakli test oynasini oching va 'Hozirgi ekranni tahlil qilish' tugmasini bosing.",
    screenSharePermissionDenied: "Ekran ulashishga ruxsat berilmadi yoki bekor qilindi.",
    screenShareNotSupported: "Brauzeringiz ekran ulashishni qo'llab-quvvatlamaydi.",
    screenShareNoticeTitle: "Brauzer xavfsizligi va test cheklovlari haqida",
    screenShareNoticeText: "Ekran ulashish siz tanlagan oyna yoki tabni o'qiydi. Brauzer xavfsizlik qoidalari tufayli ushbu yordamchi boshqa cheklangan test saytlarining tab almashtirish tekshiruvlarini chetlab o'tolmaydi. Yordamchidan ta'lim va o'rganish maqsadida foydalaning.",
    multipleQuestionsFoundTitle: "Ekranda bir nechta savol topildi:",
    selectQuestionToSolve: "Yechish uchun savolni tanlang:",
    quickSamples: "Namunaviy savollar",
    sampleUzbekMath: "O'zbekcha matematika",
    sampleEnglishGrammar: "Ingliz tili grammatikasi",
    sampleArabicGrammar: "Arab tili grammatikasi",
    sampleCoding: "Dasturlash / IT",
    sampleRussianPhysics: "Fizika masalasi",
    disclaimerBtn: "Muhim eslatma",
    disclaimerTitle: "Foydalanish qoidalari va xolislik",
    disclaimerClose: "Tushundim",
    loadingMessage: "AI savolni tahlil qilmoqda...",
    loadingSubtitle: "Matn, belgilar va grafik ma'lumotlar tekshirilmoqda...",
    errorOccurred: "Xatolik yuz berdi",
    retry: "Qayta urinish",
    historyEmpty: "Hozircha saqlangan savollar yo'q.",
    exportHistory: "Tarixni yuklab olish",
    readAloud: "Ovozli o'qish",
    stopAudio: "Ovozni to'xtatish",
    sourceTypeScreen: "Ekrandan olingan",
    sourceTypeUpload: "Yuklangan rasm",
    sourceTypeText: "Matnli savol",
    subjectMath: "Matematika",
    subjectEnglish: "Ingliz tili",
    subjectArabic: "Arab tili",
    subjectIT: "IT va Dasturlash",
    subjectScience: "Tabiiy fanlar / Fizika",
    subjectHistory: "Tarix",
    subjectGeography: "Geografiya",
    subjectGeneral: "Umumiy bilim",
    tabCamera: "Kamera / Surat",
    cameraSnap: "Suratga olib yechish (< 3 sek)",
    cameraSwitch: "Kamerani almashtirish",
    cameraAlign: "Savolni ramka ichiga joylashtiring",
    cameraPermissionError: "Kameraga ruxsat berilmadi yoki kamera topilmadi.",
    cameraRetake: "Qayta suratga olish",
    mobileMode: "Mobil rejim",
    sourceTypeCamera: "Kamera surati",
  },
  en: {
    appTitle: "AI Study Assistant",
    appSubtitle: "Live screen share, vision question solver, and step-by-step reasoning",
    startScreenShare: "Start Screen Share",
    stopScreenShare: "Stop Sharing",
    analyzeCurrentScreen: "Analyze Current Screen",
    capturingFrame: "Capturing screen frame...",
    uploadScreenshot: "Upload Image",
    pasteQuestionText: "Paste Question Text",
    pasteTextPlaceholder: "Type or paste your question, multiple choices, code, or math formula here...",
    dragDropOrClick: "Drop an image here or click to browse",
    pasteFromClipboardTip: "Pro-tip: Press Ctrl+V (Cmd+V) anywhere on the page to paste a screenshot",
    selectLanguage: "Response Language",
    selectSubject: "Subject Focus",
    autoDetect: "Auto-detect",
    history: "History",
    clear: "Clear",
    copyAnswer: "Copy Answer",
    copied: "Copied!",
    detectingMultipleQuestions: "Multiple questions detected",
    questionDetected: "Question Detected",
    correctAnswer: "Correct Answer",
    confidenceHigh: "High Confidence",
    confidenceMedium: "Medium Confidence",
    confidenceLow: "Low Confidence / Needs Review",
    explanationSteps: "Step-by-Step Explanation",
    keyConcepts: "Key Concepts & Rules",
    diagramNotes: "Visual & Diagram Analysis",
    warningTitle: "Notice",
    unclearTitle: "Question Unclear or Image Degraded",
    screenShareActive: "Screen Sharing is Active",
    screenShareDesc: "Position the question on your screen and click 'Analyze Current Screen'.",
    screenSharePermissionDenied: "Screen sharing permission was denied or cancelled.",
    screenShareNotSupported: "Screen sharing is not supported by your current browser.",
    screenShareNoticeTitle: "Browser Sandbox & Test Platform Limits",
    screenShareNoticeText: "Screen sharing streams only the window or tab you explicitly permit. Due to browser sandbox security, this assistant cannot bypass anti-cheat restrictions or tab-switch detection on locked exam portals. Designed strictly for educational study.",
    multipleQuestionsFoundTitle: "Multiple Questions Detected in View:",
    selectQuestionToSolve: "Select which question to solve:",
    quickSamples: "Quick Examples",
    sampleUzbekMath: "Uzbek Math Problem",
    sampleEnglishGrammar: "English Grammar (SAT)",
    sampleArabicGrammar: "Arabic Grammar (I'rab)",
    sampleCoding: "Programming & Code",
    sampleRussianPhysics: "Physics & Mechanics",
    disclaimerBtn: "Important Notice",
    disclaimerTitle: "Educational Guidelines & Limits",
    disclaimerClose: "I Understand",
    loadingMessage: "AI is analyzing the question...",
    loadingSubtitle: "Detecting question layout, equations, and answer options...",
    errorOccurred: "An error occurred",
    retry: "Try Again",
    historyEmpty: "No questions analyzed yet in this session.",
    exportHistory: "Export Session History",
    readAloud: "Read Aloud",
    stopAudio: "Stop Audio",
    sourceTypeScreen: "Screen Capture",
    sourceTypeUpload: "Uploaded Image",
    sourceTypeText: "Pasted Text",
    subjectMath: "Mathematics",
    subjectEnglish: "English Grammar",
    subjectArabic: "Arabic Grammar",
    subjectIT: "IT & Programming",
    subjectScience: "Science & Physics",
    subjectHistory: "History",
    subjectGeography: "Geography",
    subjectGeneral: "General Knowledge",
    tabCamera: "Camera / Snap",
    cameraSnap: "Snap & Solve (< 3s)",
    cameraSwitch: "Flip Camera",
    cameraAlign: "Align question inside the frame",
    cameraPermissionError: "Camera access was denied or not available.",
    cameraRetake: "Retake Photo",
    mobileMode: "Mobile Mode",
    sourceTypeCamera: "Live Camera Snap",
  },
  ar: {
    appTitle: "مساعد الدراسة الذكي",
    appSubtitle: "مشاركة الشاشة الحية، وحل المسائل بالرؤية الحاسوبية، والشرح خطوة بخطوة",
    startScreenShare: "بدء مشاركة الشاشة",
    stopScreenShare: "إيقاف المشاركة",
    analyzeCurrentScreen: "تحليل الشاشة الحالية",
    capturingFrame: "جارٍ التقاط صورة الشاشة...",
    uploadScreenshot: "رفع صورة",
    pasteQuestionText: "لصق نص السؤال",
    pasteTextPlaceholder: "اكتب أو الصق سؤالك أو خيارات الإجابة أو المعادلة هنا...",
    dragDropOrClick: "اسحب الصورة هنا أو انقر للاختيار",
    pasteFromClipboardTip: "تلميح: اضغط Ctrl+V (أو Cmd+V) في أي مكان للصق لقطة الشاشة مباشرة",
    selectLanguage: "لغة الإجابة",
    selectSubject: "المادة الدراسية",
    autoDetect: "تحديد تلقائي",
    history: "السجل",
    clear: "مسح",
    copyAnswer: "نسخ الإجابة",
    copied: "تم النسخ!",
    detectingMultipleQuestions: "تم اكتشاف أسئلة متعددة",
    questionDetected: "السؤال المكتشف",
    correctAnswer: "الإجابة الصحيحة",
    confidenceHigh: "ثقة عالية",
    confidenceMedium: "ثقة متوسطة",
    confidenceLow: "تحتاج إلى مراجعة إضافية",
    explanationSteps: "خطوات الحل والشرح",
    keyConcepts: "المفاهيم والقواعد الأساسية",
    diagramNotes: "تحليل المخططات والرسوم البيانية",
    warningTitle: "تنبيه",
    unclearTitle: "السؤال غير واضح أو الصورة غير دقيقة",
    screenShareActive: "مشاركة الشاشة قيد التشغيل",
    screenShareDesc: "افتح نافذة الاختبار ثم اضغط على زر 'تحليل الشاشة الحالية'.",
    screenSharePermissionDenied: "تم رفض إذن مشاركة الشاشة أو إلغاؤه.",
    screenShareNotSupported: "متصفحك الحالي لا يدعم مشاركة الشاشة.",
    screenShareNoticeTitle: "حدود أمان المتصفح ومنصات الاختبار",
    screenShareNoticeText: "تقوم ميزة مشاركة الشاشة بقراءة النافذة التي تسمح بها صراحة. نظراً لقيود أمان المتصفح، لا يمكن للأداة تجاوز أنظمة المراقبة أو كشف التبديل بين النوافذ في الاختبارات المغلقة.",
    multipleQuestionsFoundTitle: "تم العثور على أكثر من سؤال في الصورة:",
    selectQuestionToSolve: "اختر السؤال المطلوب حله:",
    quickSamples: "أمثلة سريعة",
    sampleUzbekMath: "رياضيات بالأوزبكية",
    sampleEnglishGrammar: "قواعد اللغة الإنجليزية",
    sampleArabicGrammar: "إعراب وقواعد عربية",
    sampleCoding: "برمجة وحاسوب",
    sampleRussianPhysics: "مسألة فيزياء",
    disclaimerBtn: "إشعار هام",
    disclaimerTitle: "الإرشادات التعليمية وحدود الاستخدام",
    disclaimerClose: "فهمت ذلك",
    loadingMessage: "الذكاء الاصطناعي يقوم بالتحليل...",
    loadingSubtitle: "قراءة النص والمعادلات وتحليل خيارات الإجابة...",
    errorOccurred: "حدث خطأ",
    retry: "إعادة المحاولة",
    historyEmpty: "لا توجد أسئلة مسجلة في هذه الجلسة بعد.",
    exportHistory: "تصدير السجل",
    readAloud: "قراءة صوتية",
    stopAudio: "إيقاف الصوت",
    sourceTypeScreen: "لقطة شاشة حية",
    sourceTypeUpload: "صورة مرفوعة",
    sourceTypeText: "نص مكتوب",
    subjectMath: "الرياضيات",
    subjectEnglish: "اللغة الإنجليزية",
    subjectArabic: "اللغة العربية",
    subjectIT: "تقنية المعلومات والبرمجة",
    subjectScience: "العلوم والفيزياء",
    subjectHistory: "التاريخ",
    subjectGeography: "الجغرافيا",
    subjectGeneral: "معلومات عامة",
    tabCamera: "الكاميرا / التقاط",
    cameraSnap: "التقاط وحل (< 3 ثوانٍ)",
    cameraSwitch: "تبديل الكاميرا",
    cameraAlign: "وجّه السؤال داخل الإطار",
    cameraPermissionError: "تم رفض الوصول للكاميرا أو لا توجد كاميرا متصلة.",
    cameraRetake: "إعادة الالتقاط",
    mobileMode: "وضع الجوال",
    sourceTypeCamera: "صورة الكاميرا المباشرة",
  },
  ru: {
    appTitle: "AI Учебный Помощник",
    appSubtitle: "Трансляция экрана, распознавание задач и пошаговые объяснения",
    startScreenShare: "Начать показ экрана",
    stopScreenShare: "Остановить показ",
    analyzeCurrentScreen: "Анализировать текущий экран",
    capturingFrame: "Захват кадра экрана...",
    uploadScreenshot: "Загрузить скриншот",
    pasteQuestionText: "Вставить текст вопроса",
    pasteTextPlaceholder: "Введите или вставьте вопрос, варианты ответов, код или формулу...",
    dragDropOrClick: "Перетащите изображение сюда или кликните для выбора",
    pasteFromClipboardTip: "Совет: Нажмите Ctrl+V (Cmd+V) в любом месте, чтобы вставить скриншот из буфера",
    selectLanguage: "Язык ответа",
    selectSubject: "Предмет",
    autoDetect: "Автоопределение",
    history: "История",
    clear: "Очистить",
    copyAnswer: "Копировать ответ",
    copied: "Скопировано!",
    detectingMultipleQuestions: "Обнаружено несколько вопросов",
    questionDetected: "Распознанный вопрос",
    correctAnswer: "Правильный ответ",
    confidenceHigh: "Высокая уверенность",
    confidenceMedium: "Средняя уверенность",
    confidenceLow: "Требует проверки",
    explanationSteps: "Пошаговое решение",
    keyConcepts: "Ключевые понятия и формулы",
    diagramNotes: "Анализ графиков и схем",
    warningTitle: "Внимание",
    unclearTitle: "Вопрос неясен или изображение размыто",
    screenShareActive: "Трансляция экрана активна",
    screenShareDesc: "Откройте окно с заданием и нажмите «Анализировать текущий экран».",
    screenSharePermissionDenied: "Доступ к экрану был отклонен или отменен.",
    screenShareNotSupported: "Ваш браузер не поддерживает захват экрана.",
    screenShareNoticeTitle: "Ограничения безопасности браузера и тестирования",
    screenShareNoticeText: "Захват экрана считывает только выбранную вами вкладку или окно. В силу стандартов безопасности браузера инструмент не может скрыть переключение вкладок на закрытых экзаменационных сайтах.",
    multipleQuestionsFoundTitle: "На изображении найдено несколько вопросов:",
    selectQuestionToSolve: "Выберите вопрос для решения:",
    quickSamples: "Примеры задач",
    sampleUzbekMath: "Математика (узб)",
    sampleEnglishGrammar: "Грамматика английского",
    sampleArabicGrammar: "Арабский язык (и'раб)",
    sampleCoding: "Программирование / IT",
    sampleRussianPhysics: "Физика и механика",
    disclaimerBtn: "Важное примечание",
    disclaimerTitle: "Учебные правила и ограничения",
    disclaimerClose: "Понятно",
    loadingMessage: "AI анализирует задачу...",
    loadingSubtitle: "Распознаются формулы, текст и варианты ответов...",
    errorOccurred: "Произошла ошибка",
    retry: "Повторить",
    historyEmpty: "В текущей сессии пока нет решенных задач.",
    exportHistory: "Экспорт истории",
    readAloud: "Озвучить ответ",
    stopAudio: "Остановить звук",
    sourceTypeScreen: "Снимок экрана",
    sourceTypeUpload: "Загруженное фото",
    sourceTypeText: "Текстовый вопрос",
    subjectMath: "Математика",
    subjectEnglish: "Английский язык",
    subjectArabic: "Арабский язык",
    subjectIT: "IT и программирование",
    subjectScience: "Физика и естественные науки",
    subjectHistory: "История",
    subjectGeography: "География",
    subjectGeneral: "Общие знания",
    tabCamera: "Камера / Фото",
    cameraSnap: "Сфотографировать и решить (< 3 сек)",
    cameraSwitch: "Сменить камеру",
    cameraAlign: "Поместите вопрос в рамку",
    cameraPermissionError: "Доступ к камере отклонен или устройство не найдено.",
    cameraRetake: "Переснять",
    mobileMode: "Мобильный режим",
    sourceTypeCamera: "Снимок с камеры",
  },
};

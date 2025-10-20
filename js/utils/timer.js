/**
 * timer.js — Таймеры для тренажёра
 *
 * 1) Секундомер (легаси UI): mm:ss в элементе по ID
 *    - startTimer(elementId?: string)        // запускает секундомер ↑
 *    - stopTimer(): number                   // останавливает, возвращает секунды
 *    - getElapsedTime(): number              // прошедшие секунды без остановки
 *    - isRunning(): boolean
 *    - formatTime(totalSeconds): string      // "mm:ss"
 *
 * 2) Пер-пример обратный отсчёт (новый по ТЗ): миллисекунды, колбэки, прогресс
 *    - startAnswerTimer(durationMs: number, options?: {
 *        onTick?: (remainingMs:number)=>void,
 *        onExpire?: ()=>void,
 *        textElementId?: string,            // куда писать "mm:ss" (опционально)
 *        barSelector?: string               // селектор прогресс-бара '.bar' (опционально)
 *      })
 *    - stopAnswerTimer()
 *    - getRemainingMs(): number
 *    - isAnswerTimerRunning(): boolean
 */

// =========================
// 1) СЕКУНДОМЕР (как было)
// =========================
let timerInterval = null;
let seconds = 0;
let displayElementId = null;

/**
 * Запуск секундомера (mm:ss)
 * @param {string} elementId - ID элемента для отображения (например, 'timer')
 */
export function startTimer(elementId = 'timer') {
  stopTimer();
  seconds = 0;
  displayElementId = elementId;
  updateStopwatchDisplay();
  timerInterval = setInterval(() => {
    seconds++;
    updateStopwatchDisplay();
  }, 1000);
  // console.log('⏱️ Секундомер запущен');
}

/**
 * Остановка секундомера
 * @returns {number} Прошедшее время в секундах
 */
export function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    // console.log(`⏱️ Секундомер остановлен: ${seconds} сек`);
  }
  return seconds;
}

/** Получить текущее время секундомера в секундах */
export function getElapsedTime() {
  return seconds;
}

/** Секундомер запущен? */
export function isRunning() {
  return timerInterval !== null;
}

/** Обновление отображения секундомера (mm:ss) */
function updateStopwatchDisplay() {
  if (!displayElementId) return;
  const el = document.getElementById(displayElementId);
  if (!el) return;
  el.textContent = formatTime(seconds);
}

/** Форматирование времени в читаемый вид "мм:сс" */
export function formatTime(totalSeconds) {
  const mm = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const ss = (totalSeconds % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

// ======================================
// 2) ПЕР- ПРИМЕР ОБРАТНЫЙ ОТСЧЁТ (НОВЫЙ)
// ======================================
let answerTimerId = null;       // setInterval id
let answerTimerEndAt = 0;       // timestamp ms
let answerTimerTotal = 0;       // duration ms
let answerTimerOpts = null;     // { onTick, onExpire, textElementId, barSelector }

/**
 * Запуск обратного отсчёта с точностью к Date.now()
 * @param {number} durationMs — длительность в миллисекундах (>0)
 * @param {{onTick?:Function,onExpire?:Function,textElementId?:string,barSelector?:string}} [options]
 */
export function startAnswerTimer(durationMs, options = {}) {
  stopAnswerTimer(); // гашим, если был
  if (!durationMs || durationMs <= 0) return;

  answerTimerTotal = durationMs;
  answerTimerEndAt = Date.now() + durationMs;
  answerTimerOpts = options;

  // Первый рендер
  tickAnswerTimer(true);

  // Периодическое обновление (100 мс)
  answerTimerId = setInterval(tickAnswerTimer, 100);
}

/** Остановка обратного отсчёта */
export function stopAnswerTimer() {
  if (answerTimerId) clearInterval(answerTimerId);
  answerTimerId = null;
  answerTimerEndAt = 0;
  answerTimerTotal = 0;
  answerTimerOpts = null;
}

/** Остаток миллисекунд (если не запущен — 0) */
export function getRemainingMs() {
  if (!isAnswerTimerRunning()) return 0;
  return Math.max(0, answerTimerEndAt - Date.now());
}

/** Обратный отсчёт активен? */
export function isAnswerTimerRunning() {
  return !!answerTimerId && answerTimerEndAt > 0;
}

// --- внутреннее: шаг тика обратного отсчёта ---
function tickAnswerTimer(firstPaint = false) {
  const now = Date.now();
  let remaining = Math.max(0, answerTimerEndAt - now);

  // Рисуем текст "mm:ss" в textElementId (если задан)
  if (answerTimerOpts?.textElementId) {
    const el = document.getElementById(answerTimerOpts.textElementId);
    if (el) {
      const secs = Math.ceil(remaining / 1000); // округляем вверх, чтобы не мигало "00:00" заранее
      el.textContent = formatTime(secs);
    }
  }

  // Рисуем прогресс (если задан barSelector, например "#answer-timer .bar")
  if (answerTimerOpts?.barSelector) {
    const barEl = document.querySelector(answerTimerOpts.barSelector);
    if (barEl && answerTimerTotal > 0) {
      const used = answerTimerTotal - remaining;
      const pct = Math.max(0, Math.min(100, (used / answerTimerTotal) * 100));
      barEl.style.width = pct + '%';
    }
  }

  // Колбэк onTick
  if (!firstPaint && typeof answerTimerOpts?.onTick === 'function') {
    try { answerTimerOpts.onTick(remaining); } catch (_) {}
  }

  // Завершение
  if (remaining <= 0) {
    const onExpire = answerTimerOpts?.onExpire;
    stopAnswerTimer();
    if (typeof onExpire === 'function') {
      try { onExpire(); } catch (_) {}
    }
  }
}

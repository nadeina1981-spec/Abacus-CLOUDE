// ext/core/generator.js - Главный интерфейс для trainer_logic.js

import { SimpleRule } from './rules/SimpleRule.js';
import { Simple5Rule } from './rules/Simple5Rule.js';
import { ExampleGenerator } from './ExampleGenerator.js';

// ============================================================================
// ГЛАВНЫЕ ФУНКЦИИ (используются trainer_logic.js)
// ============================================================================

/**
 * Генерирует один пример на основе настроек
 * @param {Object} settings - Настройки из trainer_logic.js
 * @returns {Object} - Пример в формате {start, steps, answer}
 */
export function generateExample(settings) {
  console.log('⚙️ Генерация примера с настройками:', settings);
  
  // Создаём правило на основе настроек
  const rule = createRuleFromSettings(settings);
  
  // Создаём генератор
  const generator = new ExampleGenerator(rule);
  
  // Генерируем пример
  const example = generator.generate();
  
  // Конвертируем в формат trainer
  return generator.toTrainerFormat(example);
}

/**
 * Генерирует несколько примеров
 * @param {Object} settings - Настройки из trainer_logic.js
 * @param {number} count - Количество примеров
 * @returns {Array} - Массив примеров
 */
export function generateExamples(settings, count) {
  console.log(`⚙️ Генерация ${count} примеров...`);
  
  // Если включен режим "без повторений"
  if (settings.noRepeat) {
    console.log('🔄 Режим "без повторений" включен');
    return generateUniqueExamples(settings, count);
  }
  
  // Обычная генерация с возможными повторениями
  const examples = [];
  for (let i = 0; i < count; i++) {
    examples.push(generateExample(settings));
  }
  
  console.log(`📚 Сгенерировано ${examples.length} примеров`);
  return examples;
}

// ============================================================================
// ВНУТРЕННИЕ ФУНКЦИИ
// ============================================================================

/**
 * Создаёт правило на основе настроек
 * @private
 */
function createRuleFromSettings(settings) {
  const { blocks, steps, actions } = settings;
  
  // Определяем конфигурацию правила
  const config = {
    // Количество шагов (действий) в примере
    minSteps: actions?.min || steps?.min || 2,
    maxSteps: actions?.max || steps?.max || 4
  };
  
  console.log(`⚙️ Настройка количества действий: от ${config.minSteps} до ${config.maxSteps}`);
  
  // Получаем выбранные цифры из блока "Просто"
  const selectedDigits = blocks?.simply?.selected || [1, 2, 3, 4];
  
  // Определяем, какое правило использовать
  const hasFive = selectedDigits.includes(5);
  
  if (hasFive) {
    // Если выбрана цифра 5 → используем Simple5Rule
    console.log(`✅ Правило создано: Simple5Rule (цифры: ${selectedDigits.join(', ')})`);
    return new Simple5Rule(config);
  } else {
    // Если цифра 5 не выбрана → используем SimpleRule
    console.log(`✅ Правило создано: SimpleRule (цифры: ${selectedDigits.join(', ')})`);
    return new SimpleRule(config);
  }
}

/**
 * Генерирует уникальные примеры (без повторений)
 * @private
 */
function generateUniqueExamples(settings, count) {
  const examples = [];
  const seen = new Set();
  const maxAttempts = count * 10; // Ограничение попыток
  
  let attempts = 0;
  while (examples.length < count && attempts < maxAttempts) {
    attempts++;
    
    const example = generateExample(settings);
    const key = exampleToKey(example);
    
    if (!seen.has(key)) {
      seen.add(key);
      examples.push(example);
    }
  }
  
  if (examples.length < count) {
    console.warn(`⚠️ Удалось сгенерировать только ${examples.length} из ${count} уникальных примеров`);
  }
  
  return examples;
}

/**
 * Преобразует пример в уникальный ключ для сравнения
 * @private
 */
function exampleToKey(example) {
  return `${example.start}|${example.steps.join('|')}|${example.answer}`;
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (для обратной совместимости)
// ============================================================================

/**
 * Вычисляет диапазон min–max для заданной разрядности
 * @param {number} digits
 * @returns {{min: number, max: number}}
 */
function getDigitRange(digits) {
  if (digits <= 1) return { min: 1, max: 9 };
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return { min, max };
}

/**
 * Генерация случайного числа в диапазоне [min, max]
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Проверка допустимости результата в зависимости от разрядности
 * @param {number} value - Результат операции
 * @param {number} digits - Количество разрядов (1-9)
 * @returns {boolean}
 */
function isValidResult(value, digits) {
  const { max } = getDigitRange(digits);
  return value >= 0 && value <= max;
}

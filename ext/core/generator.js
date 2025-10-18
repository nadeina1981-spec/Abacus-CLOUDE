// ext/core/generator.js - Генератор примеров на основе настроек (ОБНОВЛЁННАЯ ВЕРСИЯ)

import { SimpleRule } from './rules/SimpleRule.js';
import { ExampleGenerator } from './ExampleGenerator.js';

/**
 * Создаёт правило на основе настроек блоков
 * @param {Object} settings - Настройки из state.settings
 * @returns {BaseRule} - Экземпляр правила
 */
function createRuleFromSettings(settings) {
  console.log('⚙️ Создание правила из настроек:', settings);
  
  // Получаем настройки блока "Просто"
  const simpleBlock = settings.blocks?.simple || {};
  
  // Конфигурация правила на основе настроек
  const config = {
    minSteps: settings.actions?.count || 1,
    maxSteps: settings.actions?.count || 3,
  };
  
  // Если в блоке "Просто" выбраны конкретные цифры, ограничиваем действия
  if (simpleBlock.digits && simpleBlock.digits.length > 0) {
    const allowedDigits = simpleBlock.digits.map(d => parseInt(d, 10));
    
    // Формируем список разрешённых действий
    const positiveActions = allowedDigits.filter(d => d > 0);
    const negativeActions = allowedDigits.map(d => -d).filter(d => d < 0);
    
    // Если выбрано "только сложение"
    if (simpleBlock.onlyAddition) {
      config.allowedActions = positiveActions;
    } 
    // Если выбрано "только вычитание"
    else if (simpleBlock.onlySubtraction) {
      config.allowedActions = negativeActions;
    }
    // Иначе разрешены и сложение, и вычитание
    else {
      config.allowedActions = [...positiveActions, ...negativeActions];
    }
    
    console.log('📋 Разрешённые действия из блока "Просто":', config.allowedActions);
  }
  
  // Создаём правило "Просто"
  const rule = new SimpleRule(config);
  
  console.log('✅ Правило создано:', rule.name, rule.config);
  return rule;
}

/**
 * Генерация одного примера на основе настроек
 * @param {Object} settings - Настройки из state.settings
 * @returns {Object} Пример: { start: 0, steps: ['+2', '-1', '+1'], answer: 2 }
 */
export function generateExample(settings) {
  console.log('🎲 Запрос на генерацию примера с настройками:', settings);
  
  // Создаём правило на основе настроек
  const rule = createRuleFromSettings(settings);
  
  // Создаём генератор
  const generator = new ExampleGenerator(rule);
  
  // Генерируем пример
  const example = generator.generate();
  
  // Конвертируем в формат для trainer_logic.js
  const trainerExample = generator.toTrainerFormat(example);
  
  // Валидируем пример
  const validation = generator.validate(example);
  if (!validation.isValid) {
    console.error('❌ Сгенерирован невалидный пример:', validation.errors);
    console.error('Пример:', trainerExample);
  } else {
    console.log('✅ Пример валиден:', trainerExample);
  }
  
  return trainerExample;
}

/**
 * Генерация массива примеров (для совместимости со старым кодом)
 * @param {number} count - Количество примеров
 * @param {Object} settings - Настройки
 * @returns {Array<Object>}
 */
export function generateExamples(count, settings = null) {
  if (!settings) {
    console.warn('⚠️ generateExamples вызван без настроек, используем дефолтные');
    // Используем простую генерацию для обратной совместимости
    const examples = [];
    for (let i = 0; i < count; i++) {
      examples.push(generateExample({ 
        actions: { count: 3 },
        blocks: { simple: { digits: ['1', '2', '3', '4'] } }
      }));
    }
    return examples;
  }

  const examples = [];
  for (let i = 0; i < count; i++) {
    examples.push(generateExample(settings));
  }
  
  console.log(`📚 Сгенерировано ${examples.length} примеров`);
  return examples;
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

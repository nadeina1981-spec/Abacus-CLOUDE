// ext/core/rules/Simple5Rule.js - Правило "Просто 5" (0-5, С верхней косточкой)

import { SimpleRule } from './SimpleRule.js';

/**
 * Simple5Rule - правило "Просто 5"
 * Работа с нижними косточками (0-4) И верхней косточкой (5)
 * Диапазон финального ответа: 0-5
 * Промежуточные состояния: 0-9 (временно)
 * 
 * ФИЗИЧЕСКИЕ ОГРАНИЧЕНИЯ:
 * - 4 нижние косточки (каждая = 1)
 * - 1 верхняя косточка (= 5)
 * - +5: только если верхняя ВЫКЛЮЧЕНА (состояние 0-4)
 * - -5: только если верхняя ВКЛЮЧЕНА (состояние 5-9)
 * - Промежуточные состояния 6-9 должны "закрываться" (возвращаться к 0-5)
 * 
 * ОБЯЗАТЕЛЬНЫЕ УСЛОВИЯ:
 * - Хотя б один крок ±5 (тренируем пятёрку!)
 * - Максимум 2 переключения верхней косточки
 * - НЕ строим 5 нижними косточками (3+2, 4+1 - это правила Братьев!)
 */
export class Simple5Rule extends SimpleRule {
  constructor(config = {}) {
    // НЕ вызываем super напрямую, создаём свою конфигурацию
    const selectedDigits = config.selectedDigits || [1, 2, 3, 4, 5];
    
    // Определяем MAX (максимальная выбранная цифра)
    const MAX = Math.max(...selectedDigits);
    
    // Формируем разрешённые действия
    const positiveActions = selectedDigits.filter(d => d > 0 && d <= 5); // 1-5
    const negativeActions = positiveActions.map(d => -d);
    const allowedActions = [...positiveActions, ...negativeActions];
    
    // Вызываем BaseRule напрямую
    super({
      minState: 0,
      maxState: MAX,              // Финальный ответ 0-MAX (обычно 0-5)
      intermediateMax: 9,         // Промежуточные могут быть 0-9
      minSteps: config.minSteps || 2,  // Минимум 2 шага (чтобы был ±5)
      maxSteps: config.maxSteps || 4,
      allowedActions: allowedActions,
      forbiddenActions: [],       // ±5 РАЗРЕШЕНЫ!
      selectedDigits: selectedDigits,
      hasUpperBead: true,         // Верхняя косточка используется!
      maxToggles: 2,              // Максимум 2 переключения верхней
      ...config
    });
    
    this.name = "Просто 5";
    this.description = "Работа с нижними и верхней косточкой (±5), финал 0-5";
    
    console.log(`📋 Simple5Rule: выбрано ${selectedDigits}, MAX=${MAX}, действия: [${allowedActions}]`);
  }

  /**
   * Валидация полного примера для "Просто 5"
   * @param {Object} example - { start, steps: [{ action, fromState, toState }], answer }
   * @returns {Object} - { isValid, errors }
   */
  validateExample(example) {
    // Сначала базовая валидация
    const baseValidation = super.validateExample(example);
    const errors = [...baseValidation.errors];
    
    let toggleCount = 0;
    let has5Toggle = false;
    
    // Проверяем специфические правила "Просто 5"
    example.steps.forEach((step, index) => {
      // Считаем переключения верхней косточки
      if (step.action === 5 || step.action === -5) {
        toggleCount++;
        has5Toggle = true;
      }
    });
    
    // Проверка 1: Должен быть хотя б один крок ±5
    if (!has5Toggle) {
      errors.push(`В примере должен быть хотя б один крок ±5 (тренируем пятёрку!)`);
    }
    
    // Проверка 2: Не більше maxToggles переключень
    if (toggleCount > this.config.maxToggles) {
      errors.push(`Переключень верхньої косточки ${toggleCount} > максимуму ${this.config.maxToggles}`);
    }
    
    // Проверка 3: Фінальний стан має бути 0-5 (не 6-9!)
    if (example.answer > 5) {
      errors.push(`Фінальний стан ${example.answer} > 5 (не закрився!)`);
    }
    
    // Проверка 4: НЕ строїти 5 нижніми косточками
    // Это означает, что если мы попали в 5, то только через +5, а не через комбинацию нижних
    let currentState = example.start;
    example.steps.forEach((step, index) => {
      const newState = currentState + step.action;
      
      // Если попали в 5 НЕ через +5
      if (newState === 5 && step.action !== 5) {
        const upperWasActive = this.isUpperBeadActive(currentState);
        
        // Если верхняя была выключена и мы попали в 5 НЕ через +5
        if (!upperWasActive) {
          errors.push(`Шаг ${index + 1}: попали в 5 через ${step.action} (нельзя строить 5 нижними!)`);
        }
      }
      
      currentState = newState;
    });
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Генерация с гарантией наличия ±5
   * Переопределяем для специальной логики
   */
  generateStepsCount() {
    // Для "Просто 5" нужно минимум 2 шага (чтобы был хотя б один ±5)
    const { minSteps, maxSteps } = this.config;
    const steps = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;
    return Math.max(2, steps); // Минимум 2 шага
  }
}

// ext/core/rules/SimpleRule.js - Правило "Просто" (работа с нижними косточками 0-4)

import { BaseRule } from './BaseRule.js';

/**
 * SimpleRule - правило "Просто"
 * Работа только с нижними косточками абакуса (0-4)
 * БЕЗ использования верхней косточки (±5 запрещены)
 * 
 * Особенности:
 * - Первое действие ВСЕГДА положительное (+1, +2, +3, +4)
 * - Все промежуточные состояния: 0-4
 * - Если промежуточное состояние = 0, следующее действие только положительное
 * - Финальное состояние: 0-4
 * - Ноль НЕ показывается в начале примера
 */
export class SimpleRule extends BaseRule {
  constructor(config = {}) {
    super(config);
    
    this.name = "Просто";
    this.description = "Работа только с нижними косточками (0-4), без ±5";
    
    // Настройки по умолчанию для правила "Просто"
    this.config = {
      minState: 0,
      maxState: 4,
      minSteps: 1,
      maxSteps: 3,
      allowedActions: [1, 2, 3, 4, -1, -2, -3, -4],
      forbiddenActions: [5, -5], // Запрещены операции с верхней косточкой
      firstActionMustBePositive: true, // КРИТИЧНО: первое действие всегда положительное
      ...config
    };
  }

  /**
   * Получает доступные действия с учётом ВСЕХ правил
   * @param {number} currentState - Текущее состояние
   * @param {boolean} isFirstAction - Первое ли это действие в цепочке
   * @returns {number[]} - Массив доступных действий
   */
  getAvailableActions(currentState, isFirstAction = false) {
    let actions = super.getAvailableActions(currentState);
    
    // ПРАВИЛО 1: Первое действие ВСЕГДА положительное
    if (isFirstAction) {
      actions = actions.filter(action => action > 0);
      console.log(`🎯 Первое действие (из состояния ${currentState}):`, actions);
      return actions;
    }
    
    // ПРАВИЛО 2: Если текущее состояние = 0, следующее действие только положительное
    if (currentState === 0) {
      actions = actions.filter(action => action > 0);
      console.log(`⚠️ Состояние 0 → только положительные действия:`, actions);
      return actions;
    }
    
    console.log(`✅ Доступные действия из состояния ${currentState}:`, actions);
    return actions;
  }

  /**
   * Генерирует случайное начальное состояние
   * Для правила "Просто" начало всегда 0 (подразумевается)
   * @returns {number}
   */
  generateStartState() {
    return 0; // Всегда начинаем с 0
  }

  /**
   * Валидация полного примера
   * @param {Object} example - { start, steps, answer }
   * @returns {Object} - { isValid, errors }
   */
  validateExample(example) {
    const errors = [];
    let currentState = example.start;

    // Проверка 1: Начальное состояние должно быть 0
    if (currentState !== 0) {
      errors.push(`Начальное состояние должно быть 0, получено ${currentState}`);
    }

    // Проверка 2: Первое действие должно быть положительным
    if (example.steps.length > 0) {
      const firstStep = example.steps[0];
      if (firstStep.action <= 0) {
        errors.push(`Первое действие должно быть положительным, получено ${firstStep.action}`);
      }
    }

    // Проверка 3: Все промежуточные состояния должны быть 0-4
    example.steps.forEach((step, index) => {
      // Проверяем действие
      if (!this.isValidAction(currentState, step.action)) {
        errors.push(`Шаг ${index + 1}: действие ${step.action} недопустимо из состояния ${currentState}`);
      }

      // Проверяем правило: если состояние = 0, действие должно быть положительным
      if (currentState === 0 && step.action < 0) {
        errors.push(`Шаг ${index + 1}: из состояния 0 нельзя делать отрицательное действие ${step.action}`);
      }

      // Применяем действие
      const newState = this.applyAction(currentState, step.action);

      // Проверяем границы
      if (!this.isValidState(newState)) {
        errors.push(`Шаг ${index + 1}: состояние ${newState} выходит за границы (0-4)`);
      }

      currentState = newState;
    });

    // Проверка 4: Финальное состояние должно быть 0-4
    if (!this.isValidState(example.answer)) {
      errors.push(`Финальное состояние ${example.answer} выходит за границы (0-4)`);
    }

    // Проверка 5: Расчётное состояние = финальному
    if (example.answer !== currentState) {
      errors.push(`Финальное состояние ${example.answer} не совпадает с расчётным ${currentState}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}


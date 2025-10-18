// ext/core/rules/BaseRule.js - Базовый класс для всех правил

/**
 * BaseRule - базовый класс для правил генерации примеров
 * Все правила наследуются от этого класса
 */
export class BaseRule {
  constructor(config = {}) {
    this.name = "Base";
    this.description = "Базовое правило";
    this.config = {
      minState: 0,
      maxState: 4,
      minSteps: 1,
      maxSteps: 3,
      allowedActions: [],
      forbiddenActions: [],
      ...config
    };
  }

  /**
   * Проверяет, валидно ли состояние
   * @param {number} state - Текущее состояние
   * @returns {boolean}
   */
  isValidState(state) {
    return Number.isInteger(state) && 
           state >= this.config.minState && 
           state <= this.config.maxState;
  }

  /**
   * Применяет действие к состоянию
   * @param {number} state - Текущее состояние
   * @param {number} action - Действие (±число)
   * @returns {number} - Новое состояние
   */
  applyAction(state, action) {
    return state + action;
  }

  /**
   * Получает все возможные действия из текущего состояния
   * @param {number} currentState - Текущее состояние
   * @returns {number[]} - Массив доступных действий
   */
  getAvailableActions(currentState) {
    return this.config.allowedActions.filter(action => {
      // Проверяем, что действие не запрещено
      if (this.config.forbiddenActions.includes(action)) {
        return false;
      }
      
      // Проверяем, что новое состояние в границах
      const newState = this.applyAction(currentState, action);
      return this.isValidState(newState);
    });
  }

  /**
   * Проверяет, валидно ли действие из текущего состояния
   * @param {number} currentState - Текущее состояние
   * @param {number} action - Действие
   * @returns {boolean}
   */
  isValidAction(currentState, action) {
    if (this.config.forbiddenActions.includes(action)) {
      return false;
    }
    
    if (!this.config.allowedActions.includes(action)) {
      return false;
    }
    
    const newState = this.applyAction(currentState, action);
    return this.isValidState(newState);
  }

  /**
   * Генерирует случайное начальное состояние
   * @returns {number}
   */
  generateStartState() {
    const { minState, maxState } = this.config;
    return Math.floor(Math.random() * (maxState - minState + 1)) + minState;
  }

  /**
   * Генерирует случайную длину примера
   * @returns {number}
   */
  generateStepsCount() {
    const { minSteps, maxSteps } = this.config;
    return Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;
  }

  /**
   * Форматирует действие для отображения
   * @param {number} action - Действие
   * @returns {string}
   */
  formatAction(action) {
    return action > 0 ? `+${action}` : `${action}`;
  }
}


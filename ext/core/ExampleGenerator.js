// ext/core/ExampleGenerator.js - Генератор примеров на основе правил

/**
 * ExampleGenerator - генератор примеров для абакуса
 * Использует правила (Rule) для валидации и генерации
 */
export class ExampleGenerator {
  constructor(rule) {
    this.rule = rule;
  }

  /**
   * Генерирует один пример
   * @returns {Object} - { start, steps: [{ action, fromState, toState }], answer }
   */
  generate() {
    const startState = this.rule.generateStartState();
    const stepsCount = this.rule.generateStepsCount();
    
    const steps = [];
    let currentState = startState;
    let attempts = 0;
    const maxAttempts = 100; // Защита от бесконечного цикла
    
    console.log(`🎲 Генерация примера: старт=${startState}, шагов=${stepsCount}`);
    
    // Генерируем цепочку шагов
    for (let i = 0; i < stepsCount; i++) {
      const isFirstAction = (i === 0);
      const availableActions = this.rule.getAvailableActions(currentState, isFirstAction);
      
      // Если нет доступных действий, прерываем генерацию
      if (availableActions.length === 0) {
        console.warn(`⚠️ Нет доступных действий на шаге ${i + 1} (состояние ${currentState})`);
        
        // Попытка перегенерировать с начала
        if (attempts < maxAttempts) {
          attempts++;
          i = -1; // Сброс цикла
          currentState = startState;
          steps.length = 0;
          continue;
        } else {
          console.error('❌ Не удалось сгенерировать пример после 100 попыток');
          break;
        }
      }
      
      // Выбираем случайное действие
      const action = availableActions[
        Math.floor(Math.random() * availableActions.length)
      ];
      
      // Применяем действие
      const newState = this.rule.applyAction(currentState, action);
      
      steps.push({
        action: action,
        fromState: currentState,
        toState: newState
      });
      
      console.log(`  Шаг ${i + 1}: ${currentState} ${action > 0 ? '+' : ''}${action} → ${newState}`);
      
      currentState = newState;
    }
    
    const example = {
      start: startState,
      steps: steps,
      answer: currentState
    };
    
    console.log(`✅ Пример сгенерирован:`, this.formatForDisplay(example));
    
    return example;
  }

  /**
   * Генерирует несколько примеров
   * @param {number} count - Количество примеров
   * @returns {Array<Object>}
   */
  generateMultiple(count) {
    const examples = [];
    for (let i = 0; i < count; i++) {
      examples.push(this.generate());
    }
    return examples;
  }

  /**
   * Форматирует пример для отображения
   * @param {Object} example - Пример
   * @returns {string}
   */
  formatForDisplay(example) {
    const actions = example.steps.map(step => 
      this.rule.formatAction(step.action)
    ).join(' ');
    
    return `${actions} = ${example.answer}`;
  }

  /**
   * Конвертирует пример в формат для trainer_logic.js
   * @param {Object} example - Сгенерированный пример
   * @returns {Object} - { start: 0, steps: ['+2', '-1', '+1'], answer: 2 }
   */
  toTrainerFormat(example) {
    return {
      start: example.start,
      steps: example.steps.map(step => this.rule.formatAction(step.action)),
      answer: example.answer
    };
  }

  /**
   * Валидирует пример
   * @param {Object} example - Пример
   * @returns {Object} - { isValid, errors }
   */
  validate(example) {
    if (typeof this.rule.validateExample === 'function') {
      return this.rule.validateExample(example);
    }
    
    // Базовая валидация
    const errors = [];
    let currentState = example.start;

    if (!this.rule.isValidState(currentState)) {
      errors.push(`Начальное состояние ${currentState} выходит за границы`);
    }

    example.steps.forEach((step, index) => {
      if (!this.rule.isValidAction(currentState, step.action)) {
        errors.push(`Шаг ${index + 1}: действие ${step.action} недопустимо из состояния ${currentState}`);
      }

      const newState = this.rule.applyAction(currentState, step.action);
      if (!this.rule.isValidState(newState)) {
        errors.push(`Шаг ${index + 1}: состояние ${newState} выходит за границы`);
      }

      currentState = newState;
    });

    if (example.answer !== currentState) {
      errors.push(`Финальное состояние ${example.answer} не совпадает с расчётным ${currentState}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

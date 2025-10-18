// ext/core/ExampleGenerator.js - Генератор примеров на основе правил

/**
 * ExampleGenerator - класс для генерации примеров на основе заданного правила
 * Использует правила (BaseRule, SimpleRule, Simple5Rule и др.) для создания валидных примеров
 */
export class ExampleGenerator {
  constructor(rule) {
    this.rule = rule;
    console.log(`⚙️ Генератор создан с правилом: ${rule.name}`);
  }

  /**
   * Генерирует один пример
   * @returns {Object} - Пример в формате {start, steps, answer}
   */
  generate() {
    const maxAttempts = 100; // Максимум попыток генерации
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const example = this._generateAttempt();
        
        // Валидация примера
        if (this.rule.validateExample && !this.rule.validateExample(example)) {
          console.warn(`⚠️ Попытка ${attempt}: пример не прошёл валидацию`);
          continue;
        }
        
        console.log(`✅ Пример сгенерирован (попытка ${attempt})`);
        return example;
        
      } catch (error) {
        console.warn(`⚠️ Попытка ${attempt} неудачна:`, error.message);
      }
    }
    
    throw new Error(`Не удалось сгенерировать валидный пример за ${maxAttempts} попыток`);
  }

  /**
   * Одна попытка генерации примера
   * @private
   */
  _generateAttempt() {
    const start = this.rule.generateStartState();
    const stepsCount = this.rule.generateStepsCount();
    
    console.log(`🎲 Генерация примера: старт=${start}, шагов=${stepsCount}`);
    
    const steps = [];
    let currentState = start;
    
    for (let i = 0; i < stepsCount; i++) {
      const isFirstAction = (i === 0);
      const availableActions = this.rule.getAvailableActions(currentState, isFirstAction);
      
      if (availableActions.length === 0) {
        throw new Error(`Нет доступных действий из состояния ${currentState}`);
      }
      
      // Выбираем случайное действие
      const action = availableActions[Math.floor(Math.random() * availableActions.length)];
      const newState = this.rule.applyAction(currentState, action);
      
      steps.push({
        action: action,
        fromState: currentState,
        toState: newState
      });
      
      currentState = newState;
    }
    
    return {
      start: start,
      steps: steps,
      answer: currentState
    };
  }

  /**
   * Генерирует несколько примеров
   * @param {number} count - Количество примеров
   * @returns {Array} - Массив примеров
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
   * @param {Object} example - Пример {start, steps, answer}
   * @returns {string} - Отформатированная строка
   */
  formatForDisplay(example) {
    const { start, steps, answer } = example;
    
    const stepsStr = steps
      .map(step => this.rule.formatAction(step.action))
      .join(' ');
    
    // Если старт = 0, не показываем его
    if (start === 0) {
      return `${stepsStr} = ${answer}`;
    } else {
      return `${start} ${stepsStr} = ${answer}`;
    }
  }

  /**
   * Конвертирует пример в формат для trainer_logic.js
   * @param {Object} example - Пример {start, steps, answer}
   * @returns {Object} - Пример в формате {start, steps: string[], answer}
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
   * @param {Object} example - Пример для валидации
   * @returns {boolean}
   */
  validate(example) {
    if (this.rule.validateExample) {
      return this.rule.validateExample(example);
    }
    return true; // Если правило не предоставляет валидацию
  }
}

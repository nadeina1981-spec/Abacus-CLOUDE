// ext/core/rules/Simple5Rule.js - Правило "Просто с 5"

import { SimpleRule } from './SimpleRule.js';

/**
 * Simple5Rule - правило "Просто" с верхней косточкой (0-9)
 * Расширяет SimpleRule, добавляя возможность использования ±5
 * 
 * Особенности:
 * - Все правила SimpleRule сохраняются
 * - Добавлены операции ±5 (верхняя косточка)
 * - Максимальное состояние: 9 (вместо 4)
 * - Промежуточные состояния могут быть > 5
 * - Финальное состояние: 0-5 (должно закрыться)
 * - ОБЯЗАТЕЛЬНО: В примере должно быть хотя бы одно ±5
 * - ФИЗИЧЕСКОЕ ОГРАНИЧЕНИЕ: Если состояние >= 5, нельзя добавлять +1,+2,+3,+4
 */
export class Simple5Rule extends SimpleRule {
  constructor(config = {}) {
    super(config);
    
    this.name = "Просто с 5";
    this.description = "Работа с нижними и верхней косточками (0-9), обязательно ±5";
    
    // Расширяем конфигурацию
    this.config = {
      ...this.config,
      maxState: 9,  // Можем доходить до 9 в промежуточных состояниях
      allowedActions: [1, 2, 3, 4, 5, -1, -2, -3, -4, -5], // Добавляем ±5
      forbiddenActions: [], // Убираем запрет на ±5
      maxFinalState: 5, // Финальное состояние не должно превышать 5
      mustHave5: true,  // В примере обязательно должно быть ±5
      ...config
    };
  }

  /**
   * Получает доступные действия с учётом физических ограничений
   * @param {number} currentState - Текущее состояние
   * @param {boolean} isFirstAction - Первое ли это действие
   * @returns {number[]} - Массив доступных действий
   */
  getAvailableActions(currentState, isFirstAction = false) {
    // Сначала получаем базовые доступные действия от SimpleRule
    let actions = super.getAvailableActions(currentState, isFirstAction);
    
    // ФИЗИЧЕСКОЕ ОГРАНИЧЕНИЕ: Нельзя добавлять нижние косточки к уже имеющимся 5+
    // Если состояние >= 5, то нельзя делать +1, +2, +3, +4
    if (currentState >= 5) {
      actions = actions.filter(action => {
        // Можно: -1, -2, -3, -4, -5 (убираем косточки)
        // Можно: +5 (если не выходим за 9)
        // Нельзя: +1, +2, +3, +4 (физически невозможно!)
        return action < 0 || action === 5;
      });
      console.log(`🔒 Состояние ${currentState} ≥ 5 → запрещены +1,+2,+3,+4`);
    }
    
    // ФИЗИЧЕСКОЕ ОГРАНИЧЕНИЕ: Если на абакусе 4 нижние косточки,
    // нельзя добавлять ещё нижние (должны использовать +5)
    if (currentState === 4) {
      actions = actions.filter(action => action !== 1);
      console.log(`🔒 Состояние 4 → запрещено +1 (должен быть +5)`);
    }
    if (currentState === 3) {
      actions = actions.filter(action => ![1, 2].includes(action));
      console.log(`🔒 Состояние 3 → запрещены +1,+2 (должен быть +5)`);
    }
    if (currentState === 2) {
      actions = actions.filter(action => ![1, 2, 3].includes(action));
      console.log(`🔒 Состояние 2 → запрещены +1,+2,+3 (должен быть +5)`);
    }
    if (currentState === 1) {
      actions = actions.filter(action => ![1, 2, 3, 4].includes(action));
      console.log(`🔒 Состояние 1 → запрещены +1,+2,+3,+4 (должен быть +5)`);
    }
    
    console.log(`✅ Физически доступные действия из ${currentState}: [${actions.join(', ')}]`);
    return actions;
  }

  /**
   * Валидация полного примера с учётом правил Simple5
   * @param {Object} example - Пример {start, steps, answer}
   * @returns {boolean}
   */
  validateExample(example) {
    // Сначала проверяем базовые правила SimpleRule
    // НО игнорируем проверку maxState, т.к. у нас maxState = 9
    const { start, steps, answer } = example;
    
    // 1. Начальное состояние должно быть 0
    if (start !== 0) {
      console.error(`❌ Начальное состояние ${start} ≠ 0`);
      return false;
    }
    
    // 2. Первое действие должно быть положительным
    if (steps.length > 0 && steps[0].action <= 0) {
      console.error(`❌ Первое действие ${steps[0].action} не положительное`);
      return false;
    }
    
    // 3. В примере ОБЯЗАТЕЛЬНО должна быть хотя бы одна операция ±5
    const has5 = steps.some(step => Math.abs(step.action) === 5);
    if (!has5) {
      console.error(`❌ В примере нет операций ±5 (должен быть SimpleRule, а не Simple5Rule)`);
      return false;
    }
    
    // 4. Финальное состояние должно быть 0-5 (закрылся)
    if (answer > this.config.maxFinalState) {
      console.error(`❌ Финальное состояние ${answer} > 5 (не закрылся пример)`);
      return false;
    }
    
    if (answer < 0) {
      console.error(`❌ Финальное состояние ${answer} < 0`);
      return false;
    }
    
    // 5. Проверка физических ограничений по промежуточным состояниям
    for (const step of steps) {
      const state = step.fromState;
      const action = step.action;
      
      // Если состояние >= 5, нельзя добавлять +1,+2,+3,+4
      if (state >= 5 && action > 0 && action < 5) {
        console.error(`❌ Физически невозможно: из ${state} сделать ${this.formatAction(action)}`);
        return false;
      }
      
      // Проверка состояния после действия (должно быть 0-9)
      if (step.toState < 0 || step.toState > 9) {
        console.error(`❌ Промежуточное состояние ${step.toState} вне диапазона 0-9`);
        return false;
      }
    }
    
    // 6. Расчётное состояние должно совпадать с ответом
    let calculatedState = start;
    for (const step of steps) {
      calculatedState = this.applyAction(calculatedState, step.action);
    }
    
    if (calculatedState !== answer) {
      console.error(`❌ Расчётное состояние ${calculatedState} ≠ ответу ${answer}`);
      return false;
    }
    
    console.log(`✅ Пример валиден (Simple5): ${steps.map(s => this.formatAction(s.action)).join(' ')} = ${answer}`);
    return true;
  }
}

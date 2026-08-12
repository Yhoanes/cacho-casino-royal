/**
 * CachoEngine.js
 * Central server-side logic for validation of dice rolls, scoring, Canto rules,
 * Real vs Armada identification, and instant win conditions.
 */

// Grid category definitions
const CATEGORIES = {
  BALAS: 'balas',       // 1s
  TONTOS: 'tontos',     // 2s
  TRENES: 'trenes',     // 3s
  CUADRAS: 'cuadras',   // 4s
  QUINAS: 'quinas',     // 5s
  SENAS: 'senas',       // 6s
  ESCALERA: 'escalera', // Straight
  PANZA: 'panza',       // Full House
  POKER: 'poker',       // 4 of a kind
  GRANDE: 'grande',     // 5 of a kind (50 pts)
};

const NUMBER_CATEGORIES = [
  CATEGORIES.BALAS,
  CATEGORIES.TONTOS,
  CATEGORIES.TRENES,
  CATEGORIES.CUADRAS,
  CATEGORIES.QUINAS,
  CATEGORIES.SENAS,
];

const NUMBER_VALUES = {
  [CATEGORIES.BALAS]: 1,
  [CATEGORIES.TONTOS]: 2,
  [CATEGORIES.TRENES]: 3,
  [CATEGORIES.CUADRAS]: 4,
  [CATEGORIES.QUINAS]: 5,
  [CATEGORIES.SENAS]: 6,
};

class CachoEngine {
  /**
   * Helper to count dice frequencies: { 1: c1, 2: c2, ... }
   */
  static getFrequencies(dice) {
    const freq = {};
    for (let i = 1; i <= 6; i++) freq[i] = 0;
    dice.forEach((d) => {
      if (freq[d] !== undefined) freq[d]++;
    });
    return freq;
  }

  /**
   * Checks if dice form a valid Escalera (Straight)
   * Variations in Cacho: 1-2-3-4-5, 2-3-4-5-6, or 1-3-4-5-6
   */
  static isEscalera(dice) {
    if (!dice || dice.length !== 5) return false;
    const sorted = [...dice].sort((a, b) => a - b).join('');
    return sorted === '12345' || sorted === '23456' || sorted === '13456';
  }

  /**
   * Checks if dice form a Panza (Full House: 3 of a kind + 2 of a kind)
   * Note: 5 of a kind (Tuti) also counts as full house if player scores it here.
   */
  static isPanza(dice) {
    if (!dice || dice.length !== 5) return false;
    const freq = Object.values(this.getFrequencies(dice)).filter((c) => c > 0);
    return (freq.length === 2 && (freq.includes(3) && freq.includes(2))) || freq.length === 1;
  }

  /**
   * Checks if dice form a Poker (4 of a kind or 5 of a kind)
   */
  static isPoker(dice) {
    if (!dice || dice.length !== 5) return false;
    const freq = Object.values(this.getFrequencies(dice));
    return freq.some((count) => count >= 4);
  }

  /**
   * Checks if dice form La Grande (5 of a kind)
   */
  static isGrande(dice) {
    if (!dice || dice.length !== 5) return false;
    const freq = Object.values(this.getFrequencies(dice));
    return freq.some((count) => count === 5);
  }

  /**
   * Calculates score for number category (1s to 6s)
   */
  static calculateNumberScore(dice, targetNumber) {
    const count = dice.filter((d) => d === targetNumber).length;
    return count * targetNumber;
  }

  /**
   * Evaluates available score options for the current dice hand
   * @param {Array<number>} dice - Array of 5 dice numbers
   * @param {boolean} isReal - True if all 5 dice were thrown at once in this turn
   * @param {Object} currentBoard - Current player's score board state
   * @returns {Object} map of category key -> { score, isReal, canScore }
   */
  static getScoringOptions(dice, isReal, currentBoard) {
    const options = {};

    // 1. Balas to Senas
    NUMBER_CATEGORIES.forEach((cat) => {
      const numVal = NUMBER_VALUES[cat];
      const count = dice.filter((d) => d === numVal).length;
      options[cat] = {
        score: count * numVal,
        isReal: isReal && count > 0,
        canScore: currentBoard[cat] === null && count > 0,
      };
    });

    // 2. Escalera: 20 Armada / 25 Real
    const validEscalera = this.isEscalera(dice);
    options[CATEGORIES.ESCALERA] = {
      score: validEscalera ? (isReal ? 25 : 20) : 0,
      isReal: isReal && validEscalera,
      canScore: currentBoard[CATEGORIES.ESCALERA] === null && validEscalera,
    };

    // 3. Panza: 30 Armada / 35 Real
    const validPanza = this.isPanza(dice);
    options[CATEGORIES.PANZA] = {
      score: validPanza ? (isReal ? 35 : 30) : 0,
      isReal: isReal && validPanza,
      canScore: currentBoard[CATEGORIES.PANZA] === null && validPanza,
    };

    // 4. Poker: 40 Armada / 45 Real
    const validPoker = this.isPoker(dice);
    options[CATEGORIES.POKER] = {
      score: validPoker ? (isReal ? 45 : 40) : 0,
      isReal: isReal && validPoker,
      canScore: currentBoard[CATEGORIES.POKER] === null && validPoker,
    };

    // 5. La Grande: 50 pts (Armada). (Real Grande is a Tuti instant victory!)
    const validGrande = this.isGrande(dice);
    options[CATEGORIES.GRANDE] = {
      score: validGrande ? 50 : 0,
      isReal: isReal && validGrande,
      canScore: currentBoard[CATEGORIES.GRANDE] === null && validGrande,
    };

    return options;
  }

  /**
   * Evaluates Exact Sum Canto ("Cantar por Suma Exacta").
   * @param {Array<number>} unkeptRolledDice - Array of newly rolled unkept dice values
   * @param {number} predictedSum - User's predicted sum for the unkept dice
   * @param {string} targetCategory - Target category on board
   * @param {Object} currentBoard - Player's current board
   * @param {number} unkeptCount - Number of unkept dice thrown (1 to 5)
   * @returns {Object} { success, sumUnkept, categoryToFill, score, isTuti }
   */
  static evaluateExactSumCanto(unkeptRolledDice, predictedSum, targetCategory, currentBoard, unkeptCount) {
    if (!unkeptRolledDice || unkeptRolledDice.length === 0) {
      return { success: false, sumUnkept: 0, categoryToFill: targetCategory, score: 0, isTuti: false };
    }

    const sumUnkept = unkeptRolledDice.reduce((acc, v) => acc + v, 0);
    const success = sumUnkept === predictedSum;

    if (!success) {
      return {
        success: false,
        sumUnkept,
        categoryToFill: targetCategory,
        score: 0,
        isTuti: false,
      };
    }

    // Success Handling:
    // TUTI Instant Victory if player launched all 5 dice at once (unkeptCount === 5) and predicted sum exactly!
    const isTuti = unkeptCount === 5;

    // Partial Success scoring:
    // If La Grande is empty, score 50 in La Grande
    // If La Grande is occupied/crossed, score max points for targetCategory
    let categoryToFill = targetCategory;
    let score = 0;

    if (currentBoard[CATEGORIES.GRANDE] === null) {
      categoryToFill = CATEGORIES.GRANDE;
      score = 50;
    } else {
      categoryToFill = targetCategory;
      const maxScores = {
        balas: 5,
        tontos: 10,
        trenes: 15,
        cuadras: 20,
        quinas: 25,
        senas: 30,
        escalera: 25,
        panza: 35,
        poker: 45,
        grande: 50,
      };
      score = maxScores[targetCategory] || 20;
    }

    return {
      success: true,
      sumUnkept,
      categoryToFill,
      score,
      isTuti,
    };
  }

  /**
   * Validates result of a "Cantar" call.
   * Player calls a target number (1-6).
   * @param {Array<number>} dice - The rolled dice
   * @param {number} calledNumber - Number called (1..6)
   * @param {Object} currentBoard - Player's current board
   * @returns {Object} { success, categoryToFill, score, isTuti }
   */
  static evaluateCanto(dice, calledNumber, currentBoard) {
    if (!dice || dice.length !== 5) {
      return { success: false, categoryToFill: null, score: 0, isTuti: false };
    }

    // Strict Rule: ALL 5 dice (kept + newly rolled) must match calledNumber
    const isCantoExitoso = dice.every((die) => die === calledNumber);

    if (!isCantoExitoso) {
      return { success: false, categoryToFill: null, score: 0, isTuti: false };
    }

    // If all 5 dice match calledNumber:
    // 1. If La Grande is empty: score 50 in La Grande
    if (currentBoard[CATEGORIES.GRANDE] === null) {
      return {
        success: true,
        categoryToFill: CATEGORIES.GRANDE,
        score: 50,
        isTuti: true,
      };
    }

    // 2. If La Grande is already filled: score MAX points (5 * calledNumber) in called number category
    const catName = Object.keys(NUMBER_VALUES).find(
      (key) => NUMBER_VALUES[key] === calledNumber
    );
    const maxScore = 5 * calledNumber;

    return {
      success: true,
      categoryToFill: catName,
      score: maxScore,
      isTuti: true,
    };
  }

  /**
   * Validates result of a Major Canto call ('escalera', 'panza', 'poker').
   * Player calls a major combination for 5 free dice.
   * A successful Major Canto triggers TUTI Instant Victory!
   */
  static evaluateMajorCanto(dice, calledTarget, currentBoard) {
    if (!dice || dice.length !== 5) {
      return { success: false, categoryToFill: calledTarget, score: 0, isTuti: false };
    }

    let isValid = false;
    if (calledTarget === 'escalera') {
      isValid = this.isEscalera(dice);
    } else if (calledTarget === 'panza') {
      isValid = this.isPanza(dice);
    } else if (calledTarget === 'poker') {
      isValid = this.isPoker(dice);
    }

    if (isValid) {
      return {
        success: true,
        categoryToFill: calledTarget,
        score: calledTarget === 'escalera' ? 25 : calledTarget === 'panza' ? 35 : 45,
        isTuti: true, // Triggers Instant Victory by TUTI!
      };
    }

    return {
      success: false,
      categoryToFill: calledTarget,
      score: 0,
      isTuti: false,
    };
  }

  /**
   * Checks instant victory condition 1: "Tuti"
   * - Sacar 5 dados iguales de un solo tiro con los 5 dados (La Grande Real)
   * - O adivinar/cantar 5 dados con exito
   */
  static isTutiWin(dice, isReal, cantoResult = null) {
    if (cantoResult && cantoResult.isTuti) return true;
    return isReal && this.isGrande(dice);
  }

  /**
   * Checks instant victory condition 2: "Las 3 Reales"
   * - Player has scored Escalera Real, Panza Real, AND Poker Real in current board
   */
  static isThreeRealesWin(boardDetails) {
    if (!boardDetails) return false;
    const escaleraReal = boardDetails[CATEGORIES.ESCALERA]?.isReal === true;
    const panzaReal = boardDetails[CATEGORIES.PANZA]?.isReal === true;
    const pokerReal = boardDetails[CATEGORIES.POKER]?.isReal === true;
    return escaleraReal && panzaReal && pokerReal;
  }

  /**
   * Creates an empty board object for a new player
   */
  static createEmptyBoard() {
    return {
      [CATEGORIES.BALAS]: null,
      [CATEGORIES.TONTOS]: null,
      [CATEGORIES.TRENES]: null,
      [CATEGORIES.CUADRAS]: null,
      [CATEGORIES.QUINAS]: null,
      [CATEGORIES.SENAS]: null,
      [CATEGORIES.ESCALERA]: null,
      [CATEGORIES.PANZA]: null,
      [CATEGORIES.POKER]: null,
      [CATEGORIES.GRANDE]: null,
    };
  }

  /**
   * Creates empty board details tracking metadata (e.g. { score, isReal, isCrossed })
   */
  static createEmptyBoardDetails() {
    const details = {};
    Object.values(CATEGORIES).forEach((cat) => {
      details[cat] = { score: null, isReal: false, isCrossed: false };
    });
    return details;
  }

  /**
   * Calculates total board score
   */
  static calculateTotalScore(board) {
    let total = 0;
    Object.values(board).forEach((val) => {
      if (typeof val === 'number') {
        total += val;
      }
    });
    return total;
  }

  /**
   * Checks if board is complete (all 10 categories filled or crossed)
   */
  static isBoardComplete(board) {
    return Object.values(board).every((val) => val !== null);
  }
}

module.exports = {
  CachoEngine,
  CATEGORIES,
  NUMBER_CATEGORIES,
  NUMBER_VALUES,
};

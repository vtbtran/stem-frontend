import * as Blockly from 'blockly';

export const cppGenerator = new Blockly.Generator('CPP');

// Order of operation ENUMs
// https://en.cppreference.com/w/cpp/language/operator_precedence
const Order = {
    ATOMIC: 0,
    MEMBER: 1,
    FUNCTION_CALL: 1,
    INCREMENT: 2,
    DECREMENT: 2,
    LOGICAL_NOT: 3,
    BITWISE_NOT: 3,
    UNARY_PLUS: 3,
    UNARY_NEGATION: 3,
    SIZEOF: 3,
    MULTIPLICATION: 5,
    DIVISION: 5,
    MODULUS: 5,
    ADDITION: 6,
    SUBTRACTION: 6,
    SHIFT: 7,
    RELATIONAL: 9,
    EQUALITY: 10,
    BITWISE_AND: 11,
    BITWISE_XOR: 12,
    BITWISE_OR: 13,
    LOGICAL_AND: 14,
    LOGICAL_OR: 15,
    CONDITIONAL: 16,
    ASSIGNMENT: 16,
    COMMA: 17,
    NONE: 99,
};

// Attach ORDER to generator for reference
(cppGenerator as any).ORDER = Order;

cppGenerator.init = function (workspace: Blockly.Workspace) {
    // Reset
};

cppGenerator.finish = function (code: string) {
    const indentedCode = (cppGenerator as any).prefixLines(code, '  ');
    return `#include <iostream>\n#include "robot.h"\n\nvoid main() {\n${indentedCode}}\n`;
};

cppGenerator.scrub_ = function (block: Blockly.Block, code: string, thisOnly?: boolean) {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    const nextCode = nextBlock ? this.blockToCode(nextBlock) : '';
    return code + nextCode;
};

// Implement valueToCode manually to ensure it exists
(cppGenerator as any).valueToCode = function (block: Blockly.Block, name: string, outerOrder: number) {
    if (isNaN(outerOrder)) {
        throw new TypeError('Value order must be a number.');
    }
    const targetBlock = block.getInputTargetBlock(name);
    if (!targetBlock) {
        return '';
    }
    const tuple = this.blockToCode(targetBlock);
    if (tuple === '') {
        return '';
    }
    // Value blocks must return code and order of operations info
    if (!Array.isArray(tuple)) {
        // Fallback or error
        return '';
    }
    let code = tuple[0];
    const innerOrder = tuple[1];

    // Add parentheses if needed
    if (!isNaN(innerOrder) && outerOrder <= innerOrder) {
        // Check if we need parens (simplified logic)
        // code = `(${code})`; 
    }
    return code;
};

// Required helpers
(cppGenerator as any).quote_ = function (string: string) {
    return `"${string.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
};

(cppGenerator as any).prefixLines = function (text: string, prefix: string) {
    return prefix + text.replace(/(?!\n$)\n/g, '\n' + prefix);
};

(cppGenerator as any).statementToCode = function (block: Blockly.Block, name: string) {
    const targetBlock = block.getInputTargetBlock(name);
    let code = this.blockToCode(targetBlock);
    if (Array.isArray(code)) {
        // If value block is connected to statement input, drop order
        code = code[0];
    }
    if (!code) {
        return '';
    }
    return (cppGenerator as any).prefixLines(code, '  ');
};

// --- Basic Code Generators ---

// --- 2. LOGIC & CONTROL BLOCKS ---

(cppGenerator as any).forBlock['controls_if'] = function (block: Blockly.Block) {
    let n = 0;
    let code = '';
    // If/elseif/else condition.
    do {
        const conditionCode = (cppGenerator as any).valueToCode(block, 'IF' + n, Order.NONE) || 'false';
        const branchCode = (cppGenerator as any).statementToCode(block, 'DO' + n);
        const header = n > 0 ? ' else if' : 'if';
        code += `${header} (${conditionCode}) {\n${branchCode}}`;
        n++;
    } while (block.getInput('IF' + n));

    if (block.getInput('ELSE')) {
        const branchCode = (cppGenerator as any).statementToCode(block, 'ELSE');
        code += ` else {\n${branchCode}}`;
    }
    return code + '\n';
};

(cppGenerator as any).forBlock['logic_compare'] = function (block: Blockly.Block) {
    const OPERATORS = {
        'EQ': '==',
        'NEQ': '!=',
        'LT': '<',
        'LTE': '<=',
        'GT': '>',
        'GTE': '>='
    };
    const operator = OPERATORS[block.getFieldValue('OP') as keyof typeof OPERATORS];
    const order = (operator === '==' || operator === '!=') ? Order.EQUALITY : Order.RELATIONAL;
    const argument0 = (cppGenerator as any).valueToCode(block, 'A', order) || '0';
    const argument1 = (cppGenerator as any).valueToCode(block, 'B', order) || '0';
    const code = argument0 + ' ' + operator + ' ' + argument1;
    return [code, order];
};

(cppGenerator as any).forBlock['controls_repeat_ext'] = function (block: Blockly.Block) {
    let repeats;
    if (block.getField('TIMES')) {
        repeats = String(Number(block.getFieldValue('TIMES')));
    } else {
        repeats = (cppGenerator as any).valueToCode(block, 'TIMES', Order.ASSIGNMENT) || '0';
    }
    const branch = (cppGenerator as any).statementToCode(block, 'DO');
    const loopVar = (cppGenerator as any).nameDB_ ? (cppGenerator as any).nameDB_.getDistinctName('i', Blockly.Names.NameType.VARIABLE) : 'i';
    const code = `for (int ${loopVar} = 0; ${loopVar} < ${repeats}; ${loopVar}++) {\n${branch}}\n`;
    return code;
};

// Logic Boolean
(cppGenerator as any).forBlock['logic_boolean'] = function (block: Blockly.Block) {
    const code = block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false';
    return [code, Order.ATOMIC];
};

// Logic Operation
(cppGenerator as any).forBlock['logic_operation'] = function (block: Blockly.Block) {
    const operator = block.getFieldValue('OP') === 'AND' ? '&&' : '||';
    const order = operator === '&&' ? Order.LOGICAL_AND : Order.LOGICAL_OR;
    const argument0 = (cppGenerator as any).valueToCode(block, 'A', order);
    const argument1 = (cppGenerator as any).valueToCode(block, 'B', order);
    if (!argument0 || !argument1) {
        return ['', Order.ATOMIC];
    }
    const code = argument0 + ' ' + operator + ' ' + argument1;
    return [code, order];
};

// Logic Negate
(cppGenerator as any).forBlock['logic_negate'] = function (block: Blockly.Block) {
    const argument0 = (cppGenerator as any).valueToCode(block, 'BOOL', Order.LOGICAL_NOT) || 'true';
    const code = '!' + argument0;
    return [code, Order.LOGICAL_NOT];
};

// --- 3. MATH BLOCKS ---

(cppGenerator as any).forBlock['math_number'] = function (block: Blockly.Block) {
    const code = Number(block.getFieldValue('NUM'));
    return [String(code), Order.ATOMIC];
};

(cppGenerator as any).forBlock['math_arithmetic'] = function (block: Blockly.Block) {
    const OPERATORS = {
        'ADD': [' + ', Order.ADDITION],
        'MINUS': [' - ', Order.SUBTRACTION],
        'MULTIPLY': [' * ', Order.MULTIPLICATION],
        'DIVIDE': [' / ', Order.DIVISION],
        'POWER': [null, Order.NONE]  // Power matches nothing in standard C++, needing pow()
    };
    const tuple = OPERATORS[block.getFieldValue('OP') as keyof typeof OPERATORS];
    const operator = tuple[0];
    const order = tuple[1] as number;

    if (!operator) {
        // Power case: pow(a, b)
        const argument0 = (cppGenerator as any).valueToCode(block, 'A', Order.NONE) || '0';
        const argument1 = (cppGenerator as any).valueToCode(block, 'B', Order.NONE) || '0';
        return [`pow(${argument0}, ${argument1})`, Order.FUNCTION_CALL];
    }
    const argument0 = (cppGenerator as any).valueToCode(block, 'A', order) || '0';
    const argument1 = (cppGenerator as any).valueToCode(block, 'B', order) || '0';
    const code = argument0 + operator + argument1;
    return [code, order];
};

(cppGenerator as any).forBlock['math_single'] = function (block: Blockly.Block) {
    const operator = block.getFieldValue('OP');
    let code;
    let arg;
    if (operator === 'NEG') {
        arg = (cppGenerator as any).valueToCode(block, 'NUM', Order.UNARY_NEGATION) || '0';
        if (arg[0] === '-') {
            arg = ' ' + arg;
        }
        code = '-' + arg;
        return [code, Order.UNARY_NEGATION];
    }
    const TRANSFORMS = {
        'ROOT': 'sqrt',
        'ABS': 'abs',
        'LN': 'log',
        'LOG10': 'log10',
        'EXP': 'exp',
        'POW10': 'pow10'
    };
    // @ts-ignore
    const func = TRANSFORMS[operator];
    if (func) {
        arg = (cppGenerator as any).valueToCode(block, 'NUM', Order.NONE) || '0';
        code = `${func}(${arg})`;
        return [code, Order.FUNCTION_CALL];
    }
    return ['0', Order.ATOMIC];
};

// --- 4. VARIABLES ---

(cppGenerator as any).forBlock['variables_get'] = function (block: Blockly.Block) {
    const code = (cppGenerator as any).nameDB_
        ? (cppGenerator as any).nameDB_.getName(block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE)
        : block.getFieldValue('VAR');
    return [code, Order.ATOMIC];
};

(cppGenerator as any).forBlock['variables_set'] = function (block: Blockly.Block) {
    const argument0 = (cppGenerator as any).valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0';
    const varName = (cppGenerator as any).nameDB_
        ? (cppGenerator as any).nameDB_.getName(block.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE)
        : block.getFieldValue('VAR');
    return `${varName} = ${argument0};\n`;
};

// --- 5. LOOPS & FLOW ---

(cppGenerator as any).forBlock['controls_whileUntil'] = function (block: Blockly.Block) {
    const until = block.getFieldValue('MODE') === 'UNTIL';
    let argument0 = (cppGenerator as any).valueToCode(block, 'BOOL', until ? Order.LOGICAL_NOT : Order.NONE) || 'false';
    let branch = (cppGenerator as any).statementToCode(block, 'DO');

    if (until) {
        argument0 = '!' + argument0;
    }
    return `while (${argument0}) {\n${branch}}\n`;
};

(cppGenerator as any).forBlock['controls_flow_statements'] = function (block: Blockly.Block) {
    switch (block.getFieldValue('FLOW')) {
        case 'BREAK':
            return 'break;\n';
        case 'CONTINUE':
            return 'continue;\n';
    }
    return '';
};

// Text string
(cppGenerator as any).forBlock['text'] = function (block: Blockly.Block) {
    const code = (cppGenerator as any).quote_(block.getFieldValue('TEXT'));
    return [code, Order.ATOMIC];
};

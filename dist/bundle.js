(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.bundle = factory());
}(this, (function () { 'use strict';

/**
 * 解决js处理小数的计算问题
 * 返回链式操作，类似jquery
 * 目前支持的计算表达式的为，按照优先级分为： ()、*、/、、+、-
 * ------------------------
 * 链式操作，返回当前的实例
 * 1、new Calc().plus(1, 2).minus(2, 3).multiple(3, 4).divide(5, 6)
 * 对应的是((1 + 2) - 2 - 3) * 3 * 4 / 5 / 6
 * 2、采用计算表达式形式
 * new Calc().formul('1+2+(3+4*2)/4')
 * ------------------------
 * 待修复问题：
 * 对数值进行位数判断
 * 空格等会影响计算结果
 * 字符串类型转换
 * @version 1.0.0
 */

// 通用处理函数
var toString = Object.prototype.toString;
var _actions = {
  /**
   * 判断是否为数字
   * @param {Any} num - 判断的对象
   * @return {boolean} 是与否
   */
  isNumber: function(num) {
    return !isNaN(num) && num !== null
  },
  /**
   * 获取number的小数位数
   * @param {Number} num - 判断对象
   * @return {Number} 返回小数位数
   */
  getDecimalLength: function(num) {
    if (!_actions.isNumber(num)) {
      return -1
    }
    const list = num.toString().split('.');
    return list.length === 2 ? list[1].length : 0
  },
  /**
   * 获取一个数字数组转为整数的最小公倍数
   * @param {Array} args - 判断的数字数组
   * @return {Number} 返回最小公倍数
   */
  getMultiple: function(...args) {
    let maxMultiple = 0;
    args.forEach((num) => {
      if (_actions.isNumber(num)) {
        const multiples = _actions.getDecimalLength(parseFloat(num));
        maxMultiple = multiples > maxMultiple ? multiples : maxMultiple;
      }
    });
    return maxMultiple
  },
  /**
   * 创建num个0的字符串,若num为负数则是0. + (num - 1)个0
   * @param {Number} num - 个数
   * @return {Number} num个0
   */
  zeros: function(num) {
    if (num >= 0) {
      return Math.pow(10, num).toString().substr(1)
    }
    num = Math.abs(num);
    return `0.${Math.pow(10, num - 1).toString().substr(1)}`
  },
  /**
   * 将一个数字的小数点往后移
   * @param {Number} num - 判断对象
   * @param {Number} pow - 10的倍数
   * @return {Number} 返回结果
   */
  powTen: function(num, pow) {
    if (pow === 0) {
      return num
    }
    const dLength = _actions.getDecimalLength(num);
    const numString = num.toString().replace(/\./g, '') + _actions.zeros(pow);
    const length = numString.length - dLength;
    if (dLength > 0) {
      if (dLength < pow) {
        return parseInt(numString.substr(0, length), 0)
      }
      return parseFloat(`${numString.substr(0, length)}.${numString.substr(length)}`)
    }
    return parseInt(numString, 10)
  },
  /**
   * 将一个数字的小数点往前移
   * @param {Number} num - 判断对象
   * @param {Number} pow - 10的倍数
   * @return {Number} 返回结果
   */
  divideTen: function(num, pow) {
    if (pow === 0) {
      return num
    }
    const length = _actions.getDecimalLength(num);
    let numString = num.toString();
    let numLength = numString.length;
    // 有小数点时
    if (length > 0) {
      numString = numString.replace(/\./g, '');
      // 整数的长度
      const intLength = numString.length - length;
      // 结果不需要在前面补0的
      if (pow < intLength) {
        numLength = intLength - pow;
        return parseFloat(`${numString.substr(0, numLength)}.${numString.substr(numLength)}`)
      }
      // 需要在结果前方补0
      numLength = pow - intLength;
      const zero = `0.${_actions.zeros(numLength)}`;
      return parseFloat(zero + numString)
    }
    // 没有小数点时--不需要在前面加0
    if (numLength > pow) {
      numLength -= pow;
      return parseFloat(`${numString.substr(0, numLength)}.${numString.substr(numLength)}`)
    }
    return parseFloat(`0.${_actions.zeros(pow - numLength)}${numString}`)
  },
  /**
   * 对小数点的操作，前移或者后移
   * @param {Number|String} num - 数字
   * @param {String} pow - 为正数时代表后移、负数时代表后移
   * @return {Number} 返回操作后的数字
   */
  pointMove: function(num, pow) {
    if (pow > 0) {
      return _actions.powTen(num, pow)
    } else if (pow < 0) {
      return _actions.divideTen(num, -pow)
    }
    return num
  },
  /**
   * 校验运算表达式是否合法
   * @param {String} expression - 表达式
   * @return {Boolean} 是与否
   */
  isLegalExpression: function(expression) {
    return /^(\(?\d+(\.\d+)?\)?(\+|-|\*|\/))+\d+(\.\d+)?\)?$/.test(expression)
  },
  /**
   * 只包含加法和减法的表达式操作
   * @param {String} expression - 表达式
   * @return {Number} 返回计算结果
   */
  calcPMExp: function(expression) {
    // 只剩加法和减法的操作，对表达式进行提取，统一转换为加法，减法变为加-的数
    const expList = expression.split('+');
    const params = [];
    expList.forEach((item) => {
      // 提取减法
      if (/-/.test(item)) {
        item.split('-').forEach((e, index) => {
          e = parseFloat(e);
          params.push(index === 0 ? e : -e);
        });
      } else {
        params.push(parseFloat(item));
      }
    });
    return new Operation().oPlus(...params)
  },
  /**
   * 计算表达式，只包含加减乘除
   * @param {String} expression - 表达式
   * @return {Number} 返回计算结果
   */
  calcExpression: function(expression) {
    // 乘号和除号的运算优先级高,依次递归处理
    if (/\*|\//.test(expression)) {
      const result = /(\d|\.+)(\*|\/)(\d|\.+)/.exec(expression);
      if (result.length > 3) {
        let val;
        const opera = new Operation();
        if (result[2] === '*') {
          val = opera.oMultiple(result[1], result[3]);
        } else {
          val = opera.oDivide(result[1], result[3]);
        }
        expression = expression.replace(result[0], val);
        return _actions.calcExpression(expression)
      }
    } else if (/\+|-/.test(expression)) {
      return _actions.calcPMExp(expression)
    }
    return parseFloat(expression)
  },
};
/**
 * 操作的实例
 */
function Operation() {}
/**
 * 加法运算
 * @param {Number|Array} args - 需要相加的数组
 * @return {Number} 返回计算结果
 */
Operation.prototype.oPlus = function(...args) {
  if (args.length === 0) return 0
  // 算出加数的最小整数倍
  const multiple = _actions.getMultiple(...args);
  const sum = args.reduce((res, num) => {
    return res + _actions.pointMove(num, multiple)
  }, 0);
  return _actions.pointMove(sum, -multiple)
};
/**
 * 乘法运算
 * @param {Number|Array} args - 需要相乘的数组
 * @return {Number} 返回计算结果
 */
Operation.prototype.oMultiple = function(...args) {
  if (args.length === 0) return 1
  // 算出加数的最小整数倍
  const multiple = _actions.getMultiple(...args);
  const result = args.reduce((res, num) => {
    return res * _actions.pointMove(num, multiple)
  }, 1);
  return _actions.pointMove(result, -multiple * args.length)
};
/**
 * 除法运算
 * 除法运算简化为：除数相乘后，再用被除数除以相乘的结果
 * @param {Number} val - 被除数
 * @param {Number} num - 除数
 * @return {Number} 返回计算结果
 */
Operation.prototype.oDivide = function(val, num) {
  const multiple = _actions.getMultiple(val, num);
  return _actions.pointMove(val, multiple) / _actions.pointMove(num, multiple)
};
/**
 * 计算的表达式
 * @param {String} expression - 运算表达式
 * @return {Calc} 返回当前实例
 */
Operation.prototype.oFormul = function(expression) {
  // 先将（）内的运算递归出来
  if (/\(/.test(expression)) {
    const result = /\(([^\(\)]+)\)/.exec(expression);
    if (result.length > 1) {
      const value = this.oFormul(result[1]);
      expression = expression.replace(result[0], value);
      return this.oFormul(expression)
    }
  }
  // 计算出单纯的计算表达式，只包含+-*/
  return _actions.calcExpression(expression)
};
/**
 * 计算对象
 * @param {Object} options - 配置参数
 */
function Calc(options) {
  options = options || {};
  // 初始化的参数，默认为0
  if (toString.call(options).slice(8, -1).toLowerCase() === 'number') {
    this.value = options;
  } else {
    this.value = options.value || 0;
  }
  // 错误信息
  this.isError = false;
  this.errorMsg = null;
}
// 继承
Calc.prototype = Object.create(Operation.prototype);
Calc.prototype.constructor = Calc;
/**
 * 算出当前的值
 * @return {Number} 值
 */
Calc.prototype.val = function() {
  return this.value
};
/**
 * 加法运算
 * @param {Number|Array} args - 需要相加的数组
 * @return {Calc} 返回当前实例
 */
Calc.prototype.plus = function(...args) {
  this.value = this.oPlus(...args, this.value);
  return this
};
/**
 * 减法运算，依次相减
 * 减法可以简化为：负数相加
 * @param {Number|Array} args - 需要相减的数组
 * @return {Calc} 返回当前实例
 */
Calc.prototype.minus = function(...args) {
  const newArgs = [];
  args.forEach((num) => {
    newArgs.push(-num);
  });
  this.value = this.oPlus(this.value, ...newArgs);
  return this
};
/**
 * 乘号运算
 * @param {Number|Array} args - 相乘的数组
 * @return {Calc} 返回当前实例
 */
Calc.prototype.multiple = function(...args) {
  this.value = this.oMultiple(...args, this.value);
  return this
};
/**
 * 除法运算
 * 除法运算简化为：除数相乘后，再用被除数除以相乘的结果
 * @param {Number|Array} args - 相除的数组
 * @return {Calc} 返回当前实例
 */
Calc.prototype.divide = function(...args) {
  const result = this.oMultiple(...args);
  this.value = this.oDivide(this.value, result);
  return this
};
/**
 * 计算的表达式
 * @param {String} expression - 运算表达式
 * @return {Calc} 返回当前实例
 */
Calc.prototype.formul = function(expression) {
  expression = expression.replace(/\s/g, '');
  if (!_actions.isLegalExpression(expression)) {
    this.isError = true;
    this.errorMsg = 'inLegla expression';
  } else {
    this.isError = false;
    this.errorMsg = '';
    // 按照运算符的优先级依次匹配出来
    this.value = this.oFormul(expression);
  }
  return this
};

return Calc;

})));

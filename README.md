# calculate
以链式操作的形式解决js数字运算的精度问题

## Install

## Usage
#### 正常使用加减乘除
```
// ...
var ca = new Calc()
ca.plus(1).minus(2).multiple(4).divide(2)
console.log(ca.val())
```
*Note: new Calc(option) 支持参数配置 value-初始值*
#### 使用表达式解析
```
// ...
var ca = new Calc()
ca.formul('1+2*4/2')
console.log(ca.val())
```
## License
[MIT](https://opensource.org/licenses/MIT)

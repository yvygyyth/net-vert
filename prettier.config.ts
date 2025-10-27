/** @type {import("prettier").Config} */
export default {
    // ===== 基本格式化规则 =====
    semi: true, // 语句末尾加分号
    singleQuote: true, // 使用单引号
    trailingComma: 'all', // 多行对象/数组最后一项加逗号
    tabWidth: 4, // 缩进 4 个空格
    useTabs: false, // 使用空格而不是 tab
    printWidth: 100, // 每行最大宽度
    bracketSpacing: true, // 对象字面量括号间加空格 { foo: bar }
    arrowParens: 'avoid', // 单参数箭头函数省略括号
    endOfLine: 'lf', // 换行符使用 LF（Unix 风格）

    // ===== 针对不同文件类型的覆盖 =====
    overrides: [
        {
            files: '*.json',
            options: {
                tabWidth: 2, // JSON 文件缩进 2 个空格
            },
        },
    ],
};

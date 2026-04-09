window.PYTYPE_DATA = {
  pools: {
    basic: [
      "print",
      "input",
      "list",
      "dict",
      "tuple",
      "string",
      "float",
      "integer",
      "value",
      "key"
    ],
    keyword: [
      "if",
      "else",
      "elif",
      "for",
      "while",
      "break",
      "continue",
      "return",
      "def",
      "class"
    ],
    symbol: [
      "()",
      "[]",
      "{}",
      "\"\"",
      "''",
      ":",
      "=",
      "==",
      "!=",
      "print()",
      "if:",
      "for i in",
      "name ="
    ]
  },
  unlockRules: [
    { key: "basic", label: "基础", scoreNeed: 0 },
    { key: "keyword", label: "关键字", scoreNeed: 220 },
    { key: "symbol", label: "符号", scoreNeed: 520 }
  ],
  modes: {
    rain: {
      key: "rain",
      title: "代码雨模式",
      startLives: 5,
      baseScore: 10
    },
    sprint: {
      key: "sprint",
      title: "单词冲刺",
      rounds: 15,
      baseScore: 10
    },
    symbol: {
      key: "symbol",
      title: "符号训练",
      rounds: 18,
      baseScore: 15
    }
  }
};

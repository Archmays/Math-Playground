export interface ToolButtonCopy {
  id: string;
  label: string;
  englishLabel: string;
  icon: string;
  ariaLabel: string;
}

export interface ToolCategoryCopy {
  id: string;
  label: string;
  description: string;
  buttonIds: string[];
}

export interface HelpStep {
  title: string;
  body: string;
}

export interface KeyboardShortcut {
  keys: string;
  label: string;
}

export const TOOL_BUTTONS: ToolButtonCopy[] = [
  { id: "help", label: "怎么使用？", englishLabel: "Help", icon: "help", ariaLabel: "打开使用帮助" },
  { id: "number-1", label: "数字 1", englishLabel: "Number 1", icon: "one", ariaLabel: "添加数字方块 1" },
  { id: "number-5", label: "数字 5", englishLabel: "Number 5", icon: "five", ariaLabel: "添加数字方块 5" },
  { id: "number-10", label: "数字 10", englishLabel: "Number 10", icon: "ten", ariaLabel: "添加数字方块 10" },
  { id: "number-custom", label: "自定义数字", englishLabel: "Custom Number", icon: "number", ariaLabel: "添加自定义数字方块" },
  { id: "ten-frame-empty", label: "空十格阵", englishLabel: "Empty Ten Frame", icon: "ten-frame", ariaLabel: "添加空十格阵" },
  { id: "ten-frame-5", label: "5 点十格阵", englishLabel: "Five Ten Frame", icon: "ten-frame-5", ariaLabel: "添加 5 点十格阵" },
  { id: "ten-frame-10", label: "10 点十格阵", englishLabel: "Full Ten Frame", icon: "ten-frame-10", ariaLabel: "添加 10 点十格阵" },
  { id: "number-line", label: "数轴", englishLabel: "Number Line", icon: "number-line", ariaLabel: "添加数轴" },
  { id: "fraction-bar-half", label: "分数条 1/2", englishLabel: "Fraction Bar 1/2", icon: "fraction-bar", ariaLabel: "添加二分之一分数条" },
  { id: "fraction-bar-third", label: "分数条 1/3", englishLabel: "Fraction Bar 1/3", icon: "fraction-bar", ariaLabel: "添加三分之一分数条" },
  { id: "fraction-bar-quarter", label: "分数条 1/4", englishLabel: "Fraction Bar 1/4", icon: "fraction-bar", ariaLabel: "添加四分之一分数条" },
  { id: "fraction-bar-fifth", label: "分数条 1/5", englishLabel: "Fraction Bar 1/5", icon: "fraction-bar", ariaLabel: "添加五分之一分数条" },
  { id: "fraction-bar-eighth", label: "分数条 1/8", englishLabel: "Fraction Bar 1/8", icon: "fraction-bar", ariaLabel: "添加八分之一分数条" },
  { id: "fraction-bar-custom", label: "自定义分数条", englishLabel: "Custom Fraction Bar", icon: "fraction-bar", ariaLabel: "添加自定义分数条" },
  { id: "fraction-circle-half", label: "分数圆 1/2", englishLabel: "Fraction Circle 1/2", icon: "fraction-circle", ariaLabel: "添加二分之一分数圆" },
  { id: "fraction-circle-third", label: "分数圆 1/3", englishLabel: "Fraction Circle 1/3", icon: "fraction-circle", ariaLabel: "添加三分之一分数圆" },
  { id: "fraction-circle-quarter", label: "分数圆 1/4", englishLabel: "Fraction Circle 1/4", icon: "fraction-circle", ariaLabel: "添加四分之一分数圆" },
  { id: "fraction-circle-sixth", label: "分数圆 1/6", englishLabel: "Fraction Circle 1/6", icon: "fraction-circle", ariaLabel: "添加六分之一分数圆" },
  { id: "fraction-circle-eighth", label: "分数圆 1/8", englishLabel: "Fraction Circle 1/8", icon: "fraction-circle", ariaLabel: "添加八分之一分数圆" },
  { id: "fraction-circle-custom", label: "自定义分数圆", englishLabel: "Custom Fraction Circle", icon: "fraction-circle", ariaLabel: "添加自定义分数圆" },
  { id: "geometry-triangle", label: "等边三角形", englishLabel: "Equilateral Triangle", icon: "triangle", ariaLabel: "添加等边三角形拼板" },
  { id: "geometry-square", label: "正方形", englishLabel: "Square", icon: "square", ariaLabel: "添加正方形拼板" },
  { id: "geometry-rectangle", label: "长方形", englishLabel: "Rectangle", icon: "rectangle", ariaLabel: "添加长方形拼板" },
  { id: "geometry-hexagon", label: "正六边形", englishLabel: "Regular Hexagon", icon: "hexagon", ariaLabel: "添加正六边形拼板" },
  { id: "geometry-circle", label: "圆形", englishLabel: "Circle", icon: "circle", ariaLabel: "添加圆形拼板" },
  { id: "geometry-trapezoid", label: "梯形", englishLabel: "Trapezoid", icon: "trapezoid", ariaLabel: "添加梯形拼板" },
  { id: "geometry-parallelogram", label: "平行四边形", englishLabel: "Parallelogram", icon: "parallelogram", ariaLabel: "添加平行四边形拼板" },
  { id: "geometry-tangram", label: "七巧板", englishLabel: "Tangram", icon: "tangram", ariaLabel: "添加七巧板" },
  { id: "measurement-ruler", label: "直尺", englishLabel: "Ruler", icon: "ruler", ariaLabel: "添加直尺" },
  { id: "measurement-protractor", label: "量角器", englishLabel: "Protractor", icon: "protractor", ariaLabel: "添加量角器" },
  { id: "measurement-angle", label: "角度标注", englishLabel: "Angle Marker", icon: "angle", ariaLabel: "添加角度标注" },
  { id: "measurement-line", label: "线段", englishLabel: "Line Segment", icon: "line", ariaLabel: "添加线段" },
  { id: "balance-empty", label: "空天平", englishLabel: "Balance", icon: "balance", ariaLabel: "添加空天平" },
  { id: "balance-equal", label: "天平 5 = 5", englishLabel: "Balance 5 = 5", icon: "balance", ariaLabel: "添加平衡天平 5 等于 5" },
  { id: "balance-less", label: "天平 3 < 7", englishLabel: "Balance 3 < 7", icon: "balance", ariaLabel: "添加不平衡天平 3 小于 7" },
  { id: "algebra-unit-positive", label: "+1", englishLabel: "Positive Unit", icon: "algebra", ariaLabel: "添加正一代数砖" },
  { id: "algebra-unit-negative", label: "-1", englishLabel: "Negative Unit", icon: "algebra", ariaLabel: "添加负一代数砖" },
  { id: "algebra-x-positive", label: "+x", englishLabel: "Positive x", icon: "algebra-x", ariaLabel: "添加正 x 代数砖" },
  { id: "algebra-x-negative", label: "-x", englishLabel: "Negative x", icon: "algebra-x", ariaLabel: "添加负 x 代数砖" },
  { id: "algebra-x2-positive", label: "+x²", englishLabel: "Positive x Squared", icon: "algebra-x2", ariaLabel: "添加正 x 平方代数砖" },
  { id: "algebra-x2-negative", label: "-x²", englishLabel: "Negative x Squared", icon: "algebra-x2", ariaLabel: "添加负 x 平方代数砖" },
  { id: "demo-rectangle", label: "演示长方形", englishLabel: "Demo Rectangle", icon: "rectangle", ariaLabel: "添加演示长方形" },
  { id: "demo-circle", label: "演示圆形", englishLabel: "Demo Circle", icon: "circle", ariaLabel: "添加演示圆形" },
  { id: "demo-text", label: "文字标签", englishLabel: "Text Label", icon: "text", ariaLabel: "添加文字标签" },
  { id: "file-save-json", label: "保存 JSON", englishLabel: "Save JSON", icon: "save", ariaLabel: "保存当前画布为 JSON 文件" },
  { id: "file-load-json", label: "读取 JSON", englishLabel: "Load JSON", icon: "open", ariaLabel: "从 JSON 文件读取画布" },
  { id: "file-export-svg", label: "导出 SVG", englishLabel: "Export SVG", icon: "export", ariaLabel: "导出当前画布为 SVG 图片" },
  { id: "file-export-png", label: "导出 PNG", englishLabel: "Export PNG", icon: "export", ariaLabel: "导出当前画布为 PNG 图片" },
  { id: "file-clear-local", label: "清空本地保存", englishLabel: "Clear Local Save", icon: "trash", ariaLabel: "清空本地自动保存的画布" }
];

export const TOOL_CATEGORIES: ToolCategoryCopy[] = [
  {
    id: "tasks",
    label: "任务",
    description: "打开任务卡或查看简短帮助。",
    buttonIds: ["help"]
  },
  {
    id: "common",
    label: "常用",
    description: "文字、测量、天平和代数砖，适合家长引导探索。",
    buttonIds: [
      "demo-text",
      "measurement-ruler",
      "measurement-protractor",
      "measurement-angle",
      "measurement-line",
      "balance-empty",
      "balance-equal",
      "balance-less",
      "algebra-unit-positive",
      "algebra-unit-negative",
      "algebra-x-positive",
      "algebra-x-negative",
      "algebra-x2-positive",
      "algebra-x2-negative"
    ]
  },
  {
    id: "numbers",
    label: "数字",
    description: "数字方块和十格阵，适合凑十、进位和数量活动。",
    buttonIds: [
      "number-1",
      "number-5",
      "number-10",
      "number-custom",
      "ten-frame-empty",
      "ten-frame-5",
      "ten-frame-10",
      "number-line"
    ]
  },
  {
    id: "fractions",
    label: "分数",
    description: "分数条和圆形分数，适合等值与比较。",
    buttonIds: [
      "fraction-bar-half",
      "fraction-bar-third",
      "fraction-bar-quarter",
      "fraction-bar-fifth",
      "fraction-bar-eighth",
      "fraction-bar-custom",
      "fraction-circle-half",
      "fraction-circle-third",
      "fraction-circle-quarter",
      "fraction-circle-sixth",
      "fraction-circle-eighth",
      "fraction-circle-custom"
    ]
  },
  {
    id: "geometry",
    label: "几何",
    description: "几何拼板与演示图形，适合面积、周长和对称。",
    buttonIds: [
      "geometry-triangle",
      "geometry-square",
      "geometry-rectangle",
      "geometry-hexagon",
      "geometry-circle",
      "geometry-trapezoid",
      "geometry-parallelogram",
      "geometry-tangram"
    ]
  },
  {
    id: "files",
    label: "文件",
    description: "保存、读取和导出当前画布。",
    buttonIds: [
      "file-save-json",
      "file-load-json",
      "file-export-svg",
      "file-export-png",
      "file-clear-local"
    ]
  }
];

export const HELP_STEPS: HelpStep[] = [
  {
    title: "添加教具",
    body: "从左侧分类中选择常用、数字、分数或几何教具。"
  },
  {
    title: "拖动教具",
    body: "在画布上点选教具后拖动；选中框会显示当前正在操作的对象。"
  },
  {
    title: "复制/删除",
    body: "选中教具后使用画布上的动作条，或用快捷键复制和删除。"
  },
  {
    title: "保存/读取",
    body: "用“保存 JSON”保留画布，用“读取 JSON”继续之前的活动，也可以导出图片。"
  },
  {
    title: "打开任务卡",
    body: "在“任务”分类里选择任务卡，阅读说明后点击“开始任务”。"
  }
];

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { keys: "Ctrl/Cmd + A", label: "选中画布上的全部教具" },
  { keys: "Ctrl/Cmd + C", label: "复制选中的教具" },
  { keys: "Ctrl/Cmd + V", label: "粘贴教具" },
  { keys: "Delete / Backspace", label: "删除选中的教具" },
  { keys: "Shift + 点击", label: "多选教具" },
  { keys: "Alt/Option + 旋转", label: "旋转时暂时取消 15° 吸附" }
];

export const PROPERTY_EMPTY_TEXT =
  "点选一个教具后，这里会显示可以修改的属性。也可以先从左侧添加教具或打开任务卡。";

export function getToolButtonCopy(id: string): ToolButtonCopy {
  const copy = TOOL_BUTTONS.find((button) => button.id === id);

  if (!copy) {
    throw new Error(`Unknown workspace tool button: ${id}`);
  }

  return copy;
}

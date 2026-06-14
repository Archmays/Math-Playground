export interface ToolButtonCopy {
  id: string;
  label: string;
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
  { id: "help", label: "怎么使用？", ariaLabel: "打开使用帮助" },
  { id: "number-1", label: "数字 1", ariaLabel: "添加数字方块 1" },
  { id: "number-5", label: "数字 5", ariaLabel: "添加数字方块 5" },
  { id: "number-10", label: "数字 10", ariaLabel: "添加数字方块 10" },
  { id: "number-custom", label: "自定义数字", ariaLabel: "添加自定义数字方块" },
  { id: "ten-frame-empty", label: "空十格阵", ariaLabel: "添加空十格阵" },
  { id: "ten-frame-5", label: "5 点十格阵", ariaLabel: "添加 5 点十格阵" },
  { id: "ten-frame-10", label: "10 点十格阵", ariaLabel: "添加 10 点十格阵" },
  { id: "fraction-bar-half", label: "分数条 1/2", ariaLabel: "添加二分之一分数条" },
  { id: "fraction-bar-third", label: "分数条 1/3", ariaLabel: "添加三分之一分数条" },
  { id: "fraction-bar-quarter", label: "分数条 1/4", ariaLabel: "添加四分之一分数条" },
  { id: "fraction-bar-fifth", label: "分数条 1/5", ariaLabel: "添加五分之一分数条" },
  { id: "fraction-bar-eighth", label: "分数条 1/8", ariaLabel: "添加八分之一分数条" },
  { id: "fraction-bar-custom", label: "自定义分数条", ariaLabel: "添加自定义分数条" },
  { id: "fraction-circle-half", label: "圆形 1/2", ariaLabel: "添加二分之一圆形分数" },
  { id: "fraction-circle-third", label: "圆形 1/3", ariaLabel: "添加三分之一圆形分数" },
  { id: "fraction-circle-quarter", label: "圆形 1/4", ariaLabel: "添加四分之一圆形分数" },
  { id: "fraction-circle-sixth", label: "圆形 1/6", ariaLabel: "添加六分之一圆形分数" },
  { id: "fraction-circle-eighth", label: "圆形 1/8", ariaLabel: "添加八分之一圆形分数" },
  { id: "fraction-circle-custom", label: "自定义分数圆", ariaLabel: "添加自定义圆形分数" },
  { id: "geometry-triangle", label: "等边三角形", ariaLabel: "添加等边三角形拼板" },
  { id: "geometry-square", label: "正方形", ariaLabel: "添加正方形拼板" },
  { id: "geometry-rectangle", label: "长方形", ariaLabel: "添加长方形拼板" },
  { id: "geometry-hexagon", label: "正六边形", ariaLabel: "添加正六边形拼板" },
  { id: "geometry-circle", label: "圆形", ariaLabel: "添加圆形拼板" },
  { id: "geometry-trapezoid", label: "梯形", ariaLabel: "添加梯形拼板" },
  { id: "geometry-parallelogram", label: "平行四边形", ariaLabel: "添加平行四边形拼板" },
  { id: "measurement-ruler", label: "直尺", ariaLabel: "添加直尺" },
  { id: "measurement-protractor", label: "量角器", ariaLabel: "添加量角器" },
  { id: "measurement-angle", label: "角度标注", ariaLabel: "添加角度标注" },
  { id: "measurement-line", label: "线段", ariaLabel: "添加线段" },
  { id: "balance-empty", label: "空天平", ariaLabel: "添加空天平" },
  { id: "balance-equal", label: "天平 5 = 5", ariaLabel: "添加平衡天平 5 等于 5" },
  { id: "balance-less", label: "天平 3 < 7", ariaLabel: "添加不平衡天平 3 小于 7" },
  { id: "algebra-unit-positive", label: "+1", ariaLabel: "添加正一代数砖" },
  { id: "algebra-unit-negative", label: "-1", ariaLabel: "添加负一代数砖" },
  { id: "algebra-x-positive", label: "+x", ariaLabel: "添加正 x 代数砖" },
  { id: "algebra-x-negative", label: "-x", ariaLabel: "添加负 x 代数砖" },
  { id: "algebra-x2-positive", label: "+x²", ariaLabel: "添加正 x 平方代数砖" },
  { id: "algebra-x2-negative", label: "-x²", ariaLabel: "添加负 x 平方代数砖" },
  { id: "demo-rectangle", label: "演示矩形", ariaLabel: "添加演示矩形" },
  { id: "demo-circle", label: "演示圆形", ariaLabel: "添加演示圆形" },
  { id: "demo-text", label: "文字标签", ariaLabel: "添加文字标签" },
  { id: "file-save-json", label: "保存 JSON", ariaLabel: "保存当前画布为 JSON 文件" },
  { id: "file-load-json", label: "读取 JSON", ariaLabel: "从 JSON 文件读取画布" },
  { id: "file-export-svg", label: "导出 SVG", ariaLabel: "导出当前画布为 SVG 图片" },
  { id: "file-export-png", label: "导出 PNG", ariaLabel: "导出当前画布为 PNG 图片" },
  { id: "file-clear-local", label: "清空本地保存", ariaLabel: "清空本地自动保存的画布" }
];

export const TOOL_CATEGORIES: ToolCategoryCopy[] = [
  {
    id: "tasks",
    label: "任务",
    description: "打开任务卡或查看简短帮助。",
    buttonIds: ["help"]
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
      "ten-frame-10"
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
      "demo-rectangle",
      "demo-circle",
      "demo-text"
    ]
  },
  {
    id: "measurement",
    label: "测量",
    description: "长度、角度和旋转观察工具。",
    buttonIds: [
      "measurement-ruler",
      "measurement-protractor",
      "measurement-angle",
      "measurement-line"
    ]
  },
  {
    id: "equations",
    label: "等式",
    description: "用天平观察相等和不相等。",
    buttonIds: ["balance-empty", "balance-equal", "balance-less"]
  },
  {
    id: "algebra",
    label: "代数",
    description: "用代数砖表示常数、x 和 x²。",
    buttonIds: [
      "algebra-unit-positive",
      "algebra-unit-negative",
      "algebra-x-positive",
      "algebra-x-negative",
      "algebra-x2-positive",
      "algebra-x2-negative"
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
    body: "从左侧分类中选择数字、分数、几何、测量、等式或代数教具。"
  },
  {
    title: "拖动教具",
    body: "在画布上点选教具后拖动；选中框会显示当前正在操作的对象。"
  },
  {
    title: "复制/删除",
    body: "选中教具后使用快捷键复制，或用 Delete / Backspace 删除。"
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

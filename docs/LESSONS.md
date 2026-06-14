# Lesson Cards

任务卡定义在 `src/features/lessons/lessons.ts`。

新增任务卡时：

1. 在 `LESSON_CARDS` 中添加一个 `LessonCard`。
2. 使用现有 `createScene` 和教具创建函数生成 `starterScene`。
3. 保持 `starterScene` 为现有 Scene JSON 结构，不新增保存格式。
4. 填写 `instructions`、`successCriteria` 和 `hints`，让教师或家长能直接照着操作。
5. 为新任务补充测试，至少确认 starterScene 能序列化并反序列化。

任务卡加载规则：

- 当前画布为空时，可以直接载入任务卡。
- 当前画布已有内容时，必须先确认覆盖。
- 用户取消覆盖时，保留当前画布，不载入 starterScene。

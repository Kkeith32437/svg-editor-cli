# SVG Editor CLI — Lab1 Phase 1

基于 TypeScript 的面向对象 SVG 命令行编辑器，支持六种基础图形、嵌套分组、撤销重做和 SVG 文件读写。

- Git 仓库：[Kkeith32437/svg-editor-cli](https://github.com/Kkeith32437/svg-editor-cli)
- **作业提交文档：[doc/README.md](doc/README.md)**，包含架构方案、过程记录、一致性自查与质量保证。
- 运行环境：Node.js 24、npm 11（本地验证版本：24.13.0 / 11.6.2）。

```sh
npm ci
npm run check
npm run cli
```

输入 `help` 查看命令。退出交互模式使用 Ctrl+C 或关闭标准输入。

Windows PowerShell 回放示例：

```powershell
Get-Content -Encoding UTF8 examples/flowchart.commands | node --import tsx src/cli/Main.ts
```

macOS / Linux：

```sh
npm run cli < examples/flowchart.commands
```

生成的 `examples/flowchart.svg` 可直接在浏览器中打开。

![两节点流程图](examples/flowchart.svg)

本阶段只支持基础 SVG 子集；外部 SVG 的 `transform`、任意 `viewBox`、CSS、路径等限制详见提交文档。`box` 属后续阶段，当前按要求返回未知类型错误。

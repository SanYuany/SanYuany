# SwitchBot Living World — V4

日本二层一户建 / 四段日常 / 实时三维场景营销。此版本针对前版缺少空间感、镜头遮挡和文字弹窗式探索重新实现。

## 快速启动

Node.js 20+。运行本项目无需下载 npm 依赖；Three.js 0.185.1 已固定版本并自托管。

```sh
npm test
npm run check
npm run build
npm start
# http://localhost:4174
npm run preview
```

必须通过 HTTP/HTTPS 服务打开，不能直接双击 file://。在 Netlify 中以项目目录为 Base directory，Build 为 `npm run check && npm test && npm run build`，Publish 为 `dist`。

## 用户路径

- **一天的生活**：滚动或点击播放，早晨→外出→归家→晚安；时间点可直达。`3Dのみ` 隐藏文案观察空间。手动滚动或触控会停止自动播放。
- **房间探索**：同一栋真实三维住宅，可旋转、缩放、切换楼层、进入房间、昼夜切换并重播场景。
- **我的方案**：目的多选、窗数和开合方式、已有设备数量、照明适配条件；方案去重并扣减已有设备；可分享链接和导出可打印 HTML。
- 产品链接前往日本官网。**无虚构价格，无伪造购物车或结账成功。**

## 工程模块

| 文件 | 职责 |
|---|---|
| src/timeline.js | 确定性的时间状态、镜头、章节、房间视点 |
| src/house.js | 唯一住宅模型、家具、原创材质、产品示意位置 |
| src/world.js | WebGL/PBR、阴影、轨道探索、渲染生命周期 |
| src/data.js | 日文内容、场景与产品事实入口 |
| src/planner.js | 纯函数组合计算、台数和已有设备去重 |
| src/app.js | 导航、播放、表单、对话框、持久化和分享 |
| src/styles.css | 独立 PC/Mobile 构图与无障碍样式 |
| tests/domain.test.js | 真实函数的单元测试，不以字符串匹配替代行为 |
| tests/browser.mjs | WebGL、交互、截图、降级和移动端验收 |
| scripts/ | 检查、构建、静态服务 |
| docs/FACTS.html | 消费者可查看的事实依据、条件及素材边界 |
| docs/FACT_REGISTRY.json | 可维护的事实登记 |

## 3D 资产约定

单位为近似米；Y 向上。房间和产品名称写入 mesh/group 名字，可替换为经授权的精确 GLB/CAD。摄像机和交互数据不依赖某个单独页面。`floor1`、`floor2`、`roofGroup` 为稳定分组。

这是实时 Three.js 引擎，不是 Scroll World 原始 AI 视频生成管线。能前后滚动和自由探索；没有使用连续视频伪装实时交互。产品几何为简化示意，不是品牌批准的精确工业设计。

## 事实与限制

- 免手持归家必须有对应识别设备与门锁；不能仅推荐门锁。
- 门扇是人物开门动作的示意；SwitchBot Lock 不自动推开门。
- 离家没有宣称自动识别最后一名家庭成员。
- 晚安场景不把未确认的门锁动作作为任意遥控按钮可执行的动作。
- 既有 IR 照明与空调需适配检查。Hub 去重下限不能等同整屋覆盖保证。
- 无节能百分比、健康功效、安全保证、未经核实的价格或库存。
- 没有第三方视频/图片再分发。Three.js MIT 许可保留在 vendor/three/LICENSE。
- 无字体文件分发；使用设备原生字体。

## 浏览器验证

```sh
npm install --no-save playwright@1.55.0
npx playwright install --with-deps chromium
npm start
BASE_URL=http://127.0.0.1:4174 node tests/browser.mjs
```

验收输出在 `evidence/`：运行报告、PC/Mobile 实际截图、实际浏览器录屏。`test-red.txt` 保存测试先失败的记录。浏览器测试必须真实执行；代码检查不能替代视觉验收。软件 WebGL 的性能不代表手机 GPU 的实际帧率。

## 发布

生产静态文件在 dist。CSP 允许本地模块与 importmap 哈希，不依赖第三方脚本 CDN。没有服务器密钥。不要将部署令牌、Netlify proxy URL 或其他凭据写入此仓库。

正式作为 SwitchBot 官方网站上线前，仍需产品适配确认、精确品牌素材替换和品牌审批；此工程交付并不代表已取得品牌发布批准。

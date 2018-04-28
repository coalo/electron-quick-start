# 文件转移工具
**依据目标文件列表（txt或者excel文件），从源文件夹中找出文件并复制到目标文件夹**
## 开发模式
- `npm run dev`
## 转成exe文件流程
- 注释main.js 里的  mainWindow.webContents.openDevTools() 打开调试窗口命令 
- 注释index.html 里的     <script>require('electron-connect').client.create()</script> 实时更新方法
- `npm run built`



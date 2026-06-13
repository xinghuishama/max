# 神玛再现 · Android APK 构建指南

## 项目结构

```
ShenmaApp/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   ├── assets/
│   │   │   └── index.html          ← 主体 HTML 文件（已内嵌）
│   │   ├── java/com/shenma/app/
│   │   │   └── MainActivity.java   ← WebView 封装主界面
│   │   └── res/
│   │       ├── layout/activity_main.xml
│   │       ├── values/themes.xml   ← 沉浸式主题
│   │       └── xml/network_security_config.xml
│   └── build.gradle
├── build.gradle
└── settings.gradle
```

---

## 构建步骤（Android Studio）

### 前置条件
- Android Studio Hedgehog（2023.1.1）或更高版本
- JDK 11+
- Android SDK 34

### 步骤

1. **打开项目**
   - 启动 Android Studio → Open → 选择本 `ShenmaApp` 目录

2. **同步 Gradle**
   - 点击右上角 **Sync Now**（或菜单 File → Sync Project with Gradle Files）
   - 等待依赖下载完成

3. **连接设备或启动模拟器**
   - 真机：开启 USB 调试，连接电脑
   - 模拟器：API 24+（Android 7.0+）

4. **构建 Debug APK**
   ```
   菜单：Build → Build Bundle(s) / APK(s) → Build APK(s)
   ```
   生成路径：`app/build/outputs/apk/debug/app-debug.apk`

5. **构建 Release APK**
   ```
   菜单：Build → Generate Signed Bundle / APK → APK
   ```
   按向导创建或选择已有签名文件

### 命令行构建（可选）

```bash
# 在 ShenmaApp 目录下执行
./gradlew assembleDebug

# APK 输出位置
app/build/outputs/apk/debug/app-debug.apk
```

---

## 底部导航栏适配说明

| 问题 | 解决方案 |
|------|---------|
| 底部导航栏被系统 bar 遮挡 | `WindowCompat.setDecorFitsSystemWindows(window, false)` 开启沉浸式，CSS `env(safe-area-inset-bottom)` 自动感知手势条高度 |
| Android 10+ 手势导航 | 导航栏透明 + `enforceNavigationBarContrast=false` |
| 刘海屏/打孔屏 | `windowLayoutInDisplayCutoutMode=shortEdges` |
| Android 12+ 强制加深导航栏 | `values-v31/themes.xml` 覆盖 `enforceNavigationBarContrast` |

---

## 注意事项

- **开奖 API**：应用会请求 `https://macaumarksix.com/api/live2`，需要网络权限（已配置）
- **本地缓存**：使用 `localStorage` 存储状态（已启用 DOM Storage）
- **最低系统版本**：Android 7.0（API 24）
- **目标版本**：Android 14（API 34）

---

## 常见问题

**Q: 底部导航栏仍被遮挡？**  
A: 确认手机「设置 → 显示 → 导航栏」为「手势导航」或「虚拟按键」，两种模式均已适配。

**Q: 开奖数据加载失败？**  
A: 检查手机是否有网络权限（应用设置 → 权限 → 允许联网），或 API 服务不可用。

**Q: 页面显示空白？**  
A: 检查 `app/src/main/assets/index.html` 是否存在，文件大小应约 88KB。

package com.shenma.app;

import android.annotation.SuppressLint;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends AppCompatActivity {

    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 沉浸式状态栏，内容延伸到状态栏下方
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // 状态栏透明 + 亮色图标
        Window window = getWindow();
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController ctrl = window.getInsetsController();
            if (ctrl != null) {
                // 亮色状态栏图标（深色内容区域背景用浅色图标）
                ctrl.setSystemBarsAppearance(0,
                        WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS);
            }
        } else {
            int flags = window.getDecorView().getSystemUiVisibility();
            flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            window.getDecorView().setSystemUiVisibility(flags);
        }

        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);

        // 将系统 insets 注入 WebView，使 env(safe-area-inset-*) 生效
        ViewCompat.setOnApplyWindowInsetsListener(webView, (v, insets) -> {
            androidx.core.graphics.Insets systemInsets =
                    insets.getInsets(WindowInsetsCompat.Type.systemBars());
            // 用 CSS 变量方式传递 inset 给 WebView
            String js = "document.documentElement.style.setProperty('--safe-top','"
                    + systemInsets.top + "px');"
                    + "document.documentElement.style.setProperty('--safe-bottom','"
                    + systemInsets.bottom + "px');"
                    + "document.documentElement.style.setProperty('--safe-left','"
                    + systemInsets.left + "px');"
                    + "document.documentElement.style.setProperty('--safe-right','"
                    + systemInsets.right + "px');";
            webView.evaluateJavascript(js, null);
            // 让 WebView 自身不做 padding 处理，由 CSS 控制
            v.setPadding(0, 0, 0, 0);
            return WindowInsetsCompat.CONSUMED;
        });

        setupWebView();

        // 加载本地 HTML
        webView.loadUrl("file:///android_asset/index.html");
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();

        // 基础功能
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);

        // 布局与缩放
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);

        // 混合内容（允许 HTTPS 页面加载 HTTP 资源）
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // 缓存策略
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // 媒体自动播放
        settings.setMediaPlaybackRequiresUserGesture(false);

        // 启用 viewport meta 解析
        settings.setMetaViewportEnabled(true);

        // UA 保留 Mobile 标识
        String defaultUA = settings.getUserAgentString();
        if (!defaultUA.contains("Mobile")) {
            settings.setUserAgentString(defaultUA + " Mobile");
        }

        // WebViewClient：拦截外链在系统浏览器打开（可选）
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view,
                                                    WebResourceRequest request) {
                String url = request.getUrl().toString();
                // 本地文件和 macaumarksix API 允许在 WebView 内加载
                if (url.startsWith("file://") || url.contains("macaumarksix.com")) {
                    return false;
                }
                // 其余外链在 WebView 内继续加载
                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient());

        // 背景色与主题一致
        webView.setBackgroundColor(Color.parseColor("#080818"));
    }

    @Override
    public void onBackPressed() {
        // 支持 WebView 内返回
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }
}

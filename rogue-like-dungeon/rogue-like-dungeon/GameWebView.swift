//
//  GameWebView.swift
//  rogue-like-dungeon
//
//  Created by eiki ogawa on 2026/07/08.
//
//  バンドル内の kiriwatari-no-mori.jsx をそのまま読み込み、
//  WKWebView 上で React + Babel(ブラウザ内トランスパイル)により動かす。
//  JSX が「基盤」のまま──JSX を編集すればアプリの表示もそのまま変わる。
//
//  フォントはアプリに同梱した TTF を、カスタム URL スキーム(kwapp://)経由で
//  バンドルから配信する。React/lucide などは importmap 経由で CDN から読む。
//

import SwiftUI
import WebKit
import StoreKit
import AVFoundation

/// JSX ゲームを表示する WKWebView のラッパ。
struct GameWebView: UIViewRepresentable {
    /// カスタムスキーム。ここからバンドルの index.html / フォントを配信する。
    static let scheme = "kwapp"
    static let startURL = URL(string: "\(scheme)://app/index.html")!

    /// React の初回描画完了時に呼ばれるコールバック。
    var onReady: (() -> Void)?

    func makeCoordinator() -> Coordinator {
        Coordinator(onReady: onReady)
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.setURLSchemeHandler(GameSchemeHandler(), forURLScheme: Self.scheme)

        // JS → Swift メッセージハンドラ (retain cycle 回避のためプロキシ経由)
        let proxy = WeakScriptMessageProxy(target: context.coordinator)
        config.userContentController.add(proxy, name: "requestReview")
        config.userContentController.add(proxy, name: "bgm")
        config.userContentController.add(proxy, name: "appReady")
        config.userContentController.add(proxy, name: "settings")
        config.userContentController.add(proxy, name: "openURL")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0x0a / 255, green: 0x12 / 255, blue: 0x0e / 255, alpha: 1)
        webView.scrollView.backgroundColor = webView.backgroundColor
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never

        webView.load(URLRequest(url: Self.startURL))
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    /// JS メッセージを処理する Coordinator。BGM は AVAudioPlayer でネイティブ再生。
    final class Coordinator: NSObject, WKScriptMessageHandler {
        let bgm = BGMController()
        var onReady: (() -> Void)?

        init(onReady: (() -> Void)? = nil) {
            self.onReady = onReady
        }

        func userContentController(_ userContentController: WKUserContentController,
                                   didReceive message: WKScriptMessage) {
            switch message.name {
            case "requestReview":
                DispatchQueue.main.async {
                    guard let scene = UIApplication.shared.connectedScenes
                        .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene
                    else { return }
                    SKStoreReviewController.requestReview(in: scene)
                }
            case "bgm":
                bgm.handle(message)
            case "appReady":
                DispatchQueue.main.async { self.onReady?() }
            case "settings":
                guard let body = message.body as? [String: Any],
                      let sleep = body["sleep"] as? Bool else { return }
                DispatchQueue.main.async {
                    UIApplication.shared.isIdleTimerDisabled = sleep
                }
            case "openURL":
                guard let body = message.body as? [String: Any],
                      let urlString = body["url"] as? String,
                      let url = URL(string: urlString),
                      url.scheme == "https" || url.scheme == "http" || url.scheme == "mailto"
                else { return }
                DispatchQueue.main.async {
                    UIApplication.shared.open(url)
                }
            default:
                break
            }
        }
    }
}

/// AVAudioPlayer で BGM + SE をネイティブ再生する。
/// .ambient + .mixWithOthers により Apple Music と共存できる。
/// JS Audio は一切使わないことで WebKit による AVAudioSession 上書きを防ぐ。
final class BGMController: NSObject {
    private var bgmPlayer: AVAudioPlayer?
    private var sePlayer:  AVAudioPlayer?
    private var bgmStarted = false

    override init() {
        super.init()
        try? AVAudioSession.sharedInstance().setCategory(
            .ambient, mode: .default, options: [.mixWithOthers])
        if let url = Bundle.main.url(forResource: "Where_the_Willow_Bends", withExtension: "mp3") {
            bgmPlayer = try? AVAudioPlayer(contentsOf: url)
            bgmPlayer?.numberOfLoops = -1
            bgmPlayer?.volume = 0.35
            bgmPlayer?.prepareToPlay()
        }
        if let url = Bundle.main.url(forResource: "attack", withExtension: "mp3") {
            sePlayer = try? AVAudioPlayer(contentsOf: url)
            sePlayer?.volume = 0.68
            sePlayer?.prepareToPlay()
        }
    }

    func handle(_ message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let action = body["a"] as? String else { return }
        let channel = body["ch"] as? String ?? "bgm"
        switch channel {
        case "se":  handleSE(action: action, body: body)
        default:    handleBGM(action: action, body: body)
        }
    }

    private func handleBGM(action: String, body: [String: Any]) {
        switch action {
        case "play":
            bgmStarted = true
            let v = (body["v"] as? Double).map { Float($0) } ?? bgmPlayer?.volume ?? 0.35
            bgmPlayer?.volume = v
            if !(bgmPlayer?.isPlaying ?? false) {
                try? AVAudioSession.sharedInstance().setActive(true)
                bgmPlayer?.prepareToPlay()
                bgmPlayer?.play()
            }
        case "pause":
            bgmPlayer?.pause()
        case "volume":
            guard let v = (body["v"] as? Double).map({ Float($0) }) else { return }
            bgmPlayer?.volume = v
            if bgmStarted {
                if v > 0 && !(bgmPlayer?.isPlaying ?? false) { bgmPlayer?.play() }
                else if v <= 0 { bgmPlayer?.pause() }
            }
        default: break
        }
    }

    private func handleSE(action: String, body: [String: Any]) {
        switch action {
        case "play":
            sePlayer?.currentTime = 0
            sePlayer?.play()
        case "volume":
            guard let v = (body["v"] as? Double).map({ Float($0) }) else { return }
            sePlayer?.volume = v
        default: break
        }
    }
}

/// WKUserContentController との強参照ループを断ち切るプロキシ。
private final class WeakScriptMessageProxy: NSObject, WKScriptMessageHandler {
    private weak var target: WKScriptMessageHandler?

    init(target: WKScriptMessageHandler) {
        self.target = target
    }

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        target?.userContentController(userContentController, didReceive: message)
    }
}

/// kwapp:// のリクエストをバンドル内リソースへマッピングして配信する。
final class GameSchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(URLError(.badURL)); return
        }
        let name = url.lastPathComponent

        // ルート / index.html は生成した HTML シェルを返す。
        if name.isEmpty || name == "app" || name == "index.html" {
            respond(urlSchemeTask, url: url, data: Data(Self.makeHTML().utf8), mime: "text/html; charset=utf-8")
            return
        }

        // それ以外はバンドルのリソースをファイル名で探す(同梱フォントなど)。
        let ext = (name as NSString).pathExtension
        let base = (name as NSString).deletingPathExtension
        if let fileURL = Bundle.main.url(forResource: base, withExtension: ext),
           let data = try? Data(contentsOf: fileURL) {
            respond(urlSchemeTask, url: url, data: data, mime: Self.mime(for: ext))
        } else {
            urlSchemeTask.didFailWithError(URLError(.fileDoesNotExist))
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}

    private func respond(_ task: WKURLSchemeTask, url: URL, data: Data, mime: String) {
        let headers = [
            "Content-Type": mime,
            "Content-Length": String(data.count),
            "Access-Control-Allow-Origin": "*",
        ]
        let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers)!
        task.didReceive(response)
        task.didReceive(data)
        task.didFinish()
    }

    private static func mime(for ext: String) -> String {
        switch ext.lowercased() {
        case "ttf": return "font/ttf"
        case "otf": return "font/otf"
        case "woff": return "font/woff"
        case "woff2": return "font/woff2"
        case "css": return "text/css; charset=utf-8"
        case "js": return "text/javascript; charset=utf-8"
        case "json": return "application/json; charset=utf-8"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "mp3": return "audio/mpeg"
        case "m4a": return "audio/mp4"
        case "wav": return "audio/wav"
        default: return "application/octet-stream"
        }
    }

    /// バンドルの JSX を読み込み、React を動かす HTML シェルへ差し込む。
    static func makeHTML() -> String {
        guard
            let url = Bundle.main.url(forResource: "kiriwatari-no-mori", withExtension: "jsx"),
            let jsx = try? String(contentsOf: url, encoding: .utf8)
        else {
            return errorHTML("kiriwatari-no-mori.jsx がバンドルに見つかりませんでした。")
        }
        return htmlShell(with: jsx)
    }

    private static func htmlShell(with jsx: String) -> String {
        """
        <!DOCTYPE html>
        <html lang="ja">
        <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">
        <style>
          html, body { height: 100%; margin: 0; background: #0a120e; }
          #root { min-height: 100%; }
          #kw-error { position: fixed; inset: 0; z-index: 999; display: none;
            padding: 24px; color: #d96a5a; background: rgba(6,10,8,.95);
            font: 13px/1.7 -apple-system, sans-serif; white-space: pre-wrap; overflow: auto; }
        </style>
        <script type="importmap">
        {
          "imports": {
            "react": "https://esm.sh/react@18.3.1",
            "react-dom": "https://esm.sh/react-dom@18.3.1",
            "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
            "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime",
            "lucide-react": "https://esm.sh/lucide-react@0.454.0?external=react"
          }
        }
        </script>
        <script src="https://unpkg.com/@babel/standalone@7.25.6/babel.min.js"></script>
        </head>
        <body>
        <div id="root"></div>
        <pre id="kw-error"></pre>
        <script>
          window.kwAppVersion = "\(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")";
          // JSX の永続データ層 (window.storage) を localStorage で満たす。
          window.storage = {
            get: async (k) => ({ value: localStorage.getItem(k) }),
            set: async (k, v) => { localStorage.setItem(k, v); },
          };
          // エラーを画面に出して、真っ黒画面で詰まらないようにする。
          function kwShowError(msg) {
            const el = document.getElementById("kw-error");
            el.style.display = "block";
            el.textContent += msg + "\\n";
          }
          window.addEventListener("error", (e) => kwShowError("Error: " + (e.message || e.error)));
          window.addEventListener("unhandledrejection", (e) => kwShowError("Promise: " + (e.reason && (e.reason.stack || e.reason.message) || e.reason)));
        </script>
        <script type="text/babel" data-type="module" data-presets="react">
        \(jsx)

        // ---- マウント (JSX 本体には手を入れず、ここで描画する) ----
        import { createRoot } from "react-dom/client";
        createRoot(document.getElementById("root")).render(React.createElement(KiriwatariNoMori));
        </script>
        </body>
        </html>
        """
    }

    private static func errorHTML(_ message: String) -> String {
        """
        <!DOCTYPE html><html><head><meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>body{margin:0;background:#0a120e;color:#d96a5a;
          font:14px/1.7 -apple-system,sans-serif;padding:24px;}</style>
        </head><body>\(message)</body></html>
        """
    }
}

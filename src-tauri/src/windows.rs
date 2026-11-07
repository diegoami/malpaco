//! Windows uses bundled game content. HTTPS links leave the game in the default browser;
//! bundled manuals/notices open in a separate, unprivileged documentation window.
use std::sync::atomic::{AtomicUsize, Ordering};
use tauri::{Manager, Url, WebviewUrl, WebviewWindowBuilder, webview::NewWindowResponse};

fn bundled(url: &Url) -> bool {
    url.scheme() == "tauri"
        || (matches!(url.scheme(), "http" | "https") && url.host_str() == Some("tauri.localhost"))
}

fn documentation(url: &Url) -> bool {
    bundled(url)
        && (url.path() == "/manual/index.html" || url.path().starts_with("/third-party/oxygen/"))
}

fn open_https(url: &Url) {
    if url.scheme() == "https" && !bundled(url) {
        // No command shell or URL-supplied executable/arguments. Unsupported schemes stay denied.
        if let Err(error) = std::process::Command::new("rundll32.exe")
            .args(["url.dll,FileProtocolHandler", url.as_str()])
            .spawn()
        {
            eprintln!("Could not open the web link: {error}");
        }
    }
}

pub fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle().clone();
    let counter = AtomicUsize::new(0);
    let config = app
        .config()
        .app
        .windows
        .first()
        .ok_or("Missing game window")?;
    WebviewWindowBuilder::from_config(app, config)?
        .on_navigation(|url| {
            if bundled(url)
                || (cfg!(debug_assertions)
                    && matches!(url.host_str(), Some("localhost" | "127.0.0.1")))
            {
                return true;
            }
            open_https(url);
            false
        })
        .on_new_window(move |url, features| {
            if !documentation(&url) {
                open_https(&url);
                return NewWindowResponse::Deny;
            }
            let document_handle = handle.clone();
            let label = format!("manual-{}", counter.fetch_add(1, Ordering::Relaxed));
            let window = WebviewWindowBuilder::new(
                &handle,
                label,
                WebviewUrl::App(url.path().trim_start_matches('/').into()),
            )
            .window_features(features)
            .title("Malpaco documentation")
            .inner_size(1000.0, 800.0)
            .on_navigation(move |destination| {
                if documentation(destination) {
                    return true;
                }
                if bundled(destination) {
                    // The manual's Play link returns to the existing game, never a second writer.
                    if let Some(main) = document_handle.get_webview_window("main") {
                        let _ = main.set_focus();
                    }
                } else {
                    open_https(destination);
                }
                false
            })
            .on_new_window(|destination, _| {
                open_https(&destination);
                NewWindowResponse::Deny
            })
            .build();
            if let Err(error) = window {
                eprintln!("Could not open the documentation: {error}");
            }
            // Open our own bundled-document window. Returning it as WebView2's
            // replacement popup discards the custom-protocol document in this path.
            // The original window.open request needs no opener/WindowProxy.
            NewWindowResponse::Deny
        })
        .build()?;
    Ok(())
}

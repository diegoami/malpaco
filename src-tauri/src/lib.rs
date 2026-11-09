#[cfg(target_os = "windows")]
mod windows;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();
    #[cfg(target_os = "windows")]
    let builder = builder.setup(windows::setup);
    builder
        .run(tauri::generate_context!())
        .expect("could not start Malpaco");
}

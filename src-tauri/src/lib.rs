use std::process::Command;
use std::thread;
use std::time::Duration;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Auto-start backend server in production mode
      if !cfg!(debug_assertions) {
        start_backend(app.handle().clone());
      }

      Ok(())
    })
    .on_page_load(|webview, payload| {
      // In production mode, when the initial Tauri page loads (before backend navigation),
      // we show a loading screen. The backend-ready navigation will replace this.
      if !cfg!(debug_assertions) && payload.url().scheme() == "tauri" {
        let _ = webview.eval(
          r#"document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0a0a;color:#fff;font-family:system-ui"><div style="text-align:center"><div style="font-size:48px;margin-bottom:16px">⏳</div><div style="font-size:18px">Starting Memory Forge...</div></div></div>';"#
        );
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

fn start_backend(app_handle: tauri::AppHandle) {
  // Determine backend executable name based on OS
  let backend_name = if cfg!(target_os = "windows") {
    "memoryforge-backend.exe"
  } else {
    "memoryforge-backend"
  };

  // Try multiple locations to find the backend executable:
  // 1. Resource dir (installed/packaged app)
  // 2. Executable's parent dir (portable mode: backend/ sits next to the main exe)
  let resource_dir = app_handle.path().resource_dir().unwrap_or_default();
  let exe_dir = std::env::current_exe()
    .ok()
    .and_then(|e| e.parent().map(|p| p.to_path_buf()))
    .unwrap_or_default();

  let candidates = vec![
    resource_dir.join("backend").join(backend_name),
    exe_dir.join("backend").join(backend_name),
  ];

  let backend_exe = match candidates.iter().find(|p| p.exists()) {
    Some(path) => path.clone(),
    None => {
      log::error!(
        "Backend executable not found. Searched: {:?}",
        candidates
      );
      return;
    }
  };

  log::info!("Starting backend: {:?}", backend_exe);

  // Start backend as a detached process (no console window on Windows)
  #[cfg(target_os = "windows")]
  let child = {
    use std::os::windows::process::CommandExt;
    Command::new(&backend_exe)
      .args(["--host", "127.0.0.1", "--port", "8000"])
      .creation_flags(0x08000000) // CREATE_NO_WINDOW
      .spawn()
  };

  #[cfg(not(target_os = "windows"))]
  let child = Command::new(&backend_exe)
    .args(["--host", "127.0.0.1", "--port", "8000"])
    .spawn();

  match child {
    Ok(_child) => {
      log::info!("Backend server started, waiting for it to be ready...");

      // Wait for backend to be ready, then navigate the window to it
      let handle = app_handle.clone();
      thread::spawn(move || {
        let client = reqwest::blocking::Client::new();
        for i in 0..30 {
          thread::sleep(Duration::from_millis(500));
          if client
            .get("http://127.0.0.1:8000/api/dashboard/summary")
            .timeout(Duration::from_secs(2))
            .send()
            .is_ok()
          {
            log::info!("Backend is ready after {} attempts", i + 1);
            // Navigate the main window to the backend URL (same-origin for API calls)
            if let Some(window) = handle.get_webview_window("main") {
              let _ = window.eval("window.location.href = 'http://127.0.0.1:8000'");
            }
            return;
          }
        }
        log::error!("Backend failed to start within 15 seconds");
      });
    }
    Err(e) => {
      log::error!("Failed to start backend server: {}", e);
    }
  }
}

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
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

fn start_backend(app_handle: tauri::AppHandle) {
  use std::process::Command;
  use tauri::Manager;

  let resource_dir = app_handle.path().resource_dir().expect("failed to resolve resource dir");

  // Determine backend executable name based on OS
  let backend_name = if cfg!(target_os = "windows") {
    "memoryforge-backend.exe"
  } else {
    "memoryforge-backend"
  };

  let backend_exe = resource_dir.join("backend").join(backend_name);

  if backend_exe.exists() {
    let _child = Command::new(&backend_exe)
      .args(["--host", "127.0.0.1", "--port", "8000"])
      .spawn()
      .expect("failed to start backend server");

    log::info!("Backend server started: {:?}", backend_exe);
  } else {
    log::warn!("Backend executable not found: {:?}", backend_exe);
  }
}

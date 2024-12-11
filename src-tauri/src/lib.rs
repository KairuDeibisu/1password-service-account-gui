use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::env;
use std::io::Write;
use std::os::windows::process::CommandExt;
use std::process::{Command, Stdio};
use winapi::um::winbase::CREATE_NO_WINDOW;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Debug, Serialize, Deserialize)]
struct Vault {
    id: String,
    name: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Field {
    id: String,
    #[serde(rename = "type")]
    field_type: String,
    purpose: Option<String>,
    label: Option<String>,
    value: Option<String>,
    reference: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct VaultItem {
    id: String,
    title: String,
    version: u32,
    vault: Vault,
    category: String,
    last_edited_by: String,
    created_at: String,
    updated_at: String,
    additional_information: Option<String>,
    urls: Option<Vec<Url>>,
    fields: Option<Vec<Field>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Url {
    label: Option<String>,
    primary: Option<bool>,
    href: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: String,
    name: String,
    email: String,
    user_type: Option<String>,
    state: String,
    created_at: String,
    updated_at: String,
    last_auth_at: String,
}

impl User {
    fn parse(json: Value) -> Self {
        serde_json::from_value(json).expect("Failed to parse User from JSON")
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct OPVault {
    id: String,
    name: String,
    content_version: Option<String>,
    attribute_version: Option<String>,
    items: Option<Vec<String>>,
    vault_type: Option<String>,
    created_at: Option<String>,
    updated_at: Option<String>,
}

impl OPVault {
    #[allow(dead_code)]
    fn new(id: String, name: String, content_version: Option<String>) -> Self {
        Self {
            id,
            name,
            content_version,
            attribute_version: None,
            items: None,
            vault_type: None,
            created_at: None,
            updated_at: None,
        }
    }
}

#[allow(dead_code)]
fn create_basic_vault(id: String, name: String, content_version: Option<String>) -> OPVault {
    OPVault::new(id, name, content_version)
}

impl VaultItem {
    fn parse(json: Value) -> Self {
        serde_json::from_value(json).expect("Failed to parse VaultItem from JSON")
    }
}

struct Unofficial1Password {
    op_service_account_token: String,
}

impl Unofficial1Password {
    fn new(op_service_account_token: String) -> Self {
        Self {
            op_service_account_token,
        }
    }

    fn login_with_service_account(&self) {
        env::remove_var("OP_CONNECT_HOST");
        env::remove_var("OP_CONNECT_TOKEN");

        if self.op_service_account_token.is_empty() {
            eprintln!("Service account token is missing.");
            return;
        }

        env::set_var("OP_SERVICE_ACCOUNT_TOKEN", &self.op_service_account_token);
    }

    fn run_op_command(
        &self,
        command_args: Vec<String>,
        input: Vec<String>,
    ) -> Result<Value, String> {
        if self.op_service_account_token.is_empty() {
            return Err("Service account token is missing.".to_string());
        }

        let mut cmd = Command::new("C:\\Program Files\\1Password CLI\\op.exe")
            .args(&["--no-color", "--format=json", "--iso-timestamps"])
            .args(command_args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .expect("Failed to start op command");

        if let Some(mut stdin) = cmd.stdin.take() {
            for line in input {
                let _ = writeln!(stdin, "{}", line);
            }
        }

        let output = cmd
            .wait_with_output()
            .expect("Failed to read command output");

        if output.status.success() {
            Ok(serde_json::from_slice(&output.stdout).expect("Failed to parse JSON output"))
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }

    async fn get_me(&self) -> Result<User, String> {
        let user_json =
            self.run_op_command(vec!["user".into(), "get".into(), "--me".into()], vec![])?;
        Ok(User::parse(user_json))
    }

    #[allow(dead_code)]
    async fn get_vaults(&self) -> Result<Vec<OPVault>, String> {
        let vaults_json = self.run_op_command(vec!["vault".into(), "list".into()], vec![])?;
        let vaults: Vec<OPVault> =
            serde_json::from_value(vaults_json).expect("Failed to parse vaults JSON");
        Ok(vaults)
    }

    #[allow(dead_code)]
    async fn get_vault(&self, id: &str) -> Result<OPVault, String> {
        let vault_json =
            self.run_op_command(vec!["vault".into(), "get".into(), id.into()], vec![])?;
        Ok(serde_json::from_value(vault_json).expect("Failed to parse vault JSON"))
    }

    async fn get_items(
        &self,
        favorites: bool,
        include_archive: bool,
        tags: Option<Vec<&str>>,
        vault: Option<&str>,
    ) -> Result<Vec<VaultItem>, String> {
        let mut command: Vec<String> = vec!["items".to_string(), "list".to_string()];

        if favorites {
            command.push("--favorites".to_string());
        }

        if include_archive {
            command.push("--include-archive".to_string());
        }

        if let Some(tags) = tags {
            command.push("--tags".to_string());
            let joined_tags = tags.join(",");
            command.push(joined_tags.clone());
        }

        if let Some(vault) = vault {
            command.push("--vault".to_string());
            command.push(vault.to_string());
        }

        let items_json = self.run_op_command(command, vec![])?;
        let items: Vec<VaultItem> =
            serde_json::from_value(items_json).expect("Failed to parse items JSON");
        Ok(items)
    }
}

#[tauri::command]
async fn get_me(op_service_account_token: &str) -> Result<User, String> {
    let op = Unofficial1Password::new(op_service_account_token.to_string());
    op.login_with_service_account();
    op.get_me().await
}

#[tauri::command]
async fn get_items(
    op_service_account_token: &str,
    favorites: bool,
    include_archive: bool,
    tags: Option<Vec<&str>>,
    vault: Option<&str>,
) -> Result<Vec<VaultItem>, String> {
    let op = Unofficial1Password::new(op_service_account_token.to_string());
    op.login_with_service_account();
    op.get_items(favorites, include_archive, tags, vault).await
}

#[tauri::command]
async fn get_item(
    op_service_account_token: &str,
    item_id: &str,
    vault: &str,
) -> Result<VaultItem, String> {
    let op = Unofficial1Password::new(op_service_account_token.to_string());
    op.login_with_service_account();
    let item_json = op.run_op_command(
        vec![
            "item".into(),
            "get".into(),
            item_id.into(),
            "--vault".into(),
            vault.into(),
        ],
        vec![],
    )?;
    Ok(VaultItem::parse(item_json))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, get_me, get_items, get_item])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

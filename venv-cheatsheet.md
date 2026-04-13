## Python `venv` Cheat Sheet (Linux & PowerShell)

Since you're moving between a ThinkPad (Linux) and likely a Windows environment (PowerShell), here is the streamlined reference for both.

---

### 1. Creation
Always use the `.venv` naming convention to keep your project root clean.

* **Linux (Bash/Zsh):** `python3 -m venv .venv`
* **Windows (PowerShell):** `python -m venv .venv`

---

### 2. Activation
This is where the two systems differ most. Activation scripts reside in `bin` for Linux and `Scripts` for Windows.

#### **Linux (Ubuntu/Debian)**
```bash
source .venv/bin/activate
```

#### **Windows (PowerShell)**
```powershell
.\.venv\Scripts\Activate.ps1
```
> **Note:** If PowerShell throws an "Execution Policy" error, run this once:  
> `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

---

### 3. Management Commands
These commands are generally **identical** once the environment is activated.

| Action | Command |
| :--- | :--- |
| **Verify Path** | `which python` (Linux) or `where.exe python` (Windows) |
| **Install Package** | `pip install <package>` |
| **Save Dependencies** | `pip freeze > requirements.txt` |
| **Load Dependencies** | `pip install -r requirements.txt` |
| **Exit venv** | `deactivate` |

---

### 4. Key Differences Summary
| Feature | Linux/macOS | Windows (PowerShell) |
| :--- | :--- | :--- |
| **Interpreter** | `python3` | `python` |
| **Folder Name** | `.venv/bin/` | `.venv\Scripts\` |
| **Script** | `activate` | `Activate.ps1` |
| **Hidden Folders**| Prefixed with `.` | Usually visible (use `.` prefix manually) |

---

### 💡 Pro-Tip
If you find yourself constantly typing `source .venv/bin/activate`, add this alias to your `~/.bashrc` file:
```bash
alias avenv='source .venv/bin/activate'
```
Then, you can just type `avenv` to start working.
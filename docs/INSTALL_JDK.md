# Installing a JDK for local development

This project previously included a bundled Oracle JDK under `frontend/src/oracleJdk-25`. That JDK was removed from the Git repository to keep the repo small and avoid hitting GitHub's 100MB file limit.

You have three options to restore a JDK for local development:

- Restore from local backup (recommended if you want the exact binary that was used):
  - Path of the backup created by the repo cleanup: `C:\Users\YS\OneDrive\Documents\NEPSE_oracleJdk_backup\oracleJdk-25`
  - To restore to the project's expected path (PowerShell):
    ```powershell
    Move-Item -Path 'C:\Users\YS\OneDrive\Documents\NEPSE_oracleJdk_backup\oracleJdk-25' -Destination 'C:\Users\YS\OneDrive\Documents\NEPSE\frontend\src\' -Force
    ```

- Install a system JDK (recommended for contributors and CI):
  - Install a JDK from a vendor (Temurin/Adoptium, Oracle, Azul, etc.) and set `JAVA_HOME`.
  - Example links:
    - Adoptium (Temurin): https://adoptium.net/
    - Oracle JDK: https://www.oracle.com/java/technologies/downloads/
  - After installing, verify with `java -version` and set `JAVA_HOME` appropriately.

- Use the included helper script to download an OpenJDK build into the repository path (local only).
  - See `scripts/fetch-jdk.ps1` — the script downloads an OpenJDK (Temurin) zip and extracts it to `frontend/src/oracleJdk-25` so local tooling that expects that path works.
  - Note: The script downloads from the Adoptium/Temurin releases. If your project strictly requires Oracle's build, download it manually and place it in the path above.

Why we removed the JDK from the repo
- JDK distributions contain large binary files which quickly exceed GitHub's file-size limits and bloat repository history.
- Best practice is to install runtime/toolchain binaries outside version control or use Git LFS/GitHub Releases if you must host binaries.

If you want, I can also:
- Add a short note in the main `README.md` linking to this document.
- Upload the JDK to GitHub Releases (I will need your approval and upload access or you can upload the backup manually).
- Set up Git LFS for the repo and migrate the JDK into LFS (this rewrites history and requires `git-lfs` for collaborators).

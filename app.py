#!/usr/bin/env python3
"""CreaTienda — lanzador único de desarrollo.

Levanta backend (Flask :8000) y frontend (Vite :5173) con un solo comando:

    python3 app.py

Muestra la URL de acceso y los logs combinados de ambos procesos.
Ctrl+C apaga todo limpiamente. Solo usa la librería estándar.
"""

from __future__ import annotations

import os
import shutil
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND_URL = "http://127.0.0.1:5173"
BACKEND_URL = "http://127.0.0.1:8000"

IS_WINDOWS = os.name == "nt"
USE_COLOR = sys.stdout.isatty()

COLORS = {"backend": "\033[32m", "frontend": "\033[36m", "app": "\033[1m"}
RESET = "\033[0m"


def say(label: str, message: str) -> None:
    color = COLORS.get(label, "") if USE_COLOR else ""
    reset = RESET if color else ""
    print(f"{color}[{label}]{reset} {message}", flush=True)


def die(lines: list[str]) -> None:
    print("\n".join(lines), file=sys.stderr)
    sys.exit(1)


def find_backend_python() -> Path | str | None:
    """Prefiere el venv del backend; si no existe, usa el python3 del sistema."""
    venv_python = BACKEND / ".venv" / ("Scripts/python.exe" if IS_WINDOWS else "bin/python")
    if venv_python.exists():
        return venv_python
    return shutil.which("python3") or shutil.which("python")


def check_dependencies(python: Path | str) -> None:
    if not (BACKEND / "run.py").exists():
        die(["[app] Error: no se encontró backend/run.py."])
    if not (ROOT / "package.json").exists():
        die(["[app] Error: no se encontró package.json en la raíz."])
    if shutil.which("npm") is None:
        die(["[app] Error: npm no está en el PATH. Instala Node.js 18+."])
    vite_bin = ROOT / "node_modules" / (".bin/vite" if not IS_WINDOWS else ".bin/vite.cmd")
    if not vite_bin.exists():
        die(
            [
                "[app] Error: faltan las dependencias del frontend.",
                "[app] Ejecuta:  npm install",
            ]
        )
    probe = subprocess.run(
        [str(python), "-c", "import flask, flask_sqlalchemy, marshmallow, PIL, dotenv, alembic, psycopg2"],
        capture_output=True,
        text=True,
        cwd=BACKEND,
    )
    if probe.returncode != 0:
        die(
            [
                "[app] Error: faltan las dependencias del backend.",
                "[app] Ejecuta:  cd backend && python3 -m venv .venv"
                " && .venv/bin/pip install -r requirements.txt",
            ]
        )


def start_process(label: str, argv: list[str], cwd: Path) -> subprocess.Popen:
    return subprocess.Popen(
        argv,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        env={**os.environ, "FORCE_COLOR": "1" if USE_COLOR else "0"},
        **({} if IS_WINDOWS else {"start_new_session": True}),
    )


def stream_logs(label: str, proc: subprocess.Popen) -> None:
    """Reenvía la salida del proceso con un prefijo de color, línea a línea."""
    assert proc.stdout is not None
    for line in iter(proc.stdout.readline, ""):
        say(label, line.rstrip("\n"))
    proc.stdout.close()


def stop_process(label: str, proc: subprocess.Popen) -> None:
    """Señal amable primero (Ctrl+C simulado) y kill pasado un plazo."""
    if proc.poll() is not None:
        return
    say(label, "deteniendo…")
    try:
        if IS_WINDOWS:
            proc.terminate()
        else:
            os.killpg(os.getpgid(proc.pid), signal.SIGINT)
        proc.wait(timeout=5)
    except (subprocess.TimeoutExpired, ProcessLookupError, PermissionError):
        try:
            proc.kill()
            proc.wait(timeout=3)
        except Exception:  # noqa: BLE001
            pass


def main() -> None:
    python = find_backend_python()
    if python is None:
        die(["[app] Error: no se encontró python3. Instala Python 3.11+."])
    check_dependencies(python)

    procs: dict[str, subprocess.Popen] = {}

    def handle_signal(_sig: int, _frame: object) -> None:  # noqa: ANN401
        raise KeyboardInterrupt

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    say("app", "CreaTienda — iniciando…")
    procs["backend"] = start_process("backend", [str(python), "run.py"], BACKEND)
    procs["frontend"] = start_process("frontend", ["npm", "run", "dev"], ROOT)

    for label, proc in procs.items():
        worker = threading.Thread(target=stream_logs, args=(label, proc), daemon=True)
        worker.start()

    print()
    say("app", f"➜ URL de ingreso:  {FRONTEND_URL}")
    say("app", f"  API (proxy dev): {BACKEND_URL}/api/v1")
    say("app", "  Ctrl+C para apagar todo.")
    print()

    try:
        while True:
            for label, proc in procs.items():
                code = proc.poll()
                if code is not None:
                    say(label, f"terminó con código {code}; apagando el resto.")
                    return
            time.sleep(0.3)
    except KeyboardInterrupt:
        say("app", "apagando…")
    finally:
        for label, proc in procs.items():
            stop_process(label, proc)
        say("app", "todo detenido. ¡Hasta luego!")


if __name__ == "__main__":
    main()

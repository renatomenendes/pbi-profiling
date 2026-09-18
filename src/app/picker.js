import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const CURRENT_DIRECTORY = dirname(
  fileURLToPath(import.meta.url),
);

const PICKER_SCRIPT = resolve(
  CURRENT_DIRECTORY,
  '../../scripts/windows/select-powerbi-target.ps1',
);

const SUPPORTED_KINDS = new Set([
  'pbix',
  'pbip',
  'folder',
]);

export async function selectLocalPowerBiTarget(
  kind,
  {
    timeoutMs = 600_000,
  } = {},
) {
  const normalized = String(kind ?? '')
    .trim()
    .toLowerCase();

  if (!SUPPORTED_KINDS.has(normalized)) {
    throw new Error(
      `Unsupported picker kind: ${kind}`,
    );
  }

  if (process.platform !== 'win32') {
    const error = new Error(
      'Native project selection is available only on Windows.',
    );
    error.code = 'PICKER_UNAVAILABLE';
    throw error;
  }

  if (!existsSync(PICKER_SCRIPT)) {
    throw new Error(
      `Native picker script is missing: ${PICKER_SCRIPT}`,
    );
  }

  const powershell = join(
    process.env.SystemRoot ?? 'C:\\Windows',
    'System32',
    'WindowsPowerShell',
    'v1.0',
    'powershell.exe',
  );

  const script = readFileSync(
    PICKER_SCRIPT,
    'utf-8',
  );

  return await runPicker(
    powershell,
    script,
    normalized,
    timeoutMs,
  );
}

function runPicker(
  executable,
  script,
  kind,
  timeoutMs,
) {
  return new Promise(
    (resolvePromise, rejectPromise) => {
      const child = spawn(
        executable,
        [
          '-NoLogo',
          '-NoProfile',
          '-STA',
          '-Command',
          '-',
        ],
        {
          env: {
            ...process.env,
            PBI_PROFILING_PICKER_KIND: kind,
          },
          windowsHide: false,
          stdio: [
            'pipe',
            'pipe',
            'pipe',
          ],
        },
      );

      let stdout = '';
      let stderr = '';
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) {
          return;
        }

        settled = true;
        child.kill();

        rejectPromise(
          new Error(
            'Native file selection timed out.',
          ),
        );
      }, timeoutMs);

      child.stdout.setEncoding('utf-8');
      child.stderr.setEncoding('utf-8');

      child.stdin.on('error', (error) => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timer);
        rejectPromise(
          new Error(
            `Could not send picker script to Windows PowerShell: ${error.message}`,
          ),
        );
      });

      child.stdout.on('data', (chunk) => {
        stdout += chunk;
      });

      child.stderr.on('data', (chunk) => {
        stderr += chunk;
      });

      child.on('error', (error) => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timer);

        rejectPromise(
          new Error(
            `Could not start Windows project selector: ${error.message}`,
          ),
        );
      });

      child.on('close', (code) => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timer);

        if (code !== 0) {
          rejectPromise(
            new Error(
              stderr.trim() ||
              `Native project selector exited with code ${code}.`,
            ),
          );
          return;
        }

        const payload = stdout
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .at(-1);

        if (!payload) {
          rejectPromise(
            new Error(
              'Native project selector returned no result.',
            ),
          );
          return;
        }

        try {
          resolvePromise(
            JSON.parse(payload),
          );
        } catch (error) {
          rejectPromise(
            new Error(
              `Native project selector returned invalid JSON: ${error.message}`,
            ),
          );
        }
      });

      child.stdin.end(script);
    },
  );
}

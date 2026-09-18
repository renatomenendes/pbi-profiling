import {
  existsSync,
  readFileSync,
} from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  dirname,
  extname,
  join,
  resolve,
} from 'node:path';

const CURRENT_DIRECTORY = dirname(
  fileURLToPath(import.meta.url),
);

const OPEN_SCRIPT = resolve(
  CURRENT_DIRECTORY,
  '../../scripts/windows/open-pbix.ps1',
);

export async function openPbixInDesktop(
  pbixPath,
) {
  const target = resolve(pbixPath);

  if (process.platform !== 'win32') {
    throw new Error(
      'Opening PBIX requires Windows and Power BI Desktop.',
    );
  }

  if (
    !existsSync(target) ||
    extname(target).toLowerCase() !== '.pbix'
  ) {
    throw new Error(
      'A valid existing .pbix file is required.',
    );
  }

  if (!existsSync(OPEN_SCRIPT)) {
    throw new Error(
      'Power BI Desktop launcher script is missing: ' + OPEN_SCRIPT,
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
    OPEN_SCRIPT,
    'utf-8',
  );

  const result = await runPowerShell(
    powershell,
    script,
    {
      ...process.env,
      PBI_PROFILING_PBIX: target,
    },
  );

  if (!result?.opened) {
    throw new Error(
      'Power BI Desktop did not confirm that the PBIX was opened.',
    );
  }

  return {
    opened: true,
    processId:
      Number.isInteger(result.processId)
        ? result.processId
        : null,
  };
}

function runPowerShell(
  executable,
  script,
  environment,
) {
  return new Promise(
    (resolvePromise, rejectPromise) => {
      const child = spawn(
        executable,
        [
          '-NoLogo',
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          '-',
        ],
        {
          env: environment,
          windowsHide: true,
          stdio: [
            'pipe',
            'pipe',
            'pipe',
          ],
        },
      );

      let stdout = '';
      let stderr = '';

      child.stdout.setEncoding('utf-8');
      child.stderr.setEncoding('utf-8');

      child.stdout.on(
        'data',
        (chunk) => {
          stdout += chunk;
        },
      );

      child.stderr.on(
        'data',
        (chunk) => {
          stderr += chunk;
        },
      );

      child.on(
        'error',
        (error) => {
          rejectPromise(
            new Error(
              'Could not start Windows PowerShell: ' + error.message,
            ),
          );
        },
      );

      child.on(
        'close',
        (code) => {
          if (code !== 0) {
            const detail =
              stderr
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean)
                .at(-1) ||
              stdout.trim() ||
              'exit code ' + code;

            rejectPromise(
              new Error(
                'Could not open PBIX in Power BI Desktop: ' + detail,
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
                'Power BI Desktop launcher returned no structured result.',
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
                'Power BI Desktop launcher returned invalid JSON: ' + error.message,
              ),
            );
          }
        },
      );

      child.stdin.end(script);
    },
  );
}

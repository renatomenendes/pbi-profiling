import {
  existsSync,
  readFileSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  dirname,
  join,
  resolve,
} from 'node:path';
import { spawn } from 'node:child_process';

const CURRENT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const CONVERTER_SCRIPT = resolve(
  CURRENT_DIRECTORY,
  '../../scripts/windows/convert-pbix.ps1',
);

export async function convertPbixToPbip(
  pbixPath,
  workspacePath,
  {
    projectName,
    timeoutMs = 300_000,
    onProgress = () => {},
  } = {},
) {
  if (process.platform !== 'win32') {
    throw new Error('PBIX conversion is supported only on Windows.');
  }

  if (!existsSync(CONVERTER_SCRIPT)) {
    throw new Error(
      `PBIX converter script is missing: ${CONVERTER_SCRIPT}`,
    );
  }

  const powershell = join(
    process.env.SystemRoot ?? 'C:\\Windows',
    'System32',
    'WindowsPowerShell',
    'v1.0',
    'powershell.exe',
  );

  const script = readFileSync(CONVERTER_SCRIPT, 'utf-8');
  const environment = {
    ...process.env,
    PBI_PROFILING_PBIX: resolve(pbixPath),
    PBI_PROFILING_DEST: resolve(workspacePath),
    PBI_PROFILING_PROJECT_NAME: String(projectName ?? '').trim(),
    PBI_PROFILING_TIMEOUT_MS: String(timeoutMs),
  };

  const result = await runPowerShell(
    powershell,
    script,
    environment,
    {
      timeoutMs: timeoutMs + 30_000,
      onProgress,
    },
  );

  if (!result?.projectRoot) {
    throw new Error(
      'PBIX conversion completed without returning a PBIP project root.',
    );
  }

  const projectRoot = resolve(result.projectRoot);
  if (!existsSync(projectRoot)) {
    throw new Error(
      `PBIX conversion returned a missing project root: ${projectRoot}`,
    );
  }

  return {
    ...result,
    projectRoot,
  };
}

function runPowerShell(
  executable,
  script,
  environment,
  {
    timeoutMs,
    onProgress,
  },
) {
  return new Promise((resolvePromise, rejectPromise) => {
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
    let stderrBuffer = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      child.kill();
      rejectPromise(
        new Error(
          `PBIX conversion timed out after ${Math.round(timeoutMs / 1000)} seconds. Power BI Desktop may still be open; close it manually only if it was launched for this conversion.`,
        ),
      );
    }, timeoutMs);

    child.stdout.setEncoding('utf-8');
    child.stderr.setEncoding('utf-8');

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      stderrBuffer += chunk;

      const lines = stderrBuffer.split(/\r?\n/);
      stderrBuffer = lines.pop() ?? '';

      for (const line of lines) {
        const progress = parseProgressLine(line);
        if (progress) {
          onProgress(progress);
        }
      }
    });

    child.on('error', (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      rejectPromise(
        new Error(
          `Could not start Windows PowerShell for PBIX intake: ${error.message}`,
        ),
      );
    });

    child.on('close', (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);

      if (stderrBuffer) {
        const progress = parseProgressLine(stderrBuffer);
        if (progress) {
          onProgress(progress);
        }
      }

      if (code !== 0) {
        rejectPromise(
          new Error(
            normalizePowerShellError(stderr, stdout, code),
          ),
        );
        return;
      }

      const lines = stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const payload = lines.at(-1);
      if (!payload) {
        rejectPromise(
          new Error(
            'PBIX converter returned no structured result.',
          ),
        );
        return;
      }

      try {
        resolvePromise(JSON.parse(payload));
      } catch (error) {
        rejectPromise(
          new Error(
            `PBIX converter returned invalid JSON: ${error.message}`,
          ),
        );
      }
    });

    child.stdin.end(script);
  });
}

function parseProgressLine(line) {
  const match = /^PBI_PROGRESS\|([^|]+)\|(.*)$/.exec(
    String(line ?? '').trim(),
  );
  if (!match) {
    return null;
  }

  return {
    phase: match[1],
    message: match[2],
  };
}

function normalizePowerShellError(stderr, stdout, code) {
  const nonProgress = String(stderr ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !line.startsWith('PBI_PROGRESS|'),
    );

  const detail = nonProgress.at(-1) ||
    String(stdout ?? '').trim() ||
    `exit code ${code}`;

  return `PBIX conversion failed: ${detail}`;
}

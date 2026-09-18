import { spawn } from 'node:child_process';

export function openBrowser(url) {
  const platform = process.platform;

  let command;
  let args;

  if (platform === 'win32') {
    command = 'cmd.exe';
    args = [
      '/d',
      '/s',
      '/c',
      'start',
      '',
      url,
    ];
  } else if (platform === 'darwin') {
    command = 'open';
    args = [url];
  } else {
    command = 'xdg-open';
    args = [url];
  }

  const child = spawn(
    command,
    args,
    {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    },
  );

  child.unref();
}

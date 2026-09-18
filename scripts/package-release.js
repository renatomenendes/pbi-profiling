import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import {
  basename,
  dirname,
  join,
  resolve,
} from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(
  dirname(
    fileURLToPath(import.meta.url),
  ),
  '..',
);

const packageJson = JSON.parse(
  readFileSync(
    join(ROOT, 'package.json'),
    'utf-8',
  ),
);

const version =
  process.argv[2] ??
  packageJson.version;

if (version !== packageJson.version) {
  throw new Error(
    'Requested release version ' +
      version +
      ' does not match package.json version ' +
      packageJson.version +
      '.',
  );
}

const packageName =
  'pbi-profiling-v' +
  version +
  '-windows-portable';

const distRoot =
  join(ROOT, 'dist');
const stageRoot =
  join(distRoot, packageName);

rmSync(
  stageRoot,
  {
    recursive: true,
    force: true,
  },
);

mkdirSync(
  stageRoot,
  {
    recursive: true,
  },
);

const rootFiles = [
  'pbi-profiling.cmd',
  'README.md',
  'LICENSE',
  'ATTRIBUTIONS.md',
  'THIRD_PARTY_NOTICES.md',
  'CHANGELOG.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
];

const runtimeDirectories = [
  'src',
  'schemas',
  'examples',
  'docs',
];

for (const file of rootFiles) {
  copyRequired(
    join(ROOT, file),
    join(stageRoot, file),
  );
}

for (const directory of runtimeDirectories) {
  copyRequired(
    join(ROOT, directory),
    join(stageRoot, directory),
  );
}

copyRequired(
  join(
    ROOT,
    'scripts',
    'windows',
    'open-pbix.ps1',
  ),
  join(
    stageRoot,
    'scripts',
    'windows',
    'open-pbix.ps1',
  ),
);

const upstreamRoot = join(
  ROOT,
  'vendor',
  'pbi-lineage-lenz',
);

copyRequired(
  join(upstreamRoot, 'LICENSE'),
  join(
    stageRoot,
    'vendor',
    'pbi-lineage-lenz',
    'LICENSE',
  ),
);

copyRequired(
  join(
    upstreamRoot,
    'packages',
    'core',
    'src',
  ),
  join(
    stageRoot,
    'vendor',
    'pbi-lineage-lenz',
    'packages',
    'core',
    'src',
  ),
);

copyRequired(
  join(
    upstreamRoot,
    'packages',
    'viewer',
    'src',
  ),
  join(
    stageRoot,
    'vendor',
    'pbi-lineage-lenz',
    'packages',
    'viewer',
    'src',
  ),
);

const releasePackageJson = {
  ...packageJson,
  private: true,
  scripts: {
    app: 'node ./src/app.js',
    profile: 'node ./src/cli.js',
  },
};

writeFileSync(
  join(
    stageRoot,
    'package.json',
  ),
  JSON.stringify(
    releasePackageJson,
    null,
    2,
  ) + '\n',
  'utf-8',
);

const manifest = {
  product: 'pbi-profiling',
  version,
  distribution:
    'windows-portable',
  node: {
    minimumMajor: 20,
  },
  upstream: {
    repository:
      'JonathanJihwanKim/pbi-lineage-lenz',
    commit:
      '7e2c61cac2f5e0ca6e7135df17a6918c89c42aec',
    license: 'MIT',
  },
  profilingInput: 'PBIP',
  outputs: [
    'profile.html',
    'profile.json',
    'profile.rag.jsonl',
  ],
};

writeFileSync(
  join(
    stageRoot,
    'RELEASE-MANIFEST.json',
  ),
  JSON.stringify(
    manifest,
    null,
    2,
  ) + '\n',
  'utf-8',
);

const forbidden =
  findForbidden(stageRoot);

if (forbidden.length > 0) {
  throw new Error(
    'Release package contains forbidden paths: ' +
      forbidden.join(', '),
  );
}

for (const required of [
  'pbi-profiling.cmd',
  'package.json',
  'LICENSE',
  'RELEASE-MANIFEST.json',
  'src/app.js',
  'src/cli.js',
  'scripts/windows/open-pbix.ps1',
  'vendor/pbi-lineage-lenz/LICENSE',
  'vendor/pbi-lineage-lenz/packages/core/src/index.js',
  'vendor/pbi-lineage-lenz/packages/viewer/src/viewerModel.js',
]) {
  const path =
    join(stageRoot, required);

  if (!existsSync(path)) {
    throw new Error(
      'Release package is missing required runtime file: ' +
        required,
    );
  }
}

const stagedPackage = JSON.parse(
  readFileSync(
    join(
      stageRoot,
      'package.json',
    ),
    'utf-8',
  ),
);

if (
  stagedPackage.version !==
  version
) {
  throw new Error(
    'Staged package version does not match the release version.',
  );
}

if (
  Object.keys(
    stagedPackage.scripts ?? {},
  ).sort().join(',') !==
  'app,profile'
) {
  throw new Error(
    'Portable package exposes unsupported development scripts.',
  );
}

process.stdout.write(
  JSON.stringify(
    {
      packageName,
      stageRoot,
      version,
    },
    null,
    2,
  ) + '\n',
);

function copyRequired(
  source,
  destination,
) {
  if (!existsSync(source)) {
    throw new Error(
      'Required release source is missing: ' +
        source,
    );
  }

  mkdirSync(
    dirname(destination),
    {
      recursive: true,
    },
  );

  cpSync(
    source,
    destination,
    {
      recursive: true,
      force: true,
      filter(path) {
        const name =
          basename(path);

        return ![
          '.git',
          'node_modules',
          'dist',
          'coverage',
        ].includes(name);
      },
    },
  );
}

function findForbidden(root) {
  const found = [];

  function walk(directory) {
    for (
      const entry of
      readdirSync(directory)
    ) {
      const path =
        join(directory, entry);
      const relative =
        path
          .slice(root.length + 1)
          .replaceAll('\\', '/');

      if (
        entry === '.git' ||
        entry === 'node_modules' ||
        entry === 'coverage'
      ) {
        found.push(relative);
        continue;
      }

      if (
        statSync(path).isDirectory()
      ) {
        walk(path);
      }
    }
  }

  walk(root);
  return found;
}

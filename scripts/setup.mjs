import { execFileSync } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const installCommand = process.env.NPM_INSTALL_COMMAND ?? 'ci';

const installs = [
  { label: 'root dependencies', args: [installCommand] },
  { label: 'backend dependencies', args: [installCommand, '--prefix', 'backend'] },
  { label: 'frontend dependencies', args: [installCommand, '--prefix', 'frontend'] },
];

for (const install of installs) {
  console.log(`\nInstalling ${install.label}...`);
  execFileSync(npmCommand, install.args, { stdio: 'inherit' });
}

console.log('\nProject dependencies are ready.');

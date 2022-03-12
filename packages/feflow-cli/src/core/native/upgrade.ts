import spawn from 'cross-spawn';
import semver from 'semver';
import chalk from 'chalk';
import inquirer from 'inquirer';

import Feflow from '../';
import { getRegistryUrl } from '../../shared/npm';
import packageJson from '../../shared/package-json';
import { safeDump } from '../../shared/yaml';

export default (ctx: Feflow) => {
  ctx.commander.register('upgrade', 'upgrade fef cli', () => {
    checkCliUpdate(ctx);
  });
};

export async function updateCli(packageManager: string) {
  return new Promise<void>((resolve, reject) => {
    const args =
      packageManager === 'yarn'
        ? ['global', 'add', '@feflow/cli@latest', '--extract']
        : ['install', '@feflow/cli@latest', '--color=always', '--save', '--save-exact', '--loglevel', 'error', '-g'];

    const child = spawn(packageManager, args, {
      stdio: 'inherit',
      windowsHide: true,
    });
    child.on('close', (code) => {
      if (code !== 0) {
        reject({
          command: `${packageManager} ${args.join(' ')}`,
        });
        return;
      }
      resolve();
    });
  });
}

export async function checkCliUpdate(ctx: Feflow) {
  const { version, config = {}, configPath, args } = ctx;
  const { packageManager } = config;
  const { e2e } = args;

  if (!packageManager) {
    ctx.logger.error(`cannot find 'packageManager' from config`);
    return;
  }
  const registryUrl = await getRegistryUrl(packageManager);
  const latestVersion: any = await packageJson('@feflow/cli', registryUrl).catch(() => {
    ctx.logger.warn(`Network error, can't reach ${registryUrl}, CLI give up version check.`);
  });

  if (e2e) {
    console.log('E2E: upgrade');
  } else {
    if (latestVersion && semver.gt(latestVersion, version)) {
      const askIfUpdateCli = [
        {
          type: 'confirm',
          name: 'ifUpdate',
          message: chalk.yellow(
            `@feflow/cli's latest version is ${chalk.green(latestVersion)}, but your version is ${chalk.red(
              version,
            )}, Do you want to update it?`,
          ),
          default: true,
        },
      ];
      const answer = await inquirer.prompt(askIfUpdateCli);
      if (answer.ifUpdate) {
        await updateCli(packageManager);
      } else {
        safeDump(
          {
            ...config,
            lastUpdateCheck: +new Date(),
          },
          configPath,
        );
      }
    } else {
      ctx.logger.info('Current version is already latest.');
    }
  }
}

'use strict';

const {bundleCommand, startCommand} = require('@react-native/community-cli-plugin');

function findCommunityPlatformPackage(spec, startDir) {
  startDir = startDir || process.cwd();
  const main = require.resolve(spec, {paths: [startDir]});
  return require(main);
}

let android;
try {
  android = findCommunityPlatformPackage(
    '@react-native-community/cli-platform-android',
  );
} catch {
  // ignore
}

let ios;
try {
  ios = findCommunityPlatformPackage(
    '@react-native-community/cli-platform-ios',
  );
} catch {
  // ignore
}

const codegenCommand = {
  name: 'codegen',
  options: [
    {
      name: '--path <path>',
      description: 'Path to the React Native project root.',
      default: process.cwd(),
    },
    {
      name: '--platform <string>',
      description: 'Target platform. Supported values: "android", "ios", "all".',
      default: 'all',
    },
    {
      name: '--outputPath <path>',
      description: 'Path where generated artifacts will be output to.',
    },
    {
      name: '--source <string>',
      description: 'Whether the script is invoked from an `app` or a `library`',
      default: 'app',
    },
  ],
  func: (argv, config, args) =>
    require('./scripts/codegen/generate-artifacts-executor/index.js').execute(
      args.path,
      args.platform,
      args.outputPath,
      args.source,
    ),
};

const commands = [bundleCommand, startCommand, codegenCommand];

if (ios != null) {
  commands.push(...ios.commands);
}

if (android != null) {
  commands.push(...android.commands);
}

const config = {
  commands,
  platforms: {},
};

if (ios != null) {
  config.platforms.ios = {
    projectConfig: ios.projectConfig,
    dependencyConfig: ios.dependencyConfig,
  };
}

if (android != null) {
  config.platforms.android = {
    projectConfig: android.projectConfig,
    dependencyConfig: android.dependencyConfig,
  };
}

module.exports = config;

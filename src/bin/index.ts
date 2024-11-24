#!/usr/bin/env node

import { publishExec } from '../command/publish'
import { initExec } from '../command/init'
import { Command } from 'commander';
const program = new Command();

function registerCommand() {
    program.version(require('../../package.json').version);
    // 注册 init publish 命令

    // init --mind 初始化脑图 init --config 初始化配置
    program.command('init')
        .option('-m, --mind', 'init mind')
        // 使用 -m -f 强制同步
        .option('-f, --force', 'force sync')
        .option('-c, --config', 'init config')
        // @ts-ignore
        .action(initExec)

    // publish --config 发布配置
    program.command('publish')
        .option('-c, --config', 'publish config')
        .option('-dc, --docs', 'publish docs')
        // @ts-ignore
        .action(publishExec)

    if (process.argv.slice(2).length < 2) {
        program.outputHelp()
    }
    program.parse(process.argv)
}

registerCommand();
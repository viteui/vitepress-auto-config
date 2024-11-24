import { resolve } from "path";
import logger from "../log";
import * as fs from 'fs';
import { isExistConfigFile } from "../require";
import { repoName, repoUrl } from "../const";

const InitMethodType = {
    config: 'config',
    mind: 'mind'
}

interface InitMethod {
    config: (source: Record<string, boolean>) => void;
    mind: (source: Record<string, boolean>) => void;
    default: (source: Record<string, boolean>) => void;
}

const initMethods: InitMethod = {
    async config(source: Record<string, boolean>) {
        logger.info('init config...');
        // 根据 template 在当前执行目录下 创建配置文件
        // 判断配置文件是否存在
        const isExist = await isExistConfigFile();
        // 如果存在则提示
        logger.verbose('isExistConfigFile', isExist);
        if (isExist) {
            if (!source.force) {
                // 如果存在则提示
                logger.warn('config file is exist, please check it');
                return
            } else {
                logger.info('config file is exist, and will be deleted')
                fs.rmSync(resolve(process.cwd(), './generate.config.ts'), { recursive: true, force: true })
                logger.info('config file is deleted')
            }
        }
        fs.writeFileSync(resolve(process.cwd(), './generate.config.ts'), fs.readFileSync(resolve(__dirname, '../template/generate.config.txt')), 'utf-8')
        logger.success('init config success')

    },
    mind(source: Record<string, boolean>) {
        return new Promise((sv, rj) => {
            // 拉取git 仓库最新代码, 到当前执行目录下
            // 判断是否已经存在
            if (fs.existsSync(resolve(process.cwd(), './', repoName))) {

                // 判断是否需要强制覆盖， 是否含有 -f 参数
                if (!source.force) {
                    // 如果存在则提示
                    logger.warn(`${repoName} file is exist, please check it`);
                    return
                } else {
                    logger.info(`${repoName} file is exist, and will be deleted`)
                    // 如果存在则删除
                    fs.rmSync(resolve(process.cwd(), './', repoName), { recursive: true, force: true })
                    logger.info(`${repoName} file is deleted`)
                }

            }
            logger.info('init mind...');
            // 如果不存在则拉取
            // 使用 git clone 拉取
            const { spawn } = require('child_process');
            const git = spawn('git', ['clone', repoUrl, repoName], {
                cwd: process.cwd(),
                stdio: 'inherit'
            });
            git.on('error', (err: { message: any; }) => {
                logger.error("加载 init 模块", err.message)
                rj(err)

            })
            git.on('exit', (e: number) => {
                logger.verbose("success exit：" + e);
            })
        })
    },
    async default(souce: Record<string, boolean>) {
        await this.config(souce)
        await this.mind(souce)
    }
}

export const initExec = async (source: any) => {
    // 获取 为true 的key
    const keys = Object.keys(source).filter(key => source[key]).map(key => String(key));
    logger.verbose('initExec', source, keys);

    if (!keys.includes('mind') && !keys.includes('config')) {
        initMethods.default(source)
    } else {
        const key = keys[0] as keyof typeof InitMethodType;
        if (initMethods[key] && typeof initMethods[key] === 'function') {
            initMethods[key](source)
        }
    }

}


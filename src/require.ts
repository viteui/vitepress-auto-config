import { cosmiconfig } from 'cosmiconfig';
import logger from './log';
import { DefineConfigOptions } from './types';
import { configNamePrefix } from './const';

// 定义配置文件的搜索路径
const explorer = cosmiconfig('vitepress-generate', {
    searchPlaces: [
        'package.json',
        `${configNamePrefix}.json`,
        `${configNamePrefix}.ts`,
        `${configNamePrefix}.js`,
        `${configNamePrefix}.mjs`,
        `${configNamePrefix}.cjs`,
    ],
});

const configDefault: DefineConfigOptions = {
    sidebarConfig: {
        inputDir: './docs',
        root: 'docs',
        exculde: ["codeSnippet", "md", "public", ".vitepress", ".DS_Store", "vite.config.ts", "index.md", "liveDomain.md"],
        collapsed: true,
        collapsedValue: true,
    }
}


// 判断配置文件是否存在
export async function isExistConfigFile(): Promise<boolean> {
    try {
        const result = await explorer.search();
        if (result && result.config) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        logger.error(error);
        return false;
    }
}

/**
 * 
 * @returns 获取配置文件
 */
export async function loadConfig(): Promise<DefineConfigOptions> {
    try {
        const result = await explorer.search();
        if (result && result.config) {
            const config = typeof result.config === 'function'
                ? result.config()
                : result.config;
            return config;
        } else {
            logger.warn("not find config file use default config");
            return configDefault
        }
    } catch (error) {
        logger.error("loadConfig error use default config");
        return configDefault
    }
}


/**
 * 
 * @returns 获取配置文件
 */
export const getAutoConfig = async (): Promise<DefineConfigOptions> => {
    try {
        return await loadConfig();
    } catch (e) {
        logger.error("getAutoConfig error");
        return configDefault
    }
}

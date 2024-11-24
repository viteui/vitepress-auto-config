

// 引入log模块
import chalk from 'chalk';

const levels = {
    error: 0,
    warn: 1,
    success: 2,
    info: 3,
    verbose: 4,
    debug: 5,
};


const getLoggerLevelNum = () => {
    return levels[logger.level as keyof typeof levels] || levels.debug
}


const logger = {
    level: 'info',
    success: (...msg: any) => {
        if (getLoggerLevelNum() >= levels.success) {
            console.log.apply(console, [chalk.green('\nsuccess:'), ...msg])
        }

    },
    error: (...msg: any) => {
        if (getLoggerLevelNum() >= levels.error) {
            console.log.apply(console, [chalk.red('\nerror:'), ...msg])
        }

    },
    info: (...msg: any) => {
        if (getLoggerLevelNum() >= levels.info) {
            console.log.apply(console, ['\ninfo:', ...msg])
        }
    },
    warn: (...msg: any) => {
        if (getLoggerLevelNum() >= levels.warn) {
            console.log.apply(console, [chalk.yellow('\nwarn:'), ...msg])
        }
    },
    debug: (...msg: any) => {
        if (getLoggerLevelNum() >= levels.debug) {
            console.log.apply(console, [chalk.blue('\ndebug:'), ...msg])
        }
    },
    verbose: (...msg: any) => {
        if (getLoggerLevelNum() >= levels.verbose) {
            console.log.apply(console, [chalk.gray('\nverbose:'), ...msg])
        }
    }

}

logger.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info'  // 判断debug模式



export default logger;
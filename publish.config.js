const { execSync } = require('child_process');
module.exports = {
    // 发布目录
    root: ".",
    // 是否同步git
    syncGit: false,
    // 是否同步git tag
    syncGitTag: false,
    // 升级版本号的等级
    versionLevel: 'patch', // major | minor | patch
    // 自定义发布
    customPublish: false,
    gitRoot: ".",
    // 发布前执行
    before(config) {
        console.log("npm run build ... ")
        execSync(`npm run build`)
    },
    // 发布后执行
    after(config) {
        console.log(config)
    },
    // git tag 格式
    gitTagFormat: (version) => {
        return `release/v${version}`
    },
}


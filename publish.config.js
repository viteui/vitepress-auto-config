import { execSync } from 'child_process'
export default {
    // 发布目录
    root: ".",
    // 是否同步git
    syncGit: true,
    // 是否同步git tag
    syncGitTag: true,
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


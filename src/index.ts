
import * as fs from 'fs'
import * as path from 'path'
import { getAutoConfig } from './require'
import { register } from 'ts-node';
import logger from './log.js';
import {
    DefineConfigOptions,
    NavItem,
    NavOptions,
    OptionCallback,
    Options,
    PathTree,
    Sidebar,
    SidebarItem,
    SidebarNode
} from './types';


// 注册 ts-node 支持 .ts 文件
register(
    {
        // 可选：指定你的 TypeScript 配置文件路径
        project: './tsconfig.json',
    }
);


function generateDirectoryTreeObject(dirPath: string): PathTree {
    const stats = fs.statSync(dirPath);
    const treeObject: PathTree = {
        path: dirPath,
        name: path.basename(dirPath),
        type: ""
    };

    if (stats.isDirectory()) {
        const files = fs.readdirSync(dirPath);
        treeObject.type = 'directory';
        treeObject.children = files.map((file: any) => {
            const filePath = path.join(dirPath, file);
            return generateDirectoryTreeObject(filePath);
        });
    } else {
        treeObject.type = 'file';
    }

    return treeObject;
}

export function getSortNumber(name: any) {
    const match = name.match(/^(\d+)-/);
    if (match) {
        return parseInt(match[1]);
    }
    return Number.MAX_SAFE_INTEGER;
}
export function replaceSortNumber(name: any) {
    const match = name.match(/^(\d+)-/);
    if (match) {
        return name.replace(match[1] + "-", "")
    }
    return name
}





// function extractH2H3Titles(markdownText: string) {
//     // 定义正则表达式匹配二级和三级标题
//     const pattern = /^(##|###)\s+(.+)$/gm;

//     // 初始化结果数组
//     let result: Array<any> = [];
//     let currentH2: HTitle = {
//         title: '',
//         children: []
//     };

//     // 使用 matchAll() 方法获取所有匹配项
//     const matches = markdownText.matchAll(pattern);

//     for (const match of matches) {
//         const [fullMatch, level, title] = match;
//         if (level === '##') {
//             // 发现二级标题，添加到结果并设置为当前二级标题
//             currentH2 = { title: (title || '')?.replace(/\*\*/g, ''), children: [] };
//             result.push(currentH2);
//         } else if (level === '###' && currentH2) {
//             // 发现三级标题，添加到当前二级标题的 subTitles 列表中
//             currentH2 && currentH2.children && currentH2.children.push({
//                 title: (title || '')?.replace(/\*\*/g, ''),
//             });
//         }
//     }

//     return result;
// }


function buildSliderTree(dir: string, treeData: any, options: Partial<Options>) {
    function buildSlider(tree: any) {
        const item: SidebarItem = {
            text: replaceSortNumber(tree.name),
            sort: getSortNumber(tree.name),
            items: []
        }
        if (options.collapsed) {
            item.collapsed = options.collapsedValue || false
        }
        const children = tree.children || []
        children.forEach((child: any) => {
            if (child.type === 'directory') {
                item.items && item.items?.push(buildSlider(child))
                // 解析.link 文件，读取内容作为子级
            } else if (/.link$/.test(child.name)) {
                const link = fs.readFileSync(child.path, 'utf-8')
                const data = {
                    text: replaceSortNumber(child.name.replace(".link", "")),
                    sort: getSortNumber(child.name),
                    link: link.trim(),
                }
                item.items && item.items.push(data)
            } else if (/.md$/.test(child.name) && !/.hidden.md$/.test(child.name)) {
                // 获取 md的二级标题
                const md = fs.readFileSync(child.path, 'utf-8')
                // 只包含二级标题
                const titles = md.match(/^##\s+(.+)$/gm)
                // 获取对应的三级标题作为子级
                // const titles = extractH2H3Titles(md);
                // console.log(JSON.stringify(titles, null, 2))
                const data = {
                    text: replaceSortNumber(child.name.replace(".md", "")),
                    sort: getSortNumber(child.name),
                    link: child.path.replace(dir, "").replace(".md", "").replace(options.root, ""),
                    // md 的二级标题
                    titles: (titles || [])?.map((t: string) => ({
                        title: (t || '')?.replace(/\*\*/g, '').replace("## ", '').trim(),
                    })),
                }
                item.items && item.items.push(data)
            }
        })
        item.items && item.items?.sort((a, b) => a.sort - b.sort)
        return item
    }
    return buildSlider(treeData)
}

export async function getSideBar(_options: Partial<Options>): Promise<SidebarItem[] | Sidebar> {
    const { sidebarConfig: default_options } = await getAutoConfig();
    const options = { ...default_options, ..._options }
    const dir = options?.inputDir || '';
    const tree = generateDirectoryTreeObject(dir);
    const children = tree.children;
    const result: Record<string, any> = {};
    Array.isArray(children) && children.forEach((side) => {
        if (options.exculde && Array.isArray(options.exculde) && options.exculde.indexOf(side.name) === -1) {
            // 
            const name = `/${side.name}/`
            result[name] = buildSliderTree(dir, side, options).items as SidebarItem[]
            if (options.mindmapDomain) {
                result[name].unshift({
                    text: replaceSortNumber(side.name) + "思维导图",
                    sort: 0,
                    link: `${options.mindmapDomain}?id=/${side.name}/`,
                })
            }
        }
    })
    return result
}


export async function getNav(_options: NavOptions): Promise<NavItem[]> {
    const { sidebarConfig: default_options } = await getAutoConfig();
    const options = { ...default_options, ..._options }
    const dir = options.inputDir;
    const tree = generateDirectoryTreeObject(dir);
    const children = tree.children;
    const result: Array<any> = [];
    const findLink = (items: any) => {
        for (const iterator of items) {
            if (iterator.link) {
                return iterator.link
            } else if (iterator.items) {
                const path: string = findLink(iterator.items)
                if (path) {
                    return path
                }
            }
        }
    }
    function isDirectory(list: Array<any>) {
        for (const iterator of list) {
            if (iterator.items) {
                return true
            }
        }
    }
    Array.isArray(children) && children.forEach((side) => {
        if (options.exculde && Array.isArray(options.exculde) && options.exculde.indexOf(side.name) === -1) {
            const menuItemTree = buildSliderTree(dir, side, options)
            const menuItemTreeItems = menuItemTree.items
            if (Array.isArray(menuItemTreeItems) && menuItemTreeItems.length >= 1 && !menuItemTree?.link && isDirectory(menuItemTreeItems)) {
                const items: Array<SidebarItem> = menuItemTreeItems.map(item => {
                    // 判断是否存在目录
                    return {
                        text: replaceSortNumber(item.text),
                        sort: getSortNumber(item.text),
                        link: Array.isArray(item.items) ? findLink(item.items) : item.link,
                        activeMatch: item.text,
                    }
                })
                if (options.mindmapDomain) {
                    items.unshift({
                        text: replaceSortNumber(side.name) + "思维导图",
                        sort: 0,
                        link: `${options.mindmapDomain}?id=/${side.name}/`,
                    })
                }

                result.push({
                    text: replaceSortNumber(side.name),
                    sort: getSortNumber(side.name),
                    activeMatch: side.name,
                    items: items
                })
            } else {
                const items: Array<NavItem> = [
                    {
                        text: replaceSortNumber(side.name),
                        sort: getSortNumber(side.name),
                        link: findLink(menuItemTreeItems),
                        activeMatch: side.name,
                    }
                ]
                if (options.mindmapDomain) {
                    items.unshift({
                        text: replaceSortNumber(side.name) + "思维导图",
                        sort: 0,
                        link: `${options.mindmapDomain}?id=/${side.name}/`,
                    },)
                }
                result.push({
                    text: replaceSortNumber(side.name),
                    sort: getSortNumber(side.name),
                    // link: findLink(menuItemTreeItems),
                    activeMatch: side.name,
                    items
                })
            }
        }
    })
    return result.sort((a, b) => a.sort - b.sort)
}


function formatTree(menuTree: { [x: string]: any; }) {
    const result: Record<string, any> = {};
    for (const key in menuTree) {
        if (Object.prototype.hasOwnProperty.call(menuTree, key)) {
            const item = menuTree[key];
            function formatChildren(items: any[]) {
                const result: SidebarNode[] = []
                if (!items) return result
                items.forEach((child) => {
                    if (!child.isMindMap) {
                        const mindData = {
                            topic: child.text,
                            hyperLink: child.link ? `${child.link}.html` : "",
                            id: child.text,
                            root: false,
                            children: formatChildren(child.items),
                            expanded: true,

                        };
                        if (child?.titles?.length && child.link) {
                            mindData.children = child.titles.map(({ title, children = [] } = {
                                title: '', children: []
                            }) => {
                                return {
                                    topic: title,
                                    hyperLink: `${child.link}.html#${title}`,
                                    id: title,
                                    root: false,
                                    expanded: false,
                                    style: {
                                        // 节点样式
                                        background: '#e0e4ea'
                                    },
                                    children: []
                                    // children: children.map((h3: { title: string, children: any[] }) => {
                                    //     return {
                                    //         topic: item,
                                    //         hyperLink: `${child.link}.html#${h3.title}`,
                                    //         id: item,
                                    //         root: false,
                                    //         expanded: false,
                                    //         style: {
                                    //             // 节点样式
                                    //             background: '#e0e4ea'
                                    //         },
                                    //     }
                                    // })
                                }
                            })
                            mindData.expanded = false;
                        }
                        result.push(mindData as SidebarNode)
                    }
                })
                return result
            }
            result[key] = {
                topic: replaceSortNumber(key.replace(/\//g, "")),
                id: key,
                children: formatChildren(item),
                root: true
            }

        }

    }
    return result
}

export const buildWebSiteMindMap = async (_options: Partial<Options>) => {
    logger.info("开始生成网站思维导图...");
    let options = _options
    if (!options) {
        let { sidebarConfig: options } = await getAutoConfig();
    }

    // cd vitepress-mindmap && npm run build    
    const { spawn } = require('child_process');
    // 构建当前网站
    spawn('npm', ['run', 'build'], {
        cwd: path.resolve(process.cwd(), "."),
        stdio: 'inherit'
    }).on('close', (code: number) => {
        logger.success(`构建完成`)
    })
    // 构建vitepress-mindmap
    const child = spawn('cd', ['vitepress-mindmap', '||', 'exit 1', '&&', 'npm', 'run', 'build'], {
        cwd: path.resolve(process.cwd(), "."),
        stdio: 'inherit'
    })

    child.on('close', (code: number) => {
        logger.success(`构建完成`, code)
    })

}

export const buildMindMap = async () => {
    try {
        logger.info("开始生成mindmap文件...")
        const { sidebarConfig: options } = await getAutoConfig();
        const mindPath = path.resolve(process.cwd(), options?.mindDirectory || ".");
        // 根据mindDir文件地址获取文件的目录
        const mindDir = path.dirname(mindPath);
        // 如果目录不存在，则创建目录
        if (!fs.existsSync(mindDir)) {
            fs.mkdirSync(mindDir, { recursive: true });
        }
        const sider = getSideBar(options);
        fs.writeFileSync(mindPath, JSON.stringify(formatTree(sider), null, 2), "utf-8")
        logger.success(`文件生成成功< ${mindPath} >`)
        if (options?.buildMindmap) {
            buildWebSiteMindMap(options)
        }

    } catch (error) {
        console.log(error)
    }
}

// defineConfig 允许接受 对象/函数 参数，返回一个对象
export const defineConfig = async (options: DefineConfigOptions | OptionCallback) => {
    return typeof options === "function" ? await options() : options;
}
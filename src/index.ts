
import * as fs from 'fs'
import * as path from 'path'
export interface Options {
    exculde?: string[],
    collapsed?: boolean,
    collapsedValue?: boolean,
    root: string,
    mindmapDomain?: string,
    mindDirectory?: string,
}


export interface NavOptions extends Options {
    level?: number;
}
export interface SidebarItem {
    text: string,
    sort: number,
    link?: string,
    items?: SidebarItem[],
    collapsed?: boolean,
}

export interface Sidebar {
    [key: string]: SidebarItem[]
}
export interface NavItem {
    text: string,
    link?: string,
    items?: NavItem[],
    activeMatch?: string,
    target?: string
    rel?: string,
    sort?: number,
}

export interface PathTree {
    path: string,
    name: string,
    type: string,
    children?: PathTree[]
}
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

interface HTitle {
    title?: string,
    children?: HTitle[]
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


function buildSliderTree(dir: string, treeData: any, options: Options) {
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

export function getSideBar(dir: string, options: Options): Sidebar | SidebarItem[] {
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


export function getNav(dir: string, options: NavOptions): NavItem[] {
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

interface SidebarNode {
    text?: string;
    sort?: number;
    link?: string;
    activeMatch?: string;
    root?: boolean;
    children?: SidebarNode[];
    hyperLink?: string;
    toic?: string;
    titles?: HTitle[];
    expanded?: boolean;
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

export const buildMindMap = (options: Options) => {
    try {
        const mindDir = path.resolve(process.cwd(), options?.mindDirectory || ".");
        const sider = getSideBar("./docs", options);
        // fs.writeFileSync("./mindmap/origin-source.json", JSON.stringify(sider,null,2), "utf-8")
        fs.writeFileSync(mindDir, JSON.stringify(formatTree(sider), null, 2), "utf-8")
        console.log(`文件生成成功< ${mindDir} >`)
    } catch (error) {
        console.log(error)
    }

}
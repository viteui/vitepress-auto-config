
export interface DefineConfigOptions {
    sidebarConfig: Options
}
export interface Options {
    exculde?: string[];
    collapsed?: boolean
    collapsedValue?: boolean
    root?: string;
    mindmapDomain?: string
    mindDirectory?: string
    inputDir: string;
    level?: number;
    buildMindmap?: boolean;
}

export interface OptionCallback {
    (): Promise<DefineConfigOptions> | DefineConfigOptions
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

export interface HTitle {
    title?: string,
    children?: HTitle[]
}

export interface SidebarNode {
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

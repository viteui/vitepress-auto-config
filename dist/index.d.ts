interface Options {
    exculde?: string[];
    collapsed?: boolean;
    collapsedValue?: boolean;
    root: string;
    mindmapDomain?: string;
}
interface NavOptions extends Options {
    level?: number;
}
interface SidebarItem {
    text: string;
    sort: number;
    link?: string;
    items?: SidebarItem[];
    collapsed?: boolean;
}
interface Sidebar {
    [key: string]: SidebarItem[];
}
interface NavItem {
    text: string;
    link?: string;
    items?: NavItem[];
    activeMatch?: string;
    target?: string;
    rel?: string;
    sort?: number;
}
interface PathTree {
    path: string;
    name: string;
    type: string;
    children?: PathTree[];
}
declare function getSortNumber(name: any): number;
declare function replaceSortNumber(name: any): any;
declare function getSideBar(dir: string, options: Options): Sidebar | SidebarItem[];
declare function getNav(dir: string, options: NavOptions): NavItem[];

export { type NavItem, type NavOptions, type Options, type PathTree, type Sidebar, type SidebarItem, getNav, getSideBar, getSortNumber, replaceSortNumber };

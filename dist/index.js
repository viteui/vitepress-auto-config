// src/index.ts
import * as fs from "fs";
import * as path from "path";
function generateDirectoryTreeObject(dirPath) {
  const stats = fs.statSync(dirPath);
  const treeObject = {
    path: dirPath,
    name: path.basename(dirPath),
    type: ""
  };
  if (stats.isDirectory()) {
    const files = fs.readdirSync(dirPath);
    treeObject.type = "directory";
    treeObject.children = files.map((file) => {
      const filePath = path.join(dirPath, file);
      return generateDirectoryTreeObject(filePath);
    });
  } else {
    treeObject.type = "file";
  }
  return treeObject;
}
function getSortNumber(name) {
  const match = name.match(/^(\d+)-/);
  if (match) {
    return parseInt(match[1]);
  }
  return Number.MAX_SAFE_INTEGER;
}
function replaceSortNumber(name) {
  const match = name.match(/^(\d+)-/);
  if (match) {
    return name.replace(match[1] + "-", "");
  }
  return name;
}
function buildSliderTree(dir, treeData, options) {
  function buildSlider(tree) {
    var _a;
    const item = {
      text: replaceSortNumber(tree.name),
      sort: getSortNumber(tree.name),
      items: []
    };
    if (options.collapsed) {
      item.collapsed = options.collapsedValue || false;
    }
    const children = tree.children || [];
    children.forEach((child) => {
      var _a2, _b;
      if (child.type === "directory") {
        item.items && ((_a2 = item.items) == null ? void 0 : _a2.push(buildSlider(child)));
      } else if (/.link$/.test(child.name)) {
        const link = fs.readFileSync(child.path, "utf-8");
        const data = {
          text: replaceSortNumber(child.name.replace(".link", "")),
          sort: getSortNumber(child.name),
          link: link.trim()
        };
        item.items && item.items.push(data);
      } else if (/.md$/.test(child.name) && !/.hidden.md$/.test(child.name)) {
        const md = fs.readFileSync(child.path, "utf-8");
        const titles = md.match(/^##\s+(.+)$/gm);
        const data = {
          text: replaceSortNumber(child.name.replace(".md", "")),
          sort: getSortNumber(child.name),
          link: child.path.replace(dir, "").replace(".md", "").replace(options.root, ""),
          // md 的二级标题
          titles: (_b = titles || []) == null ? void 0 : _b.map((t) => {
            var _a3;
            return {
              title: (_a3 = t || "") == null ? void 0 : _a3.replace(/\*\*/g, "").replace("## ", "").trim()
            };
          })
        };
        item.items && item.items.push(data);
      }
    });
    item.items && ((_a = item.items) == null ? void 0 : _a.sort((a, b) => a.sort - b.sort));
    return item;
  }
  return buildSlider(treeData);
}
function getSideBar(dir, options) {
  const tree = generateDirectoryTreeObject(dir);
  const children = tree.children;
  const result = {};
  Array.isArray(children) && children.forEach((side) => {
    if (options.exculde && Array.isArray(options.exculde) && options.exculde.indexOf(side.name) === -1) {
      const name = `/${side.name}/`;
      result[name] = buildSliderTree(dir, side, options).items;
      if (options.mindmapDomain) {
        result[name].unshift({
          text: replaceSortNumber(side.name) + "\u601D\u7EF4\u5BFC\u56FE",
          sort: 0,
          link: `${options.mindmapDomain}?id=/${side.name}/`
        });
      }
    }
  });
  return result;
}
function getNav(dir, options) {
  const tree = generateDirectoryTreeObject(dir);
  const children = tree.children;
  const result = [];
  const findLink = (items) => {
    for (const iterator of items) {
      if (iterator.link) {
        return iterator.link;
      } else if (iterator.items) {
        const path2 = findLink(iterator.items);
        if (path2) {
          return path2;
        }
      }
    }
  };
  function isDirectory(list) {
    for (const iterator of list) {
      if (iterator.items) {
        return true;
      }
    }
  }
  Array.isArray(children) && children.forEach((side) => {
    if (options.exculde && Array.isArray(options.exculde) && options.exculde.indexOf(side.name) === -1) {
      const menuItemTree = buildSliderTree(dir, side, options);
      const menuItemTreeItems = menuItemTree.items;
      if (Array.isArray(menuItemTreeItems) && menuItemTreeItems.length >= 1 && !(menuItemTree == null ? void 0 : menuItemTree.link) && isDirectory(menuItemTreeItems)) {
        const items = menuItemTreeItems.map((item) => {
          return {
            text: replaceSortNumber(item.text),
            sort: getSortNumber(item.text),
            link: Array.isArray(item.items) ? findLink(item.items) : item.link,
            activeMatch: item.text
          };
        });
        if (options.mindmapDomain) {
          items.unshift({
            text: replaceSortNumber(side.name) + "\u601D\u7EF4\u5BFC\u56FE",
            sort: 0,
            link: `${options.mindmapDomain}?id=/${side.name}/`
          });
        }
        result.push({
          text: replaceSortNumber(side.name),
          sort: getSortNumber(side.name),
          activeMatch: side.name,
          items
        });
      } else {
        const items = [
          {
            text: replaceSortNumber(side.name),
            sort: getSortNumber(side.name),
            link: findLink(menuItemTreeItems),
            activeMatch: side.name
          }
        ];
        if (options.mindmapDomain) {
          items.unshift({
            text: replaceSortNumber(side.name) + "\u601D\u7EF4\u5BFC\u56FE",
            sort: 0,
            link: `${options.mindmapDomain}?id=/${side.name}/`
          });
        }
        result.push({
          text: replaceSortNumber(side.name),
          sort: getSortNumber(side.name),
          // link: findLink(menuItemTreeItems),
          activeMatch: side.name,
          items
        });
      }
    }
  });
  return result.sort((a, b) => a.sort - b.sort);
}
export {
  getNav,
  getSideBar,
  getSortNumber,
  replaceSortNumber
};

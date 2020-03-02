import { toArray } from './helper';
import { NodeType, VNode } from './vnode';

const noSpaceAndLineBreak = /\s*|[\r\n]/g;
const escape = /({{([\s\S]+?)}})+/g;

export const compile = function(element: Element) {
    let code = `with(this) {return ${process(element)}}`;
    return new Function(code);
};

export type elmOption = {
    [props: string]: any
}

export type createElement = (tagName: string, option: elmOption, children: Array<VNode | string>) => VNode;

export const createElement: createElement = function(tagName, { attrs, event }, children = []) {
    let vnodeList: VNode[] = children.map(item => {
        if (typeof item === 'string') return createText(item);
        else return item;
    });
    return new VNode({
        tagName,
        attrs,
        event,
        children: vnodeList,
        type: NodeType.Element
    });
};

type createText = (val: string) => VNode;
export const createText: createText = function(val) {
    return new VNode({
        nodeValue: val,
        type: NodeType.Text
    });
};

const process = function(element: Element | Text) {
    let code = '';
    // 元素节点
    if (element instanceof Element) code = `_c("${element.localName}",`;
    // 文本节点
    else if (element instanceof Text) {
        let text = element.wholeText.replace(noSpaceAndLineBreak, ''); // 去掉空格会车
        let newText = text.replace(escape, function(match: string) {
            // 处理 ref 的情况 用 _v 方法包起来
            return `\${_v(${match.slice(2, -2)})}`;
        });
        return `\`${newText}\``;
    }
    else return;

    code += processAttrs(element);

    let children = toArray(element.childNodes).map(process);
    code += `,[${children.join(',')}]`;

    return code += ')';
};

const processAttrs = function({ attributes }: Element) {
    let code: string[] = [];
    let options: elmOption = {
        attrs: [],
        event: []
    };
    let attrs: any[] = Array.prototype.slice.call(attributes);
    attrs.forEach(({name, value}) => {        
        if (name[0] === ':') options.attrs.push(`${name.slice(1)}:${value}`);
        else if (name[0] === '@') options.event.push(`${name.slice(1)}:${value}`);
        else options.attrs.push(`${name}:"${value}"`);
    });

    Object.keys(options).forEach(key => {
        if (options[key].length > 0) code.push(`${key}:{${options[key].join(',')}}`);
    });

    return `{${code.join(',')}}`;
}
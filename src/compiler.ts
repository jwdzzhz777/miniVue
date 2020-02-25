import { toArray } from './helper';
import template from 'lodash/template';

enum NodeType {
    Element = 1,
    Attr,
    Text,
    CDATASection,
    EntityReference,
    Entity,
    ProcessingInstruction,
    Comment,
    Document,
    DocumentType,
    DocumentFragment,
    Notation
};

const noSpaceAndLineBreak = /\s*|[\r\n]/g;
const escape = /({{([\s\S]+?)}})+/g;

export const compile = function(element: HTMLEmbedElement & Text) {
    // 储存原始元素作为基准
    const primitiveList = element.childNodes;
    let code = `with(this) {return ${process(element)}}`;
    console.log(code);
    return new Function(code);
};

type elmOption = {
    [props: string]: any
}

type createElm = (tagName: string, option: elmOption, children: HTMLEmbedElement[]) => void;

export const createElm: createElm = function(tagName, { attrs, event }, children = []) {
    let el = document.createElement(tagName);

    for (let key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
    
    for (let key in event) {
        el.addEventListener(key, event[key]);
    }
    if (children.length > 0) {
        children.forEach(c => {
            if (typeof c === 'string') el.appendChild(createText(c));
            else el.appendChild(c);
        });
    }
    return el;
};

export const createText = function(val: string) {
    return document.createTextNode(val);
};

const process = function(element: HTMLEmbedElement & Text) {
    let code = '';
    // 元素节点
    if (element.nodeType === NodeType.Element) code = `_c("${element.localName}",`;
    // 文本节点
    else if (element.nodeType === NodeType.Text) {
        let text = element.wholeText.replace(noSpaceAndLineBreak, ''); // 去掉空格会车
        let newText = text.replace(escape, function(match) {
            return `\${${match.slice(2, -2)}}`;
        });
        console.log(newText);
        return `\`${newText}\``;
    }
    else return;

    code += processAttrs(element);

    let children = toArray(element.childNodes).map(process);
    code += `,[${children.join(',')}]`;

    return code += ')';
};

const processAttrs = function({ attributes }: HTMLEmbedElement) {
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
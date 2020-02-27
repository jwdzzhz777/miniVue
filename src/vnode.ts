import { elmOption } from './compiler';
import { miniVue1 } from './miniVue';
import { isRef } from './reactivity';

export enum NodeType {
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

type VNodeOption = {
    tagName?: string;
    attrs?: elmOption;
    event?: EventOption;
    children?: VNode[];
    nodeValue?: string;
    type: NodeType
}

type EventOption = {
    [props: string]: EventListenerOrEventListenerObject
}

export class VNode {
    tagName?: string;
    attrs: elmOption = {};
    event: EventOption = {};
    children: VNode[] = [];
    el: Element | Text | undefined;
    nodeValue?: string;
    type: NodeType;

    constructor({tagName, attrs, event, children, nodeValue, type}: VNodeOption) {
        this.tagName = tagName;
        attrs && (this.attrs = attrs);
        event && (this.event = event);
        children && (this.children = children);
        this.nodeValue = nodeValue;
        this.type = type;
    }
}

export const getValue = function(target: any) {
    return isRef(target)? target.value : target;
}

const vnodeToElm = function(vnode: VNode) {
    if (vnode.type ===  NodeType.Text) {
        let el = document.createTextNode(getValue(vnode.nodeValue) || '');
        vnode.el = el;
        return el;
    };
    if (!vnode.tagName) return;

    let el = document.createElement(vnode.tagName);

    for (let key in vnode.attrs) {
        el.setAttribute(key, getValue(vnode.attrs[key]));
    }
    
    for (let key in vnode.event) {
        el.addEventListener(key, vnode.event[key]);
    }
    if (vnode.children.length > 0) {
        vnode.children.forEach(v => {
            let child = vnodeToElm(v);
            child && el.appendChild(child);
        });
    }
    vnode.el = el;
    return el;
}

export const patch = function(oldVNode: VNode | undefined, vnode: VNode, instance: miniVue1) {
    if (!oldVNode) {
        let el = vnodeToElm(vnode);
        if (el && instance.el) instance.el.parentNode!.replaceChild(el, instance.el);
        return;
    }

    if (!isSameVNode(oldVNode, vnode)) {
        let el = vnodeToElm(vnode);
        if (el && oldVNode.el) oldVNode.el.parentNode!.replaceChild(el, oldVNode.el);
    } else {
        if (vnode.type === NodeType.Text && oldVNode.nodeValue !== vnode.nodeValue) {
            console.log(123, oldVNode);
            vnode.nodeValue && (oldVNode.el!.nodeValue = vnode.nodeValue);
        } else {
            updateAttrs(oldVNode, vnode);

            vnode.children.forEach((child: VNode, index: number) => void patch(oldVNode.children[index], child, instance));
        }

        vnode.el = oldVNode.el;
    }
}

const isSameVNode = function(oldVNode: VNode, vnode: VNode) {
    return oldVNode.type === vnode.type && oldVNode.tagName === oldVNode.tagName;
}

const updateAttrs = function(oldVNode: VNode, vnode: VNode) {
    if (!(oldVNode.el instanceof Element)) return;
    let { attrs = {} } = vnode;
    let { attrs: oldAttrs = {} } = oldVNode;
    // 设置新的和修改的属性
    for (let key in attrs) {
        if (!(key in oldAttrs) || oldAttrs[key] !== attrs[key]) {
            oldVNode.el!.setAttribute(key, getValue(attrs[key]));
        }
    }
    // 删除没有的属性
    for (let key in oldAttrs) {
        if (!(key in attrs)) {
            oldVNode.el!.removeAttribute(key);
        }
    }
}
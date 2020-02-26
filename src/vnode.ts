import { elmOption } from './compiler';
import { miniVue1 } from './miniVue';

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
    el: Element | undefined;
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

const vnodeToElm = function(vnode: VNode) {
    if (vnode.type ===  NodeType.Text) return document.createTextNode(vnode.nodeValue || '');
    if (!vnode.tagName) return;

    let el = document.createElement(vnode.tagName);

    for (let key in vnode.attrs) {
        el.setAttribute(key, vnode.attrs[key]);
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
        instance.vnode = vnode;
        console.log(el);
        if (el && instance.el) instance.el.parentNode!.replaceChild(el, instance.el);
    }
}
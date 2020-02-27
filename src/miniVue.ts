import { createElement, compile } from './compiler';
import { VNode, patch, getValue } from './vnode';
import { effect, ReactiveEffect } from './reactivity'

interface miniVueOpitons {
    setup?: (fn: createElement) => any;
}

export class miniVue1 {
    $option: miniVueOpitons;
    vnode?: VNode;
    render?: Function;
    el?: Element;
    _c = createElement;
    _v = getValue;
    setupResult?: any;
    proxy: object = {};
    update?: ReactiveEffect;
    constructor(option: miniVueOpitons) {
        this.$option=option;
    }
    mount(selector: string) {
        let vm = this;
        let el = document.querySelector(selector);
        if (!el) return;
        vm.el = el;
        let render = compile(el);
        vm.render = render;
        console.log(vm.$option);
        if (vm.$option.setup) {
            let setupResult = vm.$option.setup(createElement);
            vm.setupResult = setupResult;
            vm.proxy = new Proxy(vm, {
                get: (target, key) => {
                    if (key in setupResult) return setupResult[key];
                    else return Reflect.get(target, key);
                },
                set: (target, key, value) => {
                    if (key in setupResult) setupResult[key] = value;
                    return true;
                },
                // 一定要有 has 不然 with 语句拿不到
                has(target, key) {
                    return key in setupResult || Reflect.has(target, key);
                }
            });
        }

        vm.update = effect(function() {
            let vnode = render.call(vm.proxy);
            console.log('vnode', vnode);
            let oldVNode = vm.vnode;
            vm.vnode = vnode;

            patch(oldVNode, vnode, vm);
        });
    }
}


export default miniVue1;
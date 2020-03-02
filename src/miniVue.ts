import { createElement, compile } from './compiler';
import { VNode, patch, getValue } from './vnode';
import { effect, ReactiveEffect } from './reactivity'

interface miniVueOpitons {
    setup?: (fn: createElement) => any;
}

interface App {
    $option: miniVueOpitons;
    component: ComponentInstance;
    mount: (selector: string) => void
}

export interface ComponentInstance {
    $option: miniVueOpitons;
    vnode?: VNode;
    render?: Function;
    el?: Element;
    _c: createElement;
    _v: (target: any) => any;
    setupResult?: any;
    proxy: object;
    update?: ReactiveEffect;
}

export const createApp = function(options: miniVueOpitons) {
    let instance = createInstance(options);
    let app: App = {
        $option: options,
        component: instance,
        mount(selector) {
            let el = document.querySelector(selector);
            if (!el) return;

            let instance = this.component;
            

            instance.el = el;
            instance.render = compile(el);
            
            processSetup(instance);


            instance.update = effect(function() {
                let vnode = instance.render?.call(instance.proxy);
                let oldVNode = instance.vnode;
                instance.vnode = vnode;
    
                patch(oldVNode, vnode, instance);
            });

            return app;
        }
    };

    return app;
};

const createInstance = function(options: miniVueOpitons): ComponentInstance {
    let instance: ComponentInstance = {
        $option: options,
        _c: createElement,
        _v: getValue,
        proxy: {}
    };

    return instance;
}

const processSetup = function(instance: ComponentInstance) {
    let { setup } = instance.$option;
    if (setup) {
        let setupResult = instance.setupResult = setup.call(instance, createElement);
        instance.proxy = new Proxy(instance, {
            get: (target: ComponentInstance, key: string) => {
                if (key in setupResult) return setupResult[key];
                else return Reflect.get(target, key);
            },
            set: (target: ComponentInstance, key: string, value: any) => {
                if (key in setupResult) setupResult[key] = value;
                return true;
            },
            // 一定要有 has 不然 with 语句拿不到
            has(target: ComponentInstance, key: string) {
                return key in setupResult || Reflect.has(target, key);
            }
        });
    }
}
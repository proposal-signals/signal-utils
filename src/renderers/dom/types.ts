import type { Signal } from 'signal-polyfill';

export type AnySignal<T = any> = Signal.State<T> | Signal.Computed<T>;
export type Child = Node | Function | AnySignal | string | object;
export type Children = Child[];

export type Props = Record<string, any> | null;
export type ComponentProps = {
	[key: string]: any,
	children?: Children
};

export type RenderFn = () => Node;
export type AppRenderFn = (props: Props | undefined) => Node;
export type ComponentRenderFn = (props: ComponentProps | null) => Node;

export type ElementType = ComponentRenderFn | string;

export type BindStyles = Record<keyof CSSStyleDeclaration, any>;
export type BindClassList = Record<string, any>;

export type GetterFn = () => { toString(): string } | string | boolean | null | undefined;
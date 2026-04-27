type HTMLTag = keyof HTMLElementTagNameMap;
type ElementType = HTMLTag | "TEXT_ELEMENT";

type TextChild = string | number;
type ReactlessChild = ReactlessElement | TextChild;

interface BaseProps {
    children?: ReactlessChild[];
}

interface TextElementProps extends BaseProps {
    nodeValue: string;
}

interface ElementAttributes {
    title: string;
    id: string;
    className: string;
}

type ElementProps = Partial<ElementAttributes> & BaseProps;
type PropsObject = ElementProps | TextElementProps;

interface ReactlessElement {
    type: ElementType;
    props: PropsObject;
    key?: string | number;
}

type FiberNode = {
    type: ElementType | undefined;
    dom: Node | null;
    parent: FiberNode | null;
    child: FiberNode | null;
    sibling: FiberNode | null;
    props: PropsObject;
    effectTag: "UPDATE" | "PLACEMENT" | "DELETION" | "";
    alternate: FiberNode | null;
    key?: string | number;
}

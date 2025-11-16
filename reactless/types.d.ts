interface BaseProps {
    children?: ReactlessChild[];
    key?: string | number;
}

interface ElementAttributes {
    title: string;
    id: string;
    className: string;
}

interface TextElementProps extends BaseProps {
    nodeValue: string;
}

interface ReactlessElement {
    type: string;
    props: PropsObject;
    key?: string | number;
}

type ElementProps = Partial<ElementAttributes> & BaseProps;

type PropsObject = ElementProps | TextElementProps;

type TextChild = string | number;

type ReactlessChild = ReactlessElement | TextChild;

type FiberNode = {
    type: string | undefined;
    dom: Node | null;
    parent: FiberNode | null;
    child: FiberNode | null;
    sibling: FiberNode | null;
    props: PropsObject;
    effectTag: "UPDATE" | "PLACEMENT" | "DELETION" | "";
    alternate: FiberNode | null;
    key?: string | number;
}

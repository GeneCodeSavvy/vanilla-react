import * as constants from "./constants"

function createTextElement(text: TextChild): ReactlessElement {
    return {
        type: constants.TEXT_ELEMENT,
        props: {
            nodeValue: String(text),
            children: []
        } as TextElementProps
    } as ReactlessElement;
}

export function createElement(
    type: ElementType,
    props: (PropsObject & { key?: string | number }) = {},
    ...children: ReactlessChild[]
): ReactlessElement {
    // just flattens the children with depth one, and creates a Text Element for text values, and ReactlessElement for others
    const normalizedChildren = children
        .flat()
        .map(child => typeof child === 'object' ? child as ReactlessElement : createTextElement(child));

    const { key, ...rest } = (props || {}) as PropsObject & { key?: string | number };

    return {
        type,
        key,
        props: {
            ...rest,
            children: normalizedChildren as ReactlessElement[]
        }
    } as ReactlessElement;
}

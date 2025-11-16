import * as constants from "./constants"
import { commitRoot, setWipRoot, getCurrentRoot, setDeletions } from "./commit-phase"

export let nextUnitOfWork: FiberNode | null = null;
export let wipRoot: FiberNode | null = null;
export let deletions: FiberNode[] = [];

function createDom(fiber: FiberNode): Node {
    if (fiber.type === constants.TEXT_ELEMENT) {
        const props = fiber.props as TextElementProps;
        return document.createTextNode(props.nodeValue);
    }

    const dom = document.createElement(fiber.type || 'div');
    const props = fiber.props as ElementProps;

    if (props.id) dom.id = props.id;
    if (props.title) dom.title = props.title;
    if (props.className) dom.className = props.className;

    return dom;
}

function reconcileChildren(wipFiber: FiberNode, elements: ReactlessElement[]) {
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
    let prevSibling: FiberNode | null = null;

    // Create a map of old fibers by key for efficient lookup
    const oldFiberMap = new Map<string | number, FiberNode>();
    let tempOldFiber = oldFiber;
    while (tempOldFiber) {
        if (tempOldFiber.key !== undefined) {
            oldFiberMap.set(tempOldFiber.key, tempOldFiber);
        }
        tempOldFiber = tempOldFiber.sibling;
    }

    // Track which old fibers have been matched to avoid deletion
    const matchedOldFibers = new Set<FiberNode>();

    // First pass: handle elements with keys
    elements.forEach((element, index) => {
        let newFiber: FiberNode | null = null;
        let matchedOldFiber: FiberNode | null = null;

        // Try to find matching old fiber by key first, then by position
        if (element.key !== undefined && oldFiberMap.has(element.key)) {
            matchedOldFiber = oldFiberMap.get(element.key)!;
        } else if (!element.key) {
            // For elements without keys, try positional matching
            let tempFiber = oldFiber;
            let tempIndex = 0;
            while (tempFiber && tempIndex < index) {
                tempFiber = tempFiber.sibling;
                tempIndex++;
            }
            if (tempFiber && !matchedOldFibers.has(tempFiber) && tempFiber.key === undefined) {
                matchedOldFiber = tempFiber;
            }
        }

        const sameType = matchedOldFiber && element.type === matchedOldFiber.type;

        if (sameType && matchedOldFiber) {
            newFiber = {
                type: matchedOldFiber.type,
                dom: matchedOldFiber.dom,
                parent: wipFiber,
                child: null,
                sibling: null,
                props: element.props,
                alternate: matchedOldFiber,
                effectTag: "UPDATE",
                key: element.key,
            };
            matchedOldFibers.add(matchedOldFiber);
        } else {
            newFiber = {
                type: element.type,
                dom: null,
                parent: wipFiber,
                child: null,
                sibling: null,
                props: element.props,
                alternate: null,
                effectTag: "PLACEMENT",
                key: element.key,
            };

            if (matchedOldFiber) {
                matchedOldFiber.effectTag = "DELETION";
                deletions.push(matchedOldFiber);
                matchedOldFibers.add(matchedOldFiber);
            }
        }

        // Link the fiber into the tree
        if (index === 0) {
            wipFiber.child = newFiber;
        } else if (prevSibling && newFiber) {
            prevSibling.sibling = newFiber;
        }

        if (newFiber) {
            prevSibling = newFiber;
        }
    })

    // Second pass: mark remaining old fibers for deletion
    let tempFiber = oldFiber;
    while (tempFiber) {
        if (!matchedOldFibers.has(tempFiber)) {
            tempFiber.effectTag = "DELETION";
            deletions.push(tempFiber);
        }
        tempFiber = tempFiber.sibling;
    }
}

function performUnitOfWork(fiber: FiberNode): FiberNode | null {
    if (fiber.type) {
        if (!fiber.dom) {
            fiber.dom = createDom(fiber);
        }
    }

    const elements = (fiber.props.children || []) as ReactlessElement[];
    reconcileChildren(fiber, elements);

    if (fiber.child) return fiber.child;
    let nextFiber: FiberNode | null = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) return nextFiber.sibling;
        nextFiber = nextFiber.parent;
    }
    return null;
}

function workLoop(deadline: IdleDeadline) {
    while (nextUnitOfWork && deadline.timeRemaining() > 1) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    }

    if (!nextUnitOfWork && wipRoot) {
        setWipRoot(wipRoot);
        setDeletions([...deletions]);
        commitRoot();
        deletions = [];
    }

    requestIdleCallback(workLoop);
}

export function render(container: HTMLElement, element: ReactlessElement) {
    wipRoot = {
        type: undefined,
        dom: container,
        parent: null,
        child: null,
        sibling: null,
        props: {
            children: [element]
        },
        alternate: getCurrentRoot(),
        effectTag: ''
    };
    deletions = [];
    nextUnitOfWork = wipRoot;
}

export function startRenderLoop() {
    requestIdleCallback(workLoop);
}

# Reconciliation in Reactless

This document explains how reconciliation works in our React-like implementation and the improvements made to fix common issues.

## What is Reconciliation?

Reconciliation is the process of comparing the new virtual DOM tree with the previous one and determining what changes need to be made to the actual DOM. It's the core algorithm that makes React efficient by minimizing DOM manipulations.

## How Our Reconciliation Works

### 1. Fiber Architecture

We use a fiber-based architecture similar to React's implementation:

```typescript
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
```

### 2. Two-Phase Process

#### Render Phase (`render-phase.ts`)
- **Interruptible**: Uses `requestIdleCallback` for time-sliced rendering
- **Side-effect free**: Only creates fiber tree, doesn't modify DOM
- **Reconciles children**: Compares old and new elements to determine changes

#### Commit Phase (`commit-phase.ts`) 
- **Synchronous**: All DOM changes happen together
- **Side-effects**: Actually updates the DOM
- **Handles**: Placement, updates, and deletions

### 3. Key-Based Reconciliation

Our improved implementation supports key-based reconciliation for efficient list updates:

```typescript
// Elements with keys are matched efficiently
const elements = [
    { type: 'div', key: 'item-1', props: {...} },
    { type: 'div', key: 'item-2', props: {...} }
];
```

**Benefits:**
- Preserves component state when items reorder
- Avoids unnecessary DOM manipulations
- Better performance for dynamic lists

### 4. Reconciliation Algorithm

The `reconcileChildren` function:

1. **Creates fiber map**: Maps old fibers by key for O(1) lookup
2. **First pass**: Matches new elements with old fibers
   - Key-based matching first (if keys exist)
   - Positional matching for keyless elements
3. **Effect tagging**: 
   - `UPDATE`: Same type, update props
   - `PLACEMENT`: New element, insert into DOM
   - `DELETION`: Element removed, delete from DOM
4. **Second pass**: Mark unmatched old fibers for deletion

### 5. Effect Tags

- **PLACEMENT**: New fiber needs to be inserted
- **UPDATE**: Existing fiber needs prop updates
- **DELETION**: Old fiber needs to be removed
- **""** (empty): Root fiber, no DOM operation needed

## Improvements Made

### ✅ Key-Based Reconciliation
- **Before**: Only positional matching, inefficient for lists
- **After**: Key-based matching with fallback to positional matching
- **Impact**: Better performance and state preservation in dynamic lists

### ✅ Efficient Traversal
- **Before**: Simple while loop with index, could miss edge cases
- **After**: Two-pass algorithm with proper old fiber tracking
- **Impact**: Handles all reconciliation scenarios correctly

### ✅ Complete Deletion Tracking  
- **Before**: Deletions only tracked in some cases
- **After**: All unmatched old fibers properly marked for deletion
- **Impact**: No memory leaks from orphaned fibers

### ✅ Memory Leak Prevention
- **Before**: Deletion array persisted across renders
- **After**: Deletions cleared after each commit
- **Impact**: Prevents memory buildup over time

### ✅ Recursive Child Deletion
- **Before**: `commitDeletion` only handled direct DOM nodes
- **After**: Recursively handles all child deletions
- **Impact**: Properly cleans up complex component trees

### ✅ Batched Commits
- **Before**: Single commit per idle callback
- **After**: Multiple commits per callback when time allows
- **Impact**: Better utilization of idle time

## Example Reconciliation Flow

```typescript
// Initial render
const oldTree = [
    { type: 'div', key: 'a', props: { text: 'Hello' } },
    { type: 'div', key: 'b', props: { text: 'World' } }
];

// Update
const newTree = [
    { type: 'div', key: 'b', props: { text: 'World!' } },  // UPDATE (reordered + changed)
    { type: 'div', key: 'c', props: { text: 'New' } }      // PLACEMENT (new)
];
// { key: 'a' } -> DELETION (removed)
```

**Result:**
1. Fiber 'a' marked for DELETION
2. Fiber 'b' marked for UPDATE (moved position, changed props)  
3. Fiber 'c' marked for PLACEMENT (new element)

## Performance Characteristics

- **Time Complexity**: O(n) where n is number of elements
- **Space Complexity**: O(n) for fiber tree and reconciliation maps
- **Key Lookup**: O(1) with Map-based key matching
- **Memory**: Proper cleanup prevents leaks

## Future Improvements

While functional components aren't supported yet, the reconciliation layer is ready for:
- Component lifecycle methods
- Context propagation  
- Suspense boundaries
- Concurrent features

The fiber architecture provides the foundation for these advanced React features.
"""LearniVerse-AI Authoritative Data Structures & Algorithms Knowledge Corpus.

Provides structured, pedagogical knowledge chunks across Array, Linked List, Stack,
Recursion, and Tree/BST concepts for semantic embedding, vector indexing, and RAG.
"""

from typing import Any, Dict, List

DSA_KNOWLEDGE_CORPUS: List[Dict[str, Any]] = [
    # =========================================================================
    # 1. ARRAY MODULE
    # =========================================================================
    {
        "id": "dsa_arr_overview",
        "concept": "array",
        "subconcept": "memory_architecture",
        "category": "concept_overview",
        "difficulty": "beginner",
        "title": "Array Architecture: Contiguous Memory & Direct Indexing",
        "content": (
            "An Array is a contiguous block of allocated memory cells holding elements of uniform data types. "
            "Because memory is physically sequential, any element can be directly resolved in O(1) constant time "
            "via address arithmetic: Memory_Address(index) = Base_Address + (index * Element_Byte_Size). "
            "In modern hardware, arrays maximize CPU cache line hits due to spatial locality of reference. "
            "However, static arrays have fixed capacity, and dynamic resizing requires allocating a new block "
            "of size 2*N and copying all elements, incurring an amortized O(1) append cost but an occasional O(n) resize penalty."
        ),
    },
    {
        "id": "dsa_arr_analogy",
        "concept": "array",
        "subconcept": "mental_model",
        "category": "analogy",
        "difficulty": "beginner",
        "title": "Array Mental Model: Numbered Train Passenger Seats",
        "content": (
            "Picture a train car with seats numbered 0 through 99 bolted to the floor in a straight row. "
            "If the conductor asks for passenger at seat 42, they do not start counting from seat 0—they walk directly "
            "to position 42 instantly. That is O(1) random access. But imagine someone wants to squeeze into seat 10! "
            "Every passenger from seat 10 through 99 must stand up and shift one seat to the right. "
            "Inserting or deleting in an array forces shifting of elements, taking linear O(n) time."
        ),
    },
    {
        "id": "dsa_arr_code",
        "concept": "array",
        "subconcept": "implementation",
        "category": "code_implementation",
        "difficulty": "beginner",
        "title": "Array Operations: Direct Access vs Element Insertion",
        "content": (
            "```python\n"
            "# 1. Constant Time Random Access: O(1)\n"
            "def get_element(arr: list, index: int):\n"
            "    # Direct pointer offset calculation: base + index * size\n"
            "    return arr[index]\n\n"
            "# 2. Linear Time Insertion with Element Shifting: O(n)\n"
            "def insert_element(arr: list, index: int, value: int) -> list:\n"
            "    # All elements from index to end must slide right by 1 slot\n"
            "    arr.append(None)  # expand capacity\n"
            "    for i in range(len(arr) - 1, index, -1):\n"
            "        arr[i] = arr[i - 1]\n"
            "    arr[index] = value\n"
            "    return arr\n"
            "```"
        ),
    },
    {
        "id": "dsa_arr_misconception",
        "concept": "array",
        "subconcept": "cognitive_gap",
        "category": "misconception",
        "difficulty": "intermediate",
        "title": "Array Misconception: Value Lookup vs Index Access",
        "content": (
            "A frequent student misconception is believing that looking up a value in an unsorted array is O(1). "
            "Direct index access `arr[i]` is instantaneous O(1), but searching for a specific value `target in arr` "
            "requires inspecting every element one by one from index 0 to N-1, which is O(n) linear search. "
            "Only when elements are sorted can binary search achieve O(log n) lookup."
        ),
    },
    {
        "id": "dsa_arr_complexity",
        "concept": "array",
        "subconcept": "big_o_bounds",
        "category": "complexity_analysis",
        "difficulty": "beginner",
        "title": "Array Complexity Matrix",
        "content": (
            "Time Complexity for Arrays:\n"
            "- Random Access: O(1) Constant Time\n"
            "- Search (Unsorted): O(n) Linear Time\n"
            "- Search (Sorted): O(log n) via Binary Search\n"
            "- Append / Push: O(1) Amortized (O(n) on dynamic resize)\n"
            "- Arbitrary Insert / Delete: O(n) due to shifting elements\n"
            "Space Complexity: O(n) contiguous memory."
        ),
    },
    {
        "id": "dsa_arr_diagnostic",
        "concept": "array",
        "subconcept": "assessment_probe",
        "category": "diagnostic_probe",
        "difficulty": "intermediate",
        "title": "Diagnostic Probe: Cybernetic Telemetry Buffer",
        "content": (
            "Scenario: A telemetry buffer holds 1,000 sensor readings in a contiguous array. "
            "Accessing `telemetryBuffer[742]` completes in O(1) time because the memory controller "
            "computes the exact physical byte address without scanning indices 0 through 741. "
            "However, if an urgent sensor reading is inserted at index 0, all 1,000 existing packets "
            "must be shifted by one position, requiring 1,000 memory moves."
        ),
    },

    # =========================================================================
    # 2. LINKED LIST MODULE
    # =========================================================================
    {
        "id": "dsa_ll_overview",
        "concept": "linked_list",
        "subconcept": "node_pointer_topology",
        "category": "concept_overview",
        "difficulty": "beginner",
        "title": "Linked List Architecture: Disjoint Nodes and Dynamic Pointers",
        "content": (
            "A Linked List is a dynamic linear data structure where elements (nodes) are stored arbitrarily "
            "across the memory heap rather than in contiguous blocks. Each node consists of two fields: "
            "`DATA` (payload) and `NEXT` (reference/pointer to the succeeding node). "
            "The list begins at `HEAD` and terminates where `NEXT is null`. In a Doubly Linked List, each node "
            "also maintains a `PREV` pointer, enabling bidirectional navigation. "
            "Inserting or deleting at the head is an instant O(1) pointer adjustment, but arbitrary element access "
            "requires sequential traversal starting from HEAD, resulting in O(n) access time."
        ),
    },
    {
        "id": "dsa_ll_analogy",
        "concept": "linked_list",
        "subconcept": "mental_model",
        "category": "analogy",
        "difficulty": "beginner",
        "title": "Linked List Mental Model: Treasure Hunt Clues",
        "content": (
            "Think of a linked list as a scavenger hunt. The first clue is in your pocket (HEAD). "
            "It gives you a riddle that points to the kitchen (NEXT pointer). In the kitchen, you find a piece of gold (DATA) "
            "and another clue pointing to the garden shed. You cannot teleport directly to clue #4—you must visit clue #1, #2, "
            "and #3 in order! To insert a new station between the kitchen and shed, you simply rewrite the kitchen's clue "
            "to point to the new room, and have the new room's clue point to the shed."
        ),
    },
    {
        "id": "dsa_ll_code",
        "concept": "linked_list",
        "subconcept": "implementation",
        "category": "code_implementation",
        "difficulty": "intermediate",
        "title": "Linked List Operations: Node, Insert at Head, Reversal",
        "content": (
            "```python\n"
            "class Node:\n"
            "    def __init__(self, data):\n"
            "        self.data = data\n"
            "        self.next = None\n\n"
            "class LinkedList:\n"
            "    def __init__(self):\n"
            "        self.head = None\n\n"
            "    # O(1) Instant Head Insertion\n"
            "    def insert_at_head(self, data):\n"
            "        new_node = Node(data)\n"
            "        new_node.next = self.head\n"
            "        self.head = new_node\n\n"
            "    # O(n) In-Place List Reversal\n"
            "    def reverse(self):\n"
            "        prev = None\n"
            "        curr = self.head\n"
            "        while curr:\n"
            "            next_temp = curr.next\n"
            "            curr.next = prev\n"
            "            prev = curr\n"
            "            curr = next_temp\n"
            "        self.head = prev\n"
            "```"
        ),
    },
    {
        "id": "dsa_ll_misconception",
        "concept": "linked_list",
        "subconcept": "cognitive_gap",
        "category": "misconception",
        "difficulty": "intermediate",
        "title": "Linked List Misconception: Pointer Overwrite Data Loss",
        "content": (
            "A catastrophic mistake learners make during insertion is reassigning pointers in the wrong sequence. "
            "If you set `head = new_node` before setting `new_node.next = head`, the pointer to the entire rest of the list "
            "is severed and lost forever in garbage collection. Always stitch the new node's forward reference "
            "BEFORE redirecting the predecessor pointer."
        ),
    },
    {
        "id": "dsa_ll_complexity",
        "concept": "linked_list",
        "subconcept": "big_o_bounds",
        "category": "complexity_analysis",
        "difficulty": "beginner",
        "title": "Linked List Complexity Matrix",
        "content": (
            "Time Complexity for Singly Linked Lists:\n"
            "- Access / Indexing: O(n) Linear Time\n"
            "- Search: O(n) Linear Time\n"
            "- Insert at Head: O(1) Constant Time\n"
            "- Insert at Tail: O(1) if tail pointer maintained, else O(n)\n"
            "- Delete at Head: O(1) Constant Time\n"
            "- Delete arbitrary node: O(n) to locate predecessor, O(1) pointer redirection\n"
            "Space Overhead: Extra pointer storage per node (8 bytes per pointer on 64-bit architectures)."
        ),
    },
    {
        "id": "dsa_ll_diagnostic",
        "concept": "linked_list",
        "subconcept": "assessment_probe",
        "category": "diagnostic_probe",
        "difficulty": "intermediate",
        "title": "Diagnostic Probe: Singly Linked List Node Insertion",
        "content": (
            "To insert a new node with value 99 at the head of a linked list currently headed by node A: "
            "Step 1: Set `newNode.next = head` (points 99 to A). "
            "Step 2: Set `head = newNode` (updates list entry point). "
            "Executing these in reverse severs the link to A and leaks all subsequent nodes."
        ),
    },

    # =========================================================================
    # 3. STACK MODULE
    # =========================================================================
    {
        "id": "dsa_stack_overview",
        "concept": "stack",
        "subconcept": "lifo_mechanics",
        "category": "concept_overview",
        "difficulty": "beginner",
        "title": "Stack Architecture: LIFO Structure and Call Stack Dynamics",
        "content": (
            "A Stack is a restricted linear collection adhering to the Last-In, First-Out (LIFO) protocol. "
            "All additions and removals occur exclusively at one end designated as the TOP. "
            "Fundamental operations are:\n"
            "- `push(x)`: Inserts element x onto the top of the stack (O(1))\n"
            "- `pop()`: Removes and returns the topmost element (O(1))\n"
            "- `peek()`: Inspects the top element without removing it (O(1))\n"
            "- `is_empty()`: Checks if the stack contains zero elements (O(1))\n"
            "Stacks govern CPU execution via the Call Stack, where function activation records are pushed "
            "upon invocation and popped upon return."
        ),
    },
    {
        "id": "dsa_stack_analogy",
        "concept": "stack",
        "subconcept": "mental_model",
        "category": "analogy",
        "difficulty": "beginner",
        "title": "Stack Mental Model: Spring-Loaded Cafeteria Tray Dispenser",
        "content": (
            "Imagine a spring-loaded tray dispenser in a school cafeteria. The dishwasher pushes clean trays "
            "onto the stack one by one. The spring compresses as weight is added. When a hungry student approaches, "
            "they take the top tray—which was the very last tray placed on the stack! "
            "You cannot grab a tray from the bottom without breaking the spring mechanism. "
            "Last In, First Out (LIFO)."
        ),
    },
    {
        "id": "dsa_stack_code",
        "concept": "stack",
        "subconcept": "implementation",
        "category": "code_implementation",
        "difficulty": "intermediate",
        "title": "Stack Algorithms: Balanced Parentheses Matching",
        "content": (
            "```python\n"
            "def is_valid_parentheses(s: str) -> bool:\n"
            "    stack = []\n"
            "    matching = {')': '(', '}': '{', ']': '['}\n"
            "    for char in s:\n"
            "        if char in matching.values():\n"
            "            stack.append(char)  # push opening bracket\n"
            "        elif char in matching:\n"
            "            if not stack or stack.pop() != matching[char]:\n"
            "                return False  # mismatch or stack underflow\n"
            "    return len(stack) == 0  # valid if all opened were closed\n"
            "```"
        ),
    },
    {
        "id": "dsa_stack_misconception",
        "concept": "stack",
        "subconcept": "cognitive_gap",
        "category": "misconception",
        "difficulty": "intermediate",
        "title": "Stack Misconception: LIFO vs FIFO Confusion",
        "content": (
            "Learners frequently confuse Stacks (LIFO: Last In First Out) with Queues (FIFO: First In First Out). "
            "In a stack, the item added last is the first to leave (like an undo history). "
            "In a queue, the item added first is the first to leave (like a checkout line). "
            "Furthermore, attempting to `pop()` from an empty stack triggers a Stack Underflow error."
        ),
    },
    {
        "id": "dsa_stack_complexity",
        "concept": "stack",
        "subconcept": "big_o_bounds",
        "category": "complexity_analysis",
        "difficulty": "beginner",
        "title": "Stack Complexity Matrix",
        "content": (
            "Time Complexity for Stacks (Array or Linked List backing):\n"
            "- Push: O(1) Constant Time\n"
            "- Pop: O(1) Constant Time\n"
            "- Peek / Top: O(1) Constant Time\n"
            "- Search: O(n) (requires popping elements to inspect)\n"
            "Space Complexity: O(n) proportional to the number of pushed elements."
        ),
    },
    {
        "id": "dsa_stack_diagnostic",
        "concept": "stack",
        "subconcept": "assessment_probe",
        "category": "diagnostic_probe",
        "difficulty": "intermediate",
        "title": "Diagnostic Probe: Expression Evaluation & Stack Underflow",
        "content": (
            "Given sequence: push(5), push(10), pop(), push(20), pop(), pop(). "
            "Trace:\n"
            "- push(5) -> [5]\n"
            "- push(10) -> [5, 10]\n"
            "- pop() -> returns 10, stack is [5]\n"
            "- push(20) -> [5, 20]\n"
            "- pop() -> returns 20, stack is [5]\n"
            "- pop() -> returns 5, stack is []\n"
            "A further pop() call on the empty stack raises a Stack Underflow exception."
        ),
    },

    # =========================================================================
    # 4. RECURSION MODULE
    # =========================================================================
    {
        "id": "dsa_rec_overview",
        "concept": "recursion",
        "subconcept": "call_stack_unwinding",
        "category": "concept_overview",
        "difficulty": "intermediate",
        "title": "Recursion Architecture: Base Cases and Call Stack Unwinding",
        "content": (
            "Recursion is a computational paradigm where a function solves a problem by calling copies of itself "
            "with progressively smaller subproblems. A well-formed recursive function has two non-negotiable components:\n"
            "1. Base Case: The terminating condition that returns a concrete value without further recursion.\n"
            "2. Recursive Step: The state transition that decomposes input and pushes a new activation frame.\n"
            "When a recursive call is initiated, the parent frame pauses mid-line and waits on the CPU Call Stack. "
            "Only when the innermost base case completes does the stack UNWIND in reverse order, passing results back "
            "up through paused frames until the initial caller terminates."
        ),
    },
    {
        "id": "dsa_rec_analogy",
        "concept": "recursion",
        "subconcept": "mental_model",
        "category": "analogy",
        "difficulty": "intermediate",
        "title": "Recursion Mental Model: Russian Matryoshka Dolls",
        "content": (
            "Imagine Russian nesting dolls. You cannot examine the innermost wooden figurine until you open "
            "each larger doll one by one. Every time a doll opens, you place its lid on the table (the Call Stack!). "
            "When you reach the solid baby doll at the center (the Base Case), your work is not finished: "
            "you must snap every lid back on in reverse LIFO order until the entire nested doll is complete. "
            "If a doll set has no center doll, you will open dolls forever until you run out of table space—Stack Overflow!"
        ),
    },
    {
        "id": "dsa_rec_code",
        "concept": "recursion",
        "subconcept": "implementation",
        "category": "code_implementation",
        "difficulty": "intermediate",
        "title": "Recursion Implementation: Factorial & Call Stack Tracing",
        "content": (
            "```python\n"
            "def factorial(n: int) -> int:\n"
            "    # 1. Base Case: stops the recursive descent\n"
            "    if n <= 1:\n"
            "        return 1\n"
            "    # 2. Recursive Step: pauses current frame, pushes factorial(n-1)\n"
            "    return n * factorial(n - 1)\n\n"
            "# Execution Trace for factorial(4):\n"
            "# PUSH Frame 1: factorial(4) -> pauses, calls factorial(3)\n"
            "# PUSH Frame 2: factorial(3) -> pauses, calls factorial(2)\n"
            "# PUSH Frame 3: factorial(2) -> pauses, calls factorial(1)\n"
            "# PUSH Frame 4: factorial(1) -> BASE CASE HIT, returns 1\n"
            "# POP  Frame 4: returns 1 to Frame 3 -> 2 * 1 = 2\n"
            "# POP  Frame 3: returns 2 to Frame 2 -> 3 * 2 = 6\n"
            "# POP  Frame 2: returns 6 to Frame 1 -> 4 * 6 = 24\n"
            "# POP  Frame 1: returns 24 (Stack cleared)\n"
            "```"
        ),
    },
    {
        "id": "dsa_rec_misconception",
        "concept": "recursion",
        "subconcept": "cognitive_gap",
        "category": "misconception",
        "difficulty": "advanced",
        "title": "Recursion Misconception: Instantaneous Execution & Memory Leaks",
        "content": (
            "A frequent student misconception is assuming recursive calls execute concurrently or immediately "
            "without memory cost. In reality, every pending call consumes physical RAM for its stack frame (local variables, "
            "parameter bindings, instruction pointer). If recursion depth exceeds the OS stack limit (typically 1,000 to 10,000 "
            "frames), a `RecursionError: maximum recursion depth exceeded` (Stack Overflow) crashes the program. "
            "Tail Call Optimization (TCO) can reuse frames, but is not supported in all runtimes (e.g. standard CPython)."
        ),
    },
    {
        "id": "dsa_rec_complexity",
        "concept": "recursion",
        "subconcept": "big_o_bounds",
        "category": "complexity_analysis",
        "difficulty": "intermediate",
        "title": "Recursion Complexity & Recurrence Relations",
        "content": (
            "Recursive Complexity Analysis:\n"
            "- Linear Recursion (e.g. Factorial): T(n) = T(n-1) + O(1) -> Time: O(n), Space: O(n) stack frames\n"
            "- Divide & Conquer (e.g. Binary Search): T(n) = T(n/2) + O(1) -> Time: O(log n), Space: O(log n)\n"
            "- Divide & Conquer (e.g. Merge Sort): T(n) = 2T(n/2) + O(n) -> Time: O(n log n), Space: O(n)\n"
            "- Multiple Recursion (e.g. Naive Fibonacci): T(n) = T(n-1) + T(n-2) + O(1) -> Time: O(2^n) exponential!"
        ),
    },
    {
        "id": "dsa_rec_diagnostic",
        "concept": "recursion",
        "subconcept": "assessment_probe",
        "category": "diagnostic_probe",
        "difficulty": "advanced",
        "title": "Diagnostic Probe: Missing Base Case & Stack Overflow",
        "content": (
            "Consider: `def mystery(n): return mystery(n-1) + mystery(n-2)`. "
            "Because there is no conditional `if n <= 1: return ...` base case check, "
            "the function calls `mystery(-1)`, `mystery(-2)` endlessly. Activation frames pile up "
            "vertically in stack memory until memory bounds are breached, resulting in a fatal Stack Overflow crash."
        ),
    },

    # =========================================================================
    # 5. TREE & BINARY SEARCH TREE (BST) MODULE
    # =========================================================================
    {
        "id": "dsa_tree_overview",
        "concept": "tree",
        "subconcept": "hierarchical_topology",
        "category": "concept_overview",
        "difficulty": "intermediate",
        "title": "Tree Architecture: Root, Hierarchy, and Binary Search Invariant",
        "content": (
            "A Tree is a non-linear hierarchical data structure consisting of nodes connected by directed edges. "
            "The topmost node is the ROOT; nodes with no children are LEAVES. "
            "A Binary Search Tree (BST) enforces a strict ordering invariant for every node X:\n"
            "- All values in X's left subtree are strictly LESS than X.val\n"
            "- All values in X's right subtree are strictly GREATER than X.val\n"
            "This invariant allows search, insertion, and deletion to eliminate half the remaining nodes at every step, "
            "achieving O(log n) time on balanced trees (e.g. AVL, Red-Black trees)."
        ),
    },
    {
        "id": "dsa_tree_analogy",
        "concept": "tree",
        "subconcept": "mental_model",
        "category": "analogy",
        "difficulty": "intermediate",
        "title": "Tree Mental Model: Inverted Botanical Oak Tree",
        "content": (
            "Picture an oak tree growing upside down from the ceiling. The thick trunk at the top ceiling is the ROOT. "
            "Branches split outward as they descend. The delicate twigs at the very bottom that end in leaves are LEAF nodes. "
            "In a Binary Search Tree, every fork in the branch has a strict directional sign: "
            "if your destination number is smaller than the fork's value, take the LEFT branch; "
            "if it is larger, take the RIGHT branch. You never have to search both sides."
        ),
    },
    {
        "id": "dsa_tree_code",
        "concept": "tree",
        "subconcept": "implementation",
        "category": "code_implementation",
        "difficulty": "advanced",
        "title": "BST Implementation: In-Order Traversal & Search",
        "content": (
            "```python\n"
            "class TreeNode:\n"
            "    def __init__(self, val=0, left=None, right=None):\n"
            "        self.val = val\n"
            "        self.left = left\n"
            "        self.right = right\n\n"
            "# O(log n) Search on Balanced BST\n"
            "def search_bst(root: TreeNode, target: int) -> TreeNode:\n"
            "    if not root or root.val == target:\n"
            "        return root\n"
            "    if target < root.val:\n"
            "        return search_bst(root.left, target)\n"
            "    return search_bst(root.right, target)\n\n"
            "# In-Order Traversal (Left -> Root -> Right) yields sorted values\n"
            "def inorder_traversal(root: TreeNode) -> list:\n"
            "    return inorder_traversal(root.left) + [root.val] + inorder_traversal(root.right) if root else []\n"
            "```"
        ),
    },
    {
        "id": "dsa_tree_misconception",
        "concept": "tree",
        "subconcept": "cognitive_gap",
        "category": "misconception",
        "difficulty": "advanced",
        "title": "Tree Misconception: Degenerate BST Degradation to Linked List",
        "content": (
            "Learners often assume that a Binary Search Tree ALWAYS guarantees O(log n) performance. "
            "However, if elements are inserted in already sorted order (e.g. 1, 2, 3, 4, 5), each node is appended "
            "only to the right. The tree degenerates into a linear Linked List with height N! "
            "In this degenerate state, search degrades to O(n) linear time. Self-balancing trees (AVL / Red-Black) "
            "perform rotations to maintain height balanced at O(log n)."
        ),
    },
    {
        "id": "dsa_tree_complexity",
        "concept": "tree",
        "subconcept": "big_o_bounds",
        "category": "complexity_analysis",
        "difficulty": "intermediate",
        "title": "Tree & BST Complexity Matrix",
        "content": (
            "Time Complexity for Binary Search Trees:\n"
            "- Search (Balanced): O(log n) Logarithmic Time\n"
            "- Insert (Balanced): O(log n) Logarithmic Time\n"
            "- Delete (Balanced): O(log n) Logarithmic Time\n"
            "- Search (Degenerate): O(n) Linear Time\n"
            "- In-Order Traversal: O(n) visits all nodes, producing strictly sorted order\n"
            "Space Complexity: O(n) total nodes, O(h) call stack memory where h is tree height (log n balanced, n worst)."
        ),
    },
    {
        "id": "dsa_tree_diagnostic",
        "concept": "tree",
        "subconcept": "assessment_probe",
        "category": "diagnostic_probe",
        "difficulty": "advanced",
        "title": "Diagnostic Probe: In-Order Traversal of BST",
        "content": (
            "Question: Which traversal of a Binary Search Tree visits all elements in strictly ascending sorted order? "
            "Answer: In-Order Traversal (Left Subtree -> Root Node -> Right Subtree). "
            "Because the BST invariant guarantees left < root < right, traversing the left child before the root, "
            "and the root before the right child recursively yields elements in monotonically increasing order."
        ),
    },

    # =========================================================================
    # 6. INTEGRATED CURRICULUM PREREQUISITES & 3D LAB HUBS
    # =========================================================================
    {
        "id": "dsa_prereq_chain",
        "concept": "curriculum",
        "subconcept": "dag_topology",
        "category": "concept_overview",
        "difficulty": "intermediate",
        "title": "Curriculum Prerequisite Chain: Array -> Linked List -> Stack -> Recursion -> Tree",
        "content": (
            "The LearniVerse-AI curriculum is organized as a strict Directed Acyclic Graph (DAG) with evidence gates:\n"
            "1. Array: foundational contiguous memory allocation and direct indexing.\n"
            "2. Linked List: introduces pointer references, node topology, and dynamic heap allocation.\n"
            "3. Stack: abstracts linear structure into LIFO semantics, bridging hardware memory to function calls.\n"
            "4. Recursion: relies directly on the Stack to model execution activation frames and unwinding.\n"
            "5. Tree / BST: generalizes recursive subproblems into branching non-linear hierarchies."
        ),
    },
    {
        "id": "dsa_lab_consoles",
        "concept": "virtual_classroom",
        "subconcept": "3d_spatial_anchors",
        "category": "lab_station",
        "difficulty": "beginner",
        "title": "3D Virtual Classroom Lab Stations and Diagnostic Dais",
        "content": (
            "The virtual campus represents data structures through interactive physical spatial anchors:\n"
            "- Central Dais: Holographic diagnostic plaque for 5-question cognitive assessments.\n"
            "- Array Station Console: Interactive memory registers showing contiguous slot indexing and shifting.\n"
            "- Linked List Lab: Floating node capsules displaying DATA and glowing NEXT pointer conduits.\n"
            "- Stack Tower: Vertical glowing activation frame pillar demonstrating push/pop animations.\n"
            "- Recursion Chamber: Nested multi-stage chamber illustrating Matryoshka doll stack unwinding.\n"
            "- Tree BST Grove: Branching golden ratio botanical nodes with left/right decision gates."
        ),
    },
]

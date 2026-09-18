"""Curriculum Content Repository for the Feynman Multimodal Explanation Pipeline.

Decouples educational scripts, analogies, code traces, and visual steps from
the Feynman reasoning service.
"""

from typing import Any, Dict, List, Optional

CURRICULUM_EXPLANATIONS: Dict[str, Dict[str, Any]] = {
    "recursion": {
        "title": "Demystifying Recursion & The Call Stack",
        "default_gap": "call_stack_unwinding",
        "default_misconception": "thinks_recursive_calls_execute_instantly_without_pausing",
        "learning_objective": "understand_call_stack_frames_and_base_case",
        "analogy": (
            "Imagine a set of Russian Matryoshka nesting dolls. You cannot see the innermost wooden doll "
            "until you open each larger doll one by one. Every time a doll opens, you set its lid aside on a table. "
            "The table is the Call Stack! When you finally reach the tiny solid doll in the center (the Base Case), "
            "you don't stop—you must work backward, snapping each lid back in reverse order until the full set is reassembled."
        ),
        "detailed_explanation": (
            "In computer architecture, functions do not run by magic. When `factorial(4)` calls `factorial(3)`, "
            "the execution of `factorial(4)` pauses mid-line. The CPU allocates an activation record (stack frame) "
            "containing its local variables and return address, and pushes it onto the Call Stack.\n\n"
            "This process repeats for `factorial(3)`, then `factorial(2)`, then `factorial(1)`. "
            "When the base case `n <= 1` is reached, it returns 1. The CPU pops that top frame, passes the result back "
            "to the paused parent, and unwinds the stack frame by frame. Without a valid Base Case, frames pile up forever "
            "until physical memory runs out—triggering a catastrophic Stack Overflow!"
        ),
        "code_or_trace": (
            "def factorial(n):\n"
            "    # 1. Base Case: Stops the infinite chain\n"
            "    if n <= 1:\n"
            "        return 1\n"
            "    # 2. Recursive Case: Pauses parent, pushes frame for (n-1)\n"
            "    return n * factorial(n - 1)\n\n"
            "# Call Stack Sequence:\n"
            "# Push: factorial(4) -> factorial(3) -> factorial(2) -> factorial(1)\n"
            "# Base Case Hit! Returns 1\n"
            "# Pop & Unwind: 1 -> 2*1=2 -> 3*2=6 -> 4*6=24\n"
        ),
        "visual_steps": [
            {
                "step_number": 1,
                "title": "Initial Call: factorial(4)",
                "description": "factorial(4) executes, evaluates n > 1, pauses at return 4 * factorial(3), and pushes Frame 4 to the Call Stack.",
                "visual_state": {"stack_depth": 1, "frames": ["factorial(4) [PAUSED]"], "status": "PUSH"},
                "highlight_element": "Frame 4: n=4",
                "analogy_note": "Opening the first large Matryoshka doll and placing its lid on the table."
            },
            {
                "step_number": 2,
                "title": "Cascading Push: factorial(3) & (2)",
                "description": "Each call pauses its parent and pushes a new activation frame on top. Stack grows vertically.",
                "visual_state": {"stack_depth": 3, "frames": ["factorial(4) [PAUSED]", "factorial(3) [PAUSED]", "factorial(2) [PAUSED]"], "status": "PUSH"},
                "highlight_element": "Frame 3 & 2",
                "analogy_note": "Stack of open lids is growing taller on the table."
            },
            {
                "step_number": 3,
                "title": "Deepest Frame: factorial(1)",
                "description": "factorial(1) is pushed. It checks n <= 1: BASE CASE REACHED! It returns 1 immediately without creating another call.",
                "visual_state": {"stack_depth": 4, "frames": ["factorial(4) [PAUSED]", "factorial(3) [PAUSED]", "factorial(2) [PAUSED]", "factorial(1) [BASE CASE]"], "status": "BASE_CASE"},
                "highlight_element": "BASE CASE: returns 1",
                "analogy_note": "Found the tiny solid wooden doll at the center!"
            },
            {
                "step_number": 4,
                "title": "Unwinding: factorial(2) Resumes",
                "description": "Frame 1 pops off the stack. Its return value (1) resumes factorial(2): 2 * 1 = 2. Frame 2 completes and pops.",
                "visual_state": {"stack_depth": 2, "frames": ["factorial(4) [PAUSED]", "factorial(3) [PAUSED]"], "status": "POP_AND_RESUME"},
                "highlight_element": "Result 2 returned to Frame 3",
                "analogy_note": "Snapping the smallest doll lid back in place."
            },
            {
                "step_number": 5,
                "title": "Final Unwinding: Return Value 24",
                "description": "Frame 3 pops (3 * 2 = 6). Frame 4 resumes: 4 * 6 = 24. The call stack is now completely cleared!",
                "visual_state": {"stack_depth": 0, "frames": [], "status": "COMPLETED", "final_result": 24},
                "highlight_element": "Stack Empty. Final: 24",
                "analogy_note": "All dolls fully reassembled on the desk."
            }
        ],
        "voice_script": (
            "Here is the secret to recursion. When a function calls itself, it does not restart—it pauses! "
            "Think of Russian nesting dolls. Each call puts an open doll on the table, which is the Call Stack. "
            "When we reach factorial of one, that is the base case: the solid doll inside. "
            "Now the call stack unwinds backward, multiplying each saved value until we get the final answer twenty-four."
        ),
        "video_timeline": [
            {"timestamp_sec": 0.0, "caption": "Recursion starts with a function calling itself with a smaller input.", "frame_type": "animation", "visual_data": {"active_node": "f(4)"}},
            {"timestamp_sec": 2.5, "caption": "Each call pauses and pushes a frame onto the Call Stack tower.", "frame_type": "diagram", "visual_data": {"stack_height": 4}},
            {"timestamp_sec": 5.0, "caption": "The Base Case stops the chain and returns a concrete value.", "frame_type": "code_trace", "visual_data": {"base_case": True}},
            {"timestamp_sec": 7.5, "caption": "The Call Stack unwinds in reverse LIFO order, returning the final answer.", "frame_type": "summary", "visual_data": {"unwound": True}}
        ],
        "three_d_instruction": {
            "action": "SHOW_3D_EXPLANATION",
            "concept": "recursion",
            "zone": "recursion_lab",
            "visualization": "call_stack_tower",
            "focus_elements": ["call_stack_tower", "activation_frames", "base_case_pedestal"],
            "camera_target": [-24.0, 3.5, 0.0]
        },
        "verification_question": {
            "question_id": "rec_verify_callstack_01",
            "prompt": "When factorial(4) calls factorial(3), what happens to factorial(4) while factorial(3) is executing?",
            "options": [
                "It stays paused on the Call Stack waiting for factorial(3) to return a value.",
                "It finishes executing and disappears from memory immediately.",
                "It restarts from the beginning in parallel.",
                "It gets erased to save RAM."
            ],
            "correct_option_index": 0,
            "explanation": "Correct! The parent frame remains preserved in memory on the Call Stack until the child call returns.",
            "tested_skill": "call_stack_activation_records"
        }
    },
    "stack": {
        "title": "Mastering Stacks & The LIFO Principle",
        "default_gap": "lifo_ordering",
        "default_misconception": "confuses_fifo_with_lifo",
        "learning_objective": "understand_push_pop_lifo_order",
        "analogy": (
            "Imagine a spring-loaded cafeteria plate dispenser. Every time the kitchen washes a clean plate, "
            "they press it onto the top of the stack, compressing the spring. When hungry students take a plate, "
            "they must take the topmost plate—the one washed most recently! This is LIFO: Last-In, First-Out."
        ),
        "detailed_explanation": (
            "A Stack is a linear data structure governed by a single strict access rule: elements can only be added "
            "(PUSH) and removed (POP) from the TOP.\n\n"
            "Because the most recently inserted item is always at the top, the first item you inserted will be the "
            "very last item you can remove. Stacks are fundamental to software engineering: your browser's Back button, "
            "text editor Undo/Redo, parenthesis validation in compilers, and the CPU's Call Stack all operate on this exact mechanism."
        ),
        "code_or_trace": (
            "stack = []\n"
            "stack.append('A')  # Push A  -> [A]\n"
            "stack.append('B')  # Push B  -> [A, B]\n"
            "stack.append('C')  # Push C  -> [A, B, C] (C is TOP)\n\n"
            "top_item = stack.pop()  # Pops 'C'! (Last in, First out)\n"
            "# Remaining stack: [A, B]\n"
        ),
        "visual_steps": [
            {
                "step_number": 1,
                "title": "Empty Stack Container",
                "description": "The stack cylinder is empty. Pointer TOP points to NULL (underflow state).",
                "visual_state": {"items": [], "top": None, "size": 0},
                "highlight_element": "Base plate",
                "analogy_note": "Empty cafeteria tray dispenser."
            },
            {
                "step_number": 2,
                "title": "PUSH('A') & PUSH('B')",
                "description": "Item 'A' is pushed to the bottom. Item 'B' is pushed directly on top of 'A'. TOP is now 'B'.",
                "visual_state": {"items": ["A", "B"], "top": "B", "size": 2},
                "highlight_element": "Disc B (Top)",
                "analogy_note": "Two plates pushed down against the spring."
            },
            {
                "step_number": 3,
                "title": "PUSH('C') - New Top Element",
                "description": "Item 'C' is pushed. It becomes the only directly accessible item in the stack.",
                "visual_state": {"items": ["A", "B", "C"], "top": "C", "size": 3},
                "highlight_element": "Disc C (Top)",
                "analogy_note": "The newest clean plate sits on the very top."
            },
            {
                "step_number": 4,
                "title": "POP() Operation - LIFO In Action",
                "description": "POP is invoked. The top element 'C' is removed and returned. 'A' cannot be touched yet!",
                "visual_state": {"items": ["A", "B"], "top": "B", "removed": "C", "size": 2},
                "highlight_element": "Popped: C",
                "analogy_note": "Student takes the top plate that was washed last."
            }
        ],
        "voice_script": (
            "A stack is just like a spring-loaded cafeteria plate dispenser. "
            "When you push an item, it goes on top. When you pop an item, you must take the top one. "
            "That means the last plate pushed is the first plate taken out. Remember LIFO: Last In, First Out!"
        ),
        "video_timeline": [
            {"timestamp_sec": 0.0, "caption": "A stack only allows insertions and removals at the top.", "frame_type": "animation", "visual_data": {"operation": "intro"}},
            {"timestamp_sec": 2.5, "caption": "Pushing A, B, and C creates a vertical pile.", "frame_type": "diagram", "visual_data": {"elements": ["A", "B", "C"]}},
            {"timestamp_sec": 5.0, "caption": "Invoking POP removes C first, proving the LIFO principle.", "frame_type": "code_trace", "visual_data": {"popped": "C"}},
            {"timestamp_sec": 7.5, "caption": "Stacks power browser history, Undo actions, and the CPU call stack.", "frame_type": "summary", "visual_data": {"applications": True}}
        ],
        "three_d_instruction": {
            "action": "SHOW_3D_EXPLANATION",
            "concept": "stack",
            "zone": "stack_lab",
            "visualization": "lifo_glass_cylinder",
            "focus_elements": ["spring_apparatus", "top_disc", "push_pop_chute"],
            "camera_target": [12.0, 2.5, 20.0]
        },
        "verification_question": {
            "question_id": "stack_verify_lifo_01",
            "prompt": "If you push items in order: [Alpha, Beta, Gamma], which item is popped first?",
            "options": [
                "Gamma, because Stacks follow LIFO (Last-In, First-Out).",
                "Alpha, because Stacks follow FIFO (First-In, First-Out).",
                "Beta, because it is in the middle of the stack.",
                "Any item can be extracted in O(1) time."
            ],
            "correct_option_index": 0,
            "explanation": "Correct! Gamma was pushed last, so it sits at the TOP and is popped first.",
            "tested_skill": "lifo_removal_order"
        }
    },
    "linked_list": {
        "title": "Understanding Linked Lists & Pointer Connections",
        "default_gap": "pointer_reference_traversal",
        "default_misconception": "thinks_linked_lists_support_instant_index_lookup",
        "learning_objective": "understand_node_references_and_traversal",
        "analogy": (
            "Imagine a scavenger hunt across a classroom. Clue #1 tells you where to find Clue #2. "
            "Clue #2 tells you where to find Clue #3. You cannot teleport straight to Clue #3 without "
            "reading Clue #2 first! Each clue is a Node, and the written hint is the Pointer."
        ),
        "detailed_explanation": (
            "Unlike contiguous arrays, linked list nodes can be scattered anywhere in physical RAM. "
            "Each node holds two things: the data payload and a reference pointer (`next`) to the memory address "
            "of the succeeding node.\n\n"
            "To reach index 4, you must start at the HEAD and walk the chain node by node in O(N) time. "
            "However, inserting a node in the middle is lightning fast—you simply rewire two pointer arrows!"
        ),
        "code_or_trace": (
            "class Node:\n"
            "    def __init__(self, val):\n"
            "        self.val = val\n"
            "        self.next = None\n\n"
            "# Traversal: Head -> Node1 -> Node2 -> None\n"
            "curr = head\n"
            "while curr is not None:\n"
            "    print(curr.val)\n"
            "    curr = curr.next  # Follow pointer to next node\n"
        ),
        "visual_steps": [
            {"step_number": 1, "title": "HEAD Pointer & First Node", "description": "HEAD points to memory address of Node(10).", "visual_state": {"nodes": [10], "pointer": "next"}, "highlight_element": "HEAD"},
            {"step_number": 2, "title": "Pointer Linkage", "description": "Node(10).next points to Node(20). Node(20).next points to Node(30).", "visual_state": {"nodes": [10, 20, 30]}, "highlight_element": "next arrows"},
            {"step_number": 3, "title": "Terminating at NULL", "description": "Node(30).next is NULL, indicating the end of the list.", "visual_state": {"nodes": [10, 20, 30, "NULL"]}, "highlight_element": "NULL"}
        ],
        "voice_script": "Think of a linked list as a scavenger hunt. Each node contains data and a clue pointing to the next node in memory.",
        "video_timeline": [
            {"timestamp_sec": 0.0, "caption": "Nodes in a linked list store data and a next pointer.", "frame_type": "diagram", "visual_data": {}},
            {"timestamp_sec": 4.0, "caption": "Traversal requires walking from HEAD to NULL one link at a time.", "frame_type": "summary", "visual_data": {}}
        ],
        "three_d_instruction": {
            "action": "SHOW_3D_EXPLANATION",
            "concept": "linked_list",
            "zone": "linked_list_lab",
            "visualization": "bezier_node_mesh",
            "focus_elements": ["node_spheres", "cyan_pointer_lasers"],
            "camera_target": [24.0, 2.5, 0.0]
        },
        "verification_question": {
            "question_id": "ll_verify_traversal_01",
            "prompt": "Why can't a singly linked list access element at index 5 in O(1) constant time?",
            "options": [
                "Because nodes are scattered in memory and you must traverse pointers sequentially from HEAD.",
                "Because linked lists can only hold 4 elements maximum.",
                "Because linked lists do not store values in memory.",
                "Because the CPU refuses to read pointers."
            ],
            "correct_option_index": 0,
            "explanation": "Correct! Without contiguous memory indexing, traversal requires following each next reference in O(N) time.",
            "tested_skill": "pointer_traversal_mechanics"
        }
    },
    "array": {
        "title": "Demystifying Arrays & Contiguous Memory Indexing",
        "default_gap": "zero_indexed_contiguous_memory",
        "default_misconception": "confuses_index_with_cardinal_count",
        "learning_objective": "understand_0_indexing_and_memory_offsets",
        "analogy": (
            "Imagine a row of identical post-office mailboxes side by side. Box 0 is at the entrance. "
            "If each box is exactly 1 foot wide, Box 4 is located exactly (4 * 1 foot) down the hall! "
            "You don't have to check the first three boxes; you can sprint straight to Box 4 in O(1) time."
        ),
        "detailed_explanation": (
            "An Array is stored in one uninterrupted block of physical RAM. Because every item has an identical byte size, "
            "the hardware calculates the memory address using a basic formula: `Address = BaseAddress + (Index * ElementSize)`.\n\n"
            "This makes reading or writing any element instantaneous—O(1) constant time! But inserting or deleting an item "
            "requires shifting all downstream elements over to preserve contiguous ordering."
        ),
        "code_or_trace": (
            "arr = [10, 20, 30, 40, 50]\n"
            "# Index:  0   1   2   3   4\n"
            "val = arr[3]  # Directly accesses 40 via memory offset calculation\n"
        ),
        "visual_steps": [
            {"step_number": 1, "title": "Contiguous RAM Allocation", "description": "Memory blocks 0x100 to 0x114 allocated side by side.", "visual_state": {"indices": [0, 1, 2, 3, 4]}, "highlight_element": "Contiguous blocks"},
            {"step_number": 2, "title": "Zero-Index Offset", "description": "Index 0 has offset 0 from base address. Index i is at Base + (i * size).", "visual_state": {"target": "arr[2]"}, "highlight_element": "O(1) formula"}
        ],
        "voice_script": "Arrays live in contiguous memory slots. Because every slot is identical, the computer jumps directly to any index in O(1) time.",
        "video_timeline": [
            {"timestamp_sec": 0.0, "caption": "Arrays provide instant O(1) random access using memory offset arithmetic.", "frame_type": "summary", "visual_data": {}}
        ],
        "three_d_instruction": {
            "action": "SHOW_3D_EXPLANATION",
            "concept": "array",
            "zone": "array_station",
            "visualization": "linear_memory_blocks",
            "focus_elements": ["memory_grid", "indexer_pointer"],
            "camera_target": [12.0, 2.5, -20.0]
        },
        "verification_question": {
            "question_id": "array_verify_offset_01",
            "prompt": "Why is array element lookup by index an O(1) constant-time operation?",
            "options": [
                "The computer calculates the exact memory address instantly using BaseAddress + (Index * Size).",
                "Arrays use AI to guess the location of elements.",
                "The CPU searches through every preceding item at lightspeed.",
                "Arrays are stored on hard drives instead of RAM."
            ],
            "correct_option_index": 0,
            "explanation": "Correct! Contiguous memory allows direct arithmetic memory offset calculation.",
            "tested_skill": "contiguous_indexing_formula"
        }
    },
    "tree": {
        "title": "Mastering Binary Search Trees & Hierarchical Ordering",
        "default_gap": "binary_search_invariant",
        "default_misconception": "confuses_tree_traversal_with_linear_search",
        "learning_objective": "understand_bst_property_and_traversals",
        "analogy": (
            "Imagine a royal genealogy or a tournament bracket. At every round or branch, you make a single "
            "binary decision: go left if the value is smaller, go right if it is larger. With each step, you eliminate "
            "half of the remaining possibilities—achieving logarithmic O(log N) search speed!"
        ),
        "detailed_explanation": (
            "A Binary Search Tree (BST) is a hierarchical node structure where every node satisfies a fundamental invariant: "
            "all values in its left subtree are strictly smaller than the node, and all values in its right subtree are strictly larger.\n\n"
            "This invariant enables rapid O(log N) search, insertion, and deletion on balanced trees, while an In-Order traversal "
            "(Left &rarr; Node &rarr; Right) yields elements in perfectly sorted ascending order."
        ),
        "code_or_trace": (
            "class TreeNode:\n"
            "    def __init__(self, val):\n"
            "        self.val = val\n"
            "        self.left = None\n"
            "        self.right = None\n\n"
            "def search_bst(root, target):\n"
            "    if not root or root.val == target:\n"
            "        return root\n"
            "    if target < root.val:\n"
            "        return search_bst(root.left, target)\n"
            "    return search_bst(root.right, target)\n"
        ),
        "visual_steps": [
            {"step_number": 1, "title": "Root Node Assessment", "description": "Start at root node 50. Compare target value 70.", "visual_state": {"current": 50, "target": 70}, "highlight_element": "Root 50"},
            {"step_number": 2, "title": "Branch Decision: 70 > 50", "description": "Because 70 > 50, prune left branch completely and follow right pointer.", "visual_state": {"current": 70, "branch": "right"}, "highlight_element": "Right child 70"}
        ],
        "voice_script": "A binary search tree splits decisions in half at every level. If your target is smaller, go left. If it is larger, go right.",
        "video_timeline": [
            {"timestamp_sec": 0.0, "caption": "BST nodes enforce left < parent < right.", "frame_type": "diagram", "visual_data": {}}
        ],
        "three_d_instruction": {
            "action": "SHOW_3D_EXPLANATION",
            "concept": "tree",
            "zone": "tree_lab",
            "visualization": "hierarchical_bst_mesh",
            "focus_elements": ["root_orb", "branching_lasers"],
            "camera_target": [-12.0, 2.5, 20.0]
        },
        "verification_question": {
            "question_id": "tree_verify_bst_01",
            "prompt": "In a Binary Search Tree, where are elements smaller than the root always located?",
            "options": [
                "Exclusively in the left subtree.",
                "Exclusively in the right subtree.",
                "Scattered randomly across leaf nodes.",
                "In a separate linked list buffer."
            ],
            "correct_option_index": 0,
            "explanation": "Correct! The BST invariant mandates all smaller values reside in the left subtree.",
            "tested_skill": "bst_ordering_invariant"
        }
    }
}


class CurriculumExplanationRepository:
    """Repository adapter managing curated pedagogical scripts and analogies."""

    def __init__(self, content: Optional[Dict[str, Dict[str, Any]]] = None):
        self._content = content or CURRICULUM_EXPLANATIONS

    def get_content(self, concept: str) -> Optional[Dict[str, Any]]:
        """Retrieve explanation metadata for a given concept, falling back to recursion."""
        return self._content.get(concept.lower()) or self._content.get("recursion")

    def has_concept(self, concept: str) -> bool:
        """Check if concept has curated explanation assets."""
        return concept.lower() in self._content

    def list_supported_concepts(self) -> List[str]:
        """List all curriculum concepts with curated scripts."""
        return list(self._content.keys())


curriculum_repository = CurriculumExplanationRepository()

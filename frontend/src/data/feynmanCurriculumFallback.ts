/**
 * Offline & Resilient Curriculum Fallback Generator for the Feynman Agent.
 *
 * Ensures that if the backend network request fails or is unreachable,
 * the learner still receives an authoritative, interactive multimodal explanation
 * with analogies, visual steps, code traces, and verification questions.
 */

import { FeynmanResponse } from '../types/feynman';

export const FALLBACK_CURRICULUM_DATA: Record<string, any> = {
  recursion: {
    title: 'Demystifying Recursion & The Call Stack',
    problem: 'call_stack_unwinding_misconception',
    learning_objective: 'understand_call_stack_frames_and_base_case',
    analogy:
      'Imagine Russian nesting dolls (Matryoshka). You cannot see the tiny solid doll inside until you open each larger doll one by one, setting each lid on the table (the Call Stack). When you finally reach the base case solid doll at the center, you must work backward in reverse LIFO order, snapping each lid back on to reconstruct the full set.',
    detailed_explanation:
      'When a recursive function calls itself, it does not restart—it pauses! The CPU creates an activation frame on the Call Stack storing its parameters and local variables. Each recursive call adds another frame on top. When the base case (e.g. n <= 1) is reached, it returns a concrete value, popping frames one by one and multiplying/combining results as it unwinds.',
    code_or_trace:
      'def factorial(n):\n    # 1. Base Case: Stops the infinite chain\n    if n <= 1:\n        return 1\n    # 2. Recursive Case: Pauses parent, pushes frame for (n-1)\n    return n * factorial(n - 1)\n\n# Call Stack Unwinding: factorial(4) -> 4 * 6 = 24',
    visual_steps: [
      {
        step_number: 1,
        title: 'Initial Call: factorial(4)',
        description: 'factorial(4) executes, pauses at return 4 * factorial(3), and pushes Frame 4 onto the Call Stack.',
        visual_state: { stack_depth: 1, frames: ['factorial(4) [PAUSED]'], status: 'PUSH' },
        highlight_element: 'Frame 4: n=4',
      },
      {
        step_number: 2,
        title: 'Cascading Push: factorial(3) & factorial(2)',
        description: 'Each call pauses its parent and pushes a new activation frame on top. The stack tower grows vertically.',
        visual_state: { stack_depth: 3, frames: ['factorial(4)', 'factorial(3)', 'factorial(2)'], status: 'PUSH' },
        highlight_element: 'Frames 3 & 2',
      },
      {
        step_number: 3,
        title: 'Base Case Reached: factorial(1)',
        description: 'factorial(1) checks n <= 1: BASE CASE HIT! It returns 1 immediately without pushing further frames.',
        visual_state: { stack_depth: 4, frames: ['factorial(4)', 'factorial(3)', 'factorial(2)', 'factorial(1) [BASE]'], status: 'BASE_CASE' },
        highlight_element: 'BASE CASE: returns 1',
      },
      {
        step_number: 4,
        title: 'Call Stack Unwinding: Popping & Multiplying',
        description: 'Frames pop in reverse LIFO order: 1 -> 2*1=2 -> 3*2=6 -> 4*6=24. The call stack clears completely!',
        visual_state: { stack_depth: 0, frames: [], status: 'COMPLETED', final_result: 24 },
        highlight_element: 'Final result: 24',
      },
    ],
    voice_script:
      'Here is the secret to recursion: when a function calls itself, it does not restart—it pauses! Think of Russian nesting dolls. Each call puts an open doll on the table, which is the Call Stack. When we reach factorial of one, that is the base case. Now the stack unwinds backward, multiplying each saved value until we get the final answer twenty-four.',
    verification_question: {
      question_id: 'VQ_REC_FALLBACK_01',
      prompt: 'What prevents a recursive function from calling itself infinitely until a Stack Overflow occurs?',
      options: [
        'A Base Case with a terminating condition that returns without a recursive call',
        'An infinite while-loop that breaks on zero',
        'Automatic garbage collection removing older activation frames',
        'The CPU clock cycle limit resetting the function',
      ],
      correct_option_index: 0,
      explanation: 'Correct! A Base Case provides the terminating condition that stops recursion and initiates stack unwinding.',
      tested_skill: 'base_case_recognition',
    },
  },

  stack: {
    title: 'Mastering the Stack: LIFO Protocol & Activation Frames',
    problem: 'lifo_misconception',
    learning_objective: 'understand_lifo_push_pop_dynamics',
    analogy:
      'Think of a spring-loaded cafeteria plate dispenser. Trays are pushed onto the top one by one. When you take a tray to eat, you must take the top one—the very last one placed on the stack! Last In, First Out (LIFO).',
    detailed_explanation:
      'A Stack is a linear data structure that strictly enforces LIFO. The primary operations are push (adds to top in O(1)) and pop (removes from top in O(1)). Attempting to access or remove items from the middle without popping the top elements is prohibited.',
    code_or_trace:
      'stack = []\nstack.append("A")  # push A\nstack.append("B")  # push B\ntop = stack.pop()  # returns "B" (LIFO)\n# Remaining stack: ["A"]',
    visual_steps: [
      { step_number: 1, title: 'Push Element A', description: 'Placed at base of stack', visual_state: { height: 1 } },
      { step_number: 2, title: 'Push Element B', description: 'Placed on top of A', visual_state: { height: 2 } },
      { step_number: 3, title: 'Pop Top Element', description: 'Element B is removed first', visual_state: { height: 1 } },
    ],
    voice_script:
      'Remember the spring-loaded cafeteria tray dispenser: the last tray put on top is always the first tray taken off. That is LIFO!',
    verification_question: {
      question_id: 'VQ_STACK_FALLBACK_01',
      prompt: 'If you push elements [10, 20, 30] in order, which element is returned by the first pop() call?',
      options: ['30 (the last element pushed)', '10 (the first element pushed)', '20 (the middle element)'],
      correct_option_index: 0,
      explanation: 'Correct! In LIFO protocol, the most recently pushed item (30) is the first to be popped.',
      tested_skill: 'lifo_retrieval',
    },
  },

  linked_list: {
    title: 'Navigating Linked Lists: Pointers & Node Memory',
    problem: 'pointer_redirection_misconception',
    learning_objective: 'understand_dynamic_pointer_chaining',
    analogy:
      'Think of a scavenger hunt: each clue you find contains a riddle (DATA) and instructions telling you where the next clue is hidden (NEXT pointer). You cannot jump straight to clue 5 without following the chain from the starting clue (HEAD).',
    detailed_explanation:
      'Unlike arrays, linked lists do not store elements contiguously. Nodes are scattered across the memory heap, linked together by pointers. Inserting at the head is O(1), but accessing the k-th element requires linear O(n) traversal.',
    code_or_trace:
      'class Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n\n# Head insertion:\nnew_node.next = head\nhead = new_node',
    visual_steps: [
      { step_number: 1, title: 'Create New Node', description: 'Allocate node with payload', visual_state: { nodes: 1 } },
      { step_number: 2, title: 'Point Next to Current Head', description: 'Preserve existing list', visual_state: { nodes: 2 } },
      { step_number: 3, title: 'Redirect Head Pointer', description: 'New node becomes entry point', visual_state: { nodes: 2 } },
    ],
    voice_script:
      'In a linked list, memory is not contiguous. Each node holds its data and a glowing pointer to the next station in line.',
    verification_question: {
      question_id: 'VQ_LL_FALLBACK_01',
      prompt: 'What is the time complexity of inserting a new node at the HEAD of a singly linked list?',
      options: ['O(1) Constant Time', 'O(n) Linear Time', 'O(log n) Logarithmic Time'],
      correct_option_index: 0,
      explanation: 'Correct! Inserting at the head requires only redirecting two pointers, which takes O(1) constant time.',
      tested_skill: 'head_insertion_complexity',
    },
  },

  array: {
    title: 'Array Architecture: Contiguous Memory & Direct Indexing',
    problem: 'indexing_vs_searching_confusion',
    learning_objective: 'understand_contiguous_address_arithmetic',
    analogy:
      'Think of numbered locker compartments in a gym. If you are assigned locker 42, you walk straight to locker 42 without checking lockers 0 through 41. That is O(1) direct access.',
    detailed_explanation:
      'Arrays allocate a single contiguous block of memory. Address calculation: Base_Address + (Index * Element_Size). This provides instantaneous O(1) random access by index, but inserting or deleting elements requires shifting subsequent items, taking O(n) time.',
    code_or_trace:
      '# Direct O(1) Index Access:\nval = arr[742]  # computed via address arithmetic\n\n# Linear O(n) Search:\nfor x in arr:\n    if x == target: return True',
    visual_steps: [
      { step_number: 1, title: 'Base Address Lookup', description: 'Locate index 0 in RAM', visual_state: { index: 0 } },
      { step_number: 2, title: 'Address Arithmetic Offset', description: 'Compute Base + index * size', visual_state: { index: 742 } },
      { step_number: 3, title: 'Direct Access Return', description: 'Instantaneous O(1) retrieval', visual_state: { success: true } },
    ],
    voice_script:
      'Arrays give you instant O(1) access by index because elements are laid out in a straight, contiguous line in physical RAM.',
    verification_question: {
      question_id: 'VQ_ARR_FALLBACK_01',
      prompt: 'Why does accessing an array element by its index take O(1) constant time?',
      options: [
        'The memory address is computed directly using Base_Address + (index * element_size)',
        'The computer scans through all previous indices in parallel',
        'Arrays maintain an internal hash map for each index',
      ],
      correct_option_index: 0,
      explanation: 'Correct! Address arithmetic allows the hardware to jump directly to the target byte in physical RAM.',
      tested_skill: 'address_arithmetic',
    },
  },

  tree: {
    title: 'Binary Search Trees: Hierarchical Invariant & Traversals',
    problem: 'bst_invariant_misconception',
    learning_objective: 'understand_bst_ordering_and_traversals',
    analogy:
      'Picture an inverted oak tree. At every fork in the branch, a signpost directs numbers: smaller numbers go to the LEFT, larger numbers go to the RIGHT. You never have to search both sides!',
    detailed_explanation:
      'A Binary Search Tree (BST) enforces that for every node X, all values in its left subtree are less than X, and all values in its right subtree are greater. This cuts search space in half at each step (O(log n) on balanced trees). In-Order traversal (Left -> Root -> Right) visits elements in strictly ascending sorted order.',
    code_or_trace:
      'def search_bst(root, target):\n    if not root or root.val == target:\n        return root\n    if target < root.val:\n        return search_bst(root.left, target)\n    return search_bst(root.right, target)',
    visual_steps: [
      { step_number: 1, title: 'Inspect Root Node', description: 'Compare target with root', visual_state: { node: 'root' } },
      { step_number: 2, title: 'Branch Decision', description: 'Target < Root: move left', visual_state: { node: 'left' } },
      { step_number: 3, title: 'Target Located', description: 'O(log n) search complete', visual_state: { found: true } },
    ],
    voice_script:
      'In a Binary Search Tree, every decision point halves the search space: smaller to the left, larger to the right.',
    verification_question: {
      question_id: 'VQ_TREE_FALLBACK_01',
      prompt: 'Which tree traversal algorithm visits all nodes of a Binary Search Tree in strictly ascending sorted order?',
      options: ['In-Order Traversal (Left -> Root -> Right)', 'Pre-Order Traversal (Root -> Left -> Right)', 'Post-Order Traversal (Left -> Right -> Root)'],
      correct_option_index: 0,
      explanation: 'Correct! In-Order traversal visits the left subtree, then the root, then the right subtree, producing sorted output.',
      tested_skill: 'inorder_traversal',
    },
  },
};

/**
 * Builds a valid, schema-compliant FeynmanResponse from the curriculum fallback data.
 */
export function generateCurriculumFallbackResponse(
  conceptId: string,
  studentId: string,
  userQuery: string,
  requestedModality?: string
): FeynmanResponse {
  const normalizedConcept = (conceptId || 'recursion').toLowerCase();
  const data = FALLBACK_CURRICULUM_DATA[normalizedConcept] || FALLBACK_CURRICULUM_DATA['recursion'];

  const modality = (requestedModality || 'VISUAL').toUpperCase();

  return {
    session_id: `FS_FALLBACK_${Date.now().toString(36).toUpperCase()}`,
    student_id: studentId,
    concept_id: normalizedConcept,
    input_type: 'TEXT',
    unified_input: userQuery,
    decision: {
      decision_id: `FD_FALLBACK_${Date.now().toString(36).toUpperCase()}`,
      concept_id: normalizedConcept,
      problem: data.problem,
      modality: modality,
      difficulty: 'INTERMEDIATE',
      learning_objective: data.learning_objective,
      reason: 'Curriculum Fallback Engine: Pedagogical explanation synthesized for concept remediation.',
      understood: [],
      gaps: [data.problem],
      misconceptions: [data.problem],
      confidence: 0.98,
    },
    explanation: {
      title: data.title,
      modality: modality,
      analogy: data.analogy,
      detailed_explanation: data.detailed_explanation,
      code_or_trace: data.code_or_trace,
      visual_steps: data.visual_steps,
      voice_script: data.voice_script,
      video_timeline: [
        { timestamp_sec: 0.0, caption: data.title, frame_type: 'animation', visual_data: { active: true } },
        { timestamp_sec: 3.0, caption: data.analogy.slice(0, 80) + '...', frame_type: 'diagram', visual_data: { state: 'unwinding' } },
        { timestamp_sec: 7.0, caption: 'Stack unwinds in reverse order', frame_type: 'summary', visual_data: { completed: true } },
      ],
      three_d_instruction: {
        action: 'SHOW_3D_EXPLANATION',
        concept: normalizedConcept,
        zone: `${normalizedConcept}_lab`,
        visualization: 'curriculum_apparatus',
        focus_elements: ['apparatus', 'dais', 'station'],
      },
    },
    verification_question: data.verification_question,
    strategy_history: [],
    orchestrator: 'resilient_curriculum_engine',
    llm_mode: 'curriculum_knowledge_base',
    cache_status: 'LOCAL_FALLBACK',
    timestamp: new Date().toISOString(),
  };
}

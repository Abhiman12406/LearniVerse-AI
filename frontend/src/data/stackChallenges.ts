import { StackMission, StackChallenge } from '../types/challenge';

export const STACK_CHALLENGES: StackChallenge[] = [
  {
    id: 'stack_lifo_order',
    missionId: 'stack_diagnostic_mission',
    stepNumber: 1,
    totalSteps: 4,
    title: 'LIFO Extraction Order',
    concept: 'stack',
    difficulty: 'easy',
    type: 'multiple_choice',
    objective: 'Determine output order under Last-In, First-Out (LIFO) discipline.',
    scenario:
      'Four data frames [A, B, C, D] are sequentially pushed onto an initially empty stack. Immediately afterward, four consecutive POP() operations are executed.',
    codeSnippet: [
      '// Execution Trace',
      'Stack S = new Stack();',
      'S.push("A");',
      'S.push("B");',
      'S.push("C");',
      'S.push("D");',
      '// Now popping all elements:',
      'result = [S.pop(), S.pop(), S.pop(), S.pop()];',
    ],
    options: [
      {
        id: 'opt_lifo_correct',
        label: 'A',
        text: 'D, C, B, A',
        explanation: 'Correct! The last pushed element ("D") is at the top of the stack and is extracted first.',
      },
      {
        id: 'opt_fifo',
        label: 'B',
        text: 'A, B, C, D',
        explanation: 'Incorrect. This is FIFO (First-In, First-Out), which describes a Queue, not a Stack.',
      },
      {
        id: 'opt_random',
        label: 'C',
        text: 'A, D, B, C',
        explanation: 'Incorrect. Stacks do not allow arbitrary or middle element extraction.',
      },
      {
        id: 'opt_partial_reverse',
        label: 'D',
        text: 'D, A, C, B',
        explanation: 'Incorrect. Elements must emerge in strict reverse order of insertion.',
      },
    ],
    correctOptionId: 'opt_lifo_correct',
    hint: 'Think of a spring-loaded cafeteria tray dispenser: the last tray placed on top is inevitably the first one retrieved.',
    feynmanAnalogy:
      'Imagine placing books in a vertical cardboard box. You can only look at and grab the book on top. To get to the bottom book ("A"), you must first remove all books placed after it ("D", "C", "B").',
    pedagogicalExplanation:
      'By definition, a Stack enforces LIFO (Last-In, First-Out). Elements are both inserted (pushed) and deleted (popped) exclusively at one end called the Top. Pushing [A, B, C, D] makes D the top, followed by C, B, and A at the base. Hence, popping yields D, then C, then B, then A.',
    simulatedStackInitial: [10, 20, 30, 40],
  },
  {
    id: 'stack_push_pop_trace',
    missionId: 'stack_diagnostic_mission',
    stepNumber: 2,
    totalSteps: 4,
    title: 'Interleaved Push & Pop Trace',
    concept: 'stack',
    difficulty: 'medium',
    type: 'multiple_choice',
    objective: 'Trace stack state through mixed push and pop transitions.',
    scenario:
      'Starting from an empty stack, trace the internal memory buffer across this sequence of operations:\n\nPUSH(15) → PUSH(30) → POP() → PUSH(45) → PUSH(60) → POP() → PUSH(75)\n\nWhat are the remaining elements on the stack from BASE to TOP?',
    codeSnippet: [
      '// Operation Sequence:',
      'PUSH(15)  // Stack: [15]',
      'PUSH(30)  // Stack: [15, 30]',
      'POP()     // Returns 30',
      'PUSH(45)  // Stack: [15, 45]',
      'PUSH(60)  // Stack: [15, 45, 60]',
      'POP()     // Returns 60',
      'PUSH(75)  // Stack: ?',
    ],
    options: [
      {
        id: 'opt_trace_correct',
        label: 'A',
        text: '[15, 45, 75]  (Base: 15, Top: 75)',
        explanation: 'Correct! 30 was popped, 60 was popped, leaving 15 at base, 45 in middle, and 75 on top.',
      },
      {
        id: 'opt_trace_reversed',
        label: 'B',
        text: '[75, 45, 15]  (Top to Base)',
        explanation: 'Incorrect. That is the order from Top to Base; the question asked from Base to Top.',
      },
      {
        id: 'opt_trace_all',
        label: 'C',
        text: '[15, 30, 45, 60, 75]',
        explanation: 'Incorrect. This ignores the POP() operations that removed 30 and 60.',
      },
      {
        id: 'opt_trace_dropped_base',
        label: 'D',
        text: '[45, 75]',
        explanation: 'Incorrect. The initial 15 was never popped and remains intact at the base.',
      },
    ],
    correctOptionId: 'opt_trace_correct',
    hint: 'Test this directly in the sandbox on the right! You can push and pop discs to watch the physical spring cylinder update.',
    feynmanAnalogy:
      'Each POP() undoes the most recent PUSH(). Notice how 30 was removed immediately after being added, and 60 was removed immediately after being added, preserving the foundational layers underneath.',
    pedagogicalExplanation:
      'Tracking the operations step-by-step:\n1. PUSH(15) -> [15]\n2. PUSH(30) -> [15, 30]\n3. POP() removes 30 -> [15]\n4. PUSH(45) -> [15, 45]\n5. PUSH(60) -> [15, 45, 60]\n6. POP() removes 60 -> [15, 45]\n7. PUSH(75) -> [15, 45, 75].\nFrom Base to Top, the items are [15, 45, 75].',
    simulatedStackInitial: [15, 45, 75],
  },
  {
    id: 'stack_overflow_underflow',
    missionId: 'stack_diagnostic_mission',
    stepNumber: 3,
    totalSteps: 4,
    title: 'Capacity Overflow & Underflow Guard',
    concept: 'stack',
    difficulty: 'easy',
    type: 'multiple_choice',
    objective: 'Understand structural boundary constraints and safety guards.',
    scenario:
      'The Stack Lab cylinder apparatus has an allocated physical buffer limit of 6 elements. Consider an empty stack (size = 0). What occurs if an algorithm executes POP() on this empty stack, and what mechanism does this represent in recursive programming?',
    codeSnippet: [
      'Stack S = new Stack(capacity = 6);',
      'assert S.isEmpty() == true;',
      '',
      '// Attempting removal on empty buffer:',
      'element = S.pop(); // ???',
    ],
    options: [
      {
        id: 'opt_underflow_correct',
        label: 'A',
        text: 'Stack Underflow Exception; mirrors violating a recursive Base Case',
        explanation:
          'Correct! Attempting to extract from an empty stack triggers Underflow. In recursion, a Base Case prevents underflow or runaway execution.',
      },
      {
        id: 'opt_overflow_error',
        label: 'B',
        text: 'Stack Overflow Exception; memory buffer exceeded',
        explanation: 'Incorrect. Overflow occurs when pushing into a saturated buffer, not when popping from an empty one.',
      },
      {
        id: 'opt_wraparound',
        label: 'C',
        text: 'Wraparound Circular Buffer extraction',
        explanation: 'Incorrect. Stacks do not wrap around to end indices; they are strictly linear LIFO containers.',
      },
      {
        id: 'opt_silent_null',
        label: 'D',
        text: 'Silent allocation of a synthetic zero without error',
        explanation: 'Incorrect. Robust data structures throw or return an underflow error flag to prevent corrupted data access.',
      },
    ],
    correctOptionId: 'opt_underflow_correct',
    hint: 'Grasping into an empty box gives you nothing. Popping an empty stack is an Underflow error.',
    feynmanAnalogy:
      'If you try to take a cafeteria tray when the dispenser is empty, your hands grab nothing. Guarding against Underflow is why recursive functions require a base case condition to know when to stop unwinding.',
    pedagogicalExplanation:
      'A Stack Underflow occurs when a POP or PEEK operation is requested on an empty stack. Conversely, Stack Overflow occurs when PUSH is invoked on a stack that has filled its allocated memory limit. In computer systems, recursive algorithms must hit their Base Case before the stack runs out of valid frames, avoiding both underflow and infinite stack frame allocation.',
    simulatedStackInitial: [],
  },
  {
    id: 'stack_bracket_balance',
    missionId: 'stack_diagnostic_mission',
    stepNumber: 4,
    totalSteps: 4,
    title: 'Call Stack & Bracket Validation',
    concept: 'stack',
    difficulty: 'hard',
    type: 'multiple_choice',
    objective: 'Bridge LIFO mechanics to nested syntax parsing and call stack execution.',
    scenario:
      'Compilers validate nested syntax like "( [ { } ] )" using a stack. The same mechanism dictates how the CPU handles nested function calls: f( g( h() ) ).\n\nWhen a scanner encounters a closing token (e.g., "}"), what invariant must hold for the code to be semantically valid?',
    codeSnippet: [
      '// Syntax & Call Stack Invariant:',
      'function isBalanced(code: string): boolean {',
      '  const stack = new Stack();',
      '  for (const char of code) {',
      '    if (isOpening(char)) stack.push(char);',
      '    else if (isClosing(char)) {',
      '      // What must happen here?',
      '    }',
      '  }',
      '}',
    ],
    options: [
      {
        id: 'opt_bracket_correct',
        label: 'A',
        text: 'The top of stack must match the closing token\'s opening counterpart, and is immediately popped.',
        explanation:
          'Correct! The most recently opened scope (top of stack) must be the first one closed, maintaining perfect nested LIFO symmetry.',
      },
      {
        id: 'opt_bracket_base',
        label: 'B',
        text: 'The bottom/base of the stack must match the closing token.',
        explanation: 'Incorrect. That would enforce FIFO ordering and break nested inner-scope isolation.',
      },
      {
        id: 'opt_bracket_all_pop',
        label: 'C',
        text: 'All currently open brackets are popped simultaneously.',
        explanation: 'Incorrect. Inner scopes must resolve one by one before outer scopes can close.',
      },
      {
        id: 'opt_bracket_accumulate',
        label: 'D',
        text: 'The closing token is pushed to the stack until file termination.',
        explanation: 'Incorrect. Closing tokens cancel out opening tokens; pushing them would corrupt the stack.',
      },
    ],
    correctOptionId: 'opt_bracket_correct',
    hint: 'Inner scopes must finish before outer scopes. Closing brackets mirror return statements unwinding the call stack.',
    feynmanAnalogy:
      'Think of conversations where someone goes on a tangent: "I was eating lunch (which was a pizza [with extra cheese {melted}])". You must finish talking about "melted" before you finish "extra cheese", and finish "extra cheese" before "pizza". Stacks mirror this natural nesting.',
    pedagogicalExplanation:
      'Because Stacks enforce LIFO, the most recently pushed opening token is always at the top. When a closing token arrives, it must correspond to the topmost open token. This identical principle powers the CPU Call Stack: a nested function h() cannot return to f() until g() finishes unwinding its own stack activation record.',
    simulatedStackInitial: [28, 44, 90],
  },
];

export const STACK_MISSION: StackMission = {
  id: 'stack_diagnostic_mission',
  title: 'Stack Lab Diagnostic Mission',
  subtitle: 'LIFO Mechanics & Call Stack Foundations',
  concept: 'stack',
  difficulty: 'easy',
  targetMastery: '70%+',
  description:
    'Synthesize stack operation sequences, trace LIFO buffer state transitions, and analyze memory boundary invariants to repair foundational prerequisite gaps.',
  learningObjectives: [
    'Master Last-In, First-Out (LIFO) extraction order',
    'Trace interleaved PUSH and POP memory transitions',
    'Understand Capacity Overflow and Underflow boundary conditions',
    'Bridge stack manipulation directly to Call Stack activation records',
  ],
  challenges: STACK_CHALLENGES,
};

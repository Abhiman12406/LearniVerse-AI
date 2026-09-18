"""5-Agent LangGraph Deliberation Workflow definition.

Assembles the sequential 5-agent pipeline:
Context Agent -> Diagnostic Agent -> Planner Agent -> Validator Agent -> Game Agent -> END
"""

from langgraph.graph import END, StateGraph
from backend.app.agents.context_agent import context_agent_node
from backend.app.agents.diagnostic_agent import diagnostic_agent_node
from backend.app.agents.game_agent import game_agent_node
from backend.app.agents.planner_agent import planner_agent_node
from backend.app.agents.state import AgentState
from backend.app.agents.validator_agent import validator_agent_node


def create_deliberation_graph():
    """Construct and compile the sequential 5-agent LangGraph workflow."""
    workflow = StateGraph(AgentState)

    # Register 5 agent nodes
    workflow.add_node("context_agent", context_agent_node)
    workflow.add_node("diagnostic_agent", diagnostic_agent_node)
    workflow.add_node("planner_agent", planner_agent_node)
    workflow.add_node("validator_agent", validator_agent_node)
    workflow.add_node("game_agent", game_agent_node)

    # Sequential edges
    workflow.set_entry_point("context_agent")
    workflow.add_edge("context_agent", "diagnostic_agent")
    workflow.add_edge("diagnostic_agent", "planner_agent")
    workflow.add_edge("planner_agent", "validator_agent")
    workflow.add_edge("validator_agent", "game_agent")
    workflow.add_edge("game_agent", END)

    return workflow.compile()


# Pre-compiled executable graph
deliberation_workflow = create_deliberation_graph()

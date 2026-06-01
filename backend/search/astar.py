from typing import List, Dict, Optional
import heapq

class SearchNode:
    def __init__(self, state: Dict, parent=None, action=None, path_cost=0, heuristic=0):
        self.state = state
        self.parent = parent
        self.action = action
        self.path_cost = path_cost
        self.heuristic = heuristic
        
    def __lt__(self, other):
        return (self.path_cost + self.heuristic) < (other.path_cost + other.heuristic)

def astar_search(initial_state: Dict, goal_test: callable, get_successors: callable, heuristic: callable) -> Optional[List]:
    frontier = []
    start_node = SearchNode(initial_state, path_cost=0, heuristic=heuristic(initial_state))
    heapq.heappush(frontier, start_node)
    
    explored = set()
    
    while frontier:
        node = heapq.heappop(frontier)
        
        # Simplified state representation for set (works for dicts with primitive values)
        state_tuple = tuple(sorted(node.state.items()))
        if state_tuple in explored:
            continue
        explored.add(state_tuple)
        
        if goal_test(node.state):
            path = []
            while node.parent:
                path.append(node.action)
                node = node.parent
            return path[::-1]
            
        for action, child_state, cost in get_successors(node.state):
            child_node = SearchNode(
                state=child_state,
                parent=node,
                action=action,
                path_cost=node.path_cost + cost,
                heuristic=heuristic(child_state)
            )
            heapq.heappush(frontier, child_node)
            
    return None

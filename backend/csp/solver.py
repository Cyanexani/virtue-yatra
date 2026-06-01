from typing import Dict, List, Any

class CSP:
    def __init__(self, variables: List[str], domains: Dict[str, List[Any]]):
        self.variables = variables
        self.domains = domains
        self.constraints = {}
        
    def add_constraint(self, variables: List[str], constraint_func: callable):
        for var in variables:
            if var not in self.constraints:
                self.constraints[var] = []
            self.constraints[var].append((variables, constraint_func))
            
    def is_consistent(self, var: str, value: Any, assignment: Dict[str, Any]) -> bool:
        for variables, constraint_func in self.constraints.get(var, []):
            # Check if all variables in the constraint have assignments (or are the current var)
            if all(v in assignment or v == var for v in variables):
                test_assignment = assignment.copy()
                test_assignment[var] = value
                # Only run constraint if it's fully grounded (for simplicity)
                if len([v for v in variables if v in test_assignment]) == len(variables):
                    if not constraint_func(test_assignment):
                        return False
        return True

    def backtrack(self, assignment: Dict[str, Any]) -> Dict[str, Any] | None:
        if len(assignment) == len(self.variables):
            return assignment
            
        unassigned = [v for v in self.variables if v not in assignment]
        var = unassigned[0]
        
        for value in self.domains[var]:
            if self.is_consistent(var, value, assignment):
                assignment[var] = value
                result = self.backtrack(assignment)
                if result is not None:
                    return result
                del assignment[var]
                
        return None
        
    def solve(self) -> Dict[str, Any] | None:
        return self.backtrack({})

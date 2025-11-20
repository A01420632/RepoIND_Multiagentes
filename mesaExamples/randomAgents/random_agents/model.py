from mesa import Model
from mesa.discrete_space import OrthogonalMooreGrid
from mesa.datacollection import DataCollector

from .agent import RandomAgent, ObstacleAgent, Trash, Station

class RandomModel(Model):
    """
    Roomba cleaning simulation model.
    
    Supports two simulation modes:
    - Mode 1: Single agent starting at (1,1)
    - Mode 2: Multiple agents at random positions
    
    Args:
        simulation_mode: 1 for single agent, 2 for multiple agents
        num_agents: Number of roomba agents (only used in mode 2)
        width: Grid width in cells
        height: Grid height in cells
        seed: Random seed for reproducibility
        max_steps: Maximum simulation time
        dirty_percentage: Initial percentage of dirty cells (0.0-1.0)
        obstacle_percentage: Percentage of obstacle cells (0.0-1.0)
    """
    def __init__(self, simulation_mode=1, num_agents=1, width=8, height=8, seed=42, max_steps=1000, dirty_percentage=0.2, obstacle_percentage=0.1):

        super().__init__(seed=seed)
        self.simulation_mode = simulation_mode
        self.num_agents = num_agents if simulation_mode == 2 else 1
        self.seed = seed
        self.width = width
        self.height = height
        self.max_steps = max_steps
        self.current_step = 0
        self.dirty_percentage = dirty_percentage
        self.obstacle_percentage = obstacle_percentage

        self.grid = OrthogonalMooreGrid([width, height], torus=False)

        # Identify the coordinates of the border of the grid
        border = [(x,y)
                  for y in range(height)
                  for x in range(width)
                  if y in [0, height-1] or x in [0, width - 1]]

        # Create the border cells
        for _, cell in enumerate(self.grid):
            if cell.coordinate in border:
                ObstacleAgent(self, cell=cell)

        # Simulation 1: Single agent at (1,1) with its station
        if simulation_mode == 1:
            first_cell = self.grid[(1, 1)]
            first_station = Station(self, first_cell)
            first_agent = RandomAgent(self, first_cell, energy=100, home_station=first_station)
        
        # Simulation 2: Multiple agents at random positions with their stations
        else:
            for _ in range(self.num_agents):
                empty_cell = self.grid.select_random_empty_cell()
                if empty_cell:
                    station = Station(self, empty_cell)
                    agent = RandomAgent(self, empty_cell, energy=100, home_station=station)

        self.running = True

        # Metrics for completion tracking
        self.all_clean_step = None  # Step when all trash was cleaned
        self.initial_trash_count = 0  # Total initial trash count

        self.create_trash()
        self.create_obs()

        # Data collection for statistics and visualization
        self.datacollector = DataCollector(
            model_reporters={
                "Trash": lambda m: sum(1 for agent in m.agents if isinstance(agent, Trash)),
                "Roombas": lambda m: sum(1 for agent in m.agents if isinstance(agent, RandomAgent)),
                "Average Energy": lambda m: sum(agent.energy for agent in m.agents if isinstance(agent, RandomAgent)) / max(sum(1 for agent in m.agents if isinstance(agent, RandomAgent)), 1),
                "Clean Percentage": lambda m: ((m.initial_trash_count - sum(1 for agent in m.agents if isinstance(agent, Trash))) / m.initial_trash_count * 100) if m.initial_trash_count > 0 else 100,
                "Movements": lambda m: sum(agent.moves_count for agent in m.agents if isinstance(agent, RandomAgent)),
                "Energy": lambda m: sum(agent.energy for agent in m.agents if isinstance(agent, RandomAgent)),
            },
            agent_reporters={
                "Energy": "energy",
                "Moves": "moves_count",
            }
        )

    def create_trash(self):
        """Create trash objects in random empty cells based on dirty_percentage."""
        num_trash = int(self.grid.width * self.grid.height * self.dirty_percentage)
        self.initial_trash_count = num_trash
        
        for _ in range(num_trash):
            empty_cell = self.grid.select_random_empty_cell()
            if empty_cell:
                Trash(self, empty_cell)

    def create_obs(self):
        """Create obstacle objects in random empty cells based on obstacle_percentage."""
        num_obs = int(self.grid.width * self.grid.height * self.obstacle_percentage)
        
        for _ in range(num_obs):
            empty_cell = self.grid.select_random_empty_cell()
            if empty_cell:
                ObstacleAgent(self, empty_cell)

    def step(self):
        """Execute one simulation step and collect data."""
        # Execute step for all agents in random order
        self.agents.shuffle_do("step")
        
        # Collect statistics
        self.datacollector.collect(self)
        self.current_step += 1
        
        # Analize whether it is clean or not
        if sum(1 for agent in self.agents if isinstance(agent, Trash)) == 0:
            if self.all_clean_step is None:
                self.all_clean_step = self.current_step
            self.running = False
        
        #Stop when limit time exceeded
        if self.current_step >= self.max_steps:
            self.running = False



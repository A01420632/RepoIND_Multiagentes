#Uso de IA: Uso para complementar comentarios y completarlos, además de guía en la implementación del BFS y del menú para agregar ambas simulaciones
from mesa.discrete_space import CellAgent, FixedAgent
from collections import deque

class RandomAgent(CellAgent):
    """
    Roomba agent that moves randomly, cleans trash, and manages battery.
    
    Attributes:
        cell: Current grid position
        energy: Battery level (0-100)
        home_station: Assigned charging station
        path_station: BFS path to charging station
        distance_station: Steps to reach charging station
        returning: Flag indicating return to station
        moves_count: Total movements made
        returning_to_work: Flag for returning to work area
        work_position: Last work position before charging
        path_to_work: BFS path back to work position
        waiting_station: Flag for waiting at occupied station
    """
    def __init__(self, model, cell, energy=100, home_station= None):
        """
        Creates a new random agent.
        Args:
            model: Model reference
            cell: Starting grid cell
            energy: Initial battery level (default 100)
            home_station: Assigned charging station
        """
        super().__init__(model)
        self.cell = cell
        self.energy= energy
        self.home_station= home_station
        self.path_station=[]
        self.distance_station=0
        self.returning=False
        self.moves_count = 0
        self.returning_to_work = False
        self.work_position = None
        self.path_to_work = []
        self.waiting_station=False
        self.initial_trash_count= 0

        if self.home_station:
            self.calculate_path_station()
    
    def calculate_path_station(self):
        """
        Calculate shortest path to home charging station using BFS.
        Updates path_station and distance_station attributes.
        """
        if not self.home_station:
            self.distance_station= float('inf')
            return
        
        target= self.home_station.cell
        queue= deque([(self.cell, [self.cell])])
        visited= {self.cell}

        while queue:
            current_cell, path= queue.popleft()

            # Check if reached target station
            if current_cell == target:
                self.path_station = path[1:]  # Exclude current cell
                self.distance_station = len(path) - 1
                return
            
            # Explore neighbors
            for neighbor in current_cell.neighborhood:
                if neighbor not in visited:
                    obstacle= any(isinstance(obj, ObstacleAgent) for obj in neighbor.agents)
                    if not obstacle:
                        visited.add(neighbor)
                        queue.append((neighbor, path + [neighbor]))

        self.distance_station= float('inf')
        self.path_station= []

    def calculate_path_to_work(self):
        """Calculate path back to work position using BFS"""
        if not self.work_position:
            return
        
        target = self.work_position
        queue = deque([(self.cell, [self.cell])])
        visited = {self.cell}

        while queue:
            current_cell, path = queue.popleft()

            if current_cell == target:
                self.path_to_work = path[1:]
                return
            
            for neighbor in current_cell.neighborhood:
                if neighbor not in visited:
                    obstacle = any(isinstance(obj, ObstacleAgent) for obj in neighbor.agents)
                    if not obstacle:
                        visited.add(neighbor)
                        queue.append((neighbor, path + [neighbor]))

        self.path_to_work = []

    def move(self):
        """
        Determines the next empty cell in its neighborhood, and moves to it
        """

        
        if self.random.random() < 0.5 and self.energy>0:
            # Checks which cells around have trash
            cells_trash=[]
            for cell in self.cell.neighborhood:
                obstacle= any(isinstance(obj, ObstacleAgent) for obj in cell.agents)
                trash= any(isinstance(obj, Trash) for obj in cell.agents)

                if not obstacle and trash:
                    cells_trash.append(cell)
            
            #Choose randomly between trash cells
            if cells_trash:
                self.cell = self.random.choice(cells_trash)
                self.energy -= 1
                self.moves_count += 1
                self.calculate_path_station()
                return 
            
            #If no trash around, move randomly
            next_moves = self.cell.neighborhood.select(
                lambda cell: all(not isinstance(obj, ObstacleAgent) for obj in cell.agents)
            )

            if next_moves:
                self.cell = next_moves.select_random_cell()
                self.energy -= 1
                self.moves_count += 1
                self.calculate_path_station()
    
    def move_station(self):
        """Move towards charging station"""
        # Check for nearby stations in order to reduce the time
        stations_here= [obj for obj in self.cell.agents if isinstance(obj, Station)]

        if stations_here:
            self.waiting_station=True
            self.returning=False
            return True

        # Check for stations in immediate neighborhood (opportunistic)
        for cell in self.cell.neighborhood:
            if any(isinstance(obj,Station) for obj in cell.agents):
                if not any(isinstance(obj, ObstacleAgent) for obj in cell.agents):
                    self.cell = cell
                    self.energy -= 1
                    self.moves_count += 1
                    self.returning = False
                    self.waiting_station=True
                    return True
        
        # Follow calculated path
        if self.path_station:
            next_cell= self.path_station[0]
            if not any(isinstance(obj, ObstacleAgent) for obj in next_cell.agents):
                self.cell= next_cell
                self.energy-= 1
                self.moves_count+= 1
                self.path_station.pop(0)
                self.distance_station-=1
                return True
            else:
                # Recalculate if path blocked
                self.calculate_path_station()

        return False

    def move_to_work(self):
        """Move back to work position"""
        # Check if already at work position
        if self.cell == self.work_position:
            self.returning_to_work = False
            self.work_position = None
            self.path_to_work = []
            return True
        
        # Follow path to work
        if self.path_to_work:
            next_cell = self.path_to_work[0]
            if not any(isinstance(obj, ObstacleAgent) for obj in next_cell.agents):
                self.cell = next_cell
                self.energy -= 1
                self.moves_count += 1
                self.path_to_work.pop(0)
                self.calculate_path_station()
                return True
            else:
                # Recalculate if obstacle found
                self.calculate_path_to_work()
        
        return False

    def clean(self):
        """If possible, clean floor at current location"""
        if self.returning or self.returning_to_work:
            return
        
        trash_here = [obj for obj in self.cell.agents if isinstance(obj, Trash)]
        
        if trash_here:
            trash_obj = trash_here[0]
            if trash_obj.is_dirty:
                trash_obj.is_dirty = False
                trash_obj.remove()

    def charge(self):
        """
        Charge battery at charging station by 5% per step.
        Waits if another roomba is charging at the same station.
        
        Returns:
            bool: True if charging, False if waiting or no station
        """
        station_here = [obj for obj in self.cell.agents if isinstance(obj, Station)]
        
        if station_here:
            #Verify if there is no roomba charging in this station
            roombas_here= [obj for obj in self.cell.agents if isinstance(obj, RandomAgent) and obj!=self]

            #Wait until station gets dissocupied
            if any(r.energy<100 for r in roombas_here):
                self.waiting_station=True
                return False
            
            # Charge battery
            charge_amount = 5
            self.energy = min(self.energy + charge_amount, 100)

            # When fully charged, return to work position
            if self.energy >= 100:
                self.returning = False
                self.waiting_station= False
                if self.work_position:
                    self.returning_to_work = True
                    self.calculate_path_to_work()
                self.calculate_path_station()

            return True
        self.waiting_station=False
        return False

    def step(self):
        """
        Execute one simulation step using subsumption architecture.
        Priority: Survival > Charging > Navigation > Exploration
        """
        # Calculate energy needed to safely return (distance + 10% margin)
        energy_needed = self.distance_station + 10
        
        # Activate returning mode if energy is low
        if self.home_station and self.distance_station != float('inf'):
            if self.energy <= energy_needed and not self.returning:
                if not self.returning_to_work:
                    self.work_position = self.cell  # Save current work position
                self.returning = True
        
        # Priority 1: Charge if at station or waiting (no energy consumption)
        if self.energy < 100 or self.waiting_station:
            if self.charge():
                return  # If charging, don't do anything else
            elif self.waiting_station:
                return

        # Priority 2: Return to work position after charging
        if self.returning_to_work:
            if self.move_to_work():
                return
            self.calculate_path_to_work()
            return

        # Priority 3: Return to charging station if low energy
        if self.returning:
            if self.move_station():
                return
            self.calculate_path_station()
            return
        
        # Priority 4: Normal behavior - explore and clean
        self.move()
        self.clean()

        # Handle death
        if self.energy <= 0:
            self.remove()

class Trash(FixedAgent):
    """
    Trash object that can be cleaned by roombas.
    Removed from grid when cleaned.
    """
    def __init__(self, model, cell):
        super().__init__(model)
        self.cell = cell
        self.is_dirty = True

    def step(self):
        pass

class ObstacleAgent(FixedAgent):
    """
    Static obstacle that blocks movement.
    Placed randomly on grid and at borders.
    """
    def __init__(self, model, cell):
        super().__init__(model)
        self.cell = cell
        self.is_obstacle = True

    def step(self):
        pass

class Station(FixedAgent):
    """
    Charging station for roombas.
    Recharges battery by 5% per step.
    Can be shared by multiple roombas with waiting system.
    """
    def __init__(self, model, cell):
        super().__init__(model)
        self.cell = cell
    
    def step(self):
        pass

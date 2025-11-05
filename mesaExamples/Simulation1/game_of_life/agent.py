# FixedAgent: Immobile agents permanently fixed to cells
from mesa.discrete_space import FixedAgent

class Cell(FixedAgent):
    """Represents a single ALIVE or DEAD cell in the simulation."""

    DEAD = 0
    ALIVE = 1

    @property
    def x(self):
        return self.cell.coordinate[0]

    @property
    def y(self):
        return self.cell.coordinate[1]

    @property
    def is_alive(self):
        return self.state == self.ALIVE
    
    @property
    def is_dead(self):
        return self.state == self.DEAD

    @property
    def neighbors(self):
        return self.cell.neighborhood.agents
    
    #En esta seccion inicialice una propiedad con al definicion de upneighbors
    #Lo que hice fue implementar un sistema dinamico que se base en la altura y el ancho del canvas
    @property
    def upneighbors(self):
        x=self.x
        y=self.y
        width=self.model.grid.dimensions[0]
        height=self.model.grid.dimensions[1]

        #Despues defini un arreglo de los agentes de arriba, a traves del uso del modulo
        #Lo que hace es que usa los modulos para ajustar de 50 a 0, tanto en x como y
        #Esto es porque, cuando uno de los agentes de arriba supera los limites, se tiene que reflejar al otro lado
        pos_arriba=[
            ((x-1) % width, (y+1) % height),
            (x % width, (y+1) % height),
            ((x+1) % width, (y+1) % height)
        ]

        #Se que estas funciones no se utilizaron, pero quiero guardar esta logica para futuras referencias

        # if self.x==0:
        #     pos_arriba=[(x,y+1),(49,y+1),(x+1,y+1)]
        # elif self.x==49:
        #     pos_arriba=[(x,y+1),(x-1,y+1),(0,y+1)]
        # elif self.y==49:
        #     pos_arriba=[(x,0),(x-1,0),(x+1,0)]
        # else:
        #     pos_arriba=[(x,y+1),(x-1,y+1),(x+1,y+1)]

        # if self.x==0:
        #     pos_arriba[0]=(49,y+1)
        # elif self.x==49:
        #     pos_arriba[2]=(0,y+1)
        # elif self.y==49:
        #     pos_arriba=[(x-1,0),(x,0),(x+1,0)]
        # else:
        #     pos_arriba=[(x,y+1),(x-1,y+1),(x+1,y+1)]

        #Posteriormente, genero una lista de los agentes de arriba,
        #a la que le agrego lo sresultados de las operaciones anteriores a traves de un ciclo for
        upneighbors_list=[]
        for pos in pos_arriba:
            cell=self.model.grid[pos]
            if cell and cell.agents:
                upneighbors_list.extend(cell.agents)

        return upneighbors_list
    
    #Es importante mandarle la referencia del modelo a cada agente para que puedan actuar
    def __init__(self, model, cell, init_state=DEAD):
        """Create a cell, in the given state, at the given x, y position."""
        super().__init__(model)
        self.cell = cell
        self.pos = cell.coordinate
        self.state = init_state
        self._next_state = None

    def determine_state(self):
        """Compute if the cell will be dead or alive at the next tick.  This is
        based on the number of alive or dead neighbors.  The state is not
        changed here, but is just computed and stored in self._nextState,
        because our current state may still be necessary for our neighbors
        to calculate their next state.
        """
        # Get the neighbors and apply the rules on whether to be alive or dead
        # at the next tick.
        #live_neighbors = sum(neighbor.is_alive for neighbor in self.neighbors)
        
        # Mantiene el estado de la fila superior (y=49) sin cambios.
        # Esta fila actúa como la generación inicial
        # y no debe actualizarse en los pasos siguientes. 
        if self.y == self.model.grid.dimensions[1] - 1:
            self._next_state = self.state
            return
        
        # Assume nextState is unchanged, unless changed below.
        self._next_state = self.state

        #Posteriormente, tengo una logica en la cual valido cada uno de los estados de los agentes de arriba
        #A partir de esas comprobaciones, asigno el estado del agente
        #Tengo if's anidados porque parto de que en algunas comprobaciones, el primer bit es 0, y ya de ahi evaluo el resto
        if self.upneighbors[0].is_alive and self.upneighbors[1].is_alive and self.upneighbors[2].is_alive:
            self._next_state = self.DEAD
        elif self.upneighbors[0].is_dead and self.upneighbors[1].is_dead and self.upneighbors[2].is_dead:
            self._next_state = self.DEAD
        elif self.upneighbors[0].is_alive:
            if self.upneighbors[1].is_alive and self.upneighbors[2].is_dead:
                self._next_state = self.ALIVE
            elif self.upneighbors[1].is_dead and self.upneighbors[2].is_alive:
                self._next_state = self.DEAD
            elif self.upneighbors[1].is_dead and self.upneighbors[2].is_dead:
                self._next_state = self.ALIVE
        elif self.upneighbors[0].is_dead:
            if self.upneighbors[1].is_alive and self.upneighbors[2].is_alive:
                self._next_state = self.ALIVE
            elif self.upneighbors[1].is_alive and self.upneighbors[2].is_dead:
                self._next_state = self.DEAD
            elif self.upneighbors[1].is_dead and self.upneighbors[2].is_alive:
                self._next_state = self.ALIVE
        

    def assume_state(self):
        """Set the state to the new computed state -- computed in step()."""
        self.state = self._next_state

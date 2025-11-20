from random_agents.agent import RandomAgent, ObstacleAgent, Station, Trash
from random_agents.model import RandomModel

from mesa.visualization import (
    Slider,
    SolaraViz,
    make_space_component,
    make_plot_component,
)

from mesa.visualization.components import AgentPortrayalStyle

COLORS = {"Trash": "#95a5a6", "Roombas": "#3498db", "Average Energy": "#f39c12"}
COLORS2= {"Movements": "#2fde14", "Energy": "#f7920e" }
COLORS3= {"Clean Percentage": "#570e60"}


def random_portrayal(agent):
    if agent is None:
        return

    portrayal = AgentPortrayalStyle(
        size=50,
        marker="o",
    )

    if isinstance(agent, RandomAgent):
        portrayal.color = "red"
    elif isinstance(agent, ObstacleAgent):
        portrayal.color = "gray"
        portrayal.marker = "s"
        portrayal.size = 100
    elif isinstance(agent, Station):
        portrayal.color= "green"
        portrayal.marker= "s"
        portrayal.size= 100
    elif isinstance(agent, Trash):
        portrayal.color= "black"
        portrayal.marker= "o"
        portrayal.size= 100

    return portrayal

def post_process(ax):
    """Post-process grid visualization to maintain aspect ratio."""
    ax.set_aspect("equal")

def post_process_lines(ax):
    """Post-process line plots to add legend."""
    ax.legend(loc="center left", bbox_to_anchor=(1, 0.9))

# Model parameters configurable through UI
model_params = {
    "seed": {
        "type": "InputText",
        "value": 42,
        "label": "Random Seed",
    },
    "simulation_mode": {
        "type": "Select",
        "value": 1,
        "values": [1, 2],
        "label": "Simulation Mode (1: Single Agent, 2: Multiple Agents)",
    },
    "num_agents": Slider("Number of agents", 5, 1, 20, 1),
    "width": Slider("Grid width", 20, 10, 50, 1),
    "height": Slider("Grid height", 20, 10, 50, 1),
    "max_steps": Slider("Max steps", 1000, 100, 5000, 100),
    "dirty_percentage": Slider("Dirty cells %", 0.2, 0.1, 0.5, 0.05),
    "obstacle_percentage": Slider("Obstacle cells %", 0.1, 0.05, 0.3, 0.05),
}

# Create the model using the initial parameters from the settings
model = RandomModel(
    num_agents=model_params["num_agents"].value,
    width=model_params["width"].value,
    height=model_params["height"].value,
    seed=model_params["seed"]["value"]
)

# Grid visualization component
space_component = make_space_component(
        random_portrayal,
        draw_grid = False,
        post_process=post_process
)

# Line plot 1: Trash count, number of roombas, and average energy
lineplot_component = make_plot_component(
    COLORS,
    post_process=post_process_lines,
)

# Line plot 2: Total movements and total energy
lineplot2 = make_plot_component(
    COLORS2,
    post_process=post_process_lines,
)

# Line plot 3: Clean percentage progress
lineplot3 = make_plot_component(
    COLORS3,
    post_process=post_process_lines,
)

page = SolaraViz(
    model,
    components=[space_component, lineplot_component, lineplot2, lineplot3],
    model_params=model_params,
    name="Roomba Cleaning Simulation",
)

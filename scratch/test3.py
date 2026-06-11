import requests
import json

data = {
    "modelId": "capacity_sweep_demo",
    "property": "Pmax=? [ F \"success\" ]",
    "prismPath": "/opt/prism/bin/prism",
    "sweepParams": [{"param":"MAX_BUFFER","start":1,"end":20,"step":1}],
    "constants": "t=10"
}

r = requests.post("http://localhost:3003/api/verify", json=data)
print(json.dumps(r.json(), indent=2))

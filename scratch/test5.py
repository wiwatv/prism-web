import requests
import json

data = {
    "modelId": "capacity_sweep_demo",
    "property": "Pmax=? [ F<=t overflow=1 ]",
    "prismPath": "/opt/prism/bin/prism",
    "sweepParams": [{"param":"MAX_BUFFER","start":1,"end":5,"step":1}],
    "constants": "t=10"
}

r = requests.post("http://localhost:3003/api/verify", json=data)
print(json.dumps(r.json(), indent=2))

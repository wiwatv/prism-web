import requests
import json

data = {
    "modelId": "simple_pta",
    "property": "Pmax=? [ F s=2 ]",
    "prismPath": "/opt/prism/bin/prism",
    "sweepParams": [{"param":"c","start":1,"end":5,"step":1}],
    "constants": ""
}

r = requests.post("http://localhost:3003/api/verify", json=data)
print(json.dumps(r.json(), indent=2))

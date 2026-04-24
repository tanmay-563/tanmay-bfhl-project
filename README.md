# BFHL Node Hierarchy Analyzer

This is readme file I am making this for a full-stack application built for the SRM Bajaj Challenge. The backend exposes a REST API that accepts an array of node strings, processes hierarchical relationships, detects cycles, and returns structured tree data. The frontend provides a clean interface to interact with the API.

---

## Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** HTML, CSS, JavaScript (vanilla)
- **Hosting:** Render (backend), Netlify (frontend)

---

## Project Structure

```
bfhl-project/
├── backend/
│   ├── index.js
│   └── package.json
└── frontend/
    └── index.html
```

---

## API Reference

### POST /bfhl

Accepts an array of node strings and returns parsed tree hierarchies.

**Request**

```
POST /bfhl
Content-Type: application/json

{
  "data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X"]
}
```

**Response**

```json
{
  "user_id": "tanmay_29032005",
  "email_id": "ts1399@srmist.edu.in",
  "college_roll_number": "RA2311003011644",
  "hierarchies": [
    {
      "root": "A",
      "tree": { "A": { "B": { "D": {} }, "C": {} } },
      "depth": 3
    },
    {
      "root": "X",
      "tree": {},
      "has_cycle": true
    }
  ],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

### GET /bfhl

Returns a confirmation that the API is live. 

---

## Processing Logic

**Validation**

Each entry is trimmed and checked against the pattern `^[A-Z]->[A-Z]$`. Self-loops such as `A->A` are treated as invalid. Entries that fail validation are collected in `invalid_entries`.

**Duplicate handling**

If the same edge appears more than once, only the first occurrence is used for tree construction. All subsequent occurrences are recorded once in `duplicate_edges`.

**Multi-parent rule**

If a node appears as a child in more than one edge, the first encountered parent wins. All later parent edges for that node are silently discarded.

**Cycle detection**

DFS with 3-color marking (white, gray, black) is used to detect back edges within each connected component. A component containing a cycle returns `has_cycle: true` and an empty tree object.

**Depth calculation**

Depth is the number of nodes on the longest root-to-leaf path. A single node has depth 1.

**Summary**

`largest_tree_root` returns the root of the non-cyclic tree with the greatest depth. If two trees have equal depth, the lexicographically smaller root is returned.

---

## Running Locally

**Backend**

```bash
cd backend
npm install
node index.js
```

Server starts on `http://localhost:3000`.

**Frontend**

Open `frontend/index.html` directly in a browser. Enter `http://localhost:3000` as the API base URL and click Analyze.

---

## Deployment

- Backend is deployed on Render as a Node.js web service with build command `npm install` and start command `node index.js`.
- Frontend is deployed on Netlify as a static site by uploading the `frontend` directory.
- CORS is enabled on the backend to allow cross-origin requests from the frontend.

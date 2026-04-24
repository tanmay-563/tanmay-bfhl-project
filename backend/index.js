const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const MY_USER_ID = "tanmay_29032005";
const MY_EMAIL = "ts1399@srmist.edu.in";
const MY_ROLL = "RA2311003011644";

function isValidEntry(raw) {
  const trimmed = (raw ?? "").trim();
  const pattern = /^[A-Z]->[A-Z]$/;
  if (!pattern.test(trimmed)) return null;
  if (trimmed[0] === trimmed[3]) return null;
  return trimmed;
}

function partitionEntries(data) {
  const firstSeenEdges = new Set();
  const duplicateTracker = new Set();

  const validEdges = [];
  const invalidEntries = [];
  const duplicateEdges = [];

  for (const raw of data) {
    const cleaned = isValidEntry(raw);

    if (cleaned === null) {
      invalidEntries.push(typeof raw === "string" ? raw.trim() : String(raw));
      continue;
    }

    if (firstSeenEdges.has(cleaned)) {
      if (!duplicateTracker.has(cleaned)) {
        duplicateEdges.push(cleaned);
        duplicateTracker.add(cleaned);
      }
    } else {
      firstSeenEdges.add(cleaned);
      validEdges.push(cleaned);
    }
  }

  return { validEdges, invalidEntries, duplicateEdges };
}

function buildGraph(validEdges) {
  const childToParent = new Map();
  const parentToChildren = new Map();
  const allNodes = new Set();

  for (const edge of validEdges) {
    const [parent, child] = edge.split("->");
    allNodes.add(parent);
    allNodes.add(child);

    if (!childToParent.has(child)) {
      childToParent.set(child, parent);
      if (!parentToChildren.has(parent)) parentToChildren.set(parent, []);
      parentToChildren.get(parent).push(child);
    }
  }

  return { childToParent, parentToChildren, allNodes };
}

function findConnectedComponents(allNodes, childToParent, parentToChildren) {
  const alreadyVisited = new Set();
  const components = [];

  for (const startNode of allNodes) {
    if (alreadyVisited.has(startNode)) continue;

    const currentComponent = new Set();
    const queue = [startNode];

    while (queue.length > 0) {
      const node = queue.shift();
      if (alreadyVisited.has(node)) continue;

      alreadyVisited.add(node);
      currentComponent.add(node);

      const kids = parentToChildren.get(node) || [];
      for (const child of kids) {
        if (!alreadyVisited.has(child)) queue.push(child);
      }

      const parent = childToParent.get(node);
      if (parent && !alreadyVisited.has(parent)) queue.push(parent);
    }

    components.push(currentComponent);
  }

  return components;
}

function hasCycleInComponent(component, parentToChildren) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const nodeColor = new Map();
  for (const n of component) nodeColor.set(n, WHITE);

  function dfs(node) {
    nodeColor.set(node, GRAY);
    const children = parentToChildren.get(node) || [];
    for (const child of children) {
      if (!component.has(child)) continue;
      if (nodeColor.get(child) === GRAY) return true;
      if (nodeColor.get(child) === WHITE && dfs(child)) return true;
    }
    nodeColor.set(node, BLACK);
    return false;
  }

  for (const node of component) {
    if (nodeColor.get(node) === WHITE) {
      if (dfs(node)) return true;
    }
  }
  return false;
}

function buildNestedTree(node, parentToChildren) {
  const children = parentToChildren.get(node) || [];
  const childObject = {};
  for (const child of children) {
    const subtree = buildNestedTree(child, parentToChildren);
    Object.assign(childObject, subtree);
  }
  return { [node]: childObject };
}

function calculateDepth(node, parentToChildren) {
  const children = parentToChildren.get(node) || [];
  if (children.length === 0) return 1;
  return 1 + Math.max(...children.map((c) => calculateDepth(c, parentToChildren)));
}

function buildHierarchies(components, childToParent, parentToChildren) {
  const hierarchies = [];

  for (const component of components) {
    const isCyclic = hasCycleInComponent(component, parentToChildren);

    if (isCyclic) {
      const rootCandidates = [...component]
        .filter((n) => !childToParent.has(n))
        .sort();

      const root =
        rootCandidates.length > 0 ? rootCandidates[0] : [...component].sort()[0];

      hierarchies.push({
        root,
        tree: {},
        has_cycle: true,
      });
    } else {
      const roots = [...component]
        .filter((n) => !childToParent.has(n))
        .sort();

      for (const root of roots) {
        const tree = buildNestedTree(root, parentToChildren);
        const depth = calculateDepth(root, parentToChildren);
        hierarchies.push({ root, tree, depth });
      }
    }
  }

  return hierarchies;
}

function buildSummary(hierarchies) {
  const trees = hierarchies.filter((h) => !h.has_cycle);
  const cycles = hierarchies.filter((h) => h.has_cycle);

  let largestRoot = "";
  let maxDepth = -1;

  for (const h of trees) {
    if (
      h.depth > maxDepth ||
      (h.depth === maxDepth && h.root < largestRoot)
    ) {
      maxDepth = h.depth;
      largestRoot = h.root;
    }
  }

  return {
    total_trees: trees.length,
    total_cycles: cycles.length,
    largest_tree_root: largestRoot,
  };
}

function processRequest(data) {
  if (!Array.isArray(data)) {
    throw new Error("'data' must be an array of strings");
  }

  const { validEdges, invalidEntries, duplicateEdges } = partitionEntries(data);

  const { childToParent, parentToChildren, allNodes } = buildGraph(validEdges);

  const components = findConnectedComponents(allNodes, childToParent, parentToChildren);

  const hierarchies = buildHierarchies(components, childToParent, parentToChildren);

  const summary = buildSummary(hierarchies);

  return {
    user_id: MY_USER_ID,
    email_id: MY_EMAIL,
    college_roll_number: MY_ROLL,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary,
  };
}

app.get("/", (req, res) => {
  res.json({ status: "BFHL API is running suberb and no issues are there for now at least ", endpoint: "POST /bfhl" });
});

app.get("/bfhl", (req, res) => {
  res.json({
    message: "Message by Tanmay to bajaj -BFHL API is live. Use POST /bfhl with body: { data: [...] }"
  });
});
app.post("/bfhl", (req, res) => {
  try {
    const { data } = req.body;

    if (data === undefined) {
      return res.status(400).json({ error: "Message by Tanmay to bajaj - Request body must contain a 'data' field" });
    }

    const result = processRequest(data);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found. Use POST /bfhl" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ BFHL API running on port ${PORT}`);
  console.log(`   → POST http://localhost:${PORT}/bfhl`);
});

const fs = require("fs");
const path = require("path");

// Load and parse the proof fields
const proofPath = path.join(__dirname, "../zk_voter_proof/target/proof_fields.json");
const proofJson = JSON.parse(fs.readFileSync(proofPath));

// Convert to JSON string, then to a byte buffer, then to hex
const proofBytes = Buffer.from(JSON.stringify(proofJson));
const hexProof = "0x" + proofBytes.toString("hex");

console.log("✅ ZK Proof (hex):", hexProof);